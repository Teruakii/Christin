import { cookies } from 'next/headers'
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { AppError } from './http'

const PARTICIPANT_COOKIE = 'tc'
const STAFF_COOKIE = 'staff'
const DAY = 60 * 60 * 24

// ไม่มี login: ผู้เข้าร่วมถือรหัสติดตามใน cookie ตลอดโครงการ (6 สัปดาห์ + เผื่อ)
export const setParticipantCookie = async (trackingCode: string) =>
  (await cookies()).set(PARTICIPANT_COOKIE, trackingCode, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 120 * DAY })

export const clearParticipantCookie = async () => (await cookies()).delete(PARTICIPANT_COOKIE)

export const readTrackingCode = async () => (await cookies()).get(PARTICIPANT_COOKIE)?.value ?? null

const secret = () => {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 32) throw new Error('SESSION_SECRET must be set (32+ chars)')
  return s
}

const sign = (value: string) => createHmac('sha256', secret()).update(value).digest('base64url')

// เข้าระบบด้วยรหัสของทีม ห้องที่เปิดอยู่เป็นแค่ตัวเลือก (null = ยังไม่มีห้อง)
export type StaffSession = { teamId: string; roomId: string | null; sid: string }
export type RoomStaff = StaffSession & { roomId: string }

export const setStaffCookie = async ({ teamId, roomId, sid }: StaffSession) => {
  const exp = Math.floor(Date.now() / 1000) + 14 * DAY
  const value = `${teamId}.${roomId ?? '-'}.${sid}.${exp}`
  ;(await cookies()).set(STAFF_COOKIE, `${value}.${sign(value)}`, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 14 * DAY })
}

export const clearStaffCookie = async () => (await cookies()).delete(STAFF_COOKIE)

export const requireStaff = async (): Promise<StaffSession> => {
  const raw = (await cookies()).get(STAFF_COOKIE)?.value
  const parts = raw?.split('.') ?? []
  if (parts.length !== 5) throw new AppError(401, 'STAFF_SESSION_REQUIRED')
  const [teamId, roomId, sid, exp, mac] = parts
  const expected = Buffer.from(sign(`${teamId}.${roomId}.${sid}.${exp}`))
  const given = Buffer.from(mac)
  if (expected.length !== given.length || !timingSafeEqual(expected, given) || Number(exp) * 1000 < Date.now()) {
    throw new AppError(401, 'STAFF_SESSION_REQUIRED')
  }
  return { teamId, roomId: roomId === '-' ? null : roomId, sid }
}

// ค้นห้องจากรหัสทีมงานได้ตรง ๆ โดยไม่เก็บรหัสจริง: HMAC ด้วย secret ของเซิร์ฟเวอร์
export const staffCodeLookup = (code: string) => sign(`staff-code:${code.trim().toUpperCase()}`)

export const newSid = () => randomBytes(9).toString('base64url')

export const hashStaffCode = (code: string) => {
  const salt = randomBytes(16).toString('base64url')
  return `${salt}.${scryptSync(code, salt, 32).toString('base64url')}`
}

export const verifyStaffCode = (code: string, stored: string) => {
  const [salt, hash] = stored.split('.')
  const actual = scryptSync(code, salt, 32)
  const expected = Buffer.from(hash, 'base64url')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
