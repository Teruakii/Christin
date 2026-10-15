'use client'

import { Bug, Footprints, LifeBuoy, Lightbulb, MapPin, MessageCircle, Monitor, Smartphone, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { cancelHelp, getMyHelp, requestHelp } from '@/lib/api/participant.api'
import { errorText } from '@/lib/errors'
import { clock } from '@/lib/format'
import type { HelpPlace, HelpTopic, MyHelp } from '@/types/help.types'
import { useLoad } from '@/use/useLoad'

const TOPICS: { key: HelpTopic; label: string; icon: LucideIcon }[] = [
  { key: 'content', label: 'ไม่เข้าใจเนื้อหา', icon: Lightbulb },
  { key: 'code', label: 'โค้ดไม่ทำงาน', icon: Bug },
  { key: 'app', label: 'ใช้แอปไม่เป็น', icon: Smartphone },
  { key: 'talk', label: 'อยากคุยกับทีมงาน', icon: MessageCircle },
]

export const OPEN_HELP_EVENT = 'open-help'
export const openHelp = (message = '') => window.dispatchEvent(new CustomEvent(OPEN_HELP_EVENT, { detail: message }))

const fetchHelp = () => getMyHelp().catch(() => null)

export default function HelpButton({ groupNo, raised = false, hideOnDesktop = false }: { groupNo?: number | null; raised?: boolean; hideOnDesktop?: boolean }) {
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState<HelpTopic>('content')
  const [message, setMessage] = useState('')
  const [place, setPlace] = useState<HelpPlace>('table')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // ตอนแผงเปิดเช็กถี่ ให้เห็นทันทีที่ทีมงานรับเรื่อง
  const { data: help, setData } = useLoad<MyHelp | null>(fetchHelp, open ? 5000 : 20000)

  const onOpen = useCallback((e: Event) => {
    const msg = (e as CustomEvent<string>).detail
    if (msg) setMessage(msg)
    setOpen(true)
  }, [])
  useEffect(() => {
    window.addEventListener(OPEN_HELP_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_HELP_EVENT, onOpen)
  }, [onOpen])

  const send = async () => {
    setBusy(true)
    setError('')
    try {
      setData(await requestHelp({ topic, message, place }))
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  const cancel = async () => setData(await cancelHelp())

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="ขอความช่วยเหลือ"
        className={`fixed right-4 z-30 grid h-16 w-16 place-items-center rounded-full bg-coral text-2xl text-white lift-coral ${raised ? 'bottom-20 lg:bottom-5' : 'bottom-5'} ${hideOnDesktop ? 'lg:hidden' : ''}`}
      >
        <LifeBuoy className="h-7 w-7" strokeWidth={2} aria-hidden />
        {help && <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full border-2 border-white bg-sun" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-night/40 lg:items-center" onClick={() => setOpen(false)}>
          <section
            role="dialog"
            aria-label="ขอความช่วยเหลือ"
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 lift lg:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto h-1.5 w-12 rounded-full bg-night/10 lg:hidden" />
            <div className="mt-3 flex items-start lg:mt-0">
              <div>
                <h2 className="text-2xl font-bold">ขอความช่วยเหลือ</h2>
                <p className="text-sm text-night/60">ทีมงานเห็นคำขอทันที แล้วจะมาหาคุณ</p>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto rounded-full bg-cloud px-3 py-1 text-sm">ปิด</button>
            </div>

            {help?.status === 'helping' ? (
              <div className="mt-6 flex items-center gap-4 rounded-3xl bg-mint p-6 text-white lift-mint">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-mint"><Footprints className="h-7 w-7" aria-hidden /></span>
                <div>
                  <p className="text-lg font-bold">ทีมงานกำลังไปหาคุณ</p>
                  <p className="text-sm text-white/80">รับเรื่องเมื่อ {help.claimedAt && clock(help.claimedAt)}</p>
                </div>
              </div>
            ) : help?.status === 'waiting' ? (
              <div className="mt-6 rounded-3xl bg-cloud p-6 text-center">
                <p className="text-sm text-night/50">ส่งแล้ว · {clock(help.createdAt)}</p>
                <p className="mt-2 text-5xl font-bold text-grape">คิวที่ {help.position}</p>
                <p className="mt-2 text-night/60">
                  {help.staffOnline ? `ทีมงานออนไลน์ ${help.staffOnline} คน` : 'ทีมงานจะเห็นคำขอเมื่อเปิดหน้าคิว'}
                </p>
                <div className="mt-5 flex justify-center gap-2">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-grape" />
                  <span className="h-3 w-3 rounded-full bg-grape/40" />
                  <span className="h-3 w-3 rounded-full bg-grape/20" />
                </div>
                <button onClick={cancel} className="mt-5 text-sm text-night/50 underline underline-offset-4">ยกเลิกคำขอ</button>
              </div>
            ) : (
              <>
                <p className="mt-5 font-medium">เรื่องอะไร?</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  {TOPICS.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTopic(t.key)}
                      className={`rounded-2xl p-3 text-left ${topic === t.key ? 'bg-grape text-white lift-grape' : 'bg-cloud'}`}
                    >
                      <span className="flex items-center gap-2"><t.icon className="h-4 w-4 shrink-0" aria-hidden />{t.label}</span>
                    </button>
                  ))}
                </div>
                <label className="mt-5 block font-medium" htmlFor="help-msg">เล่าสั้น ๆ (ไม่ใส่ก็ได้)</label>
                <textarea
                  id="help-msg"
                  rows={3}
                  maxLength={500}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-cloud p-4 outline-none focus:ring-4 focus:ring-grape/20"
                />
                <p className="mt-5 font-medium">ให้ไปหาที่ไหน?</p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <button onClick={() => setPlace('table')} className={`rounded-full px-4 py-2 ${place === 'table' ? 'bg-sun font-medium' : 'bg-cloud'}`}>
                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden />{groupNo ? `โต๊ะกลุ่ม ${groupNo}` : 'ที่โต๊ะของฉัน'}</span>
                  </button>
                  <button onClick={() => setPlace('online')} className={`rounded-full px-4 py-2 ${place === 'online' ? 'bg-sun font-medium' : 'bg-cloud'}`}>
                    <span className="flex items-center gap-1.5"><Monitor className="h-4 w-4" aria-hidden />ออนไลน์ (ส่งลิงก์ให้)</span>
                  </button>
                </div>
                {error && <p className="mt-4 rounded-2xl bg-coral-soft p-3 text-sm text-coral">{error}</p>}
                <button disabled={busy} onClick={send} className="mt-6 w-full rounded-2xl bg-coral py-4 text-lg font-bold text-white lift-coral">
                  ส่งคำขอ
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </>
  )
}
