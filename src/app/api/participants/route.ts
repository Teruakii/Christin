import { ok, parseBody, route } from '@/server/http'
import { findParticipant, getMe, joinRoom } from '@/server/participant/service'
import { JoinBody } from '@/server/schemas'
import { setParticipantCookie } from '@/server/session'

export const POST = route(async (req) => {
  const { roomCode, nickname } = await parseBody(req, JoinBody)
  const trackingCode = joinRoom(roomCode, nickname)
  await setParticipantCookie(trackingCode)
  return ok(getMe(findParticipant(trackingCode)), { status: 201 })
})
