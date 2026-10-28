import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendChat } from '../src/api';

afterEach(() => vi.unstubAllGlobals());

describe('sendChat', () => {
  it('POST /api/chat 並回傳答案', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: '1', answer: '你好' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendChat('hi')).resolves.toBe('你好');
    expect(fetchMock).toHaveBeenCalledWith('/api/chat', expect.objectContaining({ method: 'POST', body: JSON.stringify({ message: 'hi' }) }));
  });

  it('伺服器回傳錯誤時，拋出伺服器提供的錯誤訊息', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: '問題不可為空白' }), { status: 400 })));
    await expect(sendChat(' ')).rejects.toThrow('問題不可為空白');
  });

  it('伺服器沒有錯誤訊息時，使用預設訊息', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('oops', { status: 500 })));
    await expect(sendChat('hi')).rejects.toThrow('請求失敗（500）');
  });
});
