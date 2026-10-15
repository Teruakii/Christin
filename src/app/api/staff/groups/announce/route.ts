import { currentRoomStaff } from '@/server/guards'
import { announceGroups } from '@/server/group/service'
import { ok, route } from '@/server/http'

export const POST = route(async () => ok(announceGroups((await currentRoomStaff()).roomId)))
