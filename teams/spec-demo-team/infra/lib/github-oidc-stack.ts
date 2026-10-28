import { CfnOutput, Duration, Stack, type StackProps } from 'aws-cdk-lib';
import {
  type IOpenIdConnectProvider,
  OpenIdConnectProvider,
  PolicyStatement,
  Role,
  WebIdentityPrincipal,
} from 'aws-cdk-lib/aws-iam';
import type { Construct } from 'constructs';

export interface GithubOidcStackProps extends StackProps {
  /** owner/repo */
  githubRepo: string;
  /** 帳號裡已經有 GitHub OIDC provider 時傳入其 ARN */
  existingProviderArn?: string;
}

const GITHUB_OIDC_HOST = 'token.actions.githubusercontent.com';

// 一次性設定：讓 GitHub Actions 以 OIDC 取得短期憑證部署 CDK。
export class GithubOidcStack extends Stack {
  constructor(scope: Construct, id: string, props: GithubOidcStackProps) {
    super(scope, id, props);

    const provider: IOpenIdConnectProvider = props.existingProviderArn
      ? OpenIdConnectProvider.fromOpenIdConnectProviderArn(this, 'GithubProvider', props.existingProviderArn)
      : new OpenIdConnectProvider(this, 'GithubProvider', {
          url: `https://${GITHUB_OIDC_HOST}`,
          clientIds: ['sts.amazonaws.com'],
        });

    const role = new Role(this, 'DeployRole', {
      description: `GitHub Actions deploy role for ${props.githubRepo}`,
      maxSessionDuration: Duration.hours(1),
      assumedBy: new WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: { [`${GITHUB_OIDC_HOST}:aud`]: 'sts.amazonaws.com' },
        StringLike: { [`${GITHUB_OIDC_HOST}:sub`]: `repo:${props.githubRepo}:*` },
      }),
    });

    // 實際建立資源由 CDK bootstrap 的 deploy／file-publishing 角色執行。
    role.addToPolicy(
      new PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
      }),
    );

    new CfnOutput(this, 'DeployRoleArn', { value: role.roleArn });
  }
}
