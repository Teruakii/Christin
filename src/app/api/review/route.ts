import { currentParticipant } from '@/server/guards'
import { ok, route } from '@/server/http'
import { getReview } from '@/server/quiz/service'

export const GET = route(async () => ok(getReview(await currentParticipant())))
