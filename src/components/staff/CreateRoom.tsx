'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import RoomForm, { defaultRoom } from '@/components/staff/RoomForm'
import { createRoom } from '@/lib/api/staff.api'
import { errorText } from '@/lib/errors'
import type { RoomCreated } from '@/types/room.types'

// ห้องใหม่เป็นของทีมที่เข้าอยู่ ใช้รหัสทีมงานเดิม · สร้างเสร็จระบบสลับไปห้องใหม่ให้
export default function CreateRoom({ today }: { today: string }) {
  const router = useRouter()
  const [created, setCreated] = useState<RoomCreated | null>(null)
  const [error, setError] = useState('')

  if (created) {
    return (
      <div className="max-w-xl">
        <h2 className="text-2xl font-bold">สร้างห้องแล้ว</h2>
        <p className="mt-1 text-night/60">แจกรหัสห้องนี้ให้ผู้เข้าร่วม ทีมงานใช้รหัสทีมงานเดิมเข้าห้องนี้ได้เลย</p>
        <section className="mt-5 rounded-3xl bg-grape p-6 text-white lift-grape">
          <p className="text-sm text-white/70">รหัสห้อง (แจกผู้เข้าร่วม)</p>
          <p className="font-mono text-4xl tracking-[0.3em]">{created.roomCode}</p>
        </section>
        {/* session สลับไปห้องใหม่แล้ว หน้าทีมงานที่เคยเปิดจะโหลดข้อมูลใหม่เมื่อกลับมาแสดง */}
        <button onClick={() => router.push('/staff')} className="mt-6 w-full rounded-2xl bg-sun py-4 text-lg font-bold lift-sun">
          ไปหน้าภาพรวมของห้องใหม่
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold">สร้างห้องใหม่</h2>
      <p className="text-sm text-night/60">ได้รหัสห้องไว้แจกผู้เข้าร่วม · สร้างเสร็จระบบจะสลับไปห้องใหม่ ห้องเดิมสลับกลับได้จากรายการห้อง</p>
      <RoomForm
        initial={defaultRoom(today)}
        submitLabel="สร้างห้อง"
        onSubmit={async (room) => {
          setError('')
          try {
            setCreated(await createRoom(room))
          } catch (e) {
            setError(errorText(e))
          }
        }}
      >
        {error && <p className="mt-4 rounded-2xl bg-coral-soft p-3 text-sm text-coral">{error}</p>}
      </RoomForm>
    </div>
  )
}
