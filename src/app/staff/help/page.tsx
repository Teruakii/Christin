'use client'

import { Bug, Lightbulb, MapPin, MessageCircle, Monitor, Smartphone, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import StaffShell from '@/components/staff/StaffShell'
import { getHelpQueue, helpAction } from '@/lib/api/staff.api'
import { errorText } from '@/lib/errors'
import { clock, minutesSince } from '@/lib/format'
import type { HelpRequest, HelpTopic } from '@/types/help.types'
import { useLoad } from '@/use/useLoad'

const TOPIC: Record<HelpTopic, { icon: LucideIcon; label: string }> = {
  content: { icon: Lightbulb, label: 'ไม่เข้าใจเนื้อหา' },
  code: { icon: Bug, label: 'โค้ดไม่ทำงาน' },
  app: { icon: Smartphone, label: 'ใช้แอปไม่เป็น' },
  talk: { icon: MessageCircle, label: 'อยากคุย' },
}

const where = (r: HelpRequest) => (r.place === 'online' ? 'ออนไลน์' : r.groupNo ? `โต๊ะกลุ่ม ${r.groupNo}` : 'ที่โต๊ะ')

export default function HelpQueuePage() {
  // คิวต้องสดเพราะทีมงาน 3 คนเปิดดูพร้อมกัน
  const { data: queue, setData, reload } = useLoad(getHelpQueue, 4000)
  const [error, setError] = useState('')

  const act = async (id: string, action: 'claim' | 'done' | 'release') => {
    setError('')
    try {
      setData(await helpAction(id, action))
    } catch (e) {
      setError(errorText(e))
      void reload()
    }
  }

  if (!queue) return <StaffShell>{null}</StaffShell>
  const by = (s: HelpRequest['status']) => queue.requests.filter((r) => r.status === s)
  const waiting = by('waiting')
  const helping = by('helping')
  const done = by('done').sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? ''))
  const avgWait = done.length
    ? Math.round(done.reduce((n, r) => n + (Date.parse(r.claimedAt!) - Date.parse(r.createdAt)), 0) / done.length / 60_000 * 10) / 10
    : null

  return (
    <StaffShell>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold">คิวช่วยเหลือ</h1>
          <p className="text-sm text-night/60">อัปเดตทุก 4 วินาที · ทีมงานเปิดหน้านี้อยู่ {queue.staffOnline} คน</p>
        </div>
      </div>
      {error && <p className="mt-4 rounded-2xl bg-coral-soft p-3 text-sm text-coral">{error}</p>}

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Column dot="bg-coral" title="รอ" count={waiting.length}>
          {waiting.map((r, i) => (
            <Card key={r.id} r={r} border={i === 0 ? 'border-coral' : 'border-coral/50'} right={<span className={minutesSince(r.createdAt) >= 3 ? 'font-medium text-coral' : 'text-night/50'}>รอ {minutesSince(r.createdAt)} นาที</span>}>
              <button onClick={() => act(r.id, 'claim')} className="mt-4 w-full rounded-2xl bg-grape py-3 font-bold text-white lift-grape">รับเรื่อง</button>
            </Card>
          ))}
          {!waiting.length && <Empty>ไม่มีใครรอ</Empty>}
        </Column>

        <Column dot="bg-sun" title="กำลังช่วย" count={helping.length}>
          {helping.map((r) => (
            <Card key={r.id} r={r} border="border-sun">
              <p className="mt-3 text-sm text-night/60">รับเรื่อง {r.claimedAt && clock(r.claimedAt)} · {r.claimedAt && minutesSince(r.claimedAt)} นาทีแล้ว</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => act(r.id, 'done')} className="flex-1 rounded-2xl bg-mint py-3 font-bold text-white lift-mint">เสร็จแล้ว</button>
                <button onClick={() => act(r.id, 'release')} className="rounded-2xl bg-cloud px-4 py-3 text-sm">คืนเข้าคิว</button>
              </div>
            </Card>
          ))}
          {!helping.length && <Empty>ยังไม่มี</Empty>}
        </Column>

        <Column dot="bg-mint" title="เสร็จ 24 ชม." count={done.length}>
          {done.length > 0 && (
            <div className="rounded-3xl bg-white p-2 lift">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-night/5">
                  {done.map((r) => (
                    <tr key={r.id}>
                      <td className="p-3">{r.nickname}</td>
                      <td className="p-3 text-night/50">{TOPIC[r.topic].label}</td>
                      <td className="p-3 text-right text-night/50">เสร็จ {r.doneAt && clock(r.doneAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {avgWait !== null && <p className="mt-3 text-sm text-night/60">รอเฉลี่ย {avgWait} นาทีก่อนมีคนรับเรื่อง</p>}
          {!done.length && <Empty>ยังไม่มี</Empty>}
        </Column>
      </div>
    </StaffShell>
  )
}

function Column({ dot, title, count, children }: { dot: string; title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <p className="flex items-center gap-2 font-bold"><span className={`h-3 w-3 rounded-full ${dot}`} />{title} <span className="font-normal text-night/50">{count}</span></p>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  )
}

function Card({ r, border, right, children }: { r: HelpRequest; border: string; right?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <article className={`rounded-3xl border-l-8 bg-white p-5 lift ${border}`}>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-base font-bold">{r.nickname}</span>
        <span className="text-night/50">{r.groupNo ? `กลุ่ม ${r.groupNo}` : 'ยังไม่มีกลุ่ม'}</span>
        <span className="ml-auto">{right}</span>
      </div>
      <p className="mt-2 flex flex-wrap gap-1 text-sm">
        <TopicChip r={r} />
        <span className="inline-flex items-center gap-1 rounded-full bg-sun/40 px-2 py-0.5">{r.place === 'online' ? <Monitor className="h-3.5 w-3.5" aria-hidden /> : <MapPin className="h-3.5 w-3.5" aria-hidden />}{where(r)}</span>
      </p>
      {r.message && <p className="mt-2">{r.message}</p>}
      {children}
    </article>
  )
}

function TopicChip({ r }: { r: HelpRequest }) {
  const t = TOPIC[r.topic]
  return <span className="inline-flex items-center gap-1 rounded-full bg-cloud px-2 py-0.5"><t.icon className="h-3.5 w-3.5" aria-hidden />{t.label}</span>
}

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-3xl border-2 border-dashed border-night/10 p-5 text-center text-sm text-night/50">{children}</p>
)
