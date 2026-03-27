type LibreLanguage = { code?: string };

type LibreTranslateConfig = {
  baseUrl: string;
  timeoutMs: number;
};

const DEFAULT_BASE_URL =
  process.env.LIBRETRANSLATE_URL ?? 'http://100.68.40.69:5000';
const DEFAULT_TIMEOUT_MS = Number(
  process.env.LIBRETRANSLATE_TIMEOUT_MS ?? 90000
);

function getConfig(): LibreTranslateConfig {
  return {
    baseUrl: DEFAULT_BASE_URL.replace(/\/$/, ''),
    timeoutMs:
      Number.isFinite(DEFAULT_TIMEOUT_MS) && DEFAULT_TIMEOUT_MS > 0
        ? DEFAULT_TIMEOUT_MS
        : 8000,
  };
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  timeoutMs?: number
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? 8000);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(
        `LibreTranslate error ${res.status}: ${text || res.statusText}`
      );
    }
    return (await res.json()) as T;
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      'name' in err &&
      err.name === 'AbortError'
    ) {
      throw new Error('LibreTranslate timeout');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function getLibreLanguages(): Promise<string[]> {
  const { baseUrl, timeoutMs } = getConfig();
  const items = await fetchJson<LibreLanguage[]>(
    `${baseUrl}/languages`,
    undefined,
    timeoutMs
  );
  const codes = items
    .map((item) => String(item.code || '').trim())
    .filter(Boolean);
  return Array.from(new Set(codes));
}

export async function translateText(
  text: string,
  source: string,
  target: string
): Promise<string> {
  const { baseUrl, timeoutMs } = getConfig();
  const payload = {
    q: text,
    source,
    target,
    format: 'text',
  };
  const data = await fetchJson<{ translatedText?: string }>(
    `${baseUrl}/translate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    timeoutMs
  );
  if (!data.translatedText) {
    throw new Error('LibreTranslate returned empty translation');
  }
  return data.translatedText;
}
