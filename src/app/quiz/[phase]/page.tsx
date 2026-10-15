import { Suspense } from 'react'
import QuizView from './QuizView'

// useParams ต้องอยู่ใต้ Suspense เมื่อเปิด cacheComponents
export default function QuizPage() {
  return (
    <Suspense>
      <QuizView />
    </Suspense>
  )
}
