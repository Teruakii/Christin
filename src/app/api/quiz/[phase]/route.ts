import { z } from 'zod'
import { PHASES } from '@/types/room.types'
import { currentParticipant } from '@/server/guards'
import { AppError, ok, parseBody, route } from '@/server/http'
import { getQuiz, submitQuiz } from '@/server/quiz/service'
import { SubmitBody } from '@/server/schemas'

const phaseOf = async (ctx: RouteContext<'/api/quiz/[phase]'>) => {
  const parsed = z.enum(PHASES).safeParse((await ctx.params).phase)
  if (!parsed.success) throw new AppError(404, 'PHASE_NOT_FOUND')
  return parsed.data
}

export const GET = route(async (_req, ctx: RouteContext<'/api/quiz/[phase]'>) =>
  ok(getQuiz(await currentParticipant(), await phaseOf(ctx))),
)

export const POST = route(async (req, ctx: RouteContext<'/api/quiz/[phase]'>) => {
  const phase = await phaseOf(ctx)
  const { answers } = await parseBody(req, SubmitBody)
  return ok(submitQuiz(await currentParticipant(), phase, answers), { status: 201 })
})
