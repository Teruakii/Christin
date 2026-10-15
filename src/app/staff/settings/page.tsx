'use client'

import { KeyRound, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import CreateRoom from '@/components/staff/CreateRoom'
import RoomForm from '@/components/staff/RoomForm'
import StaffShell from '@/components/staff/StaffShell'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import LangBadge from '@/components/ui/LangBadge'
import { deleteRoom, getSettings, listRooms, resetTeamCode, switchRoom, updateSettings } from '@/lib/api/staff.api'
import { errorText } from '@/lib/errors'
import { thaiDate, todayIso } from '@/lib/format'
import type { RoomSummary } from '@/types/staff.types'
import { useLoad } from '@/use/useLoad'

export default function SettingsPage() {
  const router = useRouter()
  const confirm = useConfirm()
  const { data: settings, setData } = useLoad(getSettings)
  const { data: rooms, reload: reloadRooms } = useLoad(listRooms)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [roomError, setRoomError] = useState('')
  // เปิดฟอร์มสร้างห้องตอนกดเท่านั้น: ฟอร์มใช้วันที่วันนี้เป็นค่าเริ่มต้น ต้องคำนวณบน browser ตอนนั้น
  const [creating, setCreating] = useState<string | null>(null)
  const [newCode, setNewCode] = useState('')

  const enter = async (room: RoomSummary) => {
    setRoomError('')
    try {
      await switchRoom(room.code)
      router.push('/staff')
    } catch (e) {
      setRoomError(errorText(e))
    }
  }

  const remove = async (room: RoomSummary) => {
    const ok = await confirm({
      title: `ลบห้อง “${room.name}” ถาวร?`,
      message: `ผู้เข้าร่วม ${room.participants} คน คะแนน กลุ่ม และคิวช่วยเหลือของห้องนี้จะหายทั้งหมด กู้คืนไม่ได้`,
      confirmLabel: 'ลบห้องถาวร',
      tone: 'danger',
      typeToConfirm: room.code,
    })
    if (!ok) return
    setRoomError('')
    try {
      const { current } = await deleteRoom(room.code)
      // ลบห้องที่เปิดอยู่: เมนูและหัว sidebar ต้องเปลี่ยนตาม โหลดหน้าใหม่ทั้งหมด
      if (room.current && current) router.push('/staff')
      else if (room.current) window.location.reload()
      else reloadRooms()
    } catch (e) {
      setRoomError(errorText(e))
    }
  }

  const issueCode = async () => {
    const ok = await confirm({
      title: 'ออกรหัสทีมงานใหม่?',
      message: 'รหัสเดิมจะใช้เข้าระบบไม่ได้ทันที ทีมงานที่เข้าค้างไว้อยู่แล้วยังใช้ต่อได้ แจกรหัสใหม่ให้ทุกคนในทีม',
      confirmLabel: 'ออกรหัสใหม่',
      tone: 'danger',
    })
    if (!ok) return
    try {
      setNewCode((await resetTeamCode()).staffCode)
    } catch (e) {
      setRoomError(errorText(e))
    }
  }

  return (
    <StaffShell>
      <h1 className="text-2xl font-bold">ตั้งค่าห้อง</h1>

      <section className="mt-6 max-w-4xl">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <h2 className="text-lg font-bold">ห้องทั้งหมด</h2>
            <p className="text-sm text-night/60">ทุกห้องของทีมใช้รหัสทีมงานเดียวกัน สลับห้องได้ทันที</p>
          </div>
          {!creating && (
            <button onClick={() => setCreating(todayIso())} className="ml-auto inline-flex items-center gap-2 rounded-2xl bg-sun px-5 py-3 font-bold lift-sun">
              <Plus className="h-5 w-5" aria-hidden />
              สร้างห้องใหม่
            </button>
          )}
        </div>
        {roomError && <p className="mt-3 rounded-2xl bg-coral-soft p-3 text-sm text-coral">{roomError}</p>}
        <ul className="mt-4 space-y-3">
          {rooms?.map((r) => (
            <li key={r.code} className={`flex flex-wrap items-center gap-3 rounded-3xl bg-white p-4 lift ${r.current ? 'ring-2 ring-grape' : ''}`}>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-bold">
                  <span className="truncate">{r.name}</span>
                  {r.current && <span className="rounded-full bg-grape px-2 py-0.5 text-xs font-medium text-white">ห้องนี้</span>}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-night/60">
                  <span className="font-mono">{r.code}</span>
                  <LangBadge language={r.courseLanguage} withLabel />
                  <span>{r.participants} คน</span>
                  <span>สร้าง {thaiDate(r.createdAt.slice(0, 10))}</span>
                </p>
              </div>
              {!r.current && (
                <button onClick={() => enter(r)} className="rounded-2xl bg-grape-soft px-4 py-2 text-sm font-medium text-grape">เข้าห้องนี้</button>
              )}
              <button onClick={() => remove(r)} className="inline-flex items-center gap-1.5 rounded-2xl bg-coral-soft px-4 py-2 text-sm font-medium text-coral">
                <Trash2 className="h-4 w-4" aria-hidden />
                ลบห้อง
              </button>
            </li>
          ))}
        </ul>
        {rooms?.length === 0 && !creating && (
          <div className="mt-4 rounded-3xl border-2 border-dashed border-grape/30 bg-white p-8 text-center">
            <p className="text-lg font-bold">ทีมนี้ยังไม่มีห้อง</p>
            <p className="mt-1 text-sm text-night/60">สร้างห้องแรกเพื่อรับรหัสห้องไว้แจกผู้เข้าร่วม</p>
          </div>
        )}
      </section>

      {creating && (
        <section className="mt-8 max-w-4xl rounded-3xl border-2 border-dashed border-grape/30 p-4 lg:p-6">
          <div className="mb-2 flex justify-end">
            <button onClick={() => setCreating(null)} className="rounded-full bg-white px-4 py-1.5 text-sm text-night/60 lift">ยกเลิก</button>
          </div>
          <CreateRoom today={creating} />
        </section>
      )}

      <section className="mt-10 max-w-4xl rounded-3xl bg-white p-5 lift">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-grape-soft text-grape">
            <KeyRound className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">รหัสทีมงาน</h2>
            <p className="text-sm text-night/60">รหัสเดียวของทั้งทีม ไม่ผูกกับห้องไหน ใช้เข้าได้ทุกห้อง · ระบบเก็บแบบเข้ารหัส ดูย้อนหลังไม่ได้ ลืมให้ออกรหัสใหม่</p>
          </div>
          <button onClick={issueCode} className="rounded-2xl bg-coral-soft px-4 py-2 text-sm font-medium text-coral">ออกรหัสทีมงานใหม่</button>
        </div>
        {newCode && (
          <div className="mt-4 rounded-2xl bg-grape p-5 text-white lift-grape">
            <p className="text-sm text-white/70">รหัสทีมงานใหม่ จดไว้ตอนนี้ จะไม่แสดงอีก</p>
            <p className="font-mono text-3xl tracking-[0.2em]">{newCode}</p>
          </div>
        )}
      </section>

      {settings && (
        <section className="mt-10">
          <h2 className="text-lg font-bold">ตั้งค่าห้องนี้ · {settings.name}</h2>
          <p className="text-sm text-night/60">แก้ชื่อ กำหนดการ และขนาดกลุ่มได้ตลอด ชุดข้อสอบแก้ได้จนกว่าจะมีคนส่ง</p>
          <RoomForm
            key={JSON.stringify(settings)}
            initial={settings}
            locked={settings.locked}
            submitLabel="บันทึก"
            onSubmit={async (room) => {
              try {
                setData(await updateSettings(room))
                setMessage({ ok: true, text: 'บันทึกแล้ว' })
                reloadRooms()
              } catch (e) {
                setMessage({ ok: false, text: errorText(e) })
              }
            }}
          >
            {message && <p className={`mt-4 rounded-2xl p-3 text-sm ${message.ok ? 'bg-mint-soft' : 'bg-coral-soft text-coral'}`}>{message.text}</p>}
          </RoomForm>
          <p className="mt-8 max-w-4xl rounded-3xl bg-white p-5 text-sm lift">
            ดูข้อสอบชุดนี้พร้อมเฉลย และสถิติว่าแต่ละข้อมีคนตอบอะไรบ้าง ได้ที่{' '}
            <Link href="/staff/answers" className="font-medium text-grape underline underline-offset-4">หน้าเฉลย</Link>
          </p>
        </section>
      )}
    </StaffShell>
  )
}
