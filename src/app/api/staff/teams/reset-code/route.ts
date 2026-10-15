import { currentStaff } from '@/server/guards'
import { ok, route } from '@/server/http'
import { resetTeamCode } from '@/server/team/service'

export const POST = route(async () => ok(resetTeamCode((await currentStaff()).teamId)))
