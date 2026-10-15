import { currentParticipant } from '@/server/guards'
import { myHelp, requestHelp } from '@/server/help/service'
import { ok, parseBody, route } from '@/server/http'
import { HelpBody } from '@/server/schemas'

export const GET = route(async () => ok(myHelp(await currentParticipant())))

export const POST = route(async (req) => {
  const input = await parseBody(req, HelpBody)
  return ok(requestHelp(await currentParticipant(), input), { status: 201 })
})
