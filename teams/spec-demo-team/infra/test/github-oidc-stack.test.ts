import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, it } from 'vitest';
import { GithubOidcStack } from '../lib/github-oidc-stack.js';

const env = { account: '123456789012', region: 'ap-east-2' };

describe('GithubOidcStack', () => {
  it('只允許指定 repo 的 GitHub Actions 取得部署角色（不使用長期 Access Key）', () => {
    const t = Template.fromStack(new GithubOidcStack(new App(), 'Oidc', { env, githubRepo: 'org/repo' }));
    t.resourceCountIs('Custom::AWSCDKOpenIdConnectProvider', 1);
    t.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          Match.objectLike({
            Action: 'sts:AssumeRoleWithWebIdentity',
            Condition: {
              StringEquals: { 'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com' },
              StringLike: { 'token.actions.githubusercontent.com:sub': 'repo:org/repo:*' },
            },
          }),
        ],
      },
    });
  });

  it('部署角色只能 assume CDK bootstrap 角色', () => {
    const t = Template.fromStack(new GithubOidcStack(new App(), 'Oidc', { env, githubRepo: 'org/repo' }));
    t.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [Match.objectLike({ Action: 'sts:AssumeRole', Resource: 'arn:aws:iam::123456789012:role/cdk-*' })],
      },
    });
  });

  it('帳號已有 GitHub OIDC provider 時沿用，不重複建立', () => {
    const t = Template.fromStack(
      new GithubOidcStack(new App(), 'Oidc', {
        env,
        githubRepo: 'org/repo',
        existingProviderArn: 'arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com',
      }),
    );
    t.resourceCountIs('Custom::AWSCDKOpenIdConnectProvider', 0);
  });
});
