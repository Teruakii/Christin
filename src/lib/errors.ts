import { ApiError } from './api/instance'

const MESSAGES: Record<string, string> = {
  ROOM_NOT_FOUND: 'ไม่พบรหัสห้องนี้ ลองเช็กอีกที หรือถามทีมงานได้เลย',
  TRACKING_CODE_REQUIRED: 'ใส่รหัสติดตามก่อนนะ',
  TRACKING_CODE_NOT_FOUND: 'ไม่พบรหัสติดตามนี้ ลองเช็กตัวอักษรอีกที',
  PHASE_NOT_OPEN: 'รอบนี้ยังไม่เปิด',
  ALREADY_SUBMITTED: 'รหัสนี้ทำรอบนี้ไปแล้ว แต่ละรอบทำได้ครั้งเดียว',
  PRE_TEST_REQUIRED: 'ต้องทำแบบทดสอบก่อนเรียนก่อน',
  INVALID_ANSWERS: 'คำตอบไม่ครบ ลองรีเฟรชแล้วส่งใหม่',
  REVIEW_NOT_OPEN: 'เฉลยจะเปิดหลังทำรอบติดตามผล',
  STAFF_SESSION_REQUIRED: 'เข้าหน้าทีมงานก่อนนะ',
  NO_ROOM_SELECTED: 'ยังไม่ได้เลือกห้อง สร้างหรือเลือกห้องในหน้าตั้งค่าก่อน',
  INVALID_STAFF_CODE: 'รหัสทีมงานไม่ถูกต้อง',
  INVALID_SCHEDULE: 'กำหนดการไม่ถูกต้อง',
  NOT_ENOUGH_QUESTIONS: 'คลังคำถามมีไม่พอตามจำนวนที่ตั้ง',
  QUESTIONS_LOCKED: 'มีคนเริ่มทำแบบทดสอบแล้ว เปลี่ยนชุดข้อสอบไม่ได้',
  NO_PRE_TEST_SUBMISSIONS: 'ยังไม่มีใครส่งแบบทดสอบก่อนเรียน',
  NO_GROUPS_YET: 'ยังไม่ได้จัดกลุ่ม',
  GROUP_NOT_FOUND: 'ไม่พบกลุ่มนี้ อาจถูกลบไปแล้ว',
  HELP_STATUS_CHANGED: 'มีทีมงานคนอื่นจัดการคำขอนี้ไปแล้ว',
  VALIDATION_FAILED: 'ข้อมูลไม่ครบหรือไม่ถูกต้อง',
  NETWORK_ERROR: 'เชื่อมต่อไม่ได้ ลองอีกครั้ง',
}

export const errorText = (e: unknown) =>
  e instanceof ApiError ? MESSAGES[e.code] ?? 'เกิดข้อผิดพลาด ลองอีกครั้ง' : 'เชื่อมต่อไม่ได้ ลองอีกครั้ง'
