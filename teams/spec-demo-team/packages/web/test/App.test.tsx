import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';

describe('App', () => {
  it('AC-5: 畫面上標示 DEMO', () => {
    render(<App send={vi.fn()} />);
    expect(screen.getByText('DEMO')).toBeInTheDocument();
  });

  it('AC-2: 送出問題後顯示 AI 回答', async () => {
    const send = vi.fn(async () => '這是一筆鏈上轉帳。');
    render(<App send={send} />);

    await userEvent.type(screen.getByLabelText('你的問題'), '這筆交易是什麼？');
    await userEvent.click(screen.getByRole('button', { name: '送出' }));

    expect(await screen.findByTestId('answer')).toHaveTextContent('這是一筆鏈上轉帳。');
    expect(send).toHaveBeenCalledWith('這筆交易是什麼？');
  });

  it('AC-3: 發生錯誤時顯示錯誤訊息', async () => {
    render(<App send={vi.fn(async () => { throw new Error('問題不可為空白'); })} />);
    await userEvent.type(screen.getByLabelText('你的問題'), 'x');
    await userEvent.click(screen.getByRole('button', { name: '送出' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('問題不可為空白');
  });
});
