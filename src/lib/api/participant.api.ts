import api from './instance'
import type { Answers, Me, Quiz, ReviewItem, SubmitResult } from '@/types/quiz.types'
import type { Phase, RoomPublic } from '@/types/room.types'
import type { HelpCreate, MyHelp } from '@/types/help.types'

export const lookupRoom = async (code: string) => api.post<RoomPublic>('/rooms/lookup', { code })

export const joinRoom = async (roomCode: string, nickname: string) => api.post<Me>('/participants', { roomCode, nickname })

export const resume = async (trackingCode: string) => api.post<Me>('/participants/resume', { trackingCode })

export const leave = async () => api.post<null>('/participants/leave')

export const getMe = async () => api.get<Me>('/me')

export const getQuiz = async (phase: Phase) => api.get<Quiz>(`/quiz/${phase}`)

export const submitQuiz = async (phase: Phase, answers: Answers) => api.post<SubmitResult>(`/quiz/${phase}`, { answers })

export const getReview = async () => api.get<ReviewItem[]>('/review')

export const getMyHelp = async () => api.get<MyHelp | null>('/help')

export const requestHelp = async (input: HelpCreate) => api.post<MyHelp>('/help', input)

export const cancelHelp = async () => api.post<MyHelp | null>('/help/cancel')
