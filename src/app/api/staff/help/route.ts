import { currentRoomStaff } from '@/server/guards'
import { roomQueue } from '@/server/help/service'
import { ok, route } from '@/server/http'

export const GET = route(async () => ok(roomQueue((await currentRoomStaff()).roomId)))
