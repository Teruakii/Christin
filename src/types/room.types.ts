export const LANGUAGES = ['python', 'javascript', 'java', 'c'] as const
export type Language = (typeof LANGUAGES)[number]

export const PHASES = ['pre', 'post', 'followup'] as const
export type Phase = (typeof PHASES)[number]

// วันที่เก็บเป็น YYYY-MM-DD ตามเวลาไทย เพราะรอบเปิดเป็นรายวัน ไม่ใช่รายชั่วโมง
export type IsoDate = string

export type Schedule = { pre: IsoDate; post: IsoDate; followup: IsoDate; end: IsoDate }

export type LanguageMix = Record<Language, number>

export type RoomPublic = {
  code: string
  name: string
  courseLanguage: Language
  schedule: Schedule
}

export type RoomSettings = RoomPublic & {
  target: number
  groupSize: number
  mix: LanguageMix
  // มีคนเริ่มทำแบบทดสอบแล้ว แก้ชุดข้อสอบไม่ได้ ไม่งั้นเทียบผลก่อน-หลังไม่ได้
  locked: boolean
}

export type RoomUpsert = {
  name: string
  courseLanguage: Language
  target: number
  groupSize: number
  schedule: Schedule
  mix: LanguageMix
}

export type RoomCreated = { roomCode: string }

export type TeamCreated = { staffCode: string }
