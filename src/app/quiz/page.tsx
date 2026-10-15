'use client'

import { Ticket } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import StateCard from '@/components/ui/StateCard'
import { getMe } from '@/lib/api/participant.api'
import { useLoad } from '@/use/useLoad'

// พาไปรอบที่เปิดอยู่และยังไม่ได้ทำ ไม่มีรอบให้ทำก็ไปหน้าความคืบหน้า
export default function QuizIndex() {
  const router = useRouter()
  const { data: me, error } = useLoad(getMe)
  useEffect(() => {
    if (!me) return
    const next = me.phases.find((p) => p.open && !p.submitted)
    router.replace(next ? `/quiz/${next.phase}` : '/me')
  }, [me, router])
  if (error) return <StateCard icon={Ticket} title="ยังไม่มีรหัสติดตามในเครื่องนี้" action={{ href: '/', label: 'ใส่รหัสห้องหรือรหัสติดตาม' }} />
  return null
}
