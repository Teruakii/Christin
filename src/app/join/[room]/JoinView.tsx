'use client'

import { GraduationCap, Puzzle, SearchX, Timer } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import StateCard from '@/components/ui/StateCard'
import { joinRoom, lookupRoom } from '@/lib/api/participant.api'
import { errorText } from '@/lib/errors'
import { LANGUAGE_META } from '@/lib/format'
import type { Me } from '@/types/quiz.types'
import { useLoad } from '@/use/useLoad'

export default function JoinView() {
  const { room: code } = useParams<{ room: string }>()
  const { data: room, error: roomError } = useLoad(useCallback(() => lookupRoom(code), [code]))
  const [nickname, setNickname] = useState('')
  const [me, setMe] = useState<Me | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  if (roomError) return <StateCard icon={SearchX} title="ไม่พบรหัสห้องนี้" action={{ href: '/', label: 'ลองอีกครั้ง' }}>{errorText(roomError)}</StateCard>
  if (!room) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setMe(await joinRoom(code, nickname))
    } catch (err) {
      setError(errorText(err))
    }
  }

  const copy = async () => {
    await navigator.clipboard?.writeText(me!.trackingCode).catch(() => {})
    setCopied(true)
  }

  const lang = LANGUAGE_META[room.courseLanguage]

  if (me) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <p className="text-center text-sm text-night/60">{room.name}</p>
        <h1 className="mt-1 text-center text-3xl font-bold">นี่คือรหัสของคุณ {me.nickname}</h1>
        <div className="mt-6 rounded-3xl border-2 border-dashed border-grape/40 bg-white p-6 text-center lift">
          <p className="font-mono text-4xl tracking-[0.3em] text-grape">{me.trackingCode}</p>
          <p className="mt-3 text-sm">จดหรือถ่ายรูปไว้ ใช้กลับมาทำรอบหลังกิจกรรมและรอบติดตามผล 14 วัน เครื่องนี้จะจำให้อัตโนมัติด้วย</p>
          <button onClick={copy} className="mt-4 w-full rounded-2xl bg-cloud py-3 font-medium">{copied ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}</button>
        </div>
        <Link href="/quiz/pre" className="mt-6 block rounded-2xl bg-sun py-4 text-center text-lg font-bold lift-sun">เริ่มทำแบบทดสอบ</Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-xl px-4 pt-8 pb-16">
      <p className="text-sm text-night/60">{room.name} · <span className="font-mono">{room.code}</span></p>
      <h1 className="mt-1 text-3xl font-bold">บอกเราหน่อย</h1>
      <form onSubmit={submit}>
        <div className="mt-6 rounded-3xl bg-white p-6 lift">
          <label className="text-sm text-night/60" htmlFor="nick">ชื่อเล่น (เพื่อนในกลุ่มจะเห็นชื่อนี้)</label>
          <input
            id="nick"
            required
            maxLength={30}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="mt-1 w-full rounded-2xl bg-cloud px-4 py-4 text-xl outline-none focus:ring-4 focus:ring-grape/20"
          />
        </div>
        <div className="mt-5 rounded-3xl bg-white p-6 lift">
          <p className="text-lg font-bold">แบบทดสอบมีหน้าตาแบบนี้</p>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="flex gap-3"><GraduationCap className="h-5 w-5 shrink-0 text-grape" aria-hidden /><span>ทุกคนเรียน <b>{lang.label}</b> ด้วยกัน แบบทดสอบนี้ใช้แบ่งกลุ่ม ไม่ได้ตัดเกรด</span></li>
            <li className="flex gap-3">
              <Puzzle className="h-5 w-5 shrink-0 text-grape" aria-hidden />
              <span>
                10 ข้อ มีโค้ดหลายภาษาปนกัน{' '}
                {Object.values(LANGUAGE_META).map((l) => (
                  <span key={l.label} className={`mr-1 inline-block rounded-full px-2 text-xs ${l.chip}`}>{l.label}</span>
                ))}
                ไม่ต้องรู้ทุกภาษา ข้อไหนไม่เคยเห็นกดข้ามได้
              </span>
            </li>
            <li className="flex gap-3"><Timer className="h-5 w-5 shrink-0 text-grape" aria-hidden /><span>ใช้เวลาราว 10 นาที</span></li>
          </ul>
        </div>
        {error && <p className="mt-4 rounded-2xl bg-coral-soft p-3 text-sm text-coral">{error}</p>}
        <button className="mt-6 w-full rounded-2xl bg-sun py-4 text-lg font-bold lift-sun">รับรหัสติดตาม</button>
      </form>
    </main>
  )
}
