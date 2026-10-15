import type { QuestionWithAnswer } from '@/types/quiz.types'

const PRINT = 'โค้ดนี้พิมพ์อะไรออกมา?'

// คลังคำถาม: เพิ่มข้อใหม่ได้ด้วย id ใหม่ อย่าแก้ id เดิมเพราะคำตอบที่ส่งแล้วอ้าง id นี้
// ข้อ python/javascript ตรวจคำตอบด้วย tools/verify-bank.mjs
export const QUESTION_BANK: QuestionWithAnswer[] = [
  {
    id: 'py-01', language: 'python', topic: 'ตัวแปร', prompt: PRINT,
    code: 'x = 5\nx = x + 3\nprint(x)',
    choices: ['5', '8', '53', 'Error'], answer: 1,
    explanation: 'บรรทัดที่สองเอาค่าเดิม 5 บวก 3 แล้วเก็บกลับใน x จึงได้ 8',
  },
  {
    id: 'py-02', language: 'python', topic: 'if/else', prompt: PRINT,
    code: 'age = 15\nif age >= 18:\n    print("ผู้ใหญ่")\nelif age >= 13:\n    print("วัยรุ่น")\nelse:\n    print("เด็ก")',
    choices: ['ผู้ใหญ่', 'เด็ก', 'วัยรุ่น', 'วัยรุ่น และ เด็ก'], answer: 2,
    explanation: '15 ไม่ถึง 18 แต่ถึง 13 จึงเข้า elif และหยุดตรงนั้น ไม่ไปถึง else',
  },
  {
    id: 'py-03', language: 'python', topic: 'loop', prompt: PRINT,
    code: 'total = 0\nfor i in range(1, 4):\n    total += i\nprint(total)',
    choices: ['6', '3', '10', '4'], answer: 0,
    explanation: 'range(1, 4) ให้ 1, 2, 3 (ไม่รวม 4) ผลรวมคือ 6',
  },
  {
    id: 'py-04', language: 'python', topic: 'list', prompt: PRINT,
    code: 'nums = [3, 1, 2]\nnums.sort()\nprint(nums[-1] * 2)',
    choices: ['4', '6', '2', 'Error'], answer: 1,
    explanation: 'sort() เรียง list ในตัวเองเป็น [1, 2, 3] แล้ว nums[-1] คือตัวสุดท้าย = 3 คูณ 2 ได้ 6',
  },
  {
    id: 'py-05', language: 'python', topic: 'string', prompt: PRINT,
    code: 'word = "python"\nprint(word[1:4])',
    choices: ['pyt', 'ytho', 'yth', 'pyth'], answer: 2,
    explanation: 'ตัดตั้งแต่ตำแหน่ง 1 ถึงก่อนตำแหน่ง 4 คือ y, t, h (นับตำแหน่งเริ่มที่ 0)',
  },
  {
    id: 'py-06', language: 'python', topic: 'function', prompt: PRINT,
    code: 'def add(a, b):\n    return a + b\n\nresult = add(2, 3) * 2\nprint(result)',
    choices: ['10', '5', '2323', 'Error'], answer: 0,
    explanation: 'add(2, 3) คืนค่า 5 กลับมา แล้วคูณ 2 ได้ 10',
  },
  {
    id: 'py-07', language: 'python', topic: 'dict', prompt: PRINT,
    code: 'stock = {"apple": 3, "banana": 5}\nstock["apple"] += 2\nprint(stock["apple"] + stock["banana"])',
    choices: ['Error', '8', '13', '10'], answer: 3,
    explanation: 'apple เพิ่มจาก 3 เป็น 5 รวมกับ banana 5 ได้ 10',
  },
  {
    id: 'py-08', language: 'python', topic: 'scope', prompt: PRINT,
    code: 'count = 0\n\ndef bump():\n    count = 5\n\nbump()\nprint(count)',
    choices: ['0', '5', 'None', 'Error'], answer: 0,
    explanation: 'count ในฟังก์ชันเป็นตัวแปรใหม่เฉพาะในฟังก์ชัน ไม่ได้แก้ count ข้างนอก จึงยังเป็น 0',
  },
  {
    id: 'py-09', language: 'python', topic: 'error', prompt: PRINT,
    code: 'nums = [1, 2, 3]\nprint(nums[3])',
    choices: ['3', 'None', 'IndexError', '[1, 2, 3]'], answer: 2,
    explanation: 'list มี 3 ตัว ตำแหน่งคือ 0, 1, 2 เรียกตำแหน่ง 3 จึงเกิด IndexError',
  },
  {
    id: 'py-10', language: 'python', topic: 'recursion', prompt: PRINT,
    code: 'def f(n):\n    if n == 0:\n        return 0\n    return n + f(n - 1)\n\nprint(f(4))',
    choices: ['4', '10', '24', 'Error'], answer: 1,
    explanation: 'f(4) = 4 + f(3) = 4 + 3 + f(2) ... ไปจนถึง f(0) ที่คืน 0 ผลรวมคือ 4+3+2+1+0 = 10 ฟังก์ชันหยุดเรียกตัวเองเมื่อ n เป็น 0',
  },

  {
    id: 'js-01', language: 'javascript', topic: 'ชนิดข้อมูล', prompt: PRINT,
    code: 'let a = "5";\nlet b = 3;\nconsole.log(a + b);',
    choices: ['8', '53', 'Error', 'NaN'], answer: 1,
    explanation: 'a เป็นข้อความ เครื่องหมาย + จึงต่อข้อความ "5" กับ 3 ได้ "53"',
  },
  {
    id: 'js-02', language: 'javascript', topic: 'if/else', prompt: PRINT,
    code: 'const x = 0;\nif (x) {\n  console.log("yes");\n} else {\n  console.log("no");\n}',
    choices: ['no', 'yes', 'undefined', 'Error'], answer: 0,
    explanation: '0 ถือเป็นค่าเท็จ (falsy) ใน if จึงไปที่ else',
  },
  {
    id: 'js-03', language: 'javascript', topic: 'loop', prompt: PRINT,
    code: 'let s = "";\nfor (let i = 0; i < 3; i++) {\n  s += i;\n}\nconsole.log(s);',
    choices: ['3', '123', '012', '6'], answer: 2,
    explanation: 's เป็นข้อความ การ += ตัวเลขจึงต่อท้ายเป็น "0" "01" "012"',
  },
  {
    id: 'js-04', language: 'javascript', topic: 'array', prompt: PRINT,
    code: 'const arr = [10, 20, 30];\narr.push(40);\nconsole.log(arr.length);',
    choices: ['3', '4', '40', 'Error'], answer: 1,
    explanation: 'push เพิ่มสมาชิกท้าย array ได้ แม้ประกาศด้วย const (แก้ข้างในได้ แค่เปลี่ยนตัว array ไม่ได้) ความยาวจึงเป็น 4',
  },
  {
    id: 'js-05', language: 'javascript', topic: 'string', prompt: PRINT,
    code: 'const name = "coding";\nconsole.log(name.toUpperCase().charAt(2));',
    choices: ['O', 'd', 'D', 'C'], answer: 2,
    explanation: 'เปลี่ยนเป็น "CODING" แล้วเอาตัวที่ตำแหน่ง 2 (เริ่มนับ 0) คือ D',
  },
  {
    id: 'js-06', language: 'javascript', topic: 'function', prompt: PRINT,
    code: 'function greet(name = "เพื่อน") {\n  return "สวัสดี " + name;\n}\nconsole.log(greet());',
    choices: ['สวัสดี เพื่อน', 'สวัสดี undefined', 'สวัสดี ', 'Error'], answer: 0,
    explanation: 'ไม่ได้ส่งค่าเข้ามา จึงใช้ค่าเริ่มต้น "เพื่อน"',
  },
  {
    id: 'js-07', language: 'javascript', topic: 'object', prompt: PRINT,
    code: 'const user = { name: "Mint", age: 20 };\nuser.age += 1;\nconsole.log(user.age);',
    choices: ['201', '20', 'Error', '21'], answer: 3,
    explanation: 'age เป็นตัวเลข 20 บวก 1 ได้ 21 และแก้ค่าข้างใน object ที่เป็น const ได้',
  },
  {
    id: 'js-08', language: 'javascript', topic: 'scope', prompt: PRINT,
    code: 'let x = 1;\n{\n  let x = 2;\n}\nconsole.log(x);',
    choices: ['1', '2', 'undefined', 'Error'], answer: 0,
    explanation: 'x ข้างในวงเล็บปีกกาเป็นตัวแปรใหม่ที่อยู่แค่ในบล็อกนั้น x ข้างนอกยังเป็น 1',
  },
  {
    id: 'js-09', language: 'javascript', topic: 'array method', prompt: PRINT,
    code: 'const nums = [1, 2, 3];\nconst doubled = nums.map(n => n * 2);\nconsole.log(doubled[2]);',
    choices: ['3', '4', '6', 'undefined'], answer: 2,
    explanation: 'map สร้าง array ใหม่ [2, 4, 6] ตำแหน่ง 2 คือ 6',
  },
  {
    id: 'js-10', language: 'javascript', topic: 'error', prompt: PRINT,
    code: 'const x = 5;\nx = 10;\nconsole.log(x);',
    choices: ['TypeError', '10', '5', 'undefined'], answer: 0,
    explanation: 'ตัวแปร const กำหนดค่าใหม่ไม่ได้ จึงเกิด TypeError ก่อนถึงบรรทัด console.log',
  },

  {
    id: 'java-01', language: 'java', topic: 'ชนิดข้อมูล', prompt: PRINT,
    code: 'int a = 7;\nint b = 2;\nSystem.out.println(a / b);',
    choices: ['3.5', '3', '4', 'Error'], answer: 1,
    explanation: 'int หาร int ได้ int ตัดเศษทิ้ง 7 / 2 จึงได้ 3',
  },
  {
    id: 'java-02', language: 'java', topic: 'if/else', prompt: PRINT,
    code: 'int score = 75;\nif (score >= 80) {\n    System.out.println("A");\n} else if (score >= 70) {\n    System.out.println("B");\n} else {\n    System.out.println("C");\n}',
    choices: ['C', 'A', 'B', 'B แล้วตามด้วย C'], answer: 2,
    explanation: '75 ไม่ถึง 80 แต่ถึง 70 จึงพิมพ์ B แล้วออกจาก if ทันที',
  },
  {
    id: 'java-03', language: 'java', topic: 'loop', prompt: PRINT,
    code: 'int sum = 0;\nfor (int i = 0; i < 5; i += 2) {\n    sum += i;\n}\nSystem.out.println(sum);',
    choices: ['6', '10', '4', '9'], answer: 0,
    explanation: 'i เพิ่มทีละ 2 คือ 0, 2, 4 รวมกันได้ 6',
  },
  {
    id: 'java-04', language: 'java', topic: 'array', prompt: PRINT,
    code: 'int[] nums = {4, 8, 15};\nSystem.out.println(nums[1] + nums.length);',
    choices: ['83', '11', '12', 'Error'], answer: 1,
    explanation: 'nums[1] คือ 8 และ length คือ 3 ทั้งคู่เป็นตัวเลขจึงบวกกันได้ 11',
  },
  {
    id: 'java-05', language: 'java', topic: 'string', prompt: PRINT,
    code: 'System.out.println("Sum: " + 2 + 3);',
    choices: ['Sum: 5', 'Sum: 2 3', 'Sum: 23', 'Error'], answer: 2,
    explanation: 'ทำจากซ้ายไปขวา "Sum: " + 2 ได้ข้อความ แล้วต่อ 3 เข้าไปอีก จึงได้ "Sum: 23"',
  },
  {
    id: 'java-06', language: 'java', topic: 'method', prompt: PRINT,
    code: 'static int square(int n) {\n    return n * n;\n}\n\n// ใน main\nSystem.out.println(square(3) + 1);',
    choices: ['10', '16', '9', 'Error'], answer: 0,
    explanation: 'square(3) คืน 9 แล้วบวก 1 ได้ 10',
  },
  {
    id: 'java-07', language: 'java', topic: 'string', prompt: PRINT,
    code: 'String a = "hi";\nString b = "hi";\nSystem.out.println(a.equals(b));',
    choices: ['false', 'hi', 'true', 'Error'], answer: 2,
    explanation: 'equals เทียบตัวอักษรข้างใน ซึ่งเหมือนกัน จึงได้ true',
  },
  {
    id: 'java-08', language: 'java', topic: 'ตัวดำเนินการ', prompt: PRINT,
    code: 'int x = 5;\nint y = x++;\nSystem.out.println(x + " " + y);',
    choices: ['5 5', '6 6', '5 6', '6 5'], answer: 3,
    explanation: 'x++ ให้ค่าเดิม (5) กับ y ก่อน แล้วค่อยเพิ่ม x เป็น 6',
  },
  {
    id: 'java-09', language: 'java', topic: 'error', prompt: PRINT,
    code: 'int[] a = new int[3];\nSystem.out.println(a[3]);',
    choices: ['0', 'null', 'ArrayIndexOutOfBoundsException', '3'], answer: 2,
    explanation: 'array ขนาด 3 มีตำแหน่ง 0 ถึง 2 เรียกตำแหน่ง 3 จึงเกิด exception',
  },
  {
    id: 'java-10', language: 'java', topic: 'recursion', prompt: PRINT,
    code: 'static int f(int n) {\n    if (n <= 1) return 1;\n    return n * f(n - 1);\n}\n\n// ใน main\nSystem.out.println(f(4));',
    choices: ['10', '24', '4', '16'], answer: 1,
    explanation: 'f(4) = 4 × 3 × 2 × 1 = 24 หยุดเมื่อ n เหลือ 1',
  },

  {
    id: 'c-01', language: 'c', topic: 'ตัวดำเนินการ', prompt: PRINT,
    code: 'int a = 10;\nint b = 4;\nprintf("%d", a % b);',
    choices: ['2', '2.5', '0', '40'], answer: 0,
    explanation: '% คือเศษจากการหาร 10 หาร 4 ได้ 2 เศษ 2',
  },
  {
    id: 'c-02', language: 'c', topic: 'if/else', prompt: PRINT,
    code: 'int x = 3;\nif (x > 5)\n    printf("big");\nelse\n    printf("small");',
    choices: ['big', 'small', 'bigsmall', '3'], answer: 1,
    explanation: '3 ไม่มากกว่า 5 จึงไปที่ else',
  },
  {
    id: 'c-03', language: 'c', topic: 'loop', prompt: PRINT,
    code: 'int i = 0;\nwhile (i < 3) {\n    printf("%d", i);\n    i++;\n}',
    choices: ['0123', '123', '3', '012'], answer: 3,
    explanation: 'พิมพ์ i ก่อนเพิ่มค่า ได้ 0, 1, 2 พอ i เป็น 3 เงื่อนไขเป็นเท็จจึงหยุด',
  },
  {
    id: 'c-04', language: 'c', topic: 'array', prompt: PRINT,
    code: 'int a[4] = {2, 4, 6, 8};\nprintf("%d", a[0] + a[3]);',
    choices: ['8', '10', '6', '14'], answer: 1,
    explanation: 'a[0] คือ 2 และ a[3] คือ 8 รวมได้ 10',
  },
  {
    id: 'c-05', language: 'c', topic: 'char', prompt: PRINT,
    code: "char c = 'A';\nc = c + 2;\nprintf(\"%c\", c);",
    choices: ['67', 'A2', 'C', 'B'], answer: 2,
    explanation: "ตัวอักษรเก็บเป็นตัวเลข 'A' + 2 คือตัวถัดไปอีกสองตัว ได้ 'C' และ %c พิมพ์เป็นตัวอักษร",
  },
  {
    id: 'c-06', language: 'c', topic: 'function', prompt: PRINT,
    code: 'int twice(int n) {\n    return n * 2;\n}\n\nint main() {\n    printf("%d", twice(twice(3)));\n    return 0;\n}',
    choices: ['12', '6', '9', '33'], answer: 0,
    explanation: 'twice(3) ได้ 6 แล้ว twice(6) ได้ 12',
  },
  {
    id: 'c-07', language: 'c', topic: 'pointer', prompt: PRINT,
    code: 'int x = 5;\nint *p = &x;\n*p = 9;\nprintf("%d", x);',
    choices: ['5', '9', 'ที่อยู่ของ x', 'Error'], answer: 1,
    explanation: 'p ชี้ไปที่ x การแก้ *p จึงแก้ค่า x เป็น 9',
  },
  {
    id: 'c-08', language: 'c', topic: 'ชนิดข้อมูล', prompt: PRINT,
    code: 'float r = 7 / 2;\nprintf("%.1f", r);',
    choices: ['3.5', '3', '4.0', '3.0'], answer: 3,
    explanation: '7 / 2 เป็น int หาร int ได้ 3 ก่อน แล้วค่อยเก็บลง float เป็น 3.0',
  },
  {
    id: 'c-09', language: 'c', topic: 'loop', prompt: PRINT,
    code: 'int count = 0;\nfor (int i = 10; i > 0; i -= 3) {\n    count++;\n}\nprintf("%d", count);',
    choices: ['3', '4', '10', '0'], answer: 1,
    explanation: 'i เป็น 10, 7, 4, 1 รวม 4 รอบ พอเป็น -2 ก็หยุด',
  },
  {
    id: 'c-10', language: 'c', topic: 'function', prompt: PRINT,
    code: 'void reset(int n) {\n    n = 0;\n}\n\nint main() {\n    int a = 7;\n    reset(a);\n    printf("%d", a);\n    return 0;\n}',
    choices: ['0', '7', 'Error', 'ที่อยู่ของ a'], answer: 1,
    explanation: 'C ส่งค่าแบบคัดลอก n เป็นสำเนาของ a การแก้ n จึงไม่กระทบ a',
  },
]
