// รันโค้ดข้อ python/javascript จริงแล้วเทียบกับคำตอบในคลัง · ข้อ java/c ไม่มี compiler ในเครื่อง ข้ามไว้
// usage: node tools/verify-bank.mjs
import { execFileSync } from 'node:child_process'
import { QUESTION_BANK } from '../src/server/question/bank.ts'

const run = (cmd, args, code) => {
  try {
    return { out: execFileSync(cmd, args, { input: code, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim() }
  } catch (e) {
    return { err: String(e.stderr) }
  }
}

let fail = 0
for (const q of QUESTION_BANK) {
  if (q.language !== 'python' && q.language !== 'javascript') continue
  const r = q.language === 'python' ? run('python', ['-I', '-X', 'utf8', '-'], q.code) : run('node', ['-'], q.code)
  const expected = q.choices[q.answer]
  const pass = r.err !== undefined ? r.err.includes(expected) : r.out === expected
  if (!pass) fail++
  console.log(`${pass ? 'PASS' : 'FAIL'} ${q.id} expected=${JSON.stringify(expected)} got=${JSON.stringify(r.out ?? r.err.split('\n').filter(Boolean).at(-1))}`)
}

const counts = {}
for (const q of QUESTION_BANK) counts[q.answer] = (counts[q.answer] ?? 0) + 1
console.log(`answer positions ${JSON.stringify(counts)} · ${QUESTION_BANK.length} questions`)
process.exit(fail ? 1 : 0)
