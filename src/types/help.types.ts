export const HELP_TOPICS = ['content', 'code', 'app', 'talk'] as const
export type HelpTopic = (typeof HELP_TOPICS)[number]

export const HELP_PLACES = ['table', 'online'] as const
export type HelpPlace = (typeof HELP_PLACES)[number]

export type HelpStatus = 'waiting' | 'helping' | 'done' | 'cancelled'

export type HelpRequest = {
  id: string
  nickname: string
  groupNo: number | null
  topic: HelpTopic
  message: string
  place: HelpPlace
  status: HelpStatus
  claimedBy: string | null
  createdAt: string
  claimedAt: string | null
  doneAt: string | null
}

// ฝั่งผู้เข้าร่วมเห็นลำดับคิวด้วย
export type MyHelp = HelpRequest & { position: number | null; staffOnline: number }

export type HelpCreate = { topic: HelpTopic; message: string; place: HelpPlace }
