import type { Language, Phase, RoomPublic, IsoDate } from './room.types'

export type Question = {
  id: string
  language: Language
  topic: string
  prompt: string
  code: string
  choices: string[]
}

export type QuestionWithAnswer = Question & { answer: number; explanation: string }

// null = กดข้าม
export type Answers = Record<string, number | null>

export type LanguageScore = { language: Language; correct: number; total: number }

export type PhaseState = {
  phase: Phase
  opensOn: IsoDate
  open: boolean
  submitted: boolean
  score: number | null
  total: number
  byLanguage: LanguageScore[] | null
}

export type Me = {
  trackingCode: string
  nickname: string
  room: RoomPublic
  phases: PhaseState[]
  group: { no: number; members: string[] } | null
  submittedPre: number
  target: number
  reviewOpen: boolean
}

export type Quiz = { phase: Phase; questions: Question[] }

export type SubmitResult = { score: number; total: number }

export type ReviewItem = QuestionWithAnswer & { mine: Partial<Record<Phase, number | null>> }
