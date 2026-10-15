import { currentRoomStaff } from '@/server/guards'
import { ok, route } from '@/server/http'
import { getResults } from '@/server/report/service'

export const GET = route(async () => ok(getResults((await currentRoomStaff()).roomId)))
