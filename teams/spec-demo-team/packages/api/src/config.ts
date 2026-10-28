export interface AppConfig {
  bedrockRegion: string;
  modelId: string;
  tableName: string;
  maxTokens: number;
}

type Env = Record<string, string | undefined>;

function required(env: Env, key: string): string {
  const value = env[key];
  if (!value) throw new Error(`缺少環境變數 ${key}`);
  return value;
}

// region 與模型一律由部署設定（CDK）注入，程式碼不寫死。
export function loadConfig(env: Env = process.env): AppConfig {
  const maxTokens = Number(env.MAX_TOKENS ?? '512');
  if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 4096) {
    throw new Error('MAX_TOKENS 必須是 1 到 4096 的整數');
  }
  return {
    bedrockRegion: required(env, 'BEDROCK_REGION'),
    modelId: required(env, 'BEDROCK_MODEL_ID'),
    tableName: required(env, 'TABLE_NAME'),
    maxTokens,
  };
}
