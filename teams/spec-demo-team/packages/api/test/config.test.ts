import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

const base = {
  BEDROCK_REGION: 'ap-east-2',
  BEDROCK_MODEL_ID: 'example.model-v1',
  TABLE_NAME: 'conversations',
};

describe('loadConfig', () => {
  it('從環境變數讀取設定，MAX_TOKENS 預設 512', () => {
    expect(loadConfig(base)).toEqual({
      bedrockRegion: 'ap-east-2',
      modelId: 'example.model-v1',
      tableName: 'conversations',
      maxTokens: 512,
    });
  });

  it('缺少必要設定時拋出錯誤，不使用寫死的預設 region 或模型', () => {
    expect(() => loadConfig({ ...base, BEDROCK_REGION: '' })).toThrow('BEDROCK_REGION');
    expect(() => loadConfig({ ...base, BEDROCK_MODEL_ID: undefined })).toThrow('BEDROCK_MODEL_ID');
    expect(() => loadConfig({ ...base, TABLE_NAME: undefined })).toThrow('TABLE_NAME');
  });

  it('MAX_TOKENS 必須是 1 到 4096 的整數', () => {
    expect(loadConfig({ ...base, MAX_TOKENS: '1024' }).maxTokens).toBe(1024);
    expect(() => loadConfig({ ...base, MAX_TOKENS: '0' })).toThrow('MAX_TOKENS');
    expect(() => loadConfig({ ...base, MAX_TOKENS: '99999' })).toThrow('MAX_TOKENS');
    expect(() => loadConfig({ ...base, MAX_TOKENS: 'abc' })).toThrow('MAX_TOKENS');
  });
});
