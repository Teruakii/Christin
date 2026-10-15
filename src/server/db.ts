import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { QUESTION_BANK } from './question/bank'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  staff_code_hash TEXT NOT NULL,
  staff_code_lookup TEXT UNIQUE,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  course_language TEXT NOT NULL,
  target INTEGER NOT NULL,
  group_size INTEGER NOT NULL,
  pre_on TEXT NOT NULL,
  post_on TEXT NOT NULL,
  followup_on TEXT NOT NULL,
  end_on TEXT NOT NULL,
  mix TEXT NOT NULL,
  team_id TEXT NOT NULL REFERENCES teams(id),
  groups_announced_at TEXT,
  groups_generated_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  language TEXT NOT NULL,
  topic TEXT NOT NULL,
  prompt TEXT NOT NULL,
  code TEXT NOT NULL,
  choices TEXT NOT NULL,
  answer INTEGER NOT NULL,
  explanation TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS room_questions (
  room_id TEXT NOT NULL REFERENCES rooms(id),
  question_id TEXT NOT NULL REFERENCES questions(id),
  position INTEGER NOT NULL,
  PRIMARY KEY (room_id, question_id)
);
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id),
  tracking_code TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  group_no INTEGER,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS attempts (
  participant_id TEXT NOT NULL REFERENCES participants(id),
  phase TEXT NOT NULL,
  answers TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  submitted_at TEXT NOT NULL,
  PRIMARY KEY (participant_id, phase)
);
CREATE TABLE IF NOT EXISTS help_requests (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id),
  participant_id TEXT NOT NULL REFERENCES participants(id),
  topic TEXT NOT NULL,
  message TEXT NOT NULL,
  place TEXT NOT NULL,
  status TEXT NOT NULL,
  claimed_by TEXT,
  created_at TEXT NOT NULL,
  claimed_at TEXT,
  done_at TEXT
);
CREATE INDEX IF NOT EXISTS help_room_status ON help_requests(room_id, status);
CREATE TABLE IF NOT EXISTS staff_presence (
  room_id TEXT NOT NULL,
  name TEXT NOT NULL,
  seen_at TEXT NOT NULL,
  PRIMARY KEY (room_id, name)
);
`

const open = () => {
  // path มาจาก env ตอนรัน ไม่ต้องให้ build ไล่ trace ไฟล์ทั้งโปรเจกต์
  const file = path.resolve(/*turbopackIgnore: true*/ process.env.DATABASE_PATH ?? './data/app.db')
  mkdirSync(path.dirname(file), { recursive: true })
  const db = new DatabaseSync(file)
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;')
  db.exec(SCHEMA)
  migrateRooms(db)
  // upsert คลังคำถามทุกครั้งที่เปิด ให้แก้คำอธิบายใน bank.ts แล้วมีผลทันที
  const upsert = db.prepare(`INSERT INTO questions (id, language, topic, prompt, code, choices, answer, explanation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET language=excluded.language, topic=excluded.topic, prompt=excluded.prompt,
      code=excluded.code, choices=excluded.choices, answer=excluded.answer, explanation=excluded.explanation`)
  tx(db, () => {
    for (const q of QUESTION_BANK) {
      upsert.run(q.id, q.language, q.topic, q.prompt, q.code, JSON.stringify(q.choices), q.answer, q.explanation)
    }
  })
  return db
}

// ฐานข้อมูลรุ่นก่อน: เพิ่มคอลัมน์ที่ขาด แล้วย้ายรหัสทีมงานจากรายห้องขึ้นไปเป็นของทีม
const migrateRooms = (db: DatabaseSync) => {
  const cols = () => (db.prepare('PRAGMA table_info(rooms)').all() as { name: string }[]).map((c) => c.name)
  if (!cols().includes('groups_generated_at')) db.exec('ALTER TABLE rooms ADD COLUMN groups_generated_at TEXT')
  if (!cols().includes('team_id')) {
    if (cols().includes('workspace_id')) db.exec('ALTER TABLE rooms RENAME COLUMN workspace_id TO team_id')
    else db.exec('ALTER TABLE rooms ADD COLUMN team_id TEXT')
    // ห้องที่ยังไม่มีทีม (ก่อนมีระบบทีม) เป็นของเจ้าของเดียวกัน รวมเป็นทีมเดียว
    db.prepare('UPDATE rooms SET team_id = ? WHERE team_id IS NULL').run(randomUUID())
  }
  if (!cols().includes('staff_code_hash')) return
  const hasLookup = cols().includes('staff_code_lookup')
  // รหัสของทีม = รหัสของห้องแรกในทีม (เลือกห้องที่เคยเข้าด้วยรหัสแล้วก่อน) คนที่ถือรหัสนั้นอยู่เข้าได้ต่อ
  const pick = db.prepare(
    `SELECT staff_code_hash h, ${hasLookup ? 'staff_code_lookup' : 'NULL'} l, created_at c FROM rooms WHERE team_id = ?
     ORDER BY ${hasLookup ? 'staff_code_lookup IS NULL, ' : ''}created_at LIMIT 1`,
  )
  const insert = db.prepare('INSERT INTO teams (id, staff_code_hash, staff_code_lookup, created_at) VALUES (?, ?, ?, ?)')
  const teams = db.prepare('SELECT DISTINCT team_id id FROM rooms WHERE team_id NOT IN (SELECT id FROM teams)').all() as { id: string }[]
  tx(db, () => {
    for (const { id } of teams) {
      const r = pick.get(id) as { h: string; l: string | null; c: string }
      insert.run(id, r.h, r.l, r.c)
    }
    db.exec('DROP INDEX IF EXISTS rooms_staff_code_lookup')
    if (hasLookup) db.exec('ALTER TABLE rooms DROP COLUMN staff_code_lookup')
    db.exec('ALTER TABLE rooms DROP COLUMN staff_code_hash')
  })
}

export const tx = <T>(db: DatabaseSync, fn: () => T): T => {
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = fn()
    db.exec('COMMIT')
    return result
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

// เก็บไว้บน globalThis เพื่อไม่ให้ dev server เปิด connection ใหม่ทุกครั้งที่ hot reload
const g = globalThis as unknown as { __db?: DatabaseSync }
export const db = () => (g.__db ??= open())

export const nowIso = () => new Date().toISOString()
