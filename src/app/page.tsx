'use client'

import { ClipboardList, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getMe, leave, lookupRoom, resume } from '@/lib/api/participant.api'
import { errorText } from '@/lib/errors'
import { useLoad } from '@/use/useLoad'

const fetchMe = () => getMe().catch(() => null)

export default function HomePage() {
  const router = useRouter()
  const { data: me, setData: setMe } = useLoad(fetchMe)
  const [roomCode, setRoomCode] = useState('')
  const [tracking, setTracking] = useState('')
  const [error, setError] = useState<{ form: 'room' | 'resume'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  // สองช่องหน้าตาเหมือนกัน คนใส่สลับช่องได้ง่าย: ลองแบบที่ช่องนั้นตั้งใจก่อน ไม่เจอค่อยลองอีกแบบ
  const go = async (code: string, form: 'room' | 'resume') => {
    const asRoom = async () => router.push(`/join/${(await lookupRoom(code)).code}`)
    const asTracking = async () => {
      await resume(code)
      router.push('/me')
    }
    const [first, second] = form === 'room' ? [asRoom, asTracking] : [asTracking, asRoom]
    setBusy(true)
    setError(null)
    try {
      await first()
    } catch (err) {
      try {
        await second()
      } catch {
        setError({ form, text: errorText(err) })
        setBusy(false)
      }
    }
  }

  const enterRoom = (e: React.FormEvent) => {
    e.preventDefault()
    void go(roomCode, 'room')
  }

  const comeBack = (e: React.FormEvent) => {
    e.preventDefault()
    void go(tracking, 'resume')
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pt-8 pb-16 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-16">
      <section>
        <div className="relative overflow-hidden rounded-3xl bg-grape p-6 text-white lg:p-10">
          <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-gradient-to-br from-sun to-coral opacity-80" />
          <div className="absolute right-10 bottom-6 h-16 w-16 rotate-12 rounded-2xl bg-mint opacity-90" />
          <p className="relative text-white/70">แบบทดสอบโค้ดก่อนเรียน</p>
          <h1 className="relative mt-2 text-3xl leading-tight font-bold lg:text-5xl">
            มาดูกันว่า
            <br />
            เริ่มที่ตรงไหน
          </h1>
          <p className="relative mt-4 max-w-sm text-white/80">
            ไม่ต้องสมัคร ไม่ต้องจำรหัสผ่าน ทำแบบทดสอบ 10 ข้อ แล้วระบบจะจับกลุ่มให้คุณกับเพื่อนที่เก่งคนละด้าน
          </p>
        </div>
        <ul className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
          <li className="rounded-2xl bg-white p-3 lift"><ClipboardList className="mx-auto h-6 w-6 text-grape" aria-hidden /><p className="mt-1">ทำ 10 ข้อ</p></li>
          <li className="rounded-2xl bg-white p-3 lift"><Users className="mx-auto h-6 w-6 text-grape" aria-hidden /><p className="mt-1">ได้กลุ่มคละ</p></li>
          <li className="rounded-2xl bg-white p-3 lift"><TrendingUp className="mx-auto h-6 w-6 text-grape" aria-hidden /><p className="mt-1">ดูผล 14 วัน</p></li>
        </ul>
      </section>

      <section className="mt-8 space-y-5 lg:mt-0">
        {me && (
          <div className="rounded-3xl bg-mint p-5 text-white lift-mint">
            <Link href="/me" className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-white/80">เครื่องนี้จำคุณไว้แล้ว · {me.room.name}</p>
                <p className="text-xl font-bold">ไปต่อเลย {me.nickname}</p>
              </div>
              <span className="font-mono tracking-widest">{me.trackingCode}</span>
            </Link>
            <button
              onClick={async () => {
                await leave()
                setMe(null)
              }}
              className="mt-3 text-sm text-white/80 underline underline-offset-4"
            >
              ไม่ใช่ {me.nickname}? ล้างรหัสในเครื่องนี้
            </button>
          </div>
        )}

        <form onSubmit={enterRoom} className="rounded-3xl bg-white p-6 lift">
          <h2 className="text-xl font-bold">เข้าห้องครั้งแรก</h2>
          <label className="mt-4 block text-sm text-night/60" htmlFor="room">รหัสห้องจากทีมงาน</label>
          <input
            id="room"
            required
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="CODE24"
            autoComplete="off"
            className={`mt-1 w-full rounded-2xl px-4 py-4 font-mono text-2xl tracking-[0.3em] uppercase outline-none focus:ring-4 focus:ring-grape/20 ${error?.form === 'room' ? 'bg-coral-soft ring-2 ring-coral' : 'bg-cloud'}`}
          />
          {error?.form === 'room' && <p className="mt-2 text-sm text-coral">{error.text}</p>}
          <button disabled={busy} className="mt-4 w-full rounded-2xl bg-sun py-4 text-lg font-bold lift-sun">เข้าห้อง</button>
        </form>

        <form onSubmit={comeBack} className="rounded-3xl bg-white p-6 lift">
          <h2 className="text-xl font-bold">กลับมาทำรอบต่อไป</h2>
          <p className="mt-1 text-sm text-night/60">ใช้รหัสติดตาม 6 ตัวที่ได้ตอนทำครั้งแรก</p>
          <div className="mt-4 flex gap-3">
            <input
              required
              value={tracking}
              onChange={(e) => setTracking(e.target.value.toUpperCase())}
              placeholder="K7P2QX"
              aria-label="รหัสติดตาม"
              autoComplete="off"
              className={`min-w-0 flex-1 rounded-2xl px-4 py-4 font-mono text-xl tracking-[0.25em] uppercase outline-none focus:ring-4 focus:ring-grape/20 ${error?.form === 'resume' ? 'bg-coral-soft ring-2 ring-coral' : 'bg-cloud'}`}
            />
            <button disabled={busy} className="rounded-2xl bg-grape px-5 font-bold text-white lift-grape">ไป</button>
          </div>
          {error?.form === 'resume' && <p className="mt-2 text-sm text-coral">{error.text}</p>}
        </form>

        <p className="text-center text-sm text-night/50">
          ทีมงาน? <Link href="/staff/login" className="font-medium text-grape underline underline-offset-4">เข้าหน้าทีมงาน</Link>
        </p>
      </section>
    </main>
  )
}
