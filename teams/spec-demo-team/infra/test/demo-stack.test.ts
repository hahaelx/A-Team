import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { DemoStack, type DemoStackProps } from '../lib/demo-stack.js';

const here = path.dirname(fileURLToPath(import.meta.url));

function synth(overrides: Partial<DemoStackProps> = {}) {
  const app = new App();
  const stack = new DemoStack(app, 'Test', {
    env: { account: '123456789012', region: 'ap-east-2' },
    stage: 'pr-1',
    bedrockRegion: 'ap-northeast-1',
    bedrockModelId: 'example.model-v1',
    webAssetPath: path.join(here, 'fixtures/web'),
    apiEntry: path.join(here, '../../packages/api/src/handler.ts'),
    ...overrides,
  });
  return Template.fromStack(stack);
}

const preview = synth();
const demo = synth({ stage: 'demo', basicAuth: 'dXNlcjpwYXNz' });

describe('DemoStack', () => {
  it('Lambda 使用 Node.js 22，並由設定注入 Bedrock region 與模型', () => {
    preview.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs22.x',
      Environment: {
        Variables: Match.objectLike({
          BEDROCK_REGION: 'ap-northeast-1',
          BEDROCK_MODEL_ID: 'example.model-v1',
          TABLE_NAME: Match.anyValue(),
        }),
      },
    });
  });

  it('Lambda 只有呼叫 Bedrock 模型的權限', () => {
    preview.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
            Effect: 'Allow',
          }),
        ]),
      },
    });
  });

  it('DynamoDB 使用 on-demand；預覽環境刪除 stack 時一併刪除，demo 環境保留', () => {
    preview.hasResource('AWS::DynamoDB::Table', {
      Properties: Match.objectLike({ BillingMode: 'PAY_PER_REQUEST' }),
      DeletionPolicy: 'Delete',
    });
    demo.hasResource('AWS::DynamoDB::Table', { DeletionPolicy: 'Retain' });
  });

  it('CloudFront 將 /api/* 轉到 API Gateway，且不快取', () => {
    preview.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        CacheBehaviors: Match.arrayWith([Match.objectLike({ PathPattern: '/api/*' })]),
      }),
    });
    preview.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
  });

  it('有設定 basicAuth 時才建立 Basic Auth 的 CloudFront Function', () => {
    preview.resourceCountIs('AWS::CloudFront::Function', 0);
    demo.resourceCountIs('AWS::CloudFront::Function', 1);
    const fn = Object.values(demo.findResources('AWS::CloudFront::Function'))[0];
    expect(fn.Properties.FunctionCode).toContain('Basic dXNlcjpwYXNz');
  });

  it('S3 bucket 封鎖公開存取，只允許 CloudFront 讀取', () => {
    preview.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it('輸出網站網址', () => {
    preview.hasOutput('SiteUrl', {});
  });
});
