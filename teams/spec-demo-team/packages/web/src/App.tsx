import { useState, type FormEvent } from 'react';
import { sendChat } from './api';

interface AppProps {
  send?: (message: string) => Promise<string>;
}

export function App({ send = sendChat }: AppProps) {
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnswer('');
    try {
      setAnswer(await send(message));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: '40px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ display: 'inline-block', background: '#b91c1c', color: '#fff', padding: '2px 8px', borderRadius: 4 }}>DEMO</p>
      <h1>AI 交易說明助理</h1>
      <form onSubmit={onSubmit}>
        <label htmlFor="message">你的問題</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          style={{ display: 'block', width: '100%', margin: '8px 0' }}
        />
        <button type="submit" disabled={loading}>
          {loading ? '處理中…' : '送出'}
        </button>
      </form>
      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      {answer && <p data-testid="answer" style={{ whiteSpace: 'pre-wrap' }}>{answer}</p>}
    </main>
  );
}
