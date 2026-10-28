import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

export interface Exchange {
  id: string;
  createdAt: string;
  message: string;
  answer: string;
}

export async function saveExchange(doc: DynamoDBDocumentClient, tableName: string, record: Exchange): Promise<void> {
  await doc.send(new PutCommand({ TableName: tableName, Item: record }));
}
