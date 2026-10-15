import { ok, parseBody, route } from '@/server/http'
import { findParticipant, getMe } from '@/server/participant/service'
import { ResumeBody } from '@/server/schemas'
import { setParticipantCookie } from '@/server/session'

export const POST = route(async (req) => {
  const { trackingCode } = await parseBody(req, ResumeBody)
  const p = findParticipant(trackingCode)
  await setParticipantCookie(p.tracking_code)
  return ok(getMe(p))
})
