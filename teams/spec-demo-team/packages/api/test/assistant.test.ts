import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it } from 'vitest';
import { askAssistant, InputError, MAX_MESSAGE_LENGTH, SYSTEM_PROMPT } from '../src/assistant.js';

const bedrock = mockClient(BedrockRuntimeClient);
const client = new BedrockRuntimeClient({ region: 'ap-east-2' });
const cfg = { modelId: 'example.model-v1', maxTokens: 256 };

beforeEach(() => bedrock.reset());

describe('askAssistant', () => {
  it('AC-2: 透過 Bedrock Converse API 取得回答，並帶入系統提示與 token 上限', async () => {
    bedrock.on(ConverseCommand).resolves({
      output: { message: { role: 'assistant', content: [{ text: '這是一筆 ' }, { text: '鏈上轉帳。' }] } },
    });

    await expect(askAssistant(client, cfg, '  這筆交易是什麼？ ')).resolves.toBe('這是一筆 鏈上轉帳。');

    const input = bedrock.commandCalls(ConverseCommand)[0].args[0].input;
    expect(input.modelId).toBe('example.model-v1');
    expect(input.system).toEqual([{ text: SYSTEM_PROMPT }]);
    expect(input.messages).toEqual([{ role: 'user', content: [{ text: '這筆交易是什麼？' }] }]);
    expect(input.inferenceConfig?.maxTokens).toBe(256);
  });

  it('AC-3: 空白或過長的問題不會送到 Bedrock', async () => {
    await expect(askAssistant(client, cfg, '   ')).rejects.toBeInstanceOf(InputError);
    await expect(askAssistant(client, cfg, 'a'.repeat(MAX_MESSAGE_LENGTH + 1))).rejects.toBeInstanceOf(InputError);
    expect(bedrock.commandCalls(ConverseCommand)).toHaveLength(0);
  });

  it('Bedrock 沒有回傳文字時拋出錯誤', async () => {
    bedrock.on(ConverseCommand).resolves({ output: { message: { role: 'assistant', content: [] } } });
    await expect(askAssistant(client, cfg, 'hi')).rejects.toThrow('Bedrock 沒有回傳內容');
  });
});
