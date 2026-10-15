import { currentParticipant } from '@/server/guards'
import { cancelMyHelp } from '@/server/help/service'
import { ok, route } from '@/server/http'

export const POST = route(async () => ok(cancelMyHelp(await currentParticipant())))
