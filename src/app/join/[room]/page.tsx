import { Suspense } from 'react'
import JoinView from './JoinView'

// useParams ต้องอยู่ใต้ Suspense เมื่อเปิด cacheComponents
export default function JoinPage() {
  return (
    <Suspense>
      <JoinView />
    </Suspense>
  )
}
