'use client'

import { LifeBuoy } from 'lucide-react'
import Link from 'next/link'
import StaffShell from '@/components/staff/StaffShell'
import { getOverview } from '@/lib/api/staff.api'
import { thaiDate } from '@/lib/format'
import type { Phase } from '@/types/room.types'
import { useLoad } from '@/use/useLoad'

const weekOf = (pre: string, today: string) => Math.max(1, Math.floor((Date.parse(today) - Date.parse(pre)) / (7 * 86_400_000)) + 1)

export default function OverviewPage() {
  const { data: o } = useLoad(getOverview, 15000)
  if (!o) return <StaffShell>{null}</StaffShell>

  const s = o.room.schedule
  const weeks = Math.ceil((Date.parse(s.end) - Date.parse(s.pre)) / (7 * 86_400_000))
  const current: Phase | 'activity' | 'done' =
    o.today >= s.end ? 'done' : o.today >= s.followup ? 'followup' : o.today >= s.post ? 'post' : o.today > s.pre ? 'activity' : 'pre'
  const steps = [
    { key: 'pre', label: 'ก่อนเรียน', date: thaiDate(s.pre) },
    { key: 'activity', label: 'กิจกรรมหลัก', date: `${thaiDate(s.pre, false)}–${thaiDate(s.post)}` },
    { key: 'post', label: 'หลังกิจกรรม', date: thaiDate(s.post) },
    { key: 'followup', label: 'ติดตามผล 14 วัน', date: thaiDate(s.followup), sub: `ปิดโครงการ ${thaiDate(s.end)}` },
  ]
  const pct = (n: number) => `${Math.min(100, (n / Math.max(1, o.target)) * 100)}%`

  return (
    <StaffShell>
      <h1 className="text-2xl font-bold">ภาพรวมห้อง</h1>
      <p className="text-sm text-night/60">วันนี้ {thaiDate(o.today)} · {o.today < s.pre ? 'ยังไม่เริ่ม' : `สัปดาห์ที่ ${Math.min(weekOf(s.pre, o.today), weeks)} จาก ${weeks}`}</p>

      <ol className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {steps.map((st) => (
          <li key={st.key} className={`rounded-2xl p-4 ${current === st.key ? 'bg-grape text-white lift-grape' : 'bg-white lift'}`}>
            <p className={`text-xs ${current === st.key ? 'text-white/70' : 'text-night/50'}`}>{current === st.key ? 'ตอนนี้' : st.label}</p>
            <p className="mt-1 font-bold">{current === st.key ? st.label : st.date}</p>
            <p className={`text-xs ${current === st.key ? 'text-white/70' : 'text-night/50'}`}>{current === st.key ? st.date : st.sub}</p>
          </li>
        ))}
      </ol>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <section className="rounded-3xl bg-white p-5 lift lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <p className="text-lg font-bold">ส่งแบบทดสอบก่อนเรียน</p>
            <p className="text-3xl font-bold text-grape">{o.submitted.pre}<span className="text-base text-night/40">/{o.target}</span></p>
          </div>
          <div className="mt-3 h-4 rounded-full bg-cloud"><div className="h-4 rounded-full bg-grape" style={{ width: pct(o.submitted.pre) }} /></div>
          <ul className="mt-5 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <li className="rounded-2xl bg-mint-soft p-3"><p>สูง 70% ขึ้นไป</p><p className="text-lg font-bold">{o.bands.high} คน</p></li>
            <li className="rounded-2xl bg-sun/30 p-3"><p>กลาง 50–69%</p><p className="text-lg font-bold">{o.bands.mid} คน</p></li>
            <li className="rounded-2xl bg-coral-soft p-3"><p>เริ่มต้น ต่ำกว่า 50%</p><p className="text-lg font-bold">{o.bands.low} คน</p></li>
            <li className="rounded-2xl bg-cloud p-3"><p>เฉลี่ยตอนนี้</p><p className="text-lg font-bold">{o.avgPre ?? '–'}</p></li>
          </ul>
          <p className="mt-4 text-sm text-night/60">หลังกิจกรรมส่งแล้ว {o.submitted.post} คน · ติดตามผลส่งแล้ว {o.submitted.followup} คน</p>
          {!o.groupsAnnounced && (
            <>
              <Link href="/staff/groups" className="mt-5 inline-block w-full rounded-2xl bg-sun px-6 py-3 text-center font-bold lift-sun md:w-auto">
                จัดกลุ่มตอนนี้ ({o.submitted.pre} คน)
              </Link>
              <p className="mt-2 text-xs text-night/50">หรือรอให้ครบ คนที่ส่งหลังจัดกลุ่มจะได้กลุ่มอัตโนมัติ ระบบเลือกกลุ่มที่คนน้อยสุดและทำให้ค่าเฉลี่ยใกล้ทั้งห้องที่สุด</p>
            </>
          )}
        </section>
        <section className="rounded-3xl bg-coral p-5 text-white lift-coral">
          <p className="flex items-center gap-2 text-lg font-bold"><LifeBuoy className="h-5 w-5" aria-hidden /> คิวช่วยเหลือ</p>
          <p className="mt-2 text-5xl font-bold">{o.help.waiting} <span className="text-base font-normal text-white/80">รออยู่</span></p>
          <p className="text-sm text-white/80">{o.help.helping} กำลังช่วย · วันนี้เสร็จแล้ว {o.help.doneToday}</p>
          <Link href="/staff/help" className="mt-4 block rounded-2xl bg-white py-3 text-center font-bold text-coral">ไปที่คิว</Link>
        </section>
      </div>

      <section className="mt-5 rounded-3xl bg-white p-5 lift">
        <p className="text-lg font-bold">ยังไม่ส่งแบบทดสอบก่อนเรียน {o.notSubmittedPre.length} คน</p>
        {o.notSubmittedPre.length ? (
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {o.notSubmittedPre.map((n, i) => <span key={`${n}-${i}`} className="rounded-full bg-cloud px-3 py-1">{n}</span>)}
          </div>
        ) : (
          <p className="mt-2 text-sm text-night/60">ทุกคนที่เข้าห้องส่งแล้ว</p>
        )}
        <p className="mt-3 text-xs text-night/50">นับเฉพาะคนที่กรอกชื่อแล้ว · เข้าห้องแล้วทั้งหมด {o.participants} คน · แจกรหัสห้อง <b className="font-mono">{o.room.code}</b></p>
      </section>
    </StaffShell>
  )
}
