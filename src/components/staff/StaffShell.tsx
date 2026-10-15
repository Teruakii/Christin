'use client'

import { BookOpen, House, LifeBuoy, Settings, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { ApiError } from '@/lib/api/instance'
import { getHelpQueue, getStaffMe, logout } from '@/lib/api/staff.api'
import { useLoad } from '@/use/useLoad'

const SETTINGS = '/staff/settings'

const NAV = [
  { href: '/staff', icon: House, label: 'ภาพรวม' },
  { href: '/staff/groups', icon: Users, label: 'จัดกลุ่ม' },
  { href: '/staff/help', icon: LifeBuoy, label: 'คิวช่วยเหลือ' },
  { href: '/staff/results', icon: TrendingUp, label: 'ผลการเปลี่ยนแปลง' },
  { href: '/staff/answers', icon: BookOpen, label: 'เฉลย' },
  { href: SETTINGS, icon: Settings, label: 'ตั้งค่าห้อง' },
]

const fetchWaiting = () => getHelpQueue().then((q) => q.requests.filter((r) => r.status === 'waiting').length).catch(() => 0)

// ทุกหน้าทีมงานผ่านตรงนี้: ไม่มี session ส่งกลับไปหน้าเข้าใช้ · ทีมยังไม่มีห้อง ส่งไปหน้าตั้งค่าให้สร้างห้องแรก
export default function StaffShell({ children }: { children: ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const { data: me, error } = useLoad(getStaffMe)
  const { data: waiting } = useLoad(fetchWaiting, 10000)
  const needsRoom = !!me && !me.room && path !== SETTINGS

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) router.replace('/staff/login')
  }, [error, router])
  useEffect(() => {
    if (needsRoom) router.replace(SETTINGS)
  }, [needsRoom, router])

  if (!me || needsRoom) return null

  const signOut = async () => {
    await logout()
    router.replace('/staff/login')
  }

  // ยังไม่มีห้อง: เมนูอื่นใช้ไม่ได้ เหลือแค่ตั้งค่าที่สร้างห้องได้
  const nav = me.room ? NAV : NAV.filter((n) => n.href === SETTINGS)
  return (
    <div className="lg:flex">
      <aside className="border-b border-night/5 bg-white p-4 lg:min-h-dvh lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold">{me.room?.name ?? 'ยังไม่มีห้อง'}</p>
            <p className="font-mono text-xs text-night/50">{me.room ? `รหัสห้อง ${me.room.code}` : 'สร้างห้องแรกในหน้าตั้งค่า'}</p>
          </div>
          <button onClick={signOut} className="rounded-full bg-cloud px-3 py-1 text-xs text-night/60">ออก</button>
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto text-sm lg:flex-col">
          {nav.map((n) => {
            const active = n.href === '/staff' ? path === '/staff' : path.startsWith(n.href)
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 whitespace-nowrap ${active ? 'bg-grape text-white lift-grape' : 'text-night/70 hover:bg-cloud'}`}
              >
                <n.icon className="h-4 w-4 shrink-0" aria-hidden />
                <span>{n.label}</span>
                {n.href === '/staff/help' && !!waiting && <span className="ml-auto rounded-full bg-coral px-2 py-0.5 text-xs text-white">{waiting}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>
      <main className="max-w-7xl flex-1 p-4 lg:p-8">{children}</main>
    </div>
  )
}
