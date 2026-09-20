import { db } from '../dexie'
import type { ConversationMistake, ConversationSession, ConversationTurn } from '../types'
import { newId } from '../../utils/id'

export async function startSession(scenarioId: string): Promise<ConversationSession> {
  const session: ConversationSession = {
    id: newId(),
    updatedAt: Date.now(),
    scenarioId,
    startedAt: Date.now(),
    endedAt: null,
    summary: null,
  }
  await db.conversationSessions.put(session)
  return session
}

export interface AddTurnInput {
  role: 'user' | 'tutor'
  text: string
  mistakes?: ConversationMistake[] | null
  translation?: string | null
  assisted?: boolean
}

export async function addTurn(sessionId: string, input: AddTurnInput): Promise<ConversationTurn> {
  const turn: ConversationTurn = {
    id: newId(),
    updatedAt: Date.now(),
    sessionId,
    role: input.role,
    text: input.text,
    mistakes: input.mistakes ?? null,
    translation: input.translation ?? null,
    ...(input.assisted === true ? { assisted: true } : {}),
  }
  await db.conversationTurns.put(turn)
  return turn
}

export async function endSession(sessionId: string, summary: string): Promise<void> {
  await db.conversationSessions.update(sessionId, {
    endedAt: Date.now(),
    summary,
    updatedAt: Date.now(),
  })
}

export async function recentSessions(limit = 8): Promise<ConversationSession[]> {
  const sessions = await db.conversationSessions.toArray()
  return sessions.sort((a, b) => b.startedAt - a.startedAt).slice(0, limit)
}

/** All turns of one session, oldest first. */
export async function getSessionTurns(sessionId: string): Promise<ConversationTurn[]> {
  const turns = await db.conversationTurns.where('sessionId').equals(sessionId).toArray()
  return turns.sort((a, b) => a.updatedAt - b.updatedAt)
}
