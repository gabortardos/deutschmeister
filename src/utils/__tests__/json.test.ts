import { describe, expect, it } from 'vitest'
import { extractJsonObject } from '../json'

describe('extractJsonObject', () => {
  it('parses a plain JSON object', () => {
    expect(extractJsonObject('{"a":1}')).toEqual({ a: 1 })
  })

  it('parses JSON wrapped in a code fence with language tag', () => {
    expect(extractJsonObject('```json\n{"reply":"Hallo"}\n```')).toEqual({ reply: 'Hallo' })
  })

  it('parses JSON wrapped in a bare code fence', () => {
    expect(extractJsonObject('```\n{"x":true}\n```')).toEqual({ x: true })
  })

  it('extracts JSON embedded in prose', () => {
    expect(extractJsonObject('Sure! Here is the result: {"ok":true} hope that helps')).toEqual({ ok: true })
  })

  it('returns null for garbage', () => {
    expect(extractJsonObject('no json here')).toBeNull()
    expect(extractJsonObject('')).toBeNull()
    expect(extractJsonObject('{broken')).toBeNull()
  })

  it('handles arrays at top level', () => {
    expect(extractJsonObject('[1,2,3]')).toEqual([1, 2, 3])
  })
})
