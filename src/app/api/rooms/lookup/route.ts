import { ok, parseBody, route } from '@/server/http'
import { lookupRoom } from '@/server/room/service'
import { RoomCodeBody } from '@/server/schemas'

export const POST = route(async (req) => {
  const { code } = await parseBody(req, RoomCodeBody)
  return ok(lookupRoom(code))
})
