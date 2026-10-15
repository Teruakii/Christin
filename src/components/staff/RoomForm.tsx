'use client'

import LangBadge from '@/components/ui/LangBadge'
import { useState } from 'react'
import { LANGUAGE_META } from '@/lib/format'
import { LANGUAGES, type RoomUpsert } from '@/types/room.types'

const FOLLOWUP_GAP = 14

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
const gap = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000)

export const defaultRoom = (today: string): RoomUpsert => ({
  name: '',
  courseLanguage: 'python',
  target: 60,
  groupSize: 5,
  schedule: { pre: today, post: addDays(today, 18), followup: addDays(today, 32), end: addDays(today, 41) },
  mix: { python: 4, javascript: 2, java: 2, c: 2 },
})

const BAR = { python: 'bg-sun', javascript: 'bg-grape', java: 'bg-mint', c: 'bg-coral' } as const

// ใช้ทั้งตอนสร้างห้องและตั้งค่าห้อง · locked = มีคนส่งแล้ว ห้ามเปลี่ยนชุดข้อสอบ
export default function RoomForm({ initial, locked, submitLabel, onSubmit, children }: {
  initial: RoomUpsert
  locked?: boolean
  submitLabel: string
  onSubmit: (room: RoomUpsert) => Promise<void>
  children?: React.ReactNode
}) {
  const [room, setRoom] = useState(initial)
  const [busy, setBusy] = useState(false)
  const total = LANGUAGES.reduce((n, l) => n + room.mix[l], 0)
  const followGap = gap(room.schedule.post, room.schedule.followup)
  const groups = Math.ceil(room.target / room.groupSize)
  const weeks = Math.ceil((gap(room.schedule.pre, room.schedule.end) + 1) / 7)

  const set = <K extends keyof RoomUpsert>(k: K, v: RoomUpsert[K]) => setRoom((r) => ({ ...r, [k]: v }))
  const setDate = (k: keyof RoomUpsert['schedule'], v: string) => setRoom((r) => ({ ...r, schedule: { ...r.schedule, [k]: v } }))
  const bump = (l: (typeof LANGUAGES)[number], d: number) => set('mix', { ...room.mix, [l]: Math.max(0, Math.min(10, room.mix[l] + d)) })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await onSubmit(room)
    } finally {
      setBusy(false)
    }
  }

  const field = 'mt-1 w-full rounded-2xl bg-cloud px-4 py-3 outline-none focus:ring-4 focus:ring-grape/20'
  return (
    <form onSubmit={submit} className="max-w-4xl">
      <section className="mt-6 rounded-3xl bg-white p-6 lift">
        <p className="text-lg font-bold">ข้อมูลห้อง</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="text-sm text-night/60">ชื่อห้อง</span>
            <input required maxLength={80} value={room.name} onChange={(e) => set('name', e.target.value)} placeholder="Intro to Code รุ่น 1" className={field} />
          </label>
          <label className="block"><span className="text-sm text-night/60">ภาษาที่สอน (ทุกคนเรียนภาษานี้)</span>
            <select value={room.courseLanguage} onChange={(e) => set('courseLanguage', e.target.value as RoomUpsert['courseLanguage'])} className={field}>
              {LANGUAGES.map((l) => <option key={l} value={l}>{LANGUAGE_META[l].label}</option>)}
            </select>
          </label>
          <label className="block"><span className="text-sm text-night/60">จำนวนผู้เข้าร่วมเป้าหมาย</span>
            <input type="number" min={2} max={500} required value={room.target} onChange={(e) => set('target', Number(e.target.value))} className={field} />
          </label>
          <label className="block"><span className="text-sm text-night/60">คนต่อกลุ่ม</span>
            <input type="number" min={2} max={10} required value={room.groupSize} onChange={(e) => set('groupSize', Number(e.target.value))} className={field} />
            <span className="text-xs text-night/50">ประมาณ {groups} กลุ่ม</span>
          </label>
        </div>
      </section>

      <section className="mt-5 rounded-3xl bg-white p-6 lift">
        <p className="text-lg font-bold">ข้อสอบ {total} ข้อ ใช้ชุดเดียวกันทั้ง 3 รอบ</p>
        <p className="text-sm text-night/60">
          {locked ? 'มีคนเริ่มทำแบบทดสอบแล้ว เปลี่ยนชุดข้อสอบไม่ได้ ไม่งั้นเทียบผลก่อน-หลังไม่ได้' : 'คำถามแต่ละภาษาไม่ซ้ำกัน ระบบสุ่มข้อจากคลังภาษาละ 10 ข้อ'}
        </p>
        <ul className="mt-4 space-y-3">
          {LANGUAGES.map((l) => (
            <li key={l} className="flex items-center gap-3">
              <span className="w-32"><LangBadge language={l} withLabel /></span>
              <div className="h-3 flex-1 rounded-full bg-cloud"><div className={`h-3 rounded-full ${BAR[l]}`} style={{ width: `${room.mix[l] * 10}%` }} /></div>
              <span className="flex items-center gap-1">
                <button type="button" disabled={locked} onClick={() => bump(l, -1)} aria-label={`ลด ${LANGUAGE_META[l].label}`} className="h-8 w-8 rounded-full bg-cloud">−</button>
                <b className="w-6 text-center">{room.mix[l]}</b>
                <button type="button" disabled={locked} onClick={() => bump(l, 1)} aria-label={`เพิ่ม ${LANGUAGE_META[l].label}`} className="h-8 w-8 rounded-full bg-cloud">+</button>
              </span>
            </li>
          ))}
        </ul>
        {total < 4 && <p className="mt-3 text-sm text-coral">ข้อสอบต้องมีอย่างน้อย 4 ข้อ</p>}
      </section>

      <section className="mt-5 rounded-3xl bg-white p-6 lift">
        <p className="text-lg font-bold">กำหนดการ {weeks} สัปดาห์</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="text-sm text-night/60">1 · แบบทดสอบก่อนเรียน</span>
            <input type="date" required value={room.schedule.pre} onChange={(e) => setDate('pre', e.target.value)} className={field} />
          </label>
          <label className="block"><span className="text-sm text-night/60">2 · จบกิจกรรมหลัก + แบบทดสอบหลังกิจกรรม</span>
            <input type="date" required value={room.schedule.post} onChange={(e) => setDate('post', e.target.value)} className={field} />
          </label>
          <label className="block"><span className="text-sm text-night/60">3 · ติดตามผล (อย่างน้อย {FOLLOWUP_GAP} วันหลังข้อ 2)</span>
            <input type="date" required value={room.schedule.followup} onChange={(e) => setDate('followup', e.target.value)}
              className={`${field} ${followGap >= FOLLOWUP_GAP ? 'bg-mint-soft ring-2 ring-mint' : 'bg-coral-soft ring-2 ring-coral'}`} />
            <span className={`text-xs ${followGap >= FOLLOWUP_GAP ? 'text-mint' : 'text-coral'}`}>
              {followGap >= FOLLOWUP_GAP ? `ห่าง ${followGap} วัน ใช้ได้` : `ห่างแค่ ${followGap} วัน ต้องอย่างน้อย ${FOLLOWUP_GAP}`}
            </span>
          </label>
          <label className="block"><span className="text-sm text-night/60">ปิดโครงการ</span>
            <input type="date" required value={room.schedule.end} onChange={(e) => setDate('end', e.target.value)} className={field} />
            <span className="text-xs text-night/50">เฉลยเปิดให้ทุกคนหลังวันนี้</span>
          </label>
        </div>
      </section>
      {children}
      <button disabled={busy || total < 4 || followGap < FOLLOWUP_GAP} className="mt-6 w-full rounded-2xl bg-sun px-8 py-4 text-lg font-bold lift-sun sm:w-auto">
        {submitLabel}
      </button>
    </form>
  )
}
