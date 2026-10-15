import { currentRoomStaff } from '@/server/guards'
import { clearGroups } from '@/server/group/service'
import { ok, route } from '@/server/http'

export const POST = route(async () => ok(clearGroups((await currentRoomStaff()).roomId)))
