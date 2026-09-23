import { describe, expect, it } from 'vitest'
import {
  SILENCE_COMMIT_MS,
  silenceElapsed,
  transition,
  type VoiceSessionState,
} from '../voiceSession'

const step = (events: Parameters<typeof transition>[1][]) => {
  let s: VoiceSessionState = 'idle'
  for (const e of events) s = transition(s, e)
  return s
}

describe('voiceSession transition', () => {
  it('walks the full hands-free loop: idle → listening → thinking → speaking → listening', () => {
    expect(step([{ type: 'START' }])).toBe('listening')
    expect(step([{ type: 'START' }, { type: 'UTTERANCE', text: 'Guten Tag' }])).toBe('thinking')
    expect(
      step([
        { type: 'START' },
        { type: 'UTTERANCE', text: 'Guten Tag' },
        { type: 'LLM_DONE' },
      ]),
    ).toBe('speaking')
    expect(
      step([
        { type: 'START' },
        { type: 'UTTERANCE', text: 'Guten Tag' },
        { type: 'LLM_DONE' },
        { type: 'TTS_DONE' },
      ]),
    ).toBe('listening')
  })

  it('loops: a second utterance after TTS re-enters thinking', () => {
    expect(
      step([
        { type: 'START' },
        { type: 'UTTERANCE', text: 'eins' },
        { type: 'LLM_DONE' },
        { type: 'TTS_DONE' },
        { type: 'UTTERANCE', text: 'zwei' },
      ]),
    ).toBe('thinking')
  })

  it('STOP returns to idle from every state', () => {
    for (const setup of [
      [{ type: 'START' }],
      [{ type: 'START' }, { type: 'UTTERANCE', text: 'x' }],
      [{ type: 'START' }, { type: 'UTTERANCE', text: 'x' }, { type: 'LLM_DONE' }],
    ] as Parameters<typeof transition>[1][][]) {
      expect(step([...setup, { type: 'STOP' }])).toBe('idle')
    }
  })

  it('ERROR returns to idle from every state', () => {
    expect(step([{ type: 'START' }, { type: 'ERROR' }])).toBe('idle')
    expect(step([{ type: 'START' }, { type: 'UTTERANCE', text: 'x' }, { type: 'ERROR' }])).toBe(
      'idle',
    )
  })

  it('ignores whitespace-only utterances (mic noise) while listening', () => {
    expect(step([{ type: 'START' }, { type: 'UTTERANCE', text: '   ' }])).toBe('listening')
    expect(step([{ type: 'START' }, { type: 'UTTERANCE', text: '' }])).toBe('listening')
  })

  it('ignores unexpected/late events instead of derailing', () => {
    // LLM_DONE while still listening (duplicate callback)
    expect(step([{ type: 'START' }, { type: 'LLM_DONE' }])).toBe('listening')
    // TTS_DONE while thinking (late cancel callback)
    expect(step([{ type: 'START' }, { type: 'UTTERANCE', text: 'x' }, { type: 'TTS_DONE' }])).toBe(
      'thinking',
    )
    // TTS_DONE after stop (late speechSynthesis callback after cancel)
    expect(
      step([
        { type: 'START' },
        { type: 'UTTERANCE', text: 'x' },
        { type: 'LLM_DONE' },
        { type: 'STOP' },
        { type: 'TTS_DONE' },
      ]),
    ).toBe('idle')
    // UTTERANCE while speaking (echo of our own TTS picked up by the mic)
    expect(
      step([
        { type: 'START' },
        { type: 'UTTERANCE', text: 'x' },
        { type: 'LLM_DONE' },
        { type: 'UTTERANCE', text: 'echo' },
      ]),
    ).toBe('speaking')
    // START while already running is a no-op
    expect(step([{ type: 'START' }, { type: 'START' }])).toBe('listening')
  })
})

describe('silenceElapsed', () => {
  it('commits exactly at the threshold, not before', () => {
    expect(silenceElapsed(1000, 1000 + SILENCE_COMMIT_MS - 1)).toBe(false)
    expect(silenceElapsed(1000, 1000 + SILENCE_COMMIT_MS)).toBe(true)
  })
})
