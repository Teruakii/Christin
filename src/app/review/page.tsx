'use client'

import { Check, LifeBuoy, Lock, Ticket, X } from 'lucide-react'
import LangBadge from '@/components/ui/LangBadge'
import ParticipantShell from '@/components/participant/ParticipantShell'
import { openHelp } from '@/components/participant/HelpButton'
import StateCard from '@/components/ui/StateCard'
import { ApiError } from '@/lib/api/instance'
import { getMe, getReview } from '@/lib/api/participant.api'
import { LANGUAGE_META, thaiDate } from '@/lib/format'
import type { Phase } from '@/types/room.types'
import { useLoad } from '@/use/useLoad'

const ROUNDS: { phase: Phase; label: string }[] = [
  { phase: 'pre', label: 'ก่อน' },
  { phase: 'post', label: 'หลัง' },
  { phase: 'followup', label: '14 วัน' },
]

export default function ReviewPage() {
  const { data: me } = useLoad(getMe)
  const { data: items, error } = useLoad(getReview)

  if (error instanceof ApiError && error.code === 'REVIEW_NOT_OPEN')
    return (
      <ParticipantShell roomName={me?.room.name} groupNo={me?.group?.no}>
        <StateCard icon={Lock} title="เฉลยยังไม่เปิด" action={{ href: '/me', label: 'กลับไปดูความคืบหน้า' }}>
          เฉลยจะเปิดหลังทำรอบติดตามผล{me && ` (${thaiDate(me.room.schedule.followup)})`} เพื่อไม่ให้จำคำตอบไปทำรอบหลัง
        </StateCard>
      </ParticipantShell>
    )
  if (error) return <StateCard icon={Ticket} title="ยังไม่มีรหัสติดตามในเครื่องนี้" action={{ href: '/', label: 'ใส่รหัสห้องหรือรหัสติดตาม' }} />
  if (!items) return null

  return (
    <ParticipantShell roomName={me?.room.name} groupNo={me?.group?.no}>
      <main className="mx-auto max-w-3xl px-4 pt-6 pb-44 lg:pb-16">
        <h1 className="text-3xl font-bold">เฉลยรายข้อ</h1>

        <div className="mt-5 overflow-x-auto rounded-3xl bg-white p-4 lift">
          <table className="w-full text-center text-sm">
            <thead className="text-night/50">
              <tr>
                <th className="py-2 text-left font-normal">ข้อ</th>
                {items.map((_, i) => <th key={i} className="font-normal">{i + 1}</th>)}
              </tr>
            </thead>
            <tbody className="font-medium">
              {ROUNDS.map((r) => (
                <tr key={r.phase}>
                  <td className="py-2 pr-2 text-left font-normal whitespace-nowrap text-night/60">{r.label}</td>
                  {items.map((q) => {
                    const a = q.mine[r.phase]
                    if (!(r.phase in q.mine)) return <td key={q.id} className="text-night/20">·</td>
                    if (a === null) return <td key={q.id} className="text-night/30">–</td>
                    return <td key={q.id} className={a === q.answer ? 'text-mint' : 'text-coral'}>{a === q.answer ? <Check className="mx-auto h-4 w-4" strokeWidth={3} aria-label="ถูก" /> : <X className="mx-auto h-4 w-4" strokeWidth={3} aria-label="ผิด" />}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 flex items-center gap-3 text-xs text-night/50"><span className="flex items-center gap-1"><Check className="h-3 w-3 text-mint" strokeWidth={3} aria-hidden />ถูก</span><span className="flex items-center gap-1"><X className="h-3 w-3 text-coral" strokeWidth={3} aria-hidden />ผิด</span><span>– ข้าม</span></p>
        </div>

        {items.map((q, i) => {
          const rounds = ROUNDS.filter((r) => r.phase in q.mine)
          const allRight = rounds.length > 0 && rounds.every((r) => q.mine[r.phase] === q.answer)
          const lastAnswer = rounds.length ? q.mine[rounds[rounds.length - 1].phase] : null
          const lastWrong = lastAnswer !== q.answer
          const lang = LANGUAGE_META[q.language]
          return (
            <article key={q.id} className={`mt-5 rounded-3xl bg-white p-6 lift ${lastWrong ? 'border-2 border-coral/40' : ''}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-grape-soft px-3 py-1 text-sm text-grape">ข้อ {i + 1} · <LangBadge language={q.language} withLabel /> · {q.topic}</span>
                <span className={`ml-auto text-sm font-medium ${allRight ? 'text-mint' : lastWrong ? 'text-coral' : 'text-night/60'}`}>
                  {allRight ? 'ถูกทุกรอบ' : lastWrong ? 'ยังไม่ถูก' : 'รอบล่าสุดถูกแล้ว'}
                </span>
              </div>
              <pre className="mt-4 overflow-x-auto rounded-2xl bg-night p-4 font-mono text-[15px] leading-7 whitespace-pre-wrap break-words text-white">{q.code}</pre>
              <div className="mt-4 flex flex-wrap gap-2 font-mono text-sm">
                {lastWrong && <span className="rounded-full bg-coral-soft px-3 py-1 text-coral">คุณตอบ: {lastAnswer === null || lastAnswer === undefined ? 'ข้าม' : q.choices[lastAnswer]}</span>}
                <span className="rounded-full bg-mint px-3 py-1 text-white">ที่ถูก: {q.choices[q.answer]}</span>
              </div>
              <p className="mt-3 text-night/80">{q.explanation}</p>
              {lastWrong && (
                <button onClick={() => openHelp(`ข้อ ${i + 1} (${lang.label} · ${q.topic}) ยังงงอยู่`)} className="mt-4 rounded-2xl bg-coral px-4 py-3 text-sm font-medium text-white lift-coral">
                  <span className="flex items-center gap-2"><LifeBuoy className="h-4 w-4" aria-hidden />ยังงง ขอให้ทีมงานอธิบาย</span>
                </button>
              )}
            </article>
          )
        })}
      </main>
    </ParticipantShell>
  )
}
