// Tells the portfolio site's CRM what our API calls used, so the "API keys"
// page can show spend and budgets. Entirely optional: with CRM_URL or
// CRM_TOKEN unset, nothing is sent. Failures are ignored, because a hiccup
// in reporting must never break a search.
//
// Calls are added up in memory and sent about once a minute.

type Pending = { key: string; model: string; calls: number; input: number; output: number };
const pending = new Map<string, Pending>();

const KEY_LABELS: Record<string, string> = {
  anthropic: process.env.CRM_KEY_ANTHROPIC || 'anthropic-main',
  tmdb: process.env.CRM_KEY_TMDB || 'tmdb',
};

export function recordUsage(provider: 'anthropic' | 'tmdb', model: string, input = 0, output = 0) {
  if (!process.env.CRM_URL || !process.env.CRM_TOKEN) return;
  const key = KEY_LABELS[provider];
  const id = `${key}|${model}`;
  const row = pending.get(id) ?? { key, model, calls: 0, input: 0, output: 0 };
  row.calls += 1;
  row.input += input;
  row.output += output;
  pending.set(id, row);
}

export async function flushUsage(): Promise<void> {
  const url = process.env.CRM_URL;
  const token = process.env.CRM_TOKEN;
  if (!url || !token || pending.size === 0) return;
  const rows = [...pending.values()];
  pending.clear();
  for (const r of rows) {
    try {
      const res = await fetch(`${url.replace(/\/+$/, '')}/api/usage`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: r.key,
          product: process.env.CRM_PRODUCT || 'smart-tv-search',
          model: r.model,
          calls: r.calls,
          input_tokens: r.input,
          output_tokens: r.output,
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) console.warn(`Usage report for ${r.key} was refused (${res.status})`);
    } catch {
      /* ignore: reporting is best-effort */
    }
  }
}

setInterval(() => void flushUsage(), 60_000).unref();
