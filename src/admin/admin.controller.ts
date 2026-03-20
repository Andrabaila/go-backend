import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Language } from '../quests/language.entity.js';

@Controller('admin')
export class AdminController {
  constructor(
    @InjectRepository(Language)
    private readonly languageRepo: Repository<Language>,
    private readonly dataSource: DataSource
  ) {}

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
      @media (max-width: 600px) {
        .wrap { margin: 16px; padding: 16px; border-radius: 12px; }
        .row { grid-template-columns: 1fr; }
        .actions { flex-direction: column; align-items: stretch; }
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

  @Get('languages')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getLanguagesAdmin(): string {
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Admin · Languages</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Segoe UI", Arial, sans-serif;
        background: linear-gradient(135deg, #f8f6f1 0%, #f2f7ff 100%);
        color: #1f2a44;
      }
      .wrap {
        max-width: 900px;
        margin: 48px auto;
        padding: 24px;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.08);
      }
      @media (max-width: 600px) {
        .wrap { margin: 16px; padding: 16px; border-radius: 12px; }
        table { display: block; overflow-x: auto; }
        .actions { flex-direction: column; align-items: stretch; gap: 8px; }
        .lang-actions { flex-direction: column; }
        .lang-actions button { width: 100%; }
      }
      h1 { margin: 0 0 16px; font-size: 28px; }
      p { margin: 0 0 24px; color: #4a5875; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #e6ecf8; }
      th { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7a99; }
      input[type="text"] {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #ccd6eb;
        border-radius: 8px;
        background: #f9fbff;
      }
      .actions { display: flex; gap: 12px; margin-top: 16px; align-items: center; }
      .lang-actions { display: flex; gap: 8px; flex-wrap: wrap; }
      .lang-actions button { min-width: 96px; }
      button {
        border: 0;
        padding: 10px 16px;
        border-radius: 10px;
        background: #2d6cdf;
        color: white;
        font-size: 14px;
        cursor: pointer;
      }
      button:disabled { background: #9db7ea; cursor: not-allowed; }
      .status { padding: 10px; border-radius: 10px; background: #f1f5ff; color: #2d3b5e; }
      .status.error { background: #fff1f1; color: #8a2b2b; }
      .status.success { background: #eefaf1; color: #1f6a37; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>Языки</h1>
      <p>Список языков из таблицы <code>languages</code>. Можно менять имя и флаг default.</p>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Default</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="rows"></tbody>
      </table>
      <div class="actions" style="margin-top: 20px;">
        <input id="new-code" type="text" placeholder="code (e.g. en)" />
        <input id="new-name" type="text" placeholder="name (e.g. English)" />
        <label style="display:flex; gap:6px; align-items:center;">
          <input id="new-default" type="checkbox" />
          Default
        </label>
        <button id="add-btn">Добавить</button>
      </div>
      <div class="actions">
        <div id="status" class="status">Загружаю...</div>
      </div>
    </div>

    <script>
      const rowsEl = document.getElementById('rows');
      const statusEl = document.getElementById('status');
      const addBtn = document.getElementById('add-btn');
      const newCode = document.getElementById('new-code');
      const newName = document.getElementById('new-name');
      const newDefault = document.getElementById('new-default');

      function setStatus(text, kind) {
        statusEl.textContent = text;
        statusEl.classList.remove('error', 'success');
        if (kind) statusEl.classList.add(kind);
      }

      async function loadLanguages() {
        setStatus('Загружаю...', null);
        const res = await fetch('/admin/api/languages');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || data?.error || 'Ошибка загрузки');
        }
        rowsEl.innerHTML = '';
        data.forEach((lang) => rowsEl.appendChild(renderRow(lang)));
        setStatus('Готово', 'success');
      }

      function renderRow(lang) {
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' +
          lang.code +
          '</td>' +
          '<td><input type="text" value="' +
          lang.name +
          '" /></td>' +
          '<td><input type="checkbox" ' +
          (lang.isDefault ? 'checked' : '') +
          ' /></td>' +
          '<td><div class="lang-actions"><button class="save">Сохранить</button><button class="delete" style="background:#d9534f;">Удалить</button></div></td>';

        const input = tr.querySelector('input[type="text"]');
        const checkbox = tr.querySelector('input[type="checkbox"]');
        const saveBtn = tr.querySelector('button.save');
        const deleteBtn = tr.querySelector('button.delete');

        saveBtn.addEventListener('click', async () => {
          saveBtn.disabled = true;
          try {
            const payload = { name: input.value.trim(), is_default: checkbox.checked };
            const res = await fetch('/admin/api/languages/' + encodeURIComponent(lang.code), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
              const msg = data?.message || data?.error || 'Ошибка сохранения';
              throw new Error(msg);
            }
            if (payload.is_default) {
              await loadLanguages();
            } else {
              setStatus('Сохранено', 'success');
            }
          } catch (err) {
            const msg = err && err.message ? err.message : err;
            setStatus('Ошибка: ' + msg, 'error');
          } finally {
            saveBtn.disabled = false;
          }
        });

        deleteBtn.addEventListener('click', async () => {
          if (!confirm('Удалить язык ' + lang.code + '?')) return;
          deleteBtn.disabled = true;
          try {
            const res = await fetch('/admin/api/languages/' + encodeURIComponent(lang.code), {
              method: 'DELETE',
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
              const msg = data?.message || data?.error || 'Ошибка удаления';
              throw new Error(msg);
            }
            await loadLanguages();
          } catch (err) {
            const msg = err && err.message ? err.message : err;
            setStatus('Ошибка: ' + msg, 'error');
          } finally {
            deleteBtn.disabled = false;
          }
        });

        return tr;
      }

      loadLanguages().catch((err) => {
        const msg = err && err.message ? err.message : err;
        setStatus('Ошибка: ' + msg, 'error');
      });

      addBtn.addEventListener('click', async () => {
        const code = String(newCode.value || '').trim();
        const name = String(newName.value || '').trim();
        const isDefault = !!newDefault.checked;
        if (!code || !name) {
          setStatus('Код и имя обязательны', 'error');
          return;
        }
        addBtn.disabled = true;
        try {
          const res = await fetch('/admin/api/languages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, name, is_default: isDefault }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            const msg = data?.message || data?.error || 'Ошибка добавления';
            throw new Error(msg);
          }
          newCode.value = '';
          newName.value = '';
          newDefault.checked = false;
          await loadLanguages();
        } catch (err) {
          const msg = err && err.message ? err.message : err;
          setStatus('Ошибка: ' + msg, 'error');
        } finally {
          addBtn.disabled = false;
        }
      });
    </script>
  </body>
</html>`;
  }

  @Get('api/languages')
  async listLanguages(): Promise<Language[]> {
    return this.languageRepo.find({ order: { code: 'ASC' } });
  }

  @Put('api/languages/:code')
  async updateLanguage(
    @Param('code') code: string,
    @Body() body: { name?: string; is_default?: boolean }
  ): Promise<Language> {
    const existing = await this.languageRepo.findOne({ where: { code } });
    if (!existing) {
      throw new NotFoundException('Language not found');
    }

    return this.dataSource.transaction(async (manager) => {
      if (body.is_default) {
        await manager.update(
          Language,
          { isDefault: true },
          { isDefault: false }
        );
      }

      const next = manager.merge(Language, existing, {
        name: body.name ?? existing.name,
        isDefault: body.is_default ?? existing.isDefault,
      });

      return manager.save(next);
    });
  }

  @Post('api/languages')
  async createLanguage(
    @Body() body: { code?: string; name?: string; is_default?: boolean }
  ): Promise<Language> {
    const code = (body.code ?? '').trim();
    const name = (body.name ?? '').trim();
    if (!code || !name) {
      throw new Error('Code and name are required');
    }

    return this.dataSource.transaction(async (manager) => {
      if (body.is_default) {
        await manager.update(
          Language,
          { isDefault: true },
          { isDefault: false }
        );
      }

      const existing = await manager.findOne(Language, { where: { code } });
      if (existing) {
        const updated = manager.merge(Language, existing, {
          name,
          isDefault: body.is_default ?? existing.isDefault,
        });
        return manager.save(updated);
      }

      const created = manager.create(Language, {
        code,
        name,
        isDefault: body.is_default ?? false,
      });
      return manager.save(created);
    });
  }

  @Delete('api/languages/:code')
  async deleteLanguage(@Param('code') code: string): Promise<{ ok: true }> {
    const existing = await this.languageRepo.findOne({ where: { code } });
    if (!existing) {
      throw new NotFoundException('Language not found');
    }
    await this.languageRepo.delete({ code });
    return { ok: true };
  }
}
