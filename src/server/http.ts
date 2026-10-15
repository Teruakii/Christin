import { connection } from 'next/server'
import type { ZodType } from 'zod'

export type FieldError = { field: string; msg: string }

// error ทุกตัวออกเป็น { code, message, payload } โดย message เป็นรหัส UPPER_SNAKE ให้หน้าบ้านแปลเอง
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    public payload?: FieldError[],
  ) {
    super(code)
  }
}

export const ok = <T>(data: T, init?: ResponseInit) => Response.json({ data }, init)

export const route =
  <C>(fn: (req: Request, ctx: C) => Promise<Response>) =>
  async (req: Request, ctx: C) => {
    // sqlite เป็น sync: ต้องหยุด prerender ตรงนี้ ไม่งั้น build จะรัน query และ cookies() ตอน build
    await connection()
    try {
      return await fn(req, ctx)
    } catch (e) {
      if (e instanceof AppError) {
        return Response.json({ code: e.status, message: e.code, payload: e.payload }, { status: e.status })
      }
      console.error(e)
      return Response.json({ code: 500, message: 'INTERNAL_ERROR' }, { status: 500 })
    }
  }

export const parseBody = async <T>(req: Request, schema: ZodType<T>): Promise<T> => {
  const raw = await req.json().catch(() => {
    throw new AppError(400, 'INVALID_JSON')
  })
  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new AppError(
      400,
      'VALIDATION_FAILED',
      result.error.issues.map((i) => ({ field: i.path.join('.'), msg: i.message })),
    )
  }
  return result.data
}
