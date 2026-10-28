import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputError } from '../src/assistant.js';
import { createHandler, handler } from '../src/handler.js';

function event(method: string, path: string, body?: string): APIGatewayProxyEventV2 {
  return { rawPath: path, body, requestContext: { http: { method } } } as unknown as APIGatewayProxyEventV2;
}

function deps(overrides: Partial<Parameters<typeof createHandler>[0]> = {}) {
  return {
    ask: vi.fn(async () => '答案'),
    save: vi.fn(async () => undefined),
    now: () => new Date('2026-10-28T00:00:00.000Z'),
    newId: () => 'id-1',
    ...overrides,
  };
}

const json = (res: { body?: string }) => JSON.parse(res.body ?? '{}');

describe('createHandler', () => {
  it('AC-1: GET /api/health 回傳 ok', async () => {
    const res = await createHandler(deps())(event('GET', '/api/health'));
    expect(res.statusCode).toBe(200);
    expect(json(res)).toEqual({ status: 'ok' });
  });

  it('AC-2 / AC-4: POST /api/chat 回傳 AI 回答並保存紀錄', async () => {
    const d = deps();
    const res = await createHandler(d)(event('POST', '/api/chat', JSON.stringify({ message: '你好' })));
    expect(res.statusCode).toBe(200);
    expect(json(res)).toEqual({ id: 'id-1', answer: '答案' });
    expect(d.save).toHaveBeenCalledWith({
      id: 'id-1',
      createdAt: '2026-10-28T00:00:00.000Z',
      message: '你好',
      answer: '答案',
    });
  });

  it('AC-3: 格式錯誤或不合法的問題回傳 400', async () => {
    const h = createHandler(deps({ ask: vi.fn(async () => { throw new InputError('問題不可為空白'); }) }));
    expect((await h(event('POST', '/api/chat', '{bad json'))).statusCode).toBe(400);
    expect((await h(event('POST', '/api/chat', JSON.stringify({ message: 1 })))).statusCode).toBe(400);
    const res = await h(event('POST', '/api/chat', JSON.stringify({ message: ' ' })));
    expect(res.statusCode).toBe(400);
    expect(json(res).error).toBe('問題不可為空白');
  });

  it('AI 服務失敗時回傳 502，且不洩漏內部錯誤', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const h = createHandler(deps({ ask: vi.fn(async () => { throw new Error('AccessDenied arn:aws:...'); }) }));
    const res = await h(event('POST', '/api/chat', JSON.stringify({ message: 'hi' })));
    expect(res.statusCode).toBe(502);
    expect(json(res).error).toBe('AI 服務暫時無法使用');
  });

  it('未定義的路徑回傳 404', async () => {
    expect((await createHandler(deps())(event('GET', '/api/unknown'))).statusCode).toBe(404);
  });
});

describe('handler（Lambda 進入點）', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('使用環境變數建立 Bedrock 與 DynamoDB client', async () => {
    vi.stubEnv('BEDROCK_REGION', 'ap-east-2');
    vi.stubEnv('BEDROCK_MODEL_ID', 'example.model-v1');
    vi.stubEnv('TABLE_NAME', 'conversations');
    const bedrock = mockClient(BedrockRuntimeClient);
    const ddb = mockClient(DynamoDBDocumentClient);
    bedrock.on(ConverseCommand).resolves({ output: { message: { role: 'assistant', content: [{ text: 'ok' }] } } });
    ddb.on(PutCommand).resolves({});

    const res = await handler(event('POST', '/api/chat', JSON.stringify({ message: 'hi' })));

    expect(res.statusCode).toBe(200);
    expect(json(res).answer).toBe('ok');
    expect(ddb.commandCalls(PutCommand)[0].args[0].input.TableName).toBe('conversations');
  });
});
