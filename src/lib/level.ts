// เกณฑ์ระดับจากคะแนนก่อนเรียน ใช้ทั้งหน้าภาพรวมและหน้าจัดกลุ่ม คิดเป็นสัดส่วน ใช้ได้แม้ข้อสอบไม่ใช่ 10 ข้อ
export const LEVELS = ['high', 'mid', 'low'] as const
export type Level = (typeof LEVELS)[number]

export const levelOf = (score: number, total: number): Level => {
  const r = total ? score / total : 0
  return r >= 0.7 ? 'high' : r >= 0.5 ? 'mid' : 'low'
}

export const LEVEL_META: Record<Level, { label: string; range: string; chip: string; dot: string }> = {
  high: { label: 'เก่ง', range: '70% ขึ้นไป', chip: 'bg-mint text-white', dot: 'bg-mint' },
  mid: { label: 'กลาง', range: '50–69%', chip: 'bg-sun', dot: 'bg-sun' },
  low: { label: 'เริ่มต้น', range: 'ต่ำกว่า 50%', chip: 'bg-coral text-white', dot: 'bg-coral' },
}
