export const modelConfigs = [
  {
    id: '01AI',
    name: 'Yi-Lightning',
    apiUrl: 'https://api.lingyiwanwu.com/v1/chat/completions',
    modelName: 'yi-lightning',
    requireKey: true,
    envKey: 'YI_API_KEY'
  },
  {
    id: 'deepseek',
    name: 'Deepseek-Chat',
    apiUrl: 'https://api.deepseek.com/chat/completions',
    modelName: 'deepseek-chat',
    requireKey: true,
    envKey: 'DEEPSEEK_API_KEY'
  },
  // 可在此添加更多预配置模型
];

export const defaultModel = '01AI'; 