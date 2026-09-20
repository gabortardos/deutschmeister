/**
 * Defensive JSON extraction: models sometimes wrap JSON in prose or code fences.
 * Returns the parsed value, or null when no valid JSON object is found.
 */
export function extractJsonObject(text: string): unknown | null {
  if (!text) return null
  let trimmed = text.trim()

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  const fence = trimmed.match(/^```[a-zA-Z]*\s*([\s\S]*?)\s*```$/)
  if (fence) trimmed = fence[1].trim()

  // Fast path: the whole thing is valid JSON
  try {
    return JSON.parse(trimmed)
  } catch {
    // fall through
  }

  // Slow path: find the outermost { ... } block
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(trimmed.slice(start, end + 1))
  } catch {
    return null
  }
}
