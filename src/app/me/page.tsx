'use client'

import { Bell, Ticket, Users } from 'lucide-react'
import LangBadge from '@/components/ui/LangBadge'
import Link from 'next/link'
import ParticipantShell from '@/components/participant/ParticipantShell'
import StateCard from '@/components/ui/StateCard'
import { getMe } from '@/lib/api/participant.api'
import { PHASE_LABEL, daysUntil, thaiDate } from '@/lib/format'
import type { PhaseState } from '@/types/quiz.types'
import { useLoad } from '@/use/useLoad'

const AVATAR = ['bg-grape text-white', 'bg-sun', 'bg-mint text-white', 'bg-coral text-white', 'bg-grape-soft text-grape']

export default function MePage() {
  const { data: me, error } = useLoad(getMe, 30000)
  if (error) return <StateCard icon={Ticket} title="ยังไม่มีรหัสติดตามในเครื่องนี้" action={{ href: '/', label: 'ใส่รหัสห้องหรือรหัสติดตาม' }} />
  if (!me) return null

  const [pre, post, followup] = me.phases
  const next = me.phases.find((p) => !p.submitted)
  const latest = [...me.phases].reverse().find((p) => p.submitted)
  const gain = post.submitted && pre.score !== null && post.score !== null ? post.score - pre.score : null

  const headline =
    followup.submitted && pre.score !== null
      ? `${me.nickname} ผ่านครบทุกรอบแล้ว`
      : gain !== null
        ? gain > 0 ? `${me.nickname} เก่งขึ้น +${gain} ข้อ` : `${me.nickname} ทำครบสองรอบแล้ว`
        : `สวัสดี ${me.nickname}`

  return (
    <ParticipantShell roomName={me.room.name} groupNo={me.group?.no}>
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-44 lg:grid lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:pb-10">
        <section>
          <div className="relative overflow-hidden rounded-3xl bg-grape p-6 text-white lift-grape">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-br from-sun to-coral opacity-80" />
            <p className="relative text-sm text-white/70">รหัสติดตาม</p>
            <p className="relative font-mono text-3xl tracking-[0.3em]">{me.trackingCode}</p>
            <p className="relative mt-4 text-xl font-bold">{headline}</p>
            {next && <p className="relative text-sm text-white/80">รอบต่อไป: {PHASE_LABEL[next.phase]} · {thaiDate(next.opensOn)}</p>}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            {me.phases.map((p) => <PhaseTile key={p.phase} p={p} />)}
          </div>

          {next?.open && (
            <Link href={`/quiz/${next.phase}`} className="mt-5 block rounded-2xl bg-sun py-4 text-center text-lg font-bold lift-sun">
              ทำแบบทดสอบ{PHASE_LABEL[next.phase]}
            </Link>
          )}
          {me.reviewOpen && (
            <Link href="/review" className="mt-5 block rounded-2xl bg-mint py-4 text-center text-lg font-bold text-white lift-mint">
              ดูเฉลยรายข้อ
            </Link>
          )}

          {latest?.byLanguage && (
            <div className="mt-5 rounded-3xl bg-white p-5 lift">
              <p className="font-bold">ตามภาษาของคำถาม <span className="text-sm font-normal text-night/50">รอบ{PHASE_LABEL[latest.phase]}</span></p>
              <ul className="mt-4 space-y-3 text-sm">
                {latest.byLanguage.map((l) => {
                  const pct = l.total ? l.correct / l.total : 0
                  const color = pct === 1 ? 'bg-mint' : pct >= 0.5 ? 'bg-sun' : 'bg-coral'
                  return (
                    <li key={l.language}>
                      <div className="flex justify-between">
                        <span><LangBadge language={l.language} withLabel /> · {l.total} ข้อ</span>
                        <span className={pct === 1 ? 'font-medium text-mint' : 'text-night/60'}>{l.correct}/{l.total}</span>
                      </div>
                      <div className="mt-1 h-3 rounded-full bg-cloud">
                        <div className={`h-3 rounded-full ${color}`} style={{ width: `${Math.max(pct * 100, 4)}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>

        <section className="mt-5 space-y-5 lg:mt-0">
          {me.group ? (
            <div className="rounded-3xl bg-white p-5 lift">
              <div className="flex items-baseline justify-between">
                <p className="text-lg font-bold">กลุ่ม {me.group.no}</p>
                <span className="text-sm text-night/50">{me.group.members.length} คน · คละระดับ</span>
              </div>
              <ul className="mt-4 space-y-2">
                {me.group.members.map((m, i) => (
                  <li key={`${m}-${i}`} className={`flex items-center gap-3 rounded-2xl p-2 ${i === 0 ? 'bg-grape-soft' : ''}`}>
                    <span className={`grid h-10 w-10 place-items-center rounded-full ${AVATAR[i % AVATAR.length]}`}>{m.slice(0, 2)}</span>
                    <span className={i === 0 ? 'font-medium' : ''}>{m}{i === 0 && ' (คุณ)'}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-night/50">คะแนนของแต่ละคนเห็นได้เฉพาะเจ้าตัวและทีมงาน</p>
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-6 text-center lift">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-grape-soft text-grape"><Users className="h-8 w-8" strokeWidth={1.75} aria-hidden /></span>
              <p className="mt-3 text-xl font-bold">ยังไม่มีกลุ่ม</p>
              <p className="mt-1 text-sm text-night/60">ทีมงานจะจัดกลุ่มเมื่อทุกคนทำแบบทดสอบก่อนเรียนครบ ตอนนี้ส่งแล้ว {me.submittedPre} จาก {me.target} คน</p>
              <div className="mt-4 h-3 rounded-full bg-cloud">
                <div className="h-3 rounded-full bg-grape" style={{ width: `${Math.min(100, (me.submittedPre / me.target) * 100)}%` }} />
              </div>
            </div>
          )}
          {next && !next.open && (
            <div className="rounded-3xl bg-sun/30 p-5">
              <p className="flex items-center gap-2 font-bold"><Bell className="h-4 w-4" aria-hidden /> เตือนความจำ</p>
              <p className="mt-1 text-sm">
                รอบ{PHASE_LABEL[next.phase]}เปิด {thaiDate(next.opensOn)} (อีก {daysUntil(next.opensOn)} วัน) ใช้เวลาราว 10 นาที เข้ามาด้วยรหัส {me.trackingCode}
              </p>
            </div>
          )}
        </section>
      </main>
    </ParticipantShell>
  )
}

function PhaseTile({ p }: { p: PhaseState }) {
  const label = p.phase === 'followup' ? 'ติดตามผล' : PHASE_LABEL[p.phase]
  if (p.submitted) {
    const tone = p.phase === 'post' ? 'bg-mint text-white lift-mint' : p.phase === 'followup' ? 'bg-grape text-white lift-grape' : 'bg-white lift'
    const dim = p.phase === 'pre' ? 'text-night/50' : 'text-white/80'
    return (
      <div className={`rounded-2xl p-4 ${tone}`}>
        <p className={`text-xs ${dim}`}>{label}</p>
        <p className="mt-1 text-3xl font-bold">{p.score}</p>
        <p className={`text-xs ${dim}`}>{thaiDate(p.opensOn, false)}</p>
      </div>
    )
  }
  const days = daysUntil(p.opensOn)
  return (
    <div className="rounded-2xl border-2 border-dashed border-grape/40 bg-white p-4">
      <p className="text-xs text-night/50">{label}</p>
      <p className="mt-2 text-lg font-bold text-grape">{p.open ? 'เปิดแล้ว' : `อีก ${days} วัน`}</p>
      <p className="text-xs text-night/40">{thaiDate(p.opensOn, false)}</p>
    </div>
  )
}
