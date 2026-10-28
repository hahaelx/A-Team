export interface InfraConfig {
  stage: string;
  appRegion: string;
  bedrockRegion: string;
  bedrockModelId: string;
  basicAuth?: string;
  githubRepo?: string;
}

type ContextReader = (key: string) => unknown;

function str(read: ContextReader, key: string): string | undefined {
  const value = read(key);
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

// 部署設定一律來自 CDK context（cdk.json 預設值，或 `-c key=value` 覆寫）。
export function resolveConfig(read: ContextReader): InfraConfig {
  const stage = str(read, 'stage') ?? 'dev';
  if (!/^[a-z0-9-]{1,20}$/.test(stage)) {
    throw new Error(`stage 只能使用小寫英數與連字號（最多 20 字）：${stage}`);
  }
  const appRegion = str(read, 'appRegion') ?? 'ap-east-2';
  const bedrockModelId = str(read, 'bedrockModelId');
  if (!bedrockModelId) {
    throw new Error('缺少 bedrockModelId：請用 scripts/check-region.sh 查詢可用模型，再以 -c bedrockModelId=... 指定');
  }
  return {
    stage,
    appRegion,
    bedrockRegion: str(read, 'bedrockRegion') ?? appRegion,
    bedrockModelId,
    basicAuth: str(read, 'basicAuth'),
    githubRepo: str(read, 'githubRepo'),
  };
}
