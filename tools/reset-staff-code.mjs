// ออกรหัสทีมงานใหม่ให้ทีมของห้องนี้ (ระบบเก็บแค่ hash ดูรหัสเดิมไม่ได้) · รหัสเดิมใช้ไม่ได้ทันที
// usage: node tools/reset-staff-code.mjs <รหัสห้องใดก็ได้ของทีม>
import { DatabaseSync } from 'node:sqlite'
import { createHmac, randomBytes, randomInt, scryptSync } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const roomCode = process.argv[2]?.trim().toUpperCase()
if (!roomCode) {
  console.error('usage: node tools/reset-staff-code.mjs <รหัสห้อง>')
  process.exit(2)
}

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const secret = process.env.SESSION_SECRET ?? env.SESSION_SECRET
// ต้องตรงกับ staffCodeLookup ใน src/server/session.ts
const lookup = (code) => createHmac('sha256', secret).update(`staff-code:${code}`).digest('base64url')

const db = new DatabaseSync(path.resolve(process.env.DATABASE_PATH ?? env.DATABASE_PATH ?? './data/app.db'))
const room = db.prepare('SELECT team_id FROM rooms WHERE code = ?').get(roomCode)
if (!room) {
  console.error(`ไม่พบห้อง ${roomCode} (ถ้าเพิ่งอัปเดตแอป ให้เปิด server หนึ่งครั้งก่อน ระบบจะย้ายข้อมูลเป็นแบบทีม)`)
  process.exit(1)
}
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
let staffCode
do {
  const raw = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
  staffCode = `${raw.slice(0, 4)}-${raw.slice(4)}`
} while (db.prepare('SELECT 1 FROM teams WHERE staff_code_lookup = ?').get(lookup(staffCode)))

const salt = randomBytes(16).toString('base64url')
const hash = `${salt}.${scryptSync(staffCode, salt, 32).toString('base64url')}`
db.prepare('UPDATE teams SET staff_code_hash = ?, staff_code_lookup = ? WHERE id = ?').run(hash, lookup(staffCode), room.team_id)
console.log(`ทีมของห้อง ${roomCode} · รหัสทีมงานใหม่: ${staffCode}`)
