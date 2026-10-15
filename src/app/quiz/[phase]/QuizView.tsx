'use client'

import { BadgeCheck, Check, CircleAlert, Hourglass, PartyPopper, Ticket } from 'lucide-react'
import LangBadge from '@/components/ui/LangBadge'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import HelpButton from '@/components/participant/HelpButton'
import StateCard from '@/components/ui/StateCard'
import { ApiError } from '@/lib/api/instance'
import { getMe, getQuiz, submitQuiz } from '@/lib/api/participant.api'
import { errorText } from '@/lib/errors'
import { PHASE_LABEL, daysUntil, thaiDate } from '@/lib/format'
import type { Answers, Me, Quiz, SubmitResult } from '@/types/quiz.types'
import type { Phase } from '@/types/room.types'
import { useLoad } from '@/use/useLoad'

const LETTERS = ['ก', 'ข', 'ค', 'ง']

// เก็บคำตอบที่ทำค้างไว้ในเครื่อง เน็ตหลุดหรือเผลอรีเฟรชแล้วไม่ต้องเริ่มใหม่
const draftKey = (phase: string) => `quiz-draft:${phase}`
const loadDraft = (phase: string): { answers: Answers; index: number } | null => {
  try {
    return JSON.parse(sessionStorage.getItem(draftKey(phase)) ?? 'null')
  } catch {
    return null
  }
}
const saveDraft = (phase: string, answers: Answers, index: number) => {
  try {
    sessionStorage.setItem(draftKey(phase), JSON.stringify({ answers, index }))
  } catch {}
}
const clearDraft = (phase: string) => {
  try {
    sessionStorage.removeItem(draftKey(phase))
  } catch {}
}

export default function QuizView() {
  const { phase } = useParams<{ phase: Phase }>()
  const { data: quiz, error } = useLoad(useCallback(() => getQuiz(phase), [phase]))

  if (error) {
    const code = error instanceof ApiError ? error.code : ''
    if (code === 'PHASE_NOT_OPEN') {
      const opens = (error as ApiError).payload?.[0]?.msg ?? ''
      return (
        <StateCard icon={Hourglass} title={`รอบ${PHASE_LABEL[phase]}ยังไม่เปิด`} action={{ href: '/me', label: 'กลับไปดูความคืบหน้า' }}>
          เปิดวันที่ {opens && thaiDate(opens)} {opens && `อีก ${daysUntil(opens)} วัน`}
          {phase === 'followup' && ' ต้องเว้นให้ครบ 14 วันหลังจบกิจกรรมก่อน ผลถึงจะวัดความจำได้จริง'}
        </StateCard>
      )
    }
    if (code === 'ALREADY_SUBMITTED')
      return <StateCard icon={BadgeCheck} title="ทำรอบนี้ไปแล้ว" action={{ href: '/me', label: 'ดูความคืบหน้า' }}>แต่ละรอบทำได้ครั้งเดียว เพื่อให้เทียบผลก่อน-หลังได้ตรง</StateCard>
    if (code === 'TRACKING_CODE_REQUIRED' || code === 'TRACKING_CODE_NOT_FOUND')
      return <StateCard icon={Ticket} title="ยังไม่มีรหัสติดตามในเครื่องนี้" action={{ href: '/', label: 'ใส่รหัสห้องหรือรหัสติดตาม' }} />
    return <StateCard icon={CircleAlert} title="โหลดแบบทดสอบไม่ได้" action={{ href: '/me', label: 'กลับไปดูความคืบหน้า' }}>{errorText(error)}</StateCard>
  }
  if (!quiz) return null
  return <QuizRunner key={phase} quiz={quiz} />
}

function QuizRunner({ quiz }: { quiz: Quiz }) {
  const phase = quiz.phase
  // render หลังโหลดข้อสอบเสร็จบน browser เท่านั้น จึงอ่าน sessionStorage ตอนสร้าง state ได้เลย
  const [draft] = useState(() => loadDraft(phase))
  const [answers, setAnswers] = useState<Answers>(draft?.answers ?? {})
  const [index, setIndex] = useState(Math.min(draft?.index ?? 0, quiz.questions.length - 1))
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [me, setMe] = useState<Me | null>(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  useEffect(() => {
    if (!result) saveDraft(phase, answers, index)
  }, [phase, answers, index, result])

  const total = quiz.questions.length
  const q = quiz.questions[index]
  const answeredCount = Object.values(answers).filter((a) => a !== null && a !== undefined).length
  const isLast = index === total - 1

  const choose = (choice: number) => setAnswers((a) => ({ ...a, [q.id]: choice }))
  const skip = () => {
    setAnswers((a) => ({ ...a, [q.id]: null }))
    if (!isLast) setIndex(index + 1)
  }

  const send = async () => {
    setSending(true)
    setSendError('')
    const full = Object.fromEntries(quiz.questions.map((x) => [x.id, answers[x.id] ?? null]))
    try {
      setResult(await submitQuiz(phase, full))
      clearDraft(phase)
      setMe(await getMe())
    } catch (e) {
      setSendError(errorText(e))
    } finally {
      setSending(false)
    }
  }

  if (result) return <Done phase={phase} result={result} me={me} skipped={total - answeredCount} />

  return (
    <main className="mx-auto max-w-2xl px-4 pt-6 pb-32">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-grape-soft px-3 py-1 text-sm font-medium text-grape">แบบทดสอบ{PHASE_LABEL[phase]}</span>
        <span className="ml-auto font-bold text-grape">{index + 1}<span className="text-night/40">/{total}</span></span>
      </div>
      <div className="mt-3 flex gap-1.5" aria-label={`ข้อที่ ${index + 1} จาก ${total}`}>
        {quiz.questions.map((x, i) => {
          const a = answers[x.id]
          const color = i === index ? 'bg-sun' : a === null ? 'bg-night/20' : a !== undefined ? 'bg-grape' : 'bg-night/10'
          return <button key={x.id} onClick={() => setIndex(i)} aria-label={`ไปข้อ ${i + 1}`} className={`h-2 flex-1 rounded-full ${color}`} />
        })}
      </div>
      <p className="mt-2 text-xs text-night/50">ม่วง = ตอบแล้ว · เทา = ข้าม · เหลือง = ข้อนี้ · กดแถบเพื่อกระโดดไปข้อนั้น</p>

      <div className="mt-6 rounded-3xl bg-white p-6 lift">
        <p className="flex gap-2 text-sm">
          <LangBadge language={q.language} withLabel />
          <span className="text-night/50">หัวข้อ: {q.topic}</span>
        </p>
        <h1 className="mt-2 text-2xl font-bold">{q.prompt}</h1>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-night p-4 font-mono text-[15px] leading-7 whitespace-pre-wrap break-words text-white">{q.code}</pre>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {q.choices.map((c, i) => {
          const picked = answers[q.id] === i
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              aria-pressed={picked}
              className={`relative rounded-2xl px-3 py-6 font-mono text-xl break-words ${picked ? 'bg-grape text-white ring-4 ring-grape/20 lift-grape' : 'bg-white lift'}`}
            >
              <span className={`absolute top-2 left-3 font-sans text-xs ${picked ? 'text-white/70' : 'text-night/40'}`}>{LETTERS[i]}</span>
              {c}
            </button>
          )
        })}
      </div>

      {sendError && <p className="mt-4 rounded-2xl bg-coral-soft p-3 text-sm text-coral">{sendError} คำตอบยังเก็บอยู่ในเครื่อง กดส่งอีกครั้งได้</p>}

      <div className="mt-6 flex gap-3">
        <button disabled={index === 0} onClick={() => setIndex(index - 1)} className="rounded-2xl bg-white px-5 py-4 font-medium text-night/60 lift">ย้อน</button>
        {!isLast && <button onClick={skip} className="rounded-2xl bg-white px-5 py-4 font-medium text-night/60 lift">ข้าม</button>}
        {isLast ? (
          <button disabled={sending} onClick={send} className="flex-1 rounded-2xl bg-mint py-4 text-lg font-bold text-white lift-mint">
            ส่งคำตอบ ({answeredCount}/{total})
          </button>
        ) : (
          <button onClick={() => setIndex(index + 1)} className="flex-1 rounded-2xl bg-sun py-4 text-lg font-bold lift-sun">ไปต่อ</button>
        )}
      </div>
      <p className="mt-4 text-center text-sm text-night/50">
        {phase === 'pre' ? 'ไม่แน่ใจก็ข้ามได้นะ รอบนี้ใช้จัดกลุ่ม ไม่ได้ตัดเกรด' : 'ไม่แน่ใจก็ข้ามได้ ไม่หักคะแนน'}
      </p>
      <HelpButton />
    </main>
  )
}

function Done({ phase, result, me, skipped }: { phase: Phase; result: SubmitResult; me: Me | null; skipped: number }) {
  const steps = me
    ? [
        { label: 'แบบทดสอบก่อนเรียน', sub: me.phases[0].submitted ? `ได้ ${me.phases[0].score} จาก ${me.phases[0].total}` : thaiDate(me.room.schedule.pre), done: me.phases[0].submitted },
        { label: me.group ? `อยู่กลุ่ม ${me.group.no}` : 'รอจัดกลุ่ม', sub: me.group ? me.group.members.join(' · ') : `ส่งแล้ว ${me.submittedPre} จาก ${me.target} คน ทีมงานจะประกาศกลุ่มเมื่อพร้อม`, done: !!me.group },
        { label: 'แบบทดสอบหลังกิจกรรม', sub: me.phases[1].submitted ? `ได้ ${me.phases[1].score}` : thaiDate(me.room.schedule.post), done: me.phases[1].submitted },
        { label: 'ติดตามผล 14 วัน', sub: me.phases[2].submitted ? `ได้ ${me.phases[2].score}` : thaiDate(me.room.schedule.followup), done: me.phases[2].submitted },
      ]
    : []
  return (
    <main className="mx-auto max-w-xl px-4 pt-10 pb-32 text-center">
      <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-sun to-coral text-white lift"><PartyPopper className="h-12 w-12" strokeWidth={1.75} aria-hidden /></div>
      <h1 className="mt-6 text-3xl font-bold">ส่งแล้ว เก่งมาก{me ? ` ${me.nickname}` : ''}!</h1>
      <p className="mt-2 text-night/60">
        รอบนี้ได้ <b className="text-night">{result.score} จาก {result.total}</b>
        {skipped > 0 && ` (ข้าม ${skipped} ข้อ)`}
        {phase === 'pre' ? ' เป็นจุดเริ่มต้นที่ใช้วัดการเปลี่ยนแปลง' : ''} เฉลยรายข้อจะเปิดหลังรอบติดตามผล เพื่อให้วัดผลได้ตรง
      </p>
      {me && (
        <>
          <div className="mt-8 rounded-3xl bg-white p-6 text-left lift">
            <p className="text-lg font-bold">ขั้นต่อไป</p>
            <ol className="mt-4 space-y-4">
              {steps.map((s, i) => {
                const current = !s.done && steps.slice(0, i).every((x) => x.done)
                return (
                  <li key={s.label} className="flex items-start gap-4">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-bold ${s.done ? 'bg-mint text-white' : current ? 'bg-sun' : 'bg-cloud text-night/50'}`}>
                      {s.done ? <Check className="h-5 w-5" strokeWidth={3} aria-hidden /> : i + 1}
                    </span>
                    <div><p className="font-medium">{s.label}</p><p className="text-sm text-night/50">{s.sub}</p></div>
                  </li>
                )
              })}
            </ol>
          </div>
          <div className="mt-5 flex items-center gap-4 rounded-3xl bg-grape p-5 text-left text-white lift-grape">
            <div className="flex-1"><p className="text-sm text-white/70">รหัสติดตามของคุณ</p><p className="font-mono text-2xl tracking-[0.3em]">{me.trackingCode}</p></div>
            <Link href="/me" className="rounded-2xl bg-white/15 px-4 py-3 font-medium">ดูความคืบหน้า</Link>
          </div>
        </>
      )}
      <HelpButton groupNo={me?.group?.no} />
    </main>
  )
}
