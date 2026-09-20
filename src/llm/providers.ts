export type ProviderId = 'glm' | 'openai' | 'deepseek'

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
}

/**
 * Browser-CORS reality, verified 2026-09-20 with curl OPTIONS preflights from BOTH
 * https://gabortardos.github.io and http://localhost:5173 origins:
 *   - api.z.ai (coding AND pay-as-you-go endpoints) answers the preflight with 200 but
 *     sends NO access-control-allow-origin → every browser fetch fails ("Failed to fetch").
 *     z.ai keys — including GLM Coding Plan (Lite) keys — therefore CANNOT be used from
 *     this browser app at all. (The coding endpoint does work server-side: curl POST with
 *     model "glm-4.6" → 200 in ~1.3 s, served as the current flash model.)
 *   - open.bigmodel.cn (Zhipu's mainland platform) sends full CORS headers → the ONLY
 *     GLM endpoint usable from the browser. It needs a bigmodel.cn API key: z.ai keys
 *     are platform-specific and are rejected here (401).
 *   - api.openai.com and api.deepseek.com also send full CORS headers.
 * Model notes: "glm-4-flash" is retired (1211); "glm-5.3-flash" needs a paid balance
 * (1113); "glm-4.5-flash" is free-tier. The adapter sends thinking:{type:'disabled'}
 * for GLM (fast, cheap replies).
 */
export const PROVIDERS: readonly ProviderInfo[] = [
  {
    id: 'glm',
    label: 'Zhipu GLM (bigmodel.cn)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4.5-flash',
    modelSuggestions: ['glm-4.5-flash', 'glm-4.6', 'glm-4.7', 'glm-5.3', 'glm-5.3-flash'],
    keyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    note: 'Only browser-usable GLM endpoint (bigmodel.cn sends CORS headers; api.z.ai blocks browser apps entirely — GLM Coding Plan keys cannot be used here). Needs a bigmodel.cn API key. glm-4.5-flash is free-tier; glm-5.3-flash needs balance.',
    extraBody: { thinking: { type: 'disabled' } },
    altBaseUrls: ['https://api.z.ai/api/paas/v4', 'https://api.z.ai/api/coding/paas/v4'],
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
