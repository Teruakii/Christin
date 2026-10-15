import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

export default function StateCard({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: { href: string; label: string } }) {
  return (
    <section className="mx-auto mt-10 max-w-md rounded-3xl bg-white p-6 text-center lift">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-grape-soft text-grape">
        <Icon className="h-8 w-8" strokeWidth={1.75} aria-hidden />
      </span>
      <h1 className="mt-3 text-xl font-bold">{title}</h1>
      {children && <div className="mt-1 text-sm text-night/60">{children}</div>}
      {action && (
        <Link href={action.href} className="mt-4 inline-block rounded-2xl bg-sun px-6 py-3 font-bold lift-sun">
          {action.label}
        </Link>
      )}
    </section>
  )
}
