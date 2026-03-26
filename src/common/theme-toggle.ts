type ThemeParts = {
  style: string;
  html: string;
  script: string;
};

export function renderThemeToggle(): ThemeParts {
  return {
    style: `
      .theme-toggle {
        position: fixed;
        top: 12px;
        right: 12px;
        z-index: 20;
        display: flex;
        gap: 8px;
        align-items: center;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid #d9e3f5;
        box-shadow: 0 6px 16px rgba(0,0,0,0.08);
        font-family: "IBM Plex Sans", "Segoe UI", Arial, sans-serif;
        font-size: 12.5px;
        color: #1f2a44;
      }
      .theme-toggle select {
        border: 1px solid #ccd6eb;
        border-radius: 999px;
        padding: 4px 10px;
        background: #f9fbff;
        font-size: 12.5px;
      }
      :root[data-theme="dark"] .theme-toggle {
        background: rgba(17, 24, 39, 0.92);
        border-color: #334155;
        color: #e2e8f0;
      }
      :root[data-theme="dark"] .theme-toggle select {
        background: #0b1220;
        border-color: #334155;
        color: #e2e8f0;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme]) .theme-toggle {
          background: rgba(17, 24, 39, 0.92);
          border-color: #334155;
          color: #e2e8f0;
        }
        :root:not([data-theme]) .theme-toggle select {
          background: #0b1220;
          border-color: #334155;
          color: #e2e8f0;
        }
      }

      :root[data-theme="dark"] body {
        background: linear-gradient(135deg, #0b1220 0%, #0f172a 100%);
        color: #e2e8f0;
      }
      :root[data-theme="dark"] .wrap {
        background: #0f172a;
        box-shadow: 0 12px 30px rgba(0,0,0,0.4);
      }
      :root[data-theme="dark"] a.card,
      :root[data-theme="dark"] .card {
        background: #111827;
        border-color: #1f2a44;
      }
      :root[data-theme="dark"] table td,
      :root[data-theme="dark"] table th {
        border-bottom-color: #1f2a44;
      }
      :root[data-theme="dark"] th {
        color: #94a3b8;
      }
      :root[data-theme="dark"] p,
      :root[data-theme="dark"] .meta,
      :root[data-theme="dark"] .details,
      :root[data-theme="dark"] .addresses {
        color: #b6c2d9;
      }
      :root[data-theme="dark"] input,
      :root[data-theme="dark"] select {
        background: #0b1220;
        border-color: #334155;
        color: #e2e8f0;
      }
      :root[data-theme="dark"] .status {
        background: #0b1220;
        color: #cbd5f5;
      }
      :root[data-theme="dark"] .status.error {
        background: #3b1f24;
        color: #f8c1c1;
      }
      :root[data-theme="dark"] .status.success {
        background: #163828;
        color: #bff1d0;
      }

      @media (prefers-color-scheme: dark) {
        :root:not([data-theme]) body {
          background: linear-gradient(135deg, #0b1220 0%, #0f172a 100%);
          color: #e2e8f0;
        }
        :root:not([data-theme]) .wrap {
          background: #0f172a;
          box-shadow: 0 12px 30px rgba(0,0,0,0.4);
        }
        :root:not([data-theme]) a.card,
        :root:not([data-theme]) .card {
          background: #111827;
          border-color: #1f2a44;
        }
        :root:not([data-theme]) table td,
        :root:not([data-theme]) table th {
          border-bottom-color: #1f2a44;
        }
        :root:not([data-theme]) th {
          color: #94a3b8;
        }
        :root:not([data-theme]) p,
        :root:not([data-theme]) .meta,
        :root:not([data-theme]) .details,
        :root:not([data-theme]) .addresses {
          color: #b6c2d9;
        }
        :root:not([data-theme]) input,
        :root:not([data-theme]) select {
          background: #0b1220;
          border-color: #334155;
          color: #e2e8f0;
        }
        :root:not([data-theme]) .status {
          background: #0b1220;
          color: #cbd5f5;
        }
        :root:not([data-theme]) .status.error {
          background: #3b1f24;
          color: #f8c1c1;
        }
        :root:not([data-theme]) .status.success {
          background: #163828;
          color: #bff1d0;
        }
      }
    `,
    html: `
      <div class="theme-toggle">
        <label for="theme-select">Тема</label>
        <select id="theme-select">
          <option value="system">Как в системе</option>
          <option value="light">Светлая</option>
          <option value="dark">Темная</option>
        </select>
      </div>
    `,
    script: `
      <script>
        (function () {
          const key = 'ui-theme';
          const select = document.getElementById('theme-select');
          if (!select) return;

          function applyTheme(value) {
            if (value === 'system') {
              document.documentElement.removeAttribute('data-theme');
            } else {
              document.documentElement.setAttribute('data-theme', value);
            }
          }

          const saved = localStorage.getItem(key) || 'system';
          select.value = saved;
          applyTheme(saved);

          select.addEventListener('change', () => {
            const next = select.value || 'system';
            localStorage.setItem(key, next);
            applyTheme(next);
          });
        })();
      </script>
    `,
  };
}
