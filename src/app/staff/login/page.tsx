'use client'

import { KeyRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { login } from '@/lib/api/staff.api'
import { errorText } from '@/lib/errors'

export default function StaffLoginPage() {
  const router = useRouter()
  const [staffCode, setStaffCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(staffCode)
      router.replace('/staff')
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-6 lift">
        <Link href="/" className="inline-flex items-center gap-1 rounded-full bg-cloud px-4 py-2 text-sm font-medium text-night/70 hover:bg-grape-soft hover:text-grape">หน้าแรก</Link>
        <span className="mt-4 grid h-14 w-14 place-items-center rounded-2xl bg-grape-soft text-grape"><KeyRound className="h-7 w-7" strokeWidth={1.75} aria-hidden /></span>
        <h1 className="mt-2 text-2xl font-bold">เข้าหน้าทีมงาน</h1>
        <p className="text-sm text-night/60">ใส่รหัสทีมงานที่ได้ตอนสร้างห้อง</p>
        <label className="mt-5 block text-sm text-night/60" htmlFor="s">รหัสทีมงาน</label>
        {/* ช่องข้อความธรรมดา ไม่ใช่ password: กัน browser เติมรหัสผ่านที่บันทึกไว้ลงมาเอง */}
        <input
          id="s"
          required
          value={staffCode}
          onChange={(e) => setStaffCode(e.target.value.toUpperCase())}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className={`mt-1 w-full rounded-2xl px-4 py-4 font-mono text-2xl tracking-[0.2em] outline-none focus:ring-4 focus:ring-grape/20 ${error ? 'bg-coral-soft ring-2 ring-coral' : 'bg-cloud'}`}
        />
        {error && <p className="mt-2 text-sm text-coral">{error}</p>}
        <button disabled={busy} className="mt-6 w-full rounded-2xl bg-grape py-4 text-lg font-bold text-white lift-grape">เข้าห้อง</button>
      </form>
    </main>
  )
}
