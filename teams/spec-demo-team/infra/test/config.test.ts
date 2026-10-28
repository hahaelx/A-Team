import { describe, expect, it } from 'vitest';
import { resolveConfig } from '../lib/config.js';

const ctx = (values: Record<string, string | undefined>) => (key: string) => values[key];
const base = { appRegion: 'ap-east-2', bedrockRegion: 'ap-east-2', bedrockModelId: 'example.model-v1', stage: 'pr-12' };

describe('resolveConfig', () => {
  it('讀取 CDK context，預設應用 region 為台北 ap-east-2', () => {
    expect(resolveConfig(ctx({ ...base, appRegion: undefined }))).toEqual({
      stage: 'pr-12',
      appRegion: 'ap-east-2',
      bedrockRegion: 'ap-east-2',
      bedrockModelId: 'example.model-v1',
      basicAuth: undefined,
      githubRepo: undefined,
    });
  });

  it('Bedrock 可以使用與應用程式不同的 region（台北沒有的模型改用東京）', () => {
    const cfg = resolveConfig(ctx({ ...base, bedrockRegion: 'ap-northeast-1' }));
    expect(cfg.appRegion).toBe('ap-east-2');
    expect(cfg.bedrockRegion).toBe('ap-northeast-1');
  });

  it('bedrockRegion 未設定時沿用 appRegion', () => {
    expect(resolveConfig(ctx({ ...base, bedrockRegion: '' })).bedrockRegion).toBe('ap-east-2');
  });

  it('缺少 Bedrock 模型 ID 時拒絕部署', () => {
    expect(() => resolveConfig(ctx({ ...base, bedrockModelId: '' }))).toThrow('bedrockModelId');
  });

  it('stage 只能使用小寫英數與連字號', () => {
    expect(() => resolveConfig(ctx({ ...base, stage: 'PR_12' }))).toThrow('stage');
    expect(resolveConfig(ctx({ ...base, stage: undefined })).stage).toBe('dev');
  });

  it('讀取選用的 basicAuth 與 githubRepo', () => {
    const cfg = resolveConfig(ctx({ ...base, basicAuth: 'dXNlcjpwYXNz', githubRepo: 'org/repo' }));
    expect(cfg.basicAuth).toBe('dXNlcjpwYXNz');
    expect(cfg.githubRepo).toBe('org/repo');
  });
});
