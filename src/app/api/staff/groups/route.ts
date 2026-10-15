import { currentRoomStaff } from '@/server/guards'
import { getGroups } from '@/server/group/service'
import { ok, route } from '@/server/http'

export const GET = route(async () => ok(getGroups((await currentRoomStaff()).roomId)))
