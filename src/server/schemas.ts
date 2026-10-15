import { z } from 'zod'
import { HELP_PLACES, HELP_TOPICS } from '@/types/help.types'
import { LANGUAGES } from '@/types/room.types'

const code = z.string().trim().min(4).max(12)
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'ใช้รูปแบบ YYYY-MM-DD')

export const RoomCodeBody = z.object({ code })
export const JoinBody = z.object({ roomCode: code, nickname: z.string().trim().min(1).max(30) })
export const ResumeBody = z.object({ trackingCode: code })
export const SubmitBody = z.object({ answers: z.record(z.string(), z.number().int().nullable()) })
export const HelpBody = z.object({
  topic: z.enum(HELP_TOPICS),
  message: z.string().max(500).default(''),
  place: z.enum(HELP_PLACES),
})
export const StaffLoginBody = z.object({ staffCode: code })
export const RoomBody = z.object({
  name: z.string().trim().min(1).max(80),
  courseLanguage: z.enum(LANGUAGES),
  target: z.number().int().min(2).max(500),
  groupSize: z.number().int().min(2).max(10),
  schedule: z.object({ pre: isoDate, post: isoDate, followup: isoDate, end: isoDate }),
  mix: z
    .object(Object.fromEntries(LANGUAGES.map((l) => [l, z.number().int().min(0).max(10)])) as Record<(typeof LANGUAGES)[number], z.ZodNumber>)
    .refine((m) => Object.values(m).reduce((a, b) => a + b, 0) >= 4, 'ข้อสอบต้องมีอย่างน้อย 4 ข้อ'),
})
export const GenerateGroupsBody = z.object({ groupSize: z.number().int().min(2).max(10).optional() })
export const DeleteGroupBody = z.object({ groupNo: z.number().int().min(1) })
export const MoveBody = z.object({ participantId: z.string().min(1), groupNo: z.number().int().min(1) })
