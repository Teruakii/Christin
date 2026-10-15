import { currentRoomStaff } from '@/server/guards'
import { generateGroups } from '@/server/group/service'
import { ok, parseBody, route } from '@/server/http'
import { GenerateGroupsBody } from '@/server/schemas'

export const POST = route(async (req) => {
  const { roomId } = await currentRoomStaff()
  const { groupSize } = await parseBody(req, GenerateGroupsBody)
  return ok(generateGroups(roomId, groupSize))
})
