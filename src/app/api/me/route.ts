import { currentParticipant } from '@/server/guards'
import { ok, route } from '@/server/http'
import { getMe } from '@/server/participant/service'

export const GET = route(async () => ok(getMe(await currentParticipant())))
