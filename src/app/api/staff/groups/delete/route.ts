import { currentRoomStaff } from '@/server/guards'
import { deleteGroup } from '@/server/group/service'
import { ok, parseBody, route } from '@/server/http'
import { DeleteGroupBody } from '@/server/schemas'

export const POST = route(async (req) => {
  const { roomId } = await currentRoomStaff()
  const { groupNo } = await parseBody(req, DeleteGroupBody)
  return ok(deleteGroup(roomId, groupNo))
})
