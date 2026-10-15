'use client'

import LangBadge from '@/components/ui/LangBadge'
import { useState } from 'react'
import StaffShell from '@/components/staff/StaffShell'
import { getAnswerKey } from '@/lib/api/staff.api'
import { PHASE_LABEL } from '@/lib/format'
import { PHASES, type Phase } from '@/types/room.types'
import type { AnswerKeyItem } from '@/types/staff.types'
import { useLoad } from '@/use/useLoad'

const LETTERS = ['ก', 'ข', 'ค', 'ง']

const pctRight = (q: AnswerKeyItem, phase: Phase) => {
  const s = q.stats[phase]
  return s.n ? s.picks[q.answer] / s.n : null
}

export default function AnswerKeyPage() {
  const { data: items } = useLoad(getAnswerKey, 30000)
  const [phase, setPhase] = useState<Phase>('pre')
  const [hardestFirst, setHardestFirst] = useState(false)

  if (!items) return <StaffShell>{null}</StaffShell>

  const numbered = items.map((q, i) => ({ q, no: i + 1 }))
  const shown = hardestFirst
    ? [...numbered].sort((a, b) => (pctRight(a.q, phase) ?? 2) - (pctRight(b.q, phase) ?? 2))
    : numbered
  const n = items[0]?.stats[phase].n ?? 0

  return (
    <StaffShell>
      <h1 className="text-2xl font-bold">เฉลย</h1>
      <p className="text-sm text-night/60">
        ข้อสอบ {items.length} ข้อ ใช้ชุดเดียวกันทั้งสามรอบ · แถบบอกว่าแต่ละตัวเลือกมีคนเลือกกี่คน ดูได้ว่าคนเข้าใจผิดไปทางไหน
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        {PHASES.map((p) => (
          <button key={p} onClick={() => setPhase(p)} className={`rounded-full px-4 py-2 ${phase === p ? 'bg-grape font-medium text-white' : 'bg-white'}`}>
            {PHASE_LABEL[p]} <span className={phase === p ? 'text-white/70' : 'text-night/40'}>{items[0]?.stats[p].n ?? 0} คน</span>
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 rounded-full bg-white px-4 py-2">
          <input type="checkbox" checked={hardestFirst} onChange={(e) => setHardestFirst(e.target.checked)} className="accent-grape" />
          ข้อที่ตอบถูกน้อยสุดขึ้นก่อน
        </label>
      </div>

      {!n && <p className="mt-5 rounded-2xl bg-sun/30 p-4 text-sm">ยังไม่มีใครส่งรอบ{PHASE_LABEL[phase]} แสดงเฉลยอย่างเดียว</p>}

      <ol className="mt-5 grid gap-5 xl:grid-cols-2">
        {shown.map(({ q, no }) => {
          const s = q.stats[phase]
          const right = pctRight(q, phase)
          const most = Math.max(...s.picks)
          return (
            <li key={q.id} className="rounded-3xl bg-white p-5 lift">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-grape-soft px-3 py-1 text-sm text-grape">ข้อ {no} · <LangBadge language={q.language} withLabel /> · {q.topic}</span>
                {right !== null && (
                  <span className={`ml-auto text-sm font-medium ${right >= 0.7 ? 'text-mint' : right >= 0.4 ? 'text-night/70' : 'text-coral'}`}>
                    ถูก {Math.round(right * 100)}%
                  </span>
                )}
              </div>
              <pre className="mt-3 overflow-x-auto rounded-2xl bg-night p-4 font-mono text-sm leading-6 whitespace-pre-wrap break-words text-white">{q.code}</pre>
              <ul className="mt-3 space-y-1.5 text-sm">
                {q.choices.map((c, i) => {
                  const correct = i === q.answer
                  const count = s.picks[i]
                  // ตัวเลือกผิดที่คนเลือกมากที่สุดคือความเข้าใจผิดที่ควรอธิบายในห้อง
                  const trap = !correct && count > 0 && count === most
                  return (
                    <li key={i} className={`relative overflow-hidden rounded-xl px-3 py-2 ${correct ? 'ring-2 ring-mint' : ''}`}>
                      <div className={`absolute inset-y-0 left-0 ${correct ? 'bg-mint-soft' : trap ? 'bg-coral-soft' : 'bg-cloud'}`} style={{ width: s.n ? `${(count / s.n) * 100}%` : 0 }} />
                      <div className="relative flex items-center gap-2">
                        <span className="w-4 text-xs text-night/40">{LETTERS[i]}</span>
                        <span className="flex-1 font-mono">{c}</span>
                        {correct && <span className="rounded-full bg-mint px-2 text-xs text-white">เฉลย</span>}
                        {trap && <span className="rounded-full bg-coral px-2 text-xs text-white">ผิดบ่อย</span>}
                        {s.n > 0 && <span className="w-12 text-right text-night/60">{count} คน</span>}
                      </div>
                    </li>
                  )
                })}
                {s.n > 0 && <li className="px-3 text-xs text-night/50">ข้าม {s.skipped} คน</li>}
              </ul>
              <p className="mt-3 text-sm text-night/80">{q.explanation}</p>
            </li>
          )
        })}
      </ol>
    </StaffShell>
  )
}
