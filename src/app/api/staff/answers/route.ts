import { currentRoomStaff } from '@/server/guards'
import { ok, route } from '@/server/http'
import { getAnswerKey } from '@/server/report/service'

export const GET = route(async () => ok(getAnswerKey((await currentRoomStaff()).roomId)))
