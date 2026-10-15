import type { Metadata } from 'next'
import { Fira_Code, Kanit } from 'next/font/google'
import { ConfirmProvider } from '@/components/ui/ConfirmDialog'
import './globals.css'

const kanit = Kanit({ variable: '--font-kanit', subsets: ['thai', 'latin'], weight: ['400', '500', '700'] })
const fira = Fira_Code({ variable: '--font-fira', subsets: ['latin'], weight: ['500'] })

export const metadata: Metadata = {
  title: 'แบบทดสอบโค้ดก่อนเรียน',
  description: 'ทำแบบทดสอบ จับกลุ่มคละคะแนน และติดตามผล 14 วัน',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="th" className={`${kanit.variable} ${fira.variable} antialiased`}>
      <body className="min-h-dvh font-sans">
        <ConfirmProvider>{children}</ConfirmProvider>
      </body>
    </html>
  )
}
