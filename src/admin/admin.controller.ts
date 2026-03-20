import { Controller, Get, Header } from '@nestjs/common';

@Controller('admin')
export class AdminController {
  @Get('quests')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getQuestsAdmin(): string {
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Admin · Quests</title>
    <style>
      :root {
        color-scheme: light;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Segoe UI", Arial, sans-serif;
        background: linear-gradient(135deg, #f8f6f1 0%, #f2f7ff 100%);
        color: #1f2a44;
      }
      .wrap {
        max-width: 860px;
        margin: 48px auto;
        padding: 24px;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.08);
      }
      h1 {
        margin: 0 0 16px;
        font-size: 28px;
        letter-spacing: 0.2px;
      }
      p { margin: 0 0 24px; color: #4a5875; }
      form {
        display: grid;
        gap: 16px;
      }
      .row {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }
      label {
        display: grid;
        gap: 6px;
        font-size: 14px;
        color: #2d3b5e;
      }
      input, textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #ccd6eb;
        border-radius: 10px;
        font-size: 15px;
        background: #f9fbff;
        color: #1f2a44;
      }
      textarea { min-height: 120px; resize: vertical; }
      .actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      button {
        border: 0;
        padding: 12px 18px;
        border-radius: 10px;
        background: #2d6cdf;
        color: white;
        font-size: 15px;
        cursor: pointer;
      }
      button:disabled { background: #9db7ea; cursor: not-allowed; }
      .status {
        padding: 12px;
        border-radius: 10px;
        background: #f1f5ff;
        color: #2d3b5e;
        font-size: 14px;
      }
      .status.error {
        background: #fff1f1;
        color: #8a2b2b;
      }
      .status.success {
        background: #eefaf1;
        color: #1f6a37;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>Добавить квест</h1>
      <p>Форма создаёт запись в <code>quests</code> и переводит поля на все языки из <code>languages</code>.</p>

      <form id="quest-form">
        <div class="row">
          <label>Длительность (мин)
            <input name="duration" type="number" min="1" step="1" required />
          </label>
          <label>Дистанция (км)
            <input name="distance" type="number" min="0" step="0.1" required />
          </label>
          <label>Сложность (1-5)
            <input name="difficulty" type="number" min="1" max="5" step="1" required />
          </label>
          <label>Цена
            <input name="price" type="number" min="0" step="0.01" required />
          </label>
        </div>

        <label>
          Активен
          <input name="is_active" type="checkbox" checked />
        </label>

        <label>Название
          <input name="title" type="text" required />
        </label>
        <label>Описание
          <textarea name="description" required></textarea>
        </label>
        <div class="row">
          <label>Район
            <input name="district" type="text" required />
          </label>
          <label>Город
            <input name="city" type="text" required />
          </label>
        </div>

        <div class="actions">
          <button type="submit" id="submit">Создать квест</button>
          <div id="status" class="status">Готово к отправке.</div>
        </div>
      </form>
    </div>

    <script>
      const form = document.getElementById('quest-form');
      const statusEl = document.getElementById('status');
      const submitBtn = document.getElementById('submit');

      function setStatus(text, kind) {
        statusEl.textContent = text;
        statusEl.classList.remove('error', 'success');
        if (kind) statusEl.classList.add(kind);
      }

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        setStatus('Отправляю запрос...', null);
        submitBtn.disabled = true;

        const formData = new FormData(form);
        const payload = {
          duration: Number(formData.get('duration')),
          distance: Number(formData.get('distance')),
          difficulty: Number(formData.get('difficulty')),
          price: Number(formData.get('price')),
          is_active: formData.get('is_active') === 'on',
          title: String(formData.get('title') || '').trim(),
          description: String(formData.get('description') || '').trim(),
          district: String(formData.get('district') || '').trim(),
          city: String(formData.get('city') || '').trim(),
        };

        try {
          const res = await fetch('/quests/new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          const data = await res.json().catch(() => null);
          if (!res.ok) {
            const msg = data?.message || data?.error || 'Ошибка запроса';
            throw new Error(msg);
          }

          setStatus('Квест создан. Переводы сохранены.', 'success');
          form.reset();
        } catch (err) {
          const msg = (err && err.message) ? err.message : err;
          setStatus('Ошибка: ' + msg, 'error');
        } finally {
          submitBtn.disabled = false;
        }
      });
    </script>
  </body>
</html>`;
  }
}
