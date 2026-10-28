export async function sendChat(message: string): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  const data = (await res.json().catch(() => ({}))) as { answer?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? `請求失敗（${res.status}）`);
  return data.answer ?? '';
}
