'use client'

import LangBadge from '@/components/ui/LangBadge'
import StaffShell from '@/components/staff/StaffShell'
import { getResults, RESULTS_CSV_URL } from '@/lib/api/staff.api'
import { PHASE_LABEL } from '@/lib/format'
import { PHASES } from '@/types/room.types'
import { useLoad } from '@/use/useLoad'

const BAR = { pre: 'bg-night/20', post: 'bg-mint', followup: 'bg-grape' } as const

export default function ResultsPage() {
  const { data: r } = useLoad(getResults, 30000)
  if (!r) return <StaffShell>{null}</StaffShell>

  return (
    <StaffShell>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold">ผลการเปลี่ยนแปลง</h1>
          <p className="text-sm text-night/60">คะแนนเต็ม {r.total} · ข้อสอบชุดเดียวกันทั้งสามรอบ</p>
        </div>
        <a href={RESULTS_CSV_URL} className="ml-auto rounded-2xl bg-white px-4 py-3 font-medium lift">ดาวน์โหลด CSV</a>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat tone="bg-white lift" dim="text-night/50" label={`ก่อนเรียน (${r.phases.pre.count} คน)`} value={r.phases.pre.avg} />
        <Stat tone="bg-mint text-white lift-mint" dim="text-white/80" label={`หลังกิจกรรม (${r.phases.post.count} คน)`} value={r.phases.post.avg} />
        <Stat tone="bg-grape text-white lift-grape" dim="text-white/70" label={`ติดตามผล 14 วัน (${r.phases.followup.count} คน)`} value={r.phases.followup.avg} />
        <div className="rounded-2xl bg-white p-4 lift">
          <p className="text-xs text-night/50">คงอยู่หลัง 14 วัน</p>
          <p className="mt-1 text-3xl font-bold text-mint">{r.retention === null ? '–' : `${r.retention}%`}</p>
          <p className="text-xs text-night/50">ของคะแนนที่เพิ่มขึ้น (คนที่ทำครบ 3 รอบ)</p>
        </div>
      </div>

      <section className="mt-5 rounded-3xl bg-white p-5 lift">
        <p className="text-lg font-bold">ตอบถูกตามภาษาของคำถาม (%)</p>
        <div className="mt-2 flex gap-4 text-xs text-night/60">
          {PHASES.map((p) => <span key={p}><i className={`mr-1 inline-block h-3 w-3 rounded ${BAR[p]}`} />{PHASE_LABEL[p]}</span>)}
        </div>
        <div className="mt-4 space-y-5 text-sm">
          {r.byLanguage.map((l) => (
            <div key={l.language}>
              <p className="mb-1"><LangBadge language={l.language} withLabel /> · {l.questions} ข้อ</p>
              <div className="space-y-1">
                {PHASES.map((p) => (
                  <div key={p} className="flex items-center gap-2">
                    <div className="h-3 flex-1 rounded-full bg-cloud">
                      {l.pct[p] !== null && <div className={`h-3 rounded-full ${BAR[p]}`} style={{ width: `${Math.max(l.pct[p]!, 1)}%` }} />}
                    </div>
                    <span className="w-10 text-right text-xs text-night/60">{l.pct[p] === null ? '–' : `${l.pct[p]}%`}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-5 text-xs text-night/50 md:hidden">เลื่อนตารางไปทางขวาเพื่อดูรอบ 14 วัน</p>
      <section className="mt-2 overflow-x-auto rounded-3xl bg-white p-2 lift md:mt-5">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-night/50">
            <tr>
              <th className="p-3 font-normal">ชื่อ</th>
              <th className="p-3 font-normal">กลุ่ม</th>
              <th className="p-3 text-center font-normal">ก่อน</th>
              <th className="p-3 text-center font-normal">หลัง</th>
              <th className="p-3 text-center font-normal">14 วัน</th>
              <th className="p-3 text-center font-normal">เปลี่ยน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-night/5">
            {r.rows.map((row) => {
              const latest = row.followup ?? row.post
              const change = row.pre !== null && latest !== null ? latest - row.pre : null
              return (
                <tr key={row.id}>
                  <td className="p-3">{row.nickname}</td>
                  <td className="p-3">{row.groupNo ? `กลุ่ม ${row.groupNo}` : '–'}</td>
                  {[row.pre, row.post, row.followup].map((v, i) => (
                    <td key={i} className={`p-3 text-center ${v === null ? 'text-night/40' : ''}`}>{v ?? 'ยังไม่ทำ'}</td>
                  ))}
                  <td className="p-3 text-center">
                    {change === null ? '–' : (
                      <span className={`rounded-full px-2 font-medium ${change > 0 ? 'bg-mint-soft text-mint' : change < 0 ? 'bg-coral-soft text-coral' : 'bg-cloud'}`}>
                        {change > 0 ? `+${change}` : change}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!r.rows.length && <p className="p-6 text-center text-sm text-night/50">ยังไม่มีผู้เข้าร่วม</p>}
      </section>
    </StaffShell>
  )
}

function Stat({ tone, dim, label, value }: { tone: string; dim: string; label: string; value: number | null }) {
  return (
    <div className={`rounded-2xl p-4 ${tone}`}>
      <p className={`text-xs ${dim}`}>{label}</p>
      <p className="mt-1 text-3xl font-bold">{value ?? '–'}</p>
    </div>
  )
}
