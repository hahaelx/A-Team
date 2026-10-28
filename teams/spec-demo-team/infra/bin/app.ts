import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { App } from 'aws-cdk-lib';
import { resolveConfig } from '../lib/config.js';
import { DemoStack } from '../lib/demo-stack.js';
import { GithubOidcStack } from '../lib/github-oidc-stack.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = new App();
const read = (key: string) => app.node.tryGetContext(key);
const account = process.env.CDK_DEFAULT_ACCOUNT;

// 一次性：npx cdk deploy SpecDemoGithubOidc -c githubRepo=owner/repo
const githubRepo = read('githubRepo');
if (githubRepo) {
  new GithubOidcStack(app, 'SpecDemoGithubOidc', {
    env: { account, region: read('appRegion') ?? 'ap-east-2' },
    githubRepo,
    existingProviderArn: read('existingOidcProviderArn') || undefined,
  });
} else {
  const cfg = resolveConfig(read);
  new DemoStack(app, `SpecDemo-${cfg.stage}`, {
    env: { account, region: cfg.appRegion },
    stage: cfg.stage,
    bedrockRegion: cfg.bedrockRegion,
    bedrockModelId: cfg.bedrockModelId,
    basicAuth: cfg.basicAuth,
    webAssetPath: path.join(here, '../../packages/web/dist'),
    apiEntry: path.join(here, '../../packages/api/src/handler.ts'),
    tags: { project: 'spec-demo', stage: cfg.stage },
  });
}
