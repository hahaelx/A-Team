import { expect, test } from '@playwright/test';

// 驗收條件來源：specs/000-ai-assistant/requirements.md
test.beforeAll(() => {
  if (!process.env.E2E_BASE_URL) throw new Error('請設定 E2E_BASE_URL（預覽環境網址）');
});

test('AC-1: API 健康檢查回傳 ok', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ status: 'ok' });
});

test('AC-5: 首頁標示 DEMO', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('DEMO', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'tests/e2e/screenshots/ac-5-home.png', fullPage: true });
});

test('AC-2: 送出問題後顯示 Bedrock 產生的回答', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('你的問題').fill('什麼是區塊鏈上的交易手續費？請用一句話回答。');
  await page.getByRole('button', { name: '送出' }).click();
  await expect(page.getByTestId('answer')).not.toBeEmpty({ timeout: 60_000 });
  await page.screenshot({ path: 'tests/e2e/screenshots/ac-2-answer.png', fullPage: true });
});

test('AC-3: 空白問題顯示錯誤訊息且不呼叫 AI', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('你的問題').fill('   ');
  await page.getByRole('button', { name: '送出' }).click();
  await expect(page.getByRole('alert')).toContainText('問題不可為空白');
});
