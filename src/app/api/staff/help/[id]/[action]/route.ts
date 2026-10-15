import { currentRoomStaff } from '@/server/guards'
import { claimHelp, finishHelp, releaseHelp } from '@/server/help/service'
import { AppError, ok, route } from '@/server/http'

export const POST = route(async (_req, ctx: RouteContext<'/api/staff/help/[id]/[action]'>) => {
  const { roomId } = await currentRoomStaff()
  const { id, action } = await ctx.params
  if (action === 'claim') return ok(claimHelp(roomId, id))
  if (action === 'done') return ok(finishHelp(roomId, id))
  if (action === 'release') return ok(releaseHelp(roomId, id))
  throw new AppError(404, 'ACTION_NOT_FOUND')
})
