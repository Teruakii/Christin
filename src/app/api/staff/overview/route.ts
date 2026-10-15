import { currentRoomStaff } from '@/server/guards'
import { ok, route } from '@/server/http'
import { getOverview } from '@/server/report/service'

export const GET = route(async () => ok(getOverview((await currentRoomStaff()).roomId)))
