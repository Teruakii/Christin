import api from './instance'
import type { HelpRequest } from '@/types/help.types'
import type { RoomCreated, RoomSettings, RoomUpsert, TeamCreated } from '@/types/room.types'
import type { RoomPublic } from '@/types/room.types'
import type { AnswerKeyItem, GroupsView, Overview, Results, RoomSummary, StaffMe } from '@/types/staff.types'

export type HelpQueue = { requests: HelpRequest[]; staffOnline: number }

export const createRoom = async (input: RoomUpsert) => api.post<RoomCreated>('/staff/rooms', input)

export const createTeam = async () => api.post<TeamCreated>('/staff/teams')

export const resetTeamCode = async () => api.post<TeamCreated>('/staff/teams/reset-code')

export const listRooms = async () => api.get<RoomSummary[]>('/staff/rooms')

export const switchRoom = async (code: string) => api.post<StaffMe>(`/staff/rooms/${code}/switch`)

export const deleteRoom = async (code: string) => api.delete<{ current: RoomPublic | null }>(`/staff/rooms/${code}`)

export const login = async (staffCode: string) => api.post<StaffMe>('/staff/session', { staffCode })

export const logout = async () => api.delete<null>('/staff/session')

export const getStaffMe = async () => api.get<StaffMe>('/staff/session')

export const getSettings = async () => api.get<RoomSettings>('/staff/room')

export const updateSettings = async (input: RoomUpsert) => api.put<RoomSettings>('/staff/room', input)

export const getOverview = async () => api.get<Overview>('/staff/overview')

export const getGroups = async () => api.get<GroupsView>('/staff/groups')

export const generateGroups = async (groupSize: number) => api.post<GroupsView>('/staff/groups/generate', { groupSize })

export const announceGroups = async () => api.post<GroupsView>('/staff/groups/announce')

export const deleteGroup = async (groupNo: number) => api.post<GroupsView>('/staff/groups/delete', { groupNo })

export const clearGroups = async () => api.post<GroupsView>('/staff/groups/clear')

export const moveMember = async (participantId: string, groupNo: number) =>
  api.post<GroupsView>('/staff/groups/move', { participantId, groupNo })

export const getHelpQueue = async () => api.get<HelpQueue>('/staff/help')

export const helpAction = async (id: string, action: 'claim' | 'done' | 'release') =>
  api.post<HelpQueue>(`/staff/help/${id}/${action}`)

export const getResults = async () => api.get<Results>('/staff/results')

export const getAnswerKey = async () => api.get<AnswerKeyItem[]>('/staff/answers')

export const RESULTS_CSV_URL = '/api/staff/results/csv'
