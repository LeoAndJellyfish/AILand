export const modelConfigs = [
  {
    id: 'qwen-2.5',// 内部标识，用于区分不同模型，需要保证唯一
    name: 'qwen-2.5',// 模型名称，用于显示在界面上
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    modelName: 'qwen/qwen-2.5-72b-instruct:free',
    requireKey: true,
    envKey: 'OPENROUTER_API_KEY'
  },
  {
    id: 'deepseek-v3-0324',
    name: 'deepseek-v3-0324',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    modelName: 'deepseek/deepseek-chat-v3-0324:free',
    requireKey: true,
    envKey: 'OPENROUTER_API_KEY'
  },
  // 可在此添加更多预配置模型
];

export const defaultModel = 'deepseek-v3-0324'; 