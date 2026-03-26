import { DataSource } from 'typeorm';

type DbStatus = {
  connected: boolean;
  type?: string;
  host?: string;
  port?: number | string;
  database?: string;
  username?: string;
  source?: 'url' | 'env' | 'unknown';
};

function safeString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

function parseUrl(
  url: string
): Pick<DbStatus, 'host' | 'port' | 'database' | 'username'> {
  try {
    const parsed = new URL(url);
    return {
      host: safeString(parsed.hostname),
      port: safeString(parsed.port),
      database: safeString(parsed.pathname.replace(/^\//, '')),
      username: safeString(parsed.username),
    };
  } catch {
    return {};
  }
}

export function getDbStatus(dataSource: DataSource): DbStatus {
  const options = dataSource?.options as unknown as
    | Record<string, unknown>
    | undefined;
  const type = safeString(options?.type);
  const url = safeString(options?.url);
  const host = safeString(options?.host);
  const port = safeString(options?.port);
  const database = safeString(options?.database);
  const username = safeString(options?.username);

  if (url) {
    const parsed = parseUrl(url);
    return {
      connected: Boolean(dataSource?.isInitialized),
      type,
      host: parsed.host ?? host,
      port: parsed.port ?? port,
      database: parsed.database ?? database,
      username: parsed.username ?? username,
      source: 'url',
    };
  }

  return {
    connected: Boolean(dataSource?.isInitialized),
    type,
    host,
    port,
    database,
    username,
    source: options ? 'env' : 'unknown',
  };
}

export function renderDbStatusBar(
  dataSource: DataSource,
  addresses: string[] = []
): {
  style: string;
  html: string;
} {
  const status = getDbStatus(dataSource);
  const stateText = status.connected ? 'Подключено' : 'Не подключено';
  const stateClass = status.connected ? 'ok' : 'err';
  const details = [
    status.type ? `тип: ${status.type}` : undefined,
    status.host ? `host: ${status.host}` : undefined,
    status.port ? `port: ${status.port}` : undefined,
    status.database ? `db: ${status.database}` : undefined,
    status.username ? `user: ${status.username}` : undefined,
    status.source ? `источник: ${status.source}` : undefined,
  ]
    .filter(Boolean)
    .join(' • ');
  const uniqueAddresses = Array.from(
    new Set(addresses.map((item) => item.trim()).filter(Boolean))
  );
  const addressesHtml = uniqueAddresses.length
    ? uniqueAddresses.map((addr) => `<a href="${addr}">${addr}</a>`).join(' • ')
    : 'не определены';

  return {
    style: `
      .db-bar {
        position: sticky;
        top: 0;
        z-index: 10;
        padding: 10px 16px;
        background: #f3f7ff;
        color: #1d2b4f;
        border-bottom: 1px solid #d9e3f5;
        font-family: "IBM Plex Sans", "Segoe UI", Arial, sans-serif;
        font-size: 13px;
        display: grid;
        gap: 6px;
      }
      .db-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 12px;
        align-items: center;
      }
      .db-bar .badge {
        padding: 4px 8px;
        border-radius: 999px;
        font-weight: 600;
        letter-spacing: 0.02em;
        background: #e3ecff;
      }
      .db-bar.ok .badge { background: #dff5e6; color: #1f6a37; }
      .db-bar.err .badge { background: #ffe3e3; color: #8a2b2b; }
      .db-bar .details { color: #4a5875; }
      .db-bar .addresses { color: #4a5875; font-size: 12.5px; }
      .db-bar .addresses a { color: inherit; text-decoration: none; }
      .db-bar .addresses a:hover { text-decoration: underline; }

      :root[data-theme="dark"] .db-bar {
        background: #0b1220;
        color: #e2e8f0;
        border-bottom-color: #1f2a44;
      }
      :root[data-theme="dark"] .db-bar .badge {
        background: #1b2437;
        color: #cbd5f5;
      }
      :root[data-theme="dark"] .db-bar.ok .badge {
        background: #163828;
        color: #bff1d0;
      }
      :root[data-theme="dark"] .db-bar.err .badge {
        background: #3b1f24;
        color: #f8c1c1;
      }
      :root[data-theme="dark"] .db-bar .details,
      :root[data-theme="dark"] .db-bar .addresses {
        color: #b6c2d9;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme]) .db-bar {
          background: #0b1220;
          color: #e2e8f0;
          border-bottom-color: #1f2a44;
        }
        :root:not([data-theme]) .db-bar .badge {
          background: #1b2437;
          color: #cbd5f5;
        }
        :root:not([data-theme]) .db-bar.ok .badge {
          background: #163828;
          color: #bff1d0;
        }
        :root:not([data-theme]) .db-bar.err .badge {
          background: #3b1f24;
          color: #f8c1c1;
        }
        :root:not([data-theme]) .db-bar .details,
        :root:not([data-theme]) .db-bar .addresses {
          color: #b6c2d9;
        }
      }
    `,
    html: `
      <div class="db-bar ${stateClass}">
        <div class="db-row">
          <span class="badge">DB: ${stateText}</span>
          <span class="details">${details || 'данные подключения недоступны'}</span>
        </div>
        <div class="db-row addresses">Адреса: ${addressesHtml}</div>
      </div>
    `,
  };
}
