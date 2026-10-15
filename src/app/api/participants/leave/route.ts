import { ok, route } from '@/server/http'
import { clearParticipantCookie } from '@/server/session'

export const POST = route(async () => {
  await clearParticipantCookie()
  return ok(null)
})
