'use client'

import { BookOpen, ClipboardList, House, LifeBuoy, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import HelpButton, { openHelp } from './HelpButton'

const NAV = [
  { href: '/', icon: House, label: 'หน้าแรก' },
  { href: '/quiz', icon: ClipboardList, label: 'แบบทดสอบ' },
  { href: '/me', icon: TrendingUp, label: 'ความคืบหน้า' },
  { href: '/review', icon: BookOpen, label: 'เฉลย' },
]

// เมนูบนจอใหญ่ / แถบล่างบนมือถือ + ปุ่มช่วยเหลือทุกหน้า
export default function ParticipantShell({ roomName, groupNo, children }: { roomName?: string; groupNo?: number | null; children: ReactNode }) {
  const path = usePathname()
  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href))
  return (
    <>
      <header className="hidden border-b border-night/5 bg-white lg:block">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-8 px-4">
          <Link href="/" className="font-bold">{roomName}</Link>
          <nav className="flex gap-2 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`flex items-center gap-1.5 rounded-full px-4 py-2 ${active(n.href) ? 'bg-grape-soft font-medium text-grape' : 'text-night/60'}`}>
                <n.icon className="h-4 w-4" aria-hidden /> {n.label}
              </Link>
            ))}
          </nav>
          <button onClick={() => openHelp()} className="ml-auto rounded-full bg-coral px-5 py-2 font-medium text-white lift-coral"><span className="flex items-center gap-2"><LifeBuoy className="h-4 w-4" aria-hidden />ขอความช่วยเหลือ</span></button>
        </div>
      </header>
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-night/5 bg-white lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 py-2 text-center text-xs">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`py-2 ${active(n.href) ? 'font-medium text-grape' : 'text-night/50'}`}>
              <n.icon className="mx-auto mb-1 h-5 w-5" aria-hidden />
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
      <HelpButton groupNo={groupNo} raised hideOnDesktop />
    </>
  )
}
