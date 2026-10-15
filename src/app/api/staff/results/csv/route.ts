import { currentRoomStaff } from '@/server/guards'
import { route } from '@/server/http'
import { resultsCsv } from '@/server/report/service'

export const GET = route(async () => {
  const { roomId } = await currentRoomStaff()
  return new Response(resultsCsv(roomId), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="results.csv"' },
  })
})
