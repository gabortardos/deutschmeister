export type ProviderId = 'glm' | 'openai' | 'deepseek'

export interface ProviderInfo {
  id: ProviderId
  label: string
  baseUrl: string
  defaultModel: string
  modelSuggestions: string[]
  keyUrl: string
  note?: string
}

export const PROVIDERS: readonly ProviderInfo[] = [
  {
    id: 'glm',
    label: 'Zhipu GLM',
    baseUrl: 'https://api.z.ai/api/paas/v4',
    defaultModel: 'glm-4-flash',
    modelSuggestions: ['glm-4-flash', 'glm-5.3-flash', 'glm-5.3', 'glm-5.2'],
    keyUrl: 'https://z.ai',
    note: 'Keys from the international Z.AI platform use this base. BigModel.cn keys: https://open.bigmodel.cn/api/paas/v4. GLM Coding Plan (Lite) keys: https://api.z.ai/api/coding/paas/v4',
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
