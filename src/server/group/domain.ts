export type Scored = { id: string; score: number }

// แจกแบบงู: รอบคี่ซ้าย→ขวา รอบคู่ขวา→ซ้าย ทุกกลุ่มจึงได้คนจากทุกช่วงคะแนน
// ส่งคนที่เรียงคะแนนมากไปน้อยแล้วเข้ามา (คนคะแนนเท่ากันให้ผู้เรียกสุ่มลำดับก่อน)
export const snakeDraft = <T extends Scored>(ranked: T[], groupSize: number): T[][] => {
  const count = Math.max(1, Math.ceil(ranked.length / groupSize))
  const groups: T[][] = Array.from({ length: count }, () => [])
  ranked.forEach((p, i) => {
    const round = Math.floor(i / count)
    const slot = i % count
    groups[round % 2 === 0 ? slot : count - 1 - slot].push(p)
  })
  return groups
}

export const average = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

// คนส่งช้า: ใส่กลุ่มที่ยังไม่เต็มและคนน้อยสุด เลือกกลุ่มที่ใส่แล้วค่าเฉลี่ยใกล้ทั้งห้องที่สุด
// ทุกกลุ่มเต็มแล้วคืน null ให้ผู้เรียกเปิดกลุ่มใหม่ ไม่งั้นคนส่งช้าจะกองรวมกลุ่มเดียวไม่มีที่สิ้นสุด
export const bestGroupFor = (score: number, groups: { no: number; scores: number[] }[], roomAvg: number, groupSize: number) => {
  const open = groups.filter((g) => g.scores.length < groupSize)
  if (!open.length) return null
  const minSize = Math.min(...open.map((g) => g.scores.length))
  return open
    .filter((g) => g.scores.length === minSize)
    .map((g) => ({ no: g.no, gap: Math.abs(average([...g.scores, score])! - roomAvg) }))
    .sort((a, b) => a.gap - b.gap || a.no - b.no)[0].no
}
