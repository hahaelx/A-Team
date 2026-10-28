import { randomUUID } from 'node:crypto';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { askAssistant, InputError } from './assistant.js';
import { loadConfig } from './config.js';
import { saveExchange, type Exchange } from './repository.js';

export interface HandlerDeps {
  ask: (message: string) => Promise<string>;
  save: (record: Exchange) => Promise<void>;
  now: () => Date;
  newId: () => string;
}

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>;

const respond = (statusCode: number, body: unknown): APIGatewayProxyStructuredResultV2 => ({
  statusCode,
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});

function parseMessage(body: string | undefined): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body ?? '');
  } catch {
    throw new InputError('Request body 必須是 JSON');
  }
  const message = (parsed as { message?: unknown })?.message;
  if (typeof message !== 'string') throw new InputError('message 必須是字串');
  return message;
}

export function createHandler(deps: HandlerDeps): Handler {
  return async (event) => {
    const route = `${event.requestContext.http.method} ${event.rawPath}`;

    if (route === 'GET /api/health') return respond(200, { status: 'ok' });

    if (route === 'POST /api/chat') {
      try {
        const message = parseMessage(event.body);
        const answer = await deps.ask(message);
        const record = { id: deps.newId(), createdAt: deps.now().toISOString(), message: message.trim(), answer };
        await deps.save(record);
        return respond(200, { id: record.id, answer });
      } catch (err) {
        if (err instanceof InputError) return respond(400, { error: err.message });
        console.error('chat failed', err);
        return respond(502, { error: 'AI 服務暫時無法使用' });
      }
    }

    return respond(404, { error: 'Not Found' });
  };
}

function createDefaultHandler(): Handler {
  const cfg = loadConfig();
  const bedrock = new BedrockRuntimeClient({ region: cfg.bedrockRegion });
  const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  return createHandler({
    ask: (message) => askAssistant(bedrock, cfg, message),
    save: (record) => saveExchange(doc, cfg.tableName, record),
    now: () => new Date(),
    newId: randomUUID,
  });
}

let cached: Handler | undefined;

export const handler: Handler = (event) => (cached ??= createDefaultHandler())(event);
