import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { describe, expect, it } from 'vitest';
import { saveExchange } from '../src/repository.js';

describe('saveExchange', () => {
  it('AC-4: 每次問答都寫入 DynamoDB', async () => {
    const ddb = mockClient(DynamoDBDocumentClient);
    ddb.on(PutCommand).resolves({});
    const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'ap-east-2' }));
    const record = { id: 'abc', createdAt: '2026-10-28T00:00:00.000Z', message: 'q', answer: 'a' };

    await saveExchange(doc, 'conversations', record);

    expect(ddb.commandCalls(PutCommand)[0].args[0].input).toEqual({ TableName: 'conversations', Item: record });
  });
});
