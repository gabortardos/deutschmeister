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
 * GLM defaults were LIVE-VERIFIED (2026-09-20) with a real GLM Coding Plan (Lite) key:
 *   POST https://api.z.ai/api/coding/paas/v4/chat/completions
 *   model "glm-4.6" (the endpoint serves it as the current glm-5.3-flash) → 200 OK in ~1.3 s.
 * Findings from the same live test: "glm-4-flash" is retired (code 1211 Unknown Model);
 * "glm-5.3-flash" on the standard endpoints requires account balance (code 1113).
 * The standard pay-as-you-go endpoints are https://api.z.ai/api/paas/v4 (international)
 * and https://open.bigmodel.cn/api/paas/v4 (China) — both remain supported by editing
 * the base URL in Settings.
 */
export const PROVIDERS: readonly ProviderInfo[] = [
  {
    id: 'glm',
    label: 'Zhipu GLM (Coding Plan)',
    baseUrl: 'https://api.z.ai/api/coding/paas/v4',
    defaultModel: 'glm-4.6',
    modelSuggestions: ['glm-4.6', 'glm-5.3', 'glm-4.5-flash'],
    keyUrl: 'https://z.ai',
    note: 'Default: GLM Coding Plan endpoint (works with Lite-plan keys). Pay-as-you-go keys instead use https://api.z.ai/api/paas/v4 or https://open.bigmodel.cn/api/paas/v4. Note: glm-4-flash is retired; glm-5.3-flash needs a paid balance on standard endpoints.',
    extraBody: { thinking: { type: 'disabled' } },
    altBaseUrls: ['https://api.z.ai/api/paas/v4', 'https://open.bigmodel.cn/api/paas/v4'],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    modelSuggestions: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
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
