export type ProviderId = 'glm-zai' | 'glm' | 'openai' | 'deepseek'

export interface ProviderInfo {
  id: ProviderId
  label: string
  baseUrl: string
  defaultModel: string
  modelSuggestions: string[]
  keyUrl: string
  note?: string
  /** Extra JSON body fields merged into every request (e.g. disabling GLM thinking mode). */
  extraBody?: Record<string, unknown>
  /** Other endpoints the same platform offers; Settings probes them on test failure. */
  altBaseUrls?: string[]
  /**
   * M8.2: baseUrl is a `relay:<route>` sentinel — calls go through the ai-proxy
   * Edge Function BYO relay (for providers that block browser apps, i.e. api.z.ai).
   * The adapter resolves the sentinel to the live function URL at call time.
   */
  relay?: boolean
  /**
   * M8.3: short per-model annotations shown in the Settings model picker, e.g.
   * "free tier" vs "needs account balance" — explains why a model 401/429s on a
   * fresh bigmodel.cn account before the user ever hits Test connection.
   */
  modelNotes?: Record<string, string>
}

/**
 * Browser-CORS reality, verified 2026-09-20, re-checked 2026-09-24 with curl OPTIONS
 * preflights from BOTH https://gabortardos.github.io and http://localhost:5173 origins:
 *   - api.z.ai (coding AND pay-as-you-go endpoints) answers the preflight with 200 but
 *     sends NO access-control-allow-origin → every browser fetch fails ("Failed to
 *     fetch"). z.ai keys — including GLM Coding Plan (Lite) keys — therefore CANNOT
 *     be used browser-direct. Since M8.2 the 'glm-zai' provider routes them through
 *     the ai-proxy Edge Function relay (server-side fetch has no CORS); the user's
 *     key is forwarded per request and never stored.
 *   - open.bigmodel.cn (Zhipu's mainland platform) sends full CORS headers → usable
 *     browser-direct with a bigmodel.cn API key (z.ai keys are rejected there, 401).
 *   - api.openai.com and api.deepseek.com also send full CORS headers.
 * Model notes: "glm-4-flash" is retired (1211); "glm-5.3-flash" needs a paid balance
 * (1113); "glm-4.5-flash" is free-tier on bigmodel.cn. The adapter sends
 * thinking:{type:'disabled'} for GLM (fast, cheap replies).
 */
export const PROVIDERS: readonly ProviderInfo[] = [
  {
    id: 'glm-zai',
    label: 'GLM via z.ai — Coding Plan (recommended)',
    baseUrl: 'relay:zai-coding',
    defaultModel: 'glm-4.6',
    modelSuggestions: ['glm-4.6', 'glm-4.5-air'],
    modelNotes: {
      'glm-4.6': 'included in the Coding Plan',
      'glm-4.5-air': 'included in the Coding Plan',
    },
    keyUrl: 'https://z.ai/manage/apikey',
    note: 'For z.ai keys — GLM Coding Plan (Lite) included, no Chinese account needed. api.z.ai blocks browser apps (no CORS), so calls are relayed through the DeutschMeister server function: your key is forwarded for this request only and never stored. The endpoint is managed automatically — there is no base URL to paste.',
    extraBody: { thinking: { type: 'disabled' } },
    relay: true,
    altBaseUrls: ['relay:zai-api'],
  },
  {
    id: 'glm',
    label: 'GLM via bigmodel.cn (mainland)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4.5-flash',
    modelSuggestions: ['glm-4.5-flash', 'glm-4.6', 'glm-4.7', 'glm-5.3', 'glm-5.3-flash'],
    modelNotes: {
      'glm-4.5-flash': 'free tier — works without balance',
      'glm-4.6': 'needs account balance',
      'glm-4.7': 'needs account balance',
      'glm-5.3': 'flagship — needs account balance',
      'glm-5.3-flash': 'needs account balance',
    },
    keyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    note: 'Browser-direct via bigmodel.cn (full CORS). Needs a bigmodel.cn API key — z.ai keys are rejected here; z.ai / GLM Coding Plan keys belong to the “GLM via z.ai” provider above. Only glm-4.5-flash is free; other models require balance (and real-name verification) on your bigmodel.cn account.',
    extraBody: { thinking: { type: 'disabled' } },
  },
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    modelSuggestions: ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4o'],
    keyUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    modelSuggestions: ['deepseek-chat', 'deepseek-reasoner'],
    keyUrl: 'https://platform.deepseek.com/api_keys',
  },
] as const

export function getProvider(id: ProviderId): ProviderInfo {
  const found = PROVIDERS.find((p) => p.id === id)
  if (!found) throw new Error(`Unknown provider: ${id}`)
  return found
}
