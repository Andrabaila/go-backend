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

const STATUS_RELEASE = {
  version: '1.4.2',
  deployedAt: '2026-04-24 14:37 UTC',
  commit: 'a1b2c3d',
} as const;

const PREFERRED_ADDRESSES = [
  'http://100.110.45.76:3000',
  'https://localhost:3000',
  'http://localhost:3000',
] as const;

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
  const dbFacts = [
    { label: 'тип', value: status.type ?? 'postgres' },
    { label: 'host', value: status.host },
    { label: 'port', value: status.port ? String(status.port) : undefined },
    { label: 'db', value: status.database },
    { label: 'user', value: status.username },
    { label: 'источник', value: status.source },
  ].filter((item) => item.value);
  const uniqueAddresses = Array.from(
    new Set(
      [...PREFERRED_ADDRESSES, ...addresses]
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
  const addressesHtml = uniqueAddresses.length
    ? uniqueAddresses
        .map(
          (addr) =>
            `<a class="db-link" href="${addr}" target="_blank" rel="noreferrer">${addr}</a>`
        )
        .join('')
    : '<span class="db-empty">не определены</span>';
  const releaseFacts = [
    { label: 'Version', value: STATUS_RELEASE.version },
    { label: 'Deployed', value: STATUS_RELEASE.deployedAt },
    { label: 'Commit', value: STATUS_RELEASE.commit },
  ];
  const releaseHtml = releaseFacts
    .map(
      (item) =>
        `<div class="db-item"><span class="db-label">${item.label}</span><strong>${item.value}</strong></div>`
    )
    .join('');
  const dbFactsHtml = dbFacts.length
    ? dbFacts
        .map(
          (item) =>
            `<div class="db-item"><span class="db-label">${item.label}</span><strong>${item.value}</strong></div>`
        )
        .join('')
    : '<span class="db-empty">данные подключения недоступны</span>';

  return {
    style: `
      .db-bar {
        position: sticky;
        top: 0;
        z-index: 10;
        padding: 12px 16px;
        background: linear-gradient(135deg, #f3f7ff 0%, #eef5ff 100%);
        color: #1d2b4f;
        border-bottom: 1px solid #d9e3f5;
        font-family: "IBM Plex Sans", "Segoe UI", Arial, sans-serif;
        font-size: 13px;
        display: grid;
        gap: 10px;
      }
      .db-row {
        display: grid;
        grid-template-columns: 140px minmax(0, 1fr);
        gap: 10px 14px;
        align-items: start;
      }
      .db-bar .badge {
        padding: 4px 8px;
        border-radius: 999px;
        font-weight: 600;
        letter-spacing: 0.02em;
        background: #e3ecff;
        width: fit-content;
      }
      .db-bar.ok .badge { background: #dff5e6; color: #1f6a37; }
      .db-bar.err .badge { background: #ffe3e3; color: #8a2b2b; }
      .db-title {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #61708f;
        padding-top: 6px;
      }
      .db-content {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        min-width: 0;
      }
      .db-item {
        display: inline-flex;
        align-items: baseline;
        gap: 6px;
        padding: 7px 10px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.72);
        border: 1px solid #dce5f5;
        color: #33415f;
      }
      .db-label {
        color: #6b7a99;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .db-links {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .db-link {
        color: #284f9e;
        text-decoration: none;
        padding: 7px 10px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.72);
        border: 1px solid #dce5f5;
      }
      .db-link:hover { text-decoration: underline; }
      .db-empty {
        color: #6b7a99;
        padding: 7px 0;
      }
      @media (max-width: 760px) {
        .db-row {
          grid-template-columns: 1fr;
          gap: 6px;
        }
        .db-title {
          padding-top: 0;
        }
      }

      :root[data-theme="dark"] .db-bar {
        background: linear-gradient(135deg, #0b1220 0%, #10192d 100%);
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
      :root[data-theme="dark"] .db-title,
      :root[data-theme="dark"] .db-label,
      :root[data-theme="dark"] .db-empty {
        color: #8ea1c5;
      }
      :root[data-theme="dark"] .db-item,
      :root[data-theme="dark"] .db-link {
        background: rgba(17, 24, 39, 0.78);
        border-color: #27324a;
        color: #dbe5f6;
      }
      :root[data-theme="dark"] .db-link {
        color: #b9d2ff;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme]) .db-bar {
          background: linear-gradient(135deg, #0b1220 0%, #10192d 100%);
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
        :root:not([data-theme]) .db-title,
        :root:not([data-theme]) .db-label,
        :root:not([data-theme]) .db-empty {
          color: #8ea1c5;
        }
        :root:not([data-theme]) .db-item,
        :root:not([data-theme]) .db-link {
          background: rgba(17, 24, 39, 0.78);
          border-color: #27324a;
          color: #dbe5f6;
        }
        :root:not([data-theme]) .db-link {
          color: #b9d2ff;
        }
      }
    `,
    html: `
      <div class="db-bar ${stateClass}">
        <div class="db-row">
          <div class="db-title">Статус</div>
          <div class="db-content">
            <span class="badge">DB: ${stateText}</span>
          </div>
        </div>
        <div class="db-row">
          <div class="db-title">Релиз</div>
          <div class="db-content">${releaseHtml}</div>
        </div>
        <div class="db-row">
          <div class="db-title">Postgres</div>
          <div class="db-content">${dbFactsHtml}</div>
        </div>
        <div class="db-row">
          <div class="db-title">Адреса</div>
          <div class="db-links">${addressesHtml}</div>
        </div>
      </div>
    `,
  };
}
