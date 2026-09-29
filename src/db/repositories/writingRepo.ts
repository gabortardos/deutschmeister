import { db } from '../dexie'
import type { WritingPiece } from '../types'

/**
 * M11.9 free-writing storage. Pieces live in the Dexie v2 `writingPieces`
 * table. Device-local for now: cloud sync would need its own Supabase
 * migration (writing_pieces) and ships with the next owner-SQL batch — see
 * ROADMAP M11.9. Pages never touch Dexie directly; this is the seam.
 */

/** Upsert — pieces are immutable after grading, so put() is enough. */
export async function savePiece(piece: WritingPiece): Promise<void> {
  await db.writingPieces.put(piece)
}

/** All pieces, newest first — quota math + the recent list (page slices). */
export async function allPieces(): Promise<WritingPiece[]> {
  const rows = await db.writingPieces.toArray()
  return rows.sort((a, b) => b.createdAt - a.createdAt)
}