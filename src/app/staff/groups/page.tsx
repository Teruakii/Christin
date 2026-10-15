'use client'

import { Check } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import StaffShell from '@/components/staff/StaffShell'
import { useConfirm, type ConfirmOptions } from '@/components/ui/ConfirmDialog'
import { announceGroups, clearGroups, deleteGroup, generateGroups, getGroups, moveMember } from '@/lib/api/staff.api'
import { errorText } from '@/lib/errors'
import { LEVELS, LEVEL_META, type Level } from '@/lib/level'
import type { GroupMember, GroupsView } from '@/types/staff.types'
import { useLoad } from '@/use/useLoad'

const countLevels = (members: GroupMember[]) =>
  Object.fromEntries(LEVELS.map((l) => [l, members.filter((m) => m.level === l).length])) as Record<Level, number>

export default function GroupsPage() {
  const { data: view, setData, reload } = useLoad(getGroups, 15000)
  return <StaffShell>{view && <Board key={view.groupSize} view={view} setView={setData} reload={reload} />}</StaffShell>
}

function Board({ view, setView, reload }: { view: GroupsView; setView: (v: GroupsView) => void; reload: () => void }) {
  const [size, setSize] = useState(view.groupSize)
  const [picked, setPicked] = useState<GroupMember | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const confirm = useConfirm()

  const everyone = [...view.groups.flatMap((g) => g.members), ...view.ungrouped]
  const levels = countLevels(everyone)
  const hasGroups = view.groups.length > 0

  const run = async (fn: () => Promise<GroupsView>, ask?: ConfirmOptions) => {
    if (ask && !(await confirm(ask))) return
    setBusy(true)
    setError('')
    try {
      setView(await fn())
      setPicked(null)
    } catch (e) {
      setError(errorText(e))
      reload()
    } finally {
      setBusy(false)
    }
  }

  const regroup = () =>
    run(
      () => generateGroups(size),
      view.announced
        ? { title: 'จัดกลุ่มใหม่ทั้งห้อง?', message: 'ผู้เข้าร่วมเห็นกลุ่มอยู่แล้ว ถ้าจัดใหม่ ทุกคนจะเห็นกลุ่มใหม่ทันที', confirmLabel: 'จัดกลุ่มใหม่' }
        : undefined,
    )

  return (
    <>
      <h1 className="text-2xl font-bold">จัดกลุ่มคละคะแนน</h1>
      <p className="text-sm text-night/60">
        ระบบเรียงคะแนนแบบทดสอบก่อนเรียน แล้วแจกให้ทุกกลุ่มได้ทั้งคนเก่ง กลาง และเริ่มต้นใกล้เคียงกัน{' '}
        <Link href="/staff/answers" className="font-medium text-grape underline underline-offset-4">ดูข้อสอบที่ใช้</Link>
      </p>

      <section className="mt-5 rounded-3xl bg-white p-5 lift">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="text-lg">ส่งแบบทดสอบแล้ว <b className="text-2xl text-grape">{everyone.length}</b> คน</p>
          <div className="flex flex-wrap gap-2 text-sm">
            {LEVELS.map((l) => (
              <span key={l} className={`rounded-full px-3 py-1 ${LEVEL_META[l].chip}`}>
                {LEVEL_META[l].label} {levels[l]} คน
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <span className="text-sm text-night/60">คนต่อกลุ่ม</span>
          <span className="flex items-center gap-2">
            <button type="button" disabled={size <= 2} onClick={() => setSize(size - 1)} aria-label="ลดคนต่อกลุ่ม" className="h-10 w-10 rounded-full bg-cloud text-lg">−</button>
            <b className="w-8 text-center text-2xl">{size}</b>
            <button type="button" disabled={size >= 10} onClick={() => setSize(size + 1)} aria-label="เพิ่มคนต่อกลุ่ม" className="h-10 w-10 rounded-full bg-cloud text-lg">+</button>
          </span>
          {everyone.length > 0 && <span className="text-sm text-night/60">ได้ {Math.max(1, Math.ceil(everyone.length / size))} กลุ่ม</span>}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button disabled={busy || !everyone.length} onClick={regroup} className="rounded-2xl bg-sun px-6 py-4 text-lg font-bold lift-sun">
            {hasGroups ? 'จัดกลุ่มใหม่ทั้งห้อง' : 'จัดกลุ่มคละคะแนน'}
          </button>
          {hasGroups && !view.announced && (
            <button disabled={busy} onClick={() => run(announceGroups)} className="rounded-2xl bg-grape px-6 py-4 text-lg font-bold text-white lift-grape">
              ประกาศให้ผู้เข้าร่วมเห็น
            </button>
          )}
          {view.announced && <span className="self-center rounded-full bg-mint-soft px-4 py-2 text-sm font-medium"><Check className="mr-1 inline h-4 w-4 text-mint" strokeWidth={3} aria-hidden />ผู้เข้าร่วมเห็นกลุ่มของตัวเองแล้ว</span>}
          {hasGroups && (
            <button
              disabled={busy}
              onClick={() =>
                run(clearGroups, {
                  title: 'ล้างกลุ่มทั้งหมด?',
                  message: 'ทุกคนจะกลับไปเป็น “ยังไม่มีกลุ่ม” คะแนนไม่หาย และผู้เข้าร่วมจะไม่เห็นกลุ่มจนกว่าจะประกาศใหม่',
                  confirmLabel: 'ล้างกลุ่มทั้งหมด',
                  tone: 'danger',
                })
              }
              className="ml-auto self-center rounded-2xl bg-coral-soft px-4 py-3 text-sm font-medium text-coral"
            >
              ล้างกลุ่มทั้งหมด
            </button>
          )}
        </div>
        {!everyone.length && <p className="mt-3 text-sm text-night/60">รอให้ผู้เข้าร่วมทำแบบทดสอบก่อนเรียนก่อน ยิ่งรอให้ครบ กลุ่มยิ่งคละได้ดี</p>}
        {error && <p className="mt-4 rounded-2xl bg-coral-soft p-3 text-sm text-coral">{error}</p>}
      </section>

      {hasGroups && view.lateCount > 0 && (
        <p className="mt-4 rounded-2xl bg-sun/30 p-4 text-sm">
          มี <b>{view.lateCount} คน</b>ส่งหลังจัดกลุ่ม ระบบใส่ลงกลุ่มที่ยังไม่เต็มให้แล้ว ถ้าอยากคละใหม่ทั้งห้อง กด “จัดกลุ่มใหม่ทั้งห้อง”
        </p>
      )}

      {view.ungrouped.length > 0 && (
        <section className={`mt-5 rounded-3xl bg-white p-4 ${hasGroups ? 'border-2 border-dashed border-coral/40' : 'lift'}`}>
          <p className="font-bold">{hasGroups ? `ยังไม่มีกลุ่ม ${view.ungrouped.length} คน` : `รายชื่อที่พร้อมจัดกลุ่ม ${view.ungrouped.length} คน`}</p>
          {hasGroups && <p className="text-sm text-night/60">แตะชื่อแล้วกด “ย้ายมากลุ่มนี้” ที่กลุ่มปลายทาง หรือกด “จัดกลุ่มใหม่ทั้งห้อง”</p>}
          <MemberList members={view.ungrouped} picked={picked} onPick={setPicked} total={view.totalQuestions} />
        </section>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {view.groups.map((g) => {
          const mix = countLevels(g.members)
          const canDrop = picked && !g.members.some((m) => m.id === picked.id)
          return (
            <section key={g.no} className={`rounded-3xl bg-white p-4 lift ${canDrop ? 'ring-4 ring-grape/20' : ''}`}>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">กลุ่ม {g.no}</p>
                <p className="text-sm text-night/50">{g.members.length} คน</p>
                <button
                  disabled={busy}
                  onClick={() =>
                    run(() => deleteGroup(g.no), {
                      title: `ลบกลุ่ม ${g.no}?`,
                      message: `สมาชิก ${g.members.length} คนจะไปอยู่ใน “ยังไม่มีกลุ่ม” แล้วย้ายเข้ากลุ่มอื่นได้ คะแนนไม่หาย`,
                      confirmLabel: 'ลบกลุ่ม',
                      tone: 'danger',
                    })
                  }
                  className="ml-auto rounded-full bg-coral-soft px-3 py-1 text-xs font-medium text-coral"
                >
                  ลบกลุ่ม
                </button>
              </div>
              <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-cloud" aria-hidden>
                {LEVELS.map((l) => <div key={l} className={LEVEL_META[l].dot} style={{ width: `${(mix[l] / g.members.length) * 100}%` }} />)}
              </div>
              <p className="mt-1 text-xs text-night/60">{LEVELS.map((l) => `${LEVEL_META[l].label} ${mix[l]}`).join(' · ')}</p>
              <MemberList members={g.members} picked={picked} onPick={setPicked} total={view.totalQuestions} />
              {canDrop && (
                <button disabled={busy} onClick={() => run(() => moveMember(picked.id, g.no))} className="mt-2 w-full rounded-xl bg-grape py-2 text-sm font-medium text-white">
                  ย้าย {picked.nickname} มากลุ่มนี้
                </button>
              )}
            </section>
          )
        })}
      </div>

      {hasGroups && (
        <p className="mt-5 text-sm text-night/50">
          อยากสลับคนเอง? แตะชื่อ แล้วกด “ย้ายมากลุ่มนี้” ที่กลุ่มปลายทาง · ผู้เข้าร่วมเห็นแค่ชื่อเพื่อนในกลุ่ม ไม่เห็นคะแนนหรือระดับ
        </p>
      )}
    </>
  )
}

function MemberList({ members, picked, onPick, total }: { members: GroupMember[]; picked: GroupMember | null; onPick: (m: GroupMember | null) => void; total: number }) {
  return (
    <ul className="mt-3 space-y-1 text-sm">
      {members.map((m) => {
        const on = picked?.id === m.id
        return (
          <li key={m.id}>
            <button onClick={() => onPick(on ? null : m)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left ${on ? 'bg-grape-soft ring-2 ring-grape' : 'bg-cloud'}`}>
              <span className="flex-1 truncate">{m.nickname}</span>
              <span className="text-xs text-night/40">{m.score}/{total}</span>
              <span className={`w-16 rounded-full px-2 py-0.5 text-center text-xs ${LEVEL_META[m.level].chip}`}>{LEVEL_META[m.level].label}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
