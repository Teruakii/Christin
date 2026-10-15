'use client'

import { KeyRound } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { createTeam } from '@/lib/api/staff.api'
import { errorText } from '@/lib/errors'

// สร้างทีมใหม่: ได้รหัสทีมงานหนึ่งรหัส ใช้เข้าทุกห้องของทีม · แสดงครั้งเดียว
export default function CreateTeamPage() {
  const [staffCode, setStaffCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const create = async () => {
    setBusy(true)
    setError('')
    try {
      setStaffCode((await createTeam()).staffCode)
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 lift">
        <Link href="/" className="inline-flex items-center gap-1 rounded-full bg-cloud px-4 py-2 text-sm font-medium text-night/70 hover:bg-grape-soft hover:text-grape">หน้าแรก</Link>
        <span className="mt-4 grid h-14 w-14 place-items-center rounded-2xl bg-grape-soft text-grape">
          <KeyRound className="h-7 w-7" strokeWidth={1.75} aria-hidden />
        </span>
        <h1 className="mt-2 text-2xl font-bold">สร้างทีมใหม่</h1>
        {staffCode ? (
          <>
            <p className="text-sm text-night/60">จดรหัสนี้ไว้ตอนนี้ ระบบเก็บแค่แบบเข้ารหัส จะไม่แสดงอีก แจกให้ทีมงานทุกคน ใช้เข้าได้ทุกห้องของทีม</p>
            <p className="mt-5 rounded-2xl bg-grape p-5 text-center font-mono text-3xl tracking-[0.2em] text-white lift-grape">{staffCode}</p>
            <Link href="/staff/settings" className="mt-6 block rounded-2xl bg-sun py-4 text-center text-lg font-bold lift-sun">สร้างห้องแรก</Link>
          </>
        ) : (
          <>
            <p className="text-sm text-night/60">ได้รหัสทีมงานหนึ่งรหัส ใช้เข้าระบบทีมงานและทุกห้องที่ทีมสร้าง</p>
            {error && <p className="mt-4 rounded-2xl bg-coral-soft p-3 text-sm text-coral">{error}</p>}
            <button disabled={busy} onClick={create} className="mt-6 w-full rounded-2xl bg-grape py-4 text-lg font-bold text-white lift-grape">สร้างทีม</button>
          </>
        )}
      </section>
    </main>
  )
}
