import { currentRoomStaff } from '@/server/guards'
import { ok, parseBody, route } from '@/server/http'
import { getSettings, updateRoom } from '@/server/room/service'
import { RoomBody } from '@/server/schemas'

export const GET = route(async () => ok(getSettings((await currentRoomStaff()).roomId)))

export const PUT = route(async (req) => {
  const { roomId } = await currentRoomStaff()
  return ok(updateRoom(roomId, await parseBody(req, RoomBody)))
})
