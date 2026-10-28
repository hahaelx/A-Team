import { CfnOutput, Duration, Fn, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin, S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import type { Construct } from 'constructs';

export interface DemoStackProps extends StackProps {
  stage: string;
  bedrockRegion: string;
  bedrockModelId: string;
  /** base64(user:password)；設定後整個網站需要 Basic Auth */
  basicAuth?: string;
  webAssetPath: string;
  apiEntry: string;
}

// 參考架構：CloudFront →（S3 前端 | /api/* → API Gateway → Lambda → DynamoDB、Bedrock）
export class DemoStack extends Stack {
  constructor(scope: Construct, id: string, props: DemoStackProps) {
    super(scope, id, props);

    const isDemo = props.stage === 'demo';
    const removalPolicy = isDemo ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;

    const table = new Table(this, 'Conversations', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy,
    });

    const apiFn = new NodejsFunction(this, 'ApiFunction', {
      entry: props.apiEntry,
      handler: 'handler',
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      memorySize: 512,
      logGroup: new LogGroup(this, 'ApiLogs', { retention: RetentionDays.ONE_MONTH, removalPolicy }),
      environment: {
        TABLE_NAME: table.tableName,
        BEDROCK_REGION: props.bedrockRegion,
        BEDROCK_MODEL_ID: props.bedrockModelId,
        MAX_TOKENS: '512',
      },
      bundling: { minify: true, sourceMap: true },
    });
    table.grantWriteData(apiFn);

    // 跨區推論（inference profile）可能把請求路由到其他 region 的模型，因此 region 使用萬用字元。
    apiFn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: [
          'arn:aws:bedrock:*::foundation-model/*',
          `arn:aws:bedrock:*:${this.account}:inference-profile/*`,
          `arn:aws:bedrock:*:${this.account}:application-inference-profile/*`,
        ],
      }),
    );

    const api = new HttpApi(this, 'HttpApi');
    api.addRoutes({
      path: '/api/{proxy+}',
      methods: [HttpMethod.ANY],
      integration: new HttpLambdaIntegration('ApiIntegration', apiFn),
    });

    const siteBucket = new Bucket(this, 'SiteBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const functionAssociations = props.basicAuth
      ? [
          {
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            function: new cloudfront.Function(this, 'BasicAuth', {
              runtime: cloudfront.FunctionRuntime.JS_2_0,
              code: cloudfront.FunctionCode.fromInline(basicAuthCode(props.basicAuth)),
            }),
          },
        ]
      : undefined;

    const apiDomain = Fn.select(2, Fn.split('/', api.apiEndpoint));

    const distribution = new cloudfront.Distribution(this, 'Site', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new HttpOrigin(apiDomain),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          functionAssociations,
        },
      },
    });

    new BucketDeployment(this, 'DeploySite', {
      sources: [Source.asset(props.webAssetPath)],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    new CfnOutput(this, 'SiteUrl', { value: `https://${distribution.distributionDomainName}` });
    new CfnOutput(this, 'ApiEndpoint', { value: api.apiEndpoint });
  }
}

function basicAuthCode(credentials: string): string {
  return `function handler(event) {
  var auth = event.request.headers.authorization;
  if (!auth || auth.value !== 'Basic ${credentials}') {
    return {
      statusCode: 401,
      statusDescription: 'Unauthorized',
      headers: { 'www-authenticate': { value: 'Basic realm="demo"' } },
    };
  }
  return event.request;
}`;
}
