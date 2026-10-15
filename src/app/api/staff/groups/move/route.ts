import { currentRoomStaff } from '@/server/guards'
import { moveMember } from '@/server/group/service'
import { ok, parseBody, route } from '@/server/http'
import { MoveBody } from '@/server/schemas'

export const POST = route(async (req) => {
  const { roomId } = await currentRoomStaff()
  const { participantId, groupNo } = await parseBody(req, MoveBody)
  return ok(moveMember(roomId, participantId, groupNo))
})
