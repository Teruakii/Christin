// ยิง API จริงตั้งแต่สร้างห้องจนดูผล 14 วัน · usage: npm run smoke (build ก่อนแล้วรันไฟล์นี้)
// เปิด server ของตัวเองบนฐานข้อมูลแยก แล้วลบทิ้งตอนจบ ข้อมูลทดสอบจะไม่ปนกับฐานจริง
import { spawn } from 'node:child_process'
import { rmSync } from 'node:fs'

const PORT = 3199
const BASE = `http://localhost:${PORT}`
const DB = './data/smoke.db'
const dropDb = () => ['', '-wal', '-shm'].forEach((s) => rmSync(DB + s, { force: true }))

dropDb()
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
  env: { ...process.env, DATABASE_PATH: DB },
  stdio: 'ignore',
})
const stop = () => {
  server.kill()
  setTimeout(dropDb, 500)
}
for (let i = 0; ; i++) {
  if (await fetch(`${BASE}/api/me`).then(() => true, () => false)) break
  if (i > 60) throw new Error('smoke server did not start (ลืม npm run build?)')
  await new Promise((r) => setTimeout(r, 500))
}

const client = () => {
  let cookie = ''
  const call = async (method, path, body) => {
    const res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const set = res.headers.getSetCookie()
    if (set.length) cookie = [...new Map([...cookie.split('; ').filter(Boolean), ...set.map((c) => c.split(';')[0])].map((c) => [c.split('=')[0], c])).values()].join('; ')
    // อ่านเป็น bytes เอง เพราะ res.text() ตัด BOM ทิ้ง แล้วจะตรวจ BOM ของ CSV ไม่ได้
    const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(await res.arrayBuffer())
    const json = res.headers.get('content-type')?.includes('json') ? JSON.parse(text) : text
    return { status: res.status, json }
  }
  return { get: (p) => call('GET', p), post: (p, b = {}) => call('POST', p, b), put: (p, b) => call('PUT', p, b), delete: (p) => call('DELETE', p) }
}

let failed = 0
const check = (ok, label, detail) => {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${!ok && detail !== undefined ? ` · ${JSON.stringify(detail)}` : ''}`)
}

const room = (schedule) => ({
  name: 'Smoke รุ่นทดสอบ', courseLanguage: 'python', target: 13, groupSize: 5, schedule,
  mix: { python: 4, javascript: 2, java: 2, c: 2 },
})
const past = { pre: '2026-09-01', post: '2026-09-20', followup: '2026-10-04', end: '2026-10-10' }

const staff = client()
const team = await staff.post('/api/staff/teams')
const { staffCode } = team.json.data
check(team.status === 201 && /^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(staffCode), 'creating a team gives one staff code', team.json)
const empty = await staff.get('/api/staff/session')
const noRoom = await staff.get('/api/staff/overview')
check(empty.json.data.room === null && noRoom.status === 409 && noRoom.json.message === 'NO_ROOM_SELECTED', 'a new team has no room yet, room pages answer NO_ROOM_SELECTED', noRoom.json)
check((await client().post('/api/staff/rooms', room(past))).status === 401, 'creating a room needs a staff session')
const created = await staff.post('/api/staff/rooms', room(past))
check(created.status === 201 && /^[A-Z2-9]{6}$/.test(created.json.data.roomCode) && !('staffCode' in created.json.data), 'staff creates room, gets only a room code (no per-room staff code)', created.json)
const { roomCode } = created.json.data

const badGap = await staff.post('/api/staff/rooms', room({ ...past, followup: '2026-09-25' }))
check(badGap.status === 400 && badGap.json.message === 'INVALID_SCHEDULE', 'follow-up under 14 days after post is rejected', badGap.json)

check((await client().get('/api/staff/overview')).status === 401, 'staff endpoint without session is 401')
const wrongCode = await client().post('/api/staff/session', { staffCode: 'AAAA-BBBB' })
check(wrongCode.status === 401 && wrongCode.json.message === 'INVALID_STAFF_CODE', 'wrong staff code is rejected')
const staff2 = client()
const staff2Login = await staff2.post('/api/staff/session', { staffCode: staffCode.toLowerCase() })
check(staff2Login.status === 200 && staff2Login.json.data.room.code === roomCode, 'second staff logs in with staff code only (any case), lands in the right room', staff2Login.json)

const questions = (await staff.get('/api/staff/answers')).json.data
check(questions.length === 10 && questions.filter((q) => q.language === 'python').length === 4, 'room has 10 questions with python=4', questions.map((q) => q.language))

// คนที่ i ตอบถูก i ข้อแรก (นับตามลำดับห้อง) ที่เหลือข้าม → คะแนนต่างกันชัด
const answersFor = (correct) => Object.fromEntries(questions.map((q, i) => [q.id, i < correct ? q.answer : null]))
const people = []
for (let i = 0; i < 12; i++) {
  const c = client()
  const joined = await c.post('/api/participants', { roomCode, nickname: `คน${i}` })
  if (i === 0) check(joined.status === 201 && /^[A-Z2-9]{6}$/.test(joined.json.data.trackingCode), 'participant joins without login, gets tracking code', joined.json)
  const quiz = await c.get('/api/quiz/pre')
  if (i === 0) check(quiz.status === 200 && quiz.json.data.questions.length === 10 && !('answer' in quiz.json.data.questions[0]), 'pre quiz hides answers', quiz.json.data.questions[0])
  const score = i % 11
  const sub = await c.post('/api/quiz/pre', { answers: answersFor(score) })
  if (i === 0) check(sub.status === 201 && sub.json.data.score === score, 'pre submit scores correctly', sub.json)
  people.push({ c, score, code: joined.json.data.trackingCode })
}

const again = await people[0].c.post('/api/quiz/pre', { answers: answersFor(3) })
check(again.status === 409 && again.json.message === 'ALREADY_SUBMITTED', 'each round can be submitted once', again.json)
const partial = await client().post('/api/participants', { roomCode, nickname: 'ส่งไม่ครบ' })
const bad = await (async () => { const c = client(); await c.post('/api/participants/resume', { trackingCode: partial.json.data.trackingCode }); return c.post('/api/quiz/pre', { answers: { nope: 1 } }) })()
check(bad.status === 400 && bad.json.message === 'INVALID_ANSWERS', 'answers not matching the room set are rejected', bad.json)

const meBefore = (await people[0].c.get('/api/me')).json.data
check(meBefore.group === null, 'no group shown before staff announces')

const gen = (await staff.post('/api/staff/groups/generate')).json.data
const sizes = gen.groups.map((g) => g.members.length)
check(gen.groups.length === 3 && sizes.every((s) => s === 4) && gen.ungrouped.length === 0, '12 people → 3 groups of 4, nobody left out', sizes)
const sorted = [...people.map((p) => p.score)].sort((a, b) => b - a)
const naiveSpread = (() => { const g = [sorted.slice(0, 4), sorted.slice(4, 8), sorted.slice(8)].map((x) => x.reduce((a, b) => a + b) / 4); return Math.max(...g) - Math.min(...g) })()
check(gen.spread < naiveSpread / 4, `snake draft spread ${gen.spread} far below top-to-bottom split ${naiveSpread}`)
check(gen.groups.every((g) => g.members.some((m) => m.level === 'high') && g.members.some((m) => m.level === 'low')), 'every group mixes a high scorer with a low scorer', gen.groups.map((g) => g.members.map((m) => m.level)))

check((await staff.post('/api/staff/groups/announce')).status === 200, 'staff announces groups')
const regen = await staff.post('/api/staff/groups/generate')
check(regen.status === 200 && regen.json.data.announced && regen.json.data.groups.length === 3, 'staff can regroup after announcing, groups stay visible', regen.json)

const me = (await people[0].c.get('/api/me')).json.data
check(me.group && me.group.members.length === 4 && me.group.members[0] === 'คน0' && !JSON.stringify(me.group).includes('score'), 'participant sees own group names first, no scores', me.group)

const late = client()
await late.post('/api/participants', { roomCode, nickname: 'มาสาย' })
await late.post('/api/quiz/pre', { answers: answersFor(10) })
const lateMe = (await late.get('/api/me')).json.data
check(lateMe.group !== null, 'late pre-test submitter is placed into a group immediately', lateMe.group)

// ทุกกลุ่มเต็มแล้ว คนส่งช้าต้องได้กลุ่มใหม่ ไม่ใช่กองรวมกลุ่มเดิม (บัคเดิม: กลุ่มเดียวโตไม่หยุด)
const full = (await staff.post('/api/staff/groups/generate', { groupSize: 10 })).json.data
const late2 = client()
await late2.post('/api/participants', { roomCode, nickname: 'มาสายอีก' })
await late2.post('/api/quiz/pre', { answers: answersFor(0) })
const afterLate = (await staff.get('/api/staff/groups')).json.data
check(full.groups.length === 2 && afterLate.groups.every((g) => g.members.length <= 10) && afterLate.lateCount === 1 && afterLate.groupSize === 10,
  'late joiner never overfills a group, lateCount tells staff to regroup', afterLate.groups.map((g) => g.members.length))

const beforeDelete = (await staff.get('/api/staff/groups')).json.data
const doomed = beforeDelete.groups[0]
const deleted = (await staff.post('/api/staff/groups/delete', { groupNo: doomed.no })).json.data
check(deleted.groups.length === beforeDelete.groups.length - 1 && deleted.groups.every((g, i) => g.no === i + 1) && deleted.ungrouped.length === doomed.members.length,
  'deleting a group sends its members to ungrouped and renumbers the rest', deleted.groups.map((g) => g.no))
const moved = (await staff.post('/api/staff/groups/move', { participantId: deleted.ungrouped[0].id, groupNo: 1 })).json.data
check(moved.ungrouped.length === doomed.members.length - 1, 'an ungrouped member can be moved into a group')
const cleared = (await staff.post('/api/staff/groups/clear')).json.data
const clearedMe = (await people[0].c.get('/api/me')).json.data
check(cleared.groups.length === 0 && !cleared.announced && cleared.ungrouped.length === 14 && clearedMe.group === null, 'clearing all groups un-announces and hides groups from participants', { groups: cleared.groups.length, announced: cleared.announced })
await staff.post('/api/staff/groups/generate', { groupSize: 5 })

const resumed = client()
const r = await resumed.post('/api/participants/resume', { trackingCode: people[1].code.toLowerCase() })
check(r.status === 200 && r.json.data.nickname === 'คน1', 'resume with tracking code (any case) on a new device')

for (const p of people) {
  await p.c.post('/api/quiz/post', { answers: answersFor(Math.min(10, p.score + 4)) })
  await p.c.post('/api/quiz/followup', { answers: answersFor(Math.min(10, p.score + 3)) })
}
const postFirst = client()
await postFirst.post('/api/participants', { roomCode, nickname: 'ข้ามก่อนเรียน' })
const skipPre = await postFirst.get('/api/quiz/post')
check(skipPre.status === 409 && skipPre.json.message === 'PRE_TEST_REQUIRED', 'post-test needs a pre-test first', skipPre.json)

const review = await people[2].c.get('/api/review')
check(review.status === 200 && review.json.data.length === 10 && 'explanation' in review.json.data[0] && 'followup' in review.json.data[0].mine, 'review opens after follow-up with explanations', review.json.data?.[0])

const help = await people[3].c.post('/api/help', { topic: 'content', message: 'recursion ยังงง', place: 'table' })
check(help.status === 201 && help.json.data.position === 1 && help.json.data.status === 'waiting', 'participant asks for help, is first in queue', help.json)
const dup = await people[3].c.post('/api/help', { topic: 'code', message: 'อีกรอบ', place: 'table' })
check(dup.json.data.id === help.json.data.id, 'pressing help twice keeps one request')
const second = await people[4].c.post('/api/help', { topic: 'app', message: '', place: 'online' })
check(second.json.data.position === 2, 'second person is position 2', second.json.data)
const id = help.json.data.id
check((await staff.post(`/api/staff/help/${id}/claim`)).status === 200, 'staff claims request')
const race = await staff2.post(`/api/staff/help/${id}/claim`)
check(race.status === 409 && race.json.message === 'HELP_STATUS_CHANGED', 'second staff cannot claim the same request', race.json)
const mine = (await people[3].c.get('/api/help')).json.data
check(mine.status === 'helping' && mine.claimedAt !== null, 'participant sees staff is coming', mine)
check(((await people[4].c.get('/api/help')).json.data.position) === 1, 'queue position moves up after a claim')
await staff.post(`/api/staff/help/${id}/done`)
const queue = (await staff.get('/api/staff/help')).json.data
check(queue.requests.find((q) => q.id === id).status === 'done' && queue.staffOnline === 2, 'done request stays in today list, 2 staff online', queue.staffOnline)

const results = (await staff.get('/api/staff/results')).json.data
check(results.phases.pre.count === 14 && results.phases.followup.count === 12, 'results count submissions per round', results.phases)
// ทุกคน post = pre+4 (ตันที่ 10) และ followup = pre+3 → retention ราว 75%
check(results.retention >= 60 && results.retention <= 90, `retention ${results.retention}% matches +4 then +3`)
check(results.byLanguage.length === 4 && results.byLanguage[0].pct.pre !== null, 'per-language accuracy present', results.byLanguage)
const key = (await staff.get('/api/staff/answers')).json.data
// 14 คนส่งรอบ pre: 10 คนได้ 1-10 ข้อ + คนมาสายได้ 10 = 11 คนตอบข้อแรกถูก ที่เหลือข้าม
const first = key[0].stats.pre
check(first.n === 14 && first.picks[key[0].answer] === 11 && first.picks.reduce((a, b) => a + b, 0) + first.skipped === first.n, 'answer key counts picks per choice per round', first)
check((await client().get('/api/staff/answers')).status === 401, 'answer key is staff-only')
const csv = await staff.get('/api/staff/results/csv')
check(typeof csv.json === 'string' && csv.json.startsWith('﻿nickname,group,pre') && csv.json.includes('คน0'), 'CSV export has BOM, header and names')

const futureStaff = client()
await futureStaff.post('/api/staff/teams')
const future = await futureStaff.post('/api/staff/rooms', room({ pre: '2027-01-10', post: '2027-01-20', followup: '2027-02-03', end: '2027-02-10' }))
const early = client()
await early.post('/api/participants', { roomCode: future.json.data.roomCode, nickname: 'มาก่อน' })
const notOpen = await early.get('/api/quiz/pre')
check(notOpen.status === 409 && notOpen.json.message === 'PHASE_NOT_OPEN' && notOpen.json.payload[0].msg === '2027-01-10', 'quiz before its date is closed and says when it opens', notOpen.json)
const lock = await staff.put('/api/staff/room', { ...room(past), mix: { python: 5, javascript: 2, java: 2, c: 1 } })
check(lock.status === 409 && lock.json.message === 'QUESTIONS_LOCKED', 'question set is locked once anyone has submitted', lock.json)

// ทีมที่ย้ายมาจากรหัสรายห้องรุ่นเก่าและยังไม่มี lookup ต้องเข้าได้ด้วยรหัสเดิม และระบบบันทึก lookup ให้
const { DatabaseSync } = await import('node:sqlite')
const raw = new DatabaseSync(DB)
raw.prepare('UPDATE teams SET staff_code_lookup = NULL WHERE id = (SELECT team_id FROM rooms WHERE code = ?)').run(roomCode)
const legacy = await client().post('/api/staff/session', { staffCode })
const backfilled = raw.prepare('SELECT staff_code_lookup l FROM teams WHERE id = (SELECT team_id FROM rooms WHERE code = ?)').get(roomCode).l
raw.close()
check(legacy.status === 200 && legacy.json.data.room.code === roomCode && backfilled !== null, 'legacy team (no lookup) logs in with its old staff code and gets backfilled', legacy.json)

// ทีม: ทุกห้องของทีมใช้รหัสเดียว · ทีมอื่นมองไม่เห็น · ลบ/สลับได้เฉพาะห้องของทีม
const roomB = (await staff.post('/api/staff/rooms', room(past))).json.data
const inB = (await staff.get('/api/staff/session')).json.data.room.code
const listed = (await staff.get('/api/staff/rooms')).json.data
check(inB === roomB.roomCode && listed.length === 2 && listed.some((r) => r.code === roomCode) && listed.find((r) => r.current).code === roomB.roomCode,
  'a new room belongs to the team and becomes current', listed.map((r) => [r.code, r.current]))
const outsiderList = (await futureStaff.get('/api/staff/rooms')).json.data
check(outsiderList.length === 1 && !outsiderList.some((r) => r.code === roomCode), 'another team does not see this team\'s rooms', outsiderList.map((r) => r.code))
const crossDelete = await staff.delete(`/api/staff/rooms/${future.json.data.roomCode}`)
const crossSwitch = await staff.post(`/api/staff/rooms/${future.json.data.roomCode}/switch`)
check(crossDelete.status === 404 && crossSwitch.status === 404, 'cannot delete or switch into another team\'s room')
const switched = await staff.post(`/api/staff/rooms/${roomCode}/switch`)
check(switched.status === 200 && (await staff.get('/api/staff/session')).json.data.room.code === roomCode, 'switch between team rooms without re-entering the code')
const delOther = (await staff.delete(`/api/staff/rooms/${roomB.roomCode}`)).json.data
const afterDel = (await staff.get('/api/staff/rooms')).json.data
check(delOther.current.code === roomCode && afterDel.length === 1 && (await client().post('/api/rooms/lookup', { code: roomB.roomCode })).status === 404,
  'deleting another room keeps you where you are and the room is gone', afterDel.map((r) => r.code))
const roomC = (await staff.post('/api/staff/rooms', room(past))).json.data
const delCurrent = (await staff.delete(`/api/staff/rooms/${roomC.roomCode}`)).json.data
check(delCurrent.current?.code === roomCode && (await staff.get('/api/staff/session')).json.data.room.code === roomCode, 'deleting the current room moves you to a room left in the set', delCurrent)
const lonely = (await futureStaff.delete(`/api/staff/rooms/${future.json.data.roomCode}`)).json.data
const stillIn = await futureStaff.get('/api/staff/session')
const raw2 = new DatabaseSync(DB)
const orphans = raw2.prepare('SELECT (SELECT COUNT(*) FROM participants WHERE room_id NOT IN (SELECT id FROM rooms)) p, (SELECT COUNT(*) FROM room_questions WHERE room_id NOT IN (SELECT id FROM rooms)) q').get()
raw2.close()
check(lonely.current === null && stillIn.status === 200 && stillIn.json.data.room === null && orphans.p === 0 && orphans.q === 0,
  'deleting the team\'s last room keeps the staff session (no room) and leaves no orphan data', { lonely, orphans })
const anyCodeLogin = await client().post('/api/staff/session', { staffCode })
check(anyCodeLogin.json.data.room.code === roomCode, 'the same team code opens the team\'s latest room')

const reset = (await staff.post('/api/staff/teams/reset-code')).json.data
const oldCode = await client().post('/api/staff/session', { staffCode })
const newCode = await client().post('/api/staff/session', { staffCode: reset.staffCode })
check(oldCode.status === 401 && newCode.status === 200 && newCode.json.data.room.code === roomCode && (await staff.get('/api/staff/session')).status === 200,
  'resetting the team code: old code rejected, new code works, current sessions keep working')

console.log(failed ? `${failed} FAILED` : 'ALL PASS')
stop()
setTimeout(() => process.exit(failed ? 1 : 0), 800)
