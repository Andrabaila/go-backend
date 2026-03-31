import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpException,
  NotFoundException,
  Query,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { renderDbStatusBar } from '../common/db-status.js';
import { renderThemeToggle } from '../common/theme-toggle.js';
import { getLibreLanguages, translateText } from '../common/libretranslate.js';
import { Language } from '../quests/language.entity.js';
import { QuestRecord } from '../quests/quest-record.entity.js';
import { QuestTranslation } from '../quests/quest-translation.entity.js';

function getBackendAddresses(req: Request): string[] {
  const forwarded = req.headers['x-forwarded-proto'];
  const forwardedProto = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const protocol =
    (forwardedProto && forwardedProto.split(',')[0].trim()) ||
    req.protocol ||
    'http';
  const host = req.get('host');
  const port = String(process.env.PORT ?? (host ? host.split(':')[1] : '3000'));
  const candidates = [
    host ? `${protocol}://${host}` : '',
    `https://localhost:${port}`,
    `http://localhost:${port}`,
  ];
  return Array.from(
    new Set(candidates.map((item) => item.trim()).filter(Boolean))
  );
}

@Controller('admin')
export class AdminController {
  constructor(
    @InjectRepository(Language)
    private readonly languageRepo: Repository<Language>,
    @InjectRepository(QuestRecord)
    private readonly questRecordRepo: Repository<QuestRecord>,
    private readonly dataSource: DataSource
  ) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getAdminHome(@Req() req: Request): string {
    const dbStatus = renderDbStatusBar(
      this.dataSource,
      getBackendAddresses(req)
    );
    const theme = renderThemeToggle();
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Admin · Home</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Segoe UI", Arial, sans-serif;
        background: linear-gradient(135deg, #f8f6f1 0%, #f2f7ff 100%);
        color: #1f2a44;
      }
      ${dbStatus.style}
      ${theme.style}
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
      }
      h1 { margin: 0 0 12px; font-size: 28px; }
      p { margin: 0 0 24px; color: #4a5875; }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
      }
      a.card {
        display: block;
        padding: 18px;
        border-radius: 14px;
        border: 1px solid #e0e7f6;
        background: #f9fbff;
        color: inherit;
        text-decoration: none;
        transition: transform 120ms ease, box-shadow 120ms ease;
      }
      a.card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.08);
      }
      .card h2 { margin: 0 0 6px; font-size: 18px; }
      .card span { color: #4a5875; font-size: 14px; }
    </style>
  </head>
  <body>
    ${theme.html}
    ${dbStatus.html}
    <div class="wrap">
      <h1>Админка</h1>
      <p>Быстрые ссылки на управление справочниками.</p>
      <div class="grid">
        <a class="card" href="/admin/quests">
          <h2>Квесты</h2>
          <span>Добавление и перевод</span>
        </a>
        <a class="card" href="/admin/languages">
          <h2>Языки</h2>
          <span>Справочник языков и default</span>
        </a>
        <a class="card" href="/admin/ui">
          <h2>UI</h2>
          <span>Сущности интерфейса</span>
        </a>
        <a class="card" href="/admin/locations">
          <h2>Locations</h2>
          <span>Координаты локаций</span>
        </a>
        <a class="card" href="/admin/scenes">
          <h2>Scenes</h2>
          <span>Сцены и переводы</span>
        </a>
      </div>
    </div>
    ${theme.script}
  </body>
</html>`;
  }

  @Get('quests')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getQuestsList(): string {
    const theme = renderThemeToggle();
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Admin · Quests</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Segoe UI", Arial, sans-serif;
        background: linear-gradient(135deg, #f8f6f1 0%, #f2f7ff 100%);
        color: #1f2a44;
      }
      ${theme.style}
      .wrap {
        max-width: 980px;
        margin: 48px auto;
        padding: 24px;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.08);
      }
      .cards { display: none; }
      .card {
        border: 1px solid #e6ecf8;
        border-radius: 12px;
        padding: 12px;
        background: #f9fbff;
        display: grid;
        gap: 6px;
      }
      .card h3 { margin: 0; font-size: 16px; }
      .meta { color: #4a5875; font-size: 13px; }
      @media (max-width: 600px) {
        .wrap { margin: 16px; padding: 16px; border-radius: 12px; }
        table.desktop { display: none; }
        .cards { display: grid; gap: 10px; }
        .actions { flex-direction: column; align-items: stretch; gap: 8px; }
      }
      h1 { margin: 0 0 12px; font-size: 28px; }
      p { margin: 0 0 20px; color: #4a5875; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #e6ecf8; }
      th { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7a99; }
      .actions { display: flex; gap: 12px; margin: 12px 0 18px; align-items: center; }
      a.btn, button {
        border: 0;
        padding: 10px 16px;
        border-radius: 10px;
        background: #2d6cdf;
        color: white;
        font-size: 14px;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
      }
      button.secondary {
        background: #e8eefc;
        color: #2d3b5e;
      }
      button.delete { background: #d9534f; }
      button:disabled { background: #9db7ea; cursor: not-allowed; }
      .status { padding: 10px; border-radius: 10px; background: #f1f5ff; color: #2d3b5e; }
      .status.error { background: #fff1f1; color: #8a2b2b; }
      .status.success { background: #eefaf1; color: #1f6a37; }
      .lang {
        display: grid;
        gap: 4px;
        font-size: 12px;
        color: #6b7a99;
      }
      .lang select {
        min-width: 160px;
        padding: 8px 10px;
        border: 1px solid #ccd6eb;
        border-radius: 8px;
        background: #f9fbff;
        color: #1f2a44;
        font-size: 14px;
      }
      .details-row { display: none; background: #f9fbff; }
      .details-row.open { display: table-row; }
      .details-cell {
        padding: 12px 10px 16px;
        border-bottom: 1px solid #e6ecf8;
      }
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 10px 18px;
        font-size: 14px;
        color: #2d3b5e;
      }
      .detail-label { color: #6b7a99; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
      .detail-block { display: grid; gap: 4px; }
      .detail-wide { grid-column: 1 / -1; }
      .card .details { display: none; margin-top: 10px; }
      .card .details.open { display: grid; gap: 6px; }
    </style>
  </head>
  <body>
    ${theme.html}
    <div class="wrap">
      <h1>Квесты</h1>
      <p>Список существующих квестов. Можно удалить и перейти к форме добавления.</p>
      <div class="actions">
        <a class="btn" href="/admin/quests/add">Добавить квест</a>
        <label class="lang">
          <span>Язык</span>
          <select id="lang-select"></select>
        </label>
        <div id="status" class="status">Загружаю...</div>
      </div>
      <table class="desktop">
        <thead>
          <tr>
            <th>Название</th>
            <th>Город</th>
            <th>Район</th>
            <th>Длительность</th>
            <th>Цена</th>
            <th>Активен</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody id="rows"></tbody>
      </table>
      <div class="cards" id="cards"></div>
    </div>

    <script>
      const rowsEl = document.getElementById('rows');
      const statusEl = document.getElementById('status');
      const cardsEl = document.getElementById('cards');
      const langSelect = document.getElementById('lang-select');

      function setStatus(text, kind) {
        statusEl.textContent = text;
        statusEl.classList.remove('error', 'success');
        if (kind) statusEl.classList.add(kind);
      }

      function getLangFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('lang');
      }

      function setLangInUrl(code) {
        const params = new URLSearchParams(window.location.search);
        params.set('lang', code);
        const next = window.location.pathname + '?' + params.toString();
        window.history.replaceState(null, '', next);
      }

      async function loadLanguages() {
        const res = await fetch('/admin/api/languages');
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = data?.message || data?.error || 'Ошибка загрузки языков';
          throw new Error(msg);
        }
        langSelect.innerHTML = '';
        data.forEach((lang) => {
          const opt = document.createElement('option');
          opt.value = lang.code;
          opt.textContent = lang.name
            ? String(lang.name) + ' (' + String(lang.code) + ')'
            : String(lang.code);
          if (lang.isDefault) opt.dataset.default = 'true';
          langSelect.appendChild(opt);
        });
        const urlLang = getLangFromUrl();
        const defaultOpt =
          langSelect.querySelector('option[data-default="true"]') ||
          langSelect.querySelector('option');
        const preferred = urlLang || (defaultOpt ? defaultOpt.value : '');
        if (preferred) {
          langSelect.value = preferred;
          setLangInUrl(preferred);
        }
      }

      async function loadQuests() {
        setStatus('Загружаю...', null);
        const lang = langSelect.value;
        const res = await fetch('/admin/api/quests?lang=' + encodeURIComponent(lang));
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || data?.error || 'Ошибка загрузки');
        }
        rowsEl.innerHTML = '';
        cardsEl.innerHTML = '';
        data.forEach((q) => {
          rowsEl.appendChild(renderRow(q));
          cardsEl.appendChild(renderCard(q));
        });
        setStatus('Готово', 'success');
      }

      function renderRow(q) {
        const frag = document.createDocumentFragment();
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + (q.title || '-') + '</td>' +
          '<td>' + (q.city || '-') + '</td>' +
          '<td>' + (q.district || '-') + '</td>' +
          '<td>' + q.duration + ' мин</td>' +
          '<td>' + q.price + '</td>' +
          '<td>' + (q.is_active ? 'да' : 'нет') + '</td>' +
          '<td>' +
            '<button class="secondary toggle">Подробнее</button> ' +
            '<button class="delete">Удалить</button>' +
          '</td>';

        const detailsRow = document.createElement('tr');
        detailsRow.className = 'details-row';
        detailsRow.innerHTML =
          '<td class="details-cell" colspan="7">' +
            '<div class="detail-grid">' +
              '<div class="detail-block">' +
                '<div class="detail-label">ID</div>' +
                '<div>' + q.id + '</div>' +
              '</div>' +
              '<div class="detail-block">' +
                '<div class="detail-label">Дистанция</div>' +
                '<div>' + q.distance + ' км</div>' +
              '</div>' +
              '<div class="detail-block">' +
                '<div class="detail-label">Сложность</div>' +
                '<div>' + q.difficulty + '</div>' +
              '</div>' +
              '<div class="detail-block">' +
                '<div class="detail-label">Длительность</div>' +
                '<div>' + q.duration + ' мин</div>' +
              '</div>' +
              '<div class="detail-block">' +
                '<div class="detail-label">Цена</div>' +
                '<div>' + q.price + '</div>' +
              '</div>' +
              '<div class="detail-block">' +
                '<div class="detail-label">Активен</div>' +
                '<div>' + (q.is_active ? 'да' : 'нет') + '</div>' +
              '</div>' +
              '<div class="detail-block detail-wide">' +
                '<div class="detail-label">Описание</div>' +
                '<div>' + (q.description || '-') + '</div>' +
              '</div>' +
            '</div>' +
          '</td>';

        const toggleBtn = tr.querySelector('button.toggle');
        toggleBtn.addEventListener('click', () => {
          const isOpen = detailsRow.classList.toggle('open');
          toggleBtn.textContent = isOpen ? 'Скрыть' : 'Подробнее';
        });

        const delBtn = tr.querySelector('button.delete');
        delBtn.addEventListener('click', async () => {
          if (!confirm('Удалить квест?')) return;
          delBtn.disabled = true;
          try {
            const res = await fetch('/admin/api/quests/' + encodeURIComponent(q.id), {
              method: 'DELETE',
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
              const msg = data?.message || data?.error || 'Ошибка удаления';
              throw new Error(msg);
            }
            await loadQuests();
          } catch (err) {
            const msg = err && err.message ? err.message : err;
            setStatus('Ошибка: ' + msg, 'error');
          } finally {
            delBtn.disabled = false;
          }
        });

        frag.appendChild(tr);
        frag.appendChild(detailsRow);
        return frag;
      }

      function renderCard(q) {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML =
          '<h3>' + (q.title || '-') + '</h3>' +
          '<div class="meta">' + (q.city || '-') + ' · ' + (q.district || '-') + '</div>' +
          '<div class="meta">Длительность: ' + q.duration + ' мин</div>' +
          '<div class="meta">Цена: ' + q.price + '</div>' +
          '<div class="meta">Активен: ' + (q.is_active ? 'да' : 'нет') + '</div>' +
          '<button class="secondary toggle">Подробнее</button>' +
          '<div class="details">' +
            '<div class="meta">ID: ' + q.id + '</div>' +
            '<div class="meta">Дистанция: ' + q.distance + ' км</div>' +
            '<div class="meta">Сложность: ' + q.difficulty + '</div>' +
            '<div class="meta">Описание: ' + (q.description || '-') + '</div>' +
          '</div>' +
          '<button class="delete">Удалить</button>';

        const toggleBtn = div.querySelector('button.toggle');
        const detailsEl = div.querySelector('.details');
        toggleBtn.addEventListener('click', () => {
          const isOpen = detailsEl.classList.toggle('open');
          toggleBtn.textContent = isOpen ? 'Скрыть' : 'Подробнее';
        });

        const delBtn = div.querySelector('button.delete');
        delBtn.addEventListener('click', async () => {
          if (!confirm('Удалить квест?')) return;
          delBtn.disabled = true;
          try {
            const res = await fetch('/admin/api/quests/' + encodeURIComponent(q.id), {
              method: 'DELETE',
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
              const msg = data?.message || data?.error || 'Ошибка удаления';
              throw new Error(msg);
            }
            await loadQuests();
          } catch (err) {
            const msg = err && err.message ? err.message : err;
            setStatus('Ошибка: ' + msg, 'error');
          } finally {
            delBtn.disabled = false;
          }
        });

        return div;
      }

      langSelect.addEventListener('change', () => {
        setLangInUrl(langSelect.value);
        loadQuests().catch((err) => {
          const msg = err && err.message ? err.message : err;
          setStatus('Ошибка: ' + msg, 'error');
        });
      });

      (async () => {
        try {
          await loadLanguages();
          await loadQuests();
        } catch (err) {
          const msg = err && err.message ? err.message : err;
          setStatus('Ошибка: ' + msg, 'error');
        }
      })();
    </script>
  </body>
</html>`;
  }

  @Get('quests/add')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getQuestsAdmin(): string {
    const theme = renderThemeToggle();
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
      ${theme.style}
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
      input, textarea, select {
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
    ${theme.html}
    <div class="wrap">
      <h1>Добавить квест</h1>
      <p>Форма создаёт запись в <code>quests</code> и переводит поля через LibreTranslate на доступные языки.</p>

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

        <label>Язык
          <select name="language_code" required>
            <option value="ru" selected>Русский</option>
            <option value="en">English</option>
            <option value="pl">Polski</option>
            <option value="es">Español</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
            <option value="pt">Português</option>
            <option value="ja">日本語</option>
            <option value="uk">Українська</option>
            <option value="ar">العربية</option>
          </select>
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
          language_code: String(formData.get('language_code') || '').trim(),
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
    ${theme.script}
  </body>
</html>`;
  }

  @Get('languages')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getLanguagesAdmin(): string {
    const theme = renderThemeToggle();
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
      ${theme.style}
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
      button.delete { background: #d9534f; }
      button:disabled { background: #9db7ea; cursor: not-allowed; }
      .status { padding: 10px; border-radius: 10px; background: #f1f5ff; color: #2d3b5e; }
      .status.error { background: #fff1f1; color: #8a2b2b; }
      .status.success { background: #eefaf1; color: #1f6a37; }
    </style>
  </head>
  <body>
    ${theme.html}
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
    ${theme.script}
  </body>
</html>`;
  }

  @Get('ui')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getUiAdmin(): string {
    const theme = renderThemeToggle();
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Admin · UI</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Segoe UI", Arial, sans-serif;
        background: linear-gradient(135deg, #f8f6f1 0%, #f2f7ff 100%);
        color: #1f2a44;
      }
      ${theme.style}
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
    ${theme.html}
    <div class="wrap">
      <h1>UI</h1>
      <p>Список сущностей интерфейса из таблицы <code>ui</code>. Можно добавить и удалить.</p>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="rows"></tbody>
      </table>
      <div class="actions" style="margin-top: 20px;">
        <input id="new-name" type="text" placeholder="name" />
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
      const newName = document.getElementById('new-name');

      function setStatus(text, kind) {
        statusEl.textContent = text;
        statusEl.classList.remove('error', 'success');
        if (kind) statusEl.classList.add(kind);
      }

      async function loadUi() {
        setStatus('Загружаю...', null);
        const res = await fetch('/admin/api/ui');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || data?.error || 'Ошибка загрузки');
        }
        rowsEl.innerHTML = '';
        data.forEach((item) => rowsEl.appendChild(renderRow(item)));
        setStatus('Готово', 'success');
      }

      function renderRow(item) {
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + item.id + '</td>' +
          '<td>' + item.name + '</td>' +
          '<td><button class="delete">Удалить</button></td>';

        const delBtn = tr.querySelector('button.delete');
        delBtn.addEventListener('click', async () => {
          if (!confirm('Удалить элемент?')) return;
          delBtn.disabled = true;
          try {
            const res = await fetch('/admin/api/ui/' + encodeURIComponent(item.id), {
              method: 'DELETE',
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
              const msg = data?.message || data?.error || 'Ошибка удаления';
              throw new Error(msg);
            }
            await loadUi();
          } catch (err) {
            const msg = err && err.message ? err.message : err;
            setStatus('Ошибка: ' + msg, 'error');
          } finally {
            delBtn.disabled = false;
          }
        });
        return tr;
      }

      loadUi().catch((err) => {
        const msg = err && err.message ? err.message : err;
        setStatus('Ошибка: ' + msg, 'error');
      });

      addBtn.addEventListener('click', async () => {
        const name = String(newName.value || '').trim();
        if (!name) {
          setStatus('Name обязателен', 'error');
          return;
        }
        addBtn.disabled = true;
        try {
          const res = await fetch('/admin/api/ui', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            const msg = data?.message || data?.error || 'Ошибка добавления';
            throw new Error(msg);
          }
          newName.value = '';
          await loadUi();
        } catch (err) {
          const msg = err && err.message ? err.message : err;
          setStatus('Ошибка: ' + msg, 'error');
        } finally {
          addBtn.disabled = false;
        }
      });

      newName.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          addBtn.click();
        }
      });
    </script>
    ${theme.script}
  </body>
</html>`;
  }

  @Get('locations')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getLocationsAdmin(): string {
    const theme = renderThemeToggle();
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Admin · Locations</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Segoe UI", Arial, sans-serif;
        background: linear-gradient(135deg, #f8f6f1 0%, #f2f7ff 100%);
        color: #1f2a44;
      }
      ${theme.style}
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
      }
      h1 { margin: 0 0 16px; font-size: 28px; }
      p { margin: 0 0 24px; color: #4a5875; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #e6ecf8; }
      th { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7a99; }
      input[type="number"] {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #ccd6eb;
        border-radius: 8px;
        background: #f9fbff;
      }
      .actions { display: flex; gap: 12px; margin-top: 16px; align-items: center; }
      button {
        border: 0;
        padding: 10px 16px;
        border-radius: 10px;
        background: #2d6cdf;
        color: white;
        font-size: 14px;
        cursor: pointer;
      }
      button.delete { background: #d9534f; }
      button:disabled { background: #9db7ea; cursor: not-allowed; }
      .status { padding: 10px; border-radius: 10px; background: #f1f5ff; color: #2d3b5e; }
      .status.error { background: #fff1f1; color: #8a2b2b; }
      .status.success { background: #eefaf1; color: #1f6a37; }
    </style>
  </head>
  <body>
    ${theme.html}
    <div class="wrap">
      <h1>Locations</h1>
      <p>Список координат из таблицы <code>locations</code>. Можно добавить и удалить.</p>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Lat</th>
            <th>Lng</th>
            <th>Язык</th>
            <th>Название</th>
            <th>Описание</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="rows"></tbody>
      </table>
      <div class="actions" style="margin-top: 20px;">
        <select id="new-lang">
          <option value="ru" selected>Русский</option>
          <option value="en">English</option>
          <option value="pl">Polski</option>
          <option value="es">Español</option>
        </select>
        <input id="new-title" type="text" placeholder="название (ru)" />
        <input id="new-desc" type="text" placeholder="описание (ru)" />
        <input id="new-lat" type="number" step="0.000001" placeholder="lat" />
        <input id="new-lng" type="number" step="0.000001" placeholder="lng" />
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
      const newLang = document.getElementById('new-lang');
      const newTitle = document.getElementById('new-title');
      const newDesc = document.getElementById('new-desc');
      const newLat = document.getElementById('new-lat');
      const newLng = document.getElementById('new-lng');

      function setStatus(text, kind) {
        statusEl.textContent = text;
        statusEl.classList.remove('error', 'success');
        if (kind) statusEl.classList.add(kind);
      }

      async function loadLocations() {
        setStatus('Загружаю...', null);
        const res = await fetch('/admin/api/locations');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || data?.error || 'Ошибка загрузки');
        }
        rowsEl.innerHTML = '';
        data.forEach((item) => rowsEl.appendChild(renderRow(item)));
        setStatus('Готово', 'success');
      }

      function renderRow(item) {
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + item.id + '</td>' +
          '<td>' + item.lat + '</td>' +
          '<td>' + item.lng + '</td>' +
          '<td>' + (item.languageCode || '') + '</td>' +
          '<td>' + (item.title || '') + '</td>' +
          '<td>' + (item.description || '') + '</td>' +
          '<td><button class="delete">Удалить</button></td>';

        const delBtn = tr.querySelector('button.delete');
        delBtn.addEventListener('click', async () => {
          if (!confirm('Удалить локацию?')) return;
          delBtn.disabled = true;
          try {
            const res = await fetch('/admin/api/locations/' + encodeURIComponent(item.id), {
              method: 'DELETE',
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
              const msg = data?.message || data?.error || 'Ошибка удаления';
              throw new Error(msg);
            }
            await loadLocations();
          } catch (err) {
            const msg = err && err.message ? err.message : err;
            setStatus('Ошибка: ' + msg, 'error');
          } finally {
            delBtn.disabled = false;
          }
        });
        return tr;
      }

      loadLocations().catch((err) => {
        const msg = err && err.message ? err.message : err;
        setStatus('Ошибка: ' + msg, 'error');
      });

      addBtn.addEventListener('click', async () => {
        const languageCode = String(newLang.value || '').trim();
        const title = String(newTitle.value || '').trim();
        const description = String(newDesc.value || '').trim();
        const lat = Number(newLat.value);
        const lng = Number(newLng.value);
        if (!languageCode) {
          setStatus('Язык обязателен', 'error');
          return;
        }
        if (!title || !description) {
          setStatus('Название и описание обязательны', 'error');
          return;
        }
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          setStatus('Lat и Lng обязательны', 'error');
          return;
        }
        addBtn.disabled = true;
        try {
          const res = await fetch('/admin/api/locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng, title, description, language_code: languageCode }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            const msg = data?.message || data?.error || 'Ошибка добавления';
            throw new Error(msg);
          }
          newTitle.value = '';
          newDesc.value = '';
          newLat.value = '';
          newLng.value = '';
          await loadLocations();
        } catch (err) {
          const msg = err && err.message ? err.message : err;
          setStatus('Ошибка: ' + msg, 'error');
        } finally {
          addBtn.disabled = false;
        }
      });
    </script>
    ${theme.script}
  </body>
</html>`;
  }

  @Get('scenes')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getScenesAdmin(): string {
    const theme = renderThemeToggle();
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Admin · Scenes</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Segoe UI", Arial, sans-serif;
        background: linear-gradient(135deg, #f8f6f1 0%, #f2f7ff 100%);
        color: #1f2a44;
      }
      ${theme.style}
      .wrap {
        max-width: 1100px;
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
      }
      h1 { margin: 0 0 16px; font-size: 28px; }
      p { margin: 0 0 24px; color: #4a5875; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #e6ecf8; vertical-align: top; }
      th { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7a99; }
      input[type="text"], select, textarea {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #ccd6eb;
        border-radius: 8px;
        background: #f9fbff;
        font: inherit;
        color: inherit;
      }
      textarea {
        min-height: 88px;
        resize: vertical;
      }
      .actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        margin-top: 16px;
        align-items: end;
      }
      .actions button {
        width: fit-content;
      }
      button {
        border: 0;
        padding: 10px 16px;
        border-radius: 10px;
        background: #2d6cdf;
        color: white;
        font-size: 14px;
        cursor: pointer;
      }
      button.delete { background: #d9534f; }
      button:disabled { background: #9db7ea; cursor: not-allowed; }
      .status { padding: 10px; border-radius: 10px; background: #f1f5ff; color: #2d3b5e; }
      .status.error { background: #fff1f1; color: #8a2b2b; }
      .status.success { background: #eefaf1; color: #1f6a37; }
      .hint {
        margin-top: 10px;
        color: #6b7a99;
        font-size: 13px;
      }
      code { word-break: break-all; }
    </style>
  </head>
  <body>
    ${theme.html}
    <div class="wrap">
      <h1>Scenes</h1>
      <p>Список сцен из таблицы <code>scenes</code>. Можно добавить сцену с переводами и удалить её.</p>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Location ID</th>
            <th>Quest ID</th>
            <th>Тип</th>
            <th>Язык</th>
            <th>Название</th>
            <th>Описание</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="rows"></tbody>
      </table>
      <div class="actions" style="margin-top: 20px;">
        <select id="new-location-id">
          <option value="">Выберите локацию</option>
        </select>
        <select id="new-quest-id">
          <option value="">Выберите квест</option>
        </select>
        <select id="new-scene-type">
          <option value="before" selected>before</option>
          <option value="during">during</option>
          <option value="after">after</option>
        </select>
        <select id="new-lang">
          <option value="ru" selected>Русский</option>
          <option value="en">English</option>
          <option value="pl">Polski</option>
          <option value="es">Español</option>
          <option value="uk">Українська</option>
        </select>
        <input id="new-title" type="text" placeholder="название" />
        <input id="new-desc" type="text" placeholder="описание" />
        <button id="add-btn">Добавить</button>
      </div>
      <div class="hint">Для добавления нужны существующие <code>location_id</code> и <code>quest_id</code>.</div>
      <div class="actions">
        <div id="status" class="status">Загружаю...</div>
      </div>
    </div>

    <script>
      const rowsEl = document.getElementById('rows');
      const statusEl = document.getElementById('status');
      const addBtn = document.getElementById('add-btn');
      const newLocationId = document.getElementById('new-location-id');
      const newQuestId = document.getElementById('new-quest-id');
      const newSceneType = document.getElementById('new-scene-type');
      const newLang = document.getElementById('new-lang');
      const newTitle = document.getElementById('new-title');
      const newDesc = document.getElementById('new-desc');

      function setStatus(text, kind) {
        statusEl.textContent = text;
        statusEl.classList.remove('error', 'success');
        if (kind) statusEl.classList.add(kind);
      }

      function populateSelect(selectEl, items, placeholder) {
        const previousValue = selectEl.value;
        selectEl.innerHTML = '';
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = placeholder;
        selectEl.appendChild(placeholderOption);
        items.forEach((item) => {
          const option = document.createElement('option');
          option.value = item.value;
          option.textContent = item.label;
          selectEl.appendChild(option);
        });
        if (items.some((item) => item.value === previousValue)) {
          selectEl.value = previousValue;
        }
      }

      async function loadLocationOptions() {
        const res = await fetch('/admin/api/locations');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || data?.error || 'Ошибка загрузки локаций');
        }
        const byId = new Map();
        data.forEach((item) => {
          if (!byId.has(item.id)) {
            byId.set(item.id, {
              value: item.id,
              label:
                (item.title ? item.title + ' ' : '') +
                '(' + item.lat + ', ' + item.lng + ') [' + item.id + ']',
            });
          }
        });
        populateSelect(
          newLocationId,
          Array.from(byId.values()),
          'Выберите локацию'
        );
      }

      async function loadQuestOptions() {
        const lang = String(newLang.value || 'ru').trim();
        const res = await fetch('/admin/api/quests?lang=' + encodeURIComponent(lang));
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || data?.error || 'Ошибка загрузки квестов');
        }
        populateSelect(
          newQuestId,
          data.map((item) => ({
            value: item.id,
            label:
              (item.title || 'Без названия') +
              ' [' + item.id + ']',
          })),
          'Выберите квест'
        );
      }

      async function loadFormOptions() {
        await Promise.all([loadLocationOptions(), loadQuestOptions()]);
      }

      async function loadScenes() {
        setStatus('Загружаю...', null);
        const res = await fetch('/admin/api/scenes');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || data?.error || 'Ошибка загрузки');
        }
        rowsEl.innerHTML = '';
        data.forEach((item) => rowsEl.appendChild(renderRow(item)));
        setStatus('Готово', 'success');
      }

      function renderRow(item) {
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td><code>' + item.id + '</code></td>' +
          '<td><code>' + item.locationId + '</code></td>' +
          '<td><code>' + item.questId + '</code></td>' +
          '<td>' + item.sceneType + '</td>' +
          '<td>' + (item.languageCode || '') + '</td>' +
          '<td>' + (item.title || '') + '</td>' +
          '<td>' + (item.description || '') + '</td>' +
          '<td><button class="delete">Удалить</button></td>';

        const delBtn = tr.querySelector('button.delete');
        delBtn.addEventListener('click', async () => {
          if (!confirm('Удалить сцену?')) return;
          delBtn.disabled = true;
          try {
            const res = await fetch('/admin/api/scenes/' + encodeURIComponent(item.id), {
              method: 'DELETE',
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
              const msg = data?.message || data?.error || 'Ошибка удаления';
              throw new Error(msg);
            }
            await loadScenes();
          } catch (err) {
            const msg = err && err.message ? err.message : err;
            setStatus('Ошибка: ' + msg, 'error');
          } finally {
            delBtn.disabled = false;
          }
        });
        return tr;
      }

      Promise.all([loadScenes(), loadFormOptions()]).catch((err) => {
        const msg = err && err.message ? err.message : err;
        setStatus('Ошибка: ' + msg, 'error');
      });

      newLang.addEventListener('change', () => {
        loadQuestOptions().catch((err) => {
          const msg = err && err.message ? err.message : err;
          setStatus('Ошибка: ' + msg, 'error');
        });
      });

      addBtn.addEventListener('click', async () => {
        const locationId = String(newLocationId.value || '').trim();
        const questId = String(newQuestId.value || '').trim();
        const sceneType = String(newSceneType.value || '').trim();
        const languageCode = String(newLang.value || '').trim();
        const title = String(newTitle.value || '').trim();
        const description = String(newDesc.value || '').trim();
        if (!locationId || !questId) {
          setStatus('Location ID и Quest ID обязательны', 'error');
          return;
        }
        if (!sceneType) {
          setStatus('Тип сцены обязателен', 'error');
          return;
        }
        if (!languageCode) {
          setStatus('Язык обязателен', 'error');
          return;
        }
        if (!title || !description) {
          setStatus('Название и описание обязательны', 'error');
          return;
        }
        addBtn.disabled = true;
        try {
          const res = await fetch('/admin/api/scenes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location_id: locationId,
              quest_id: questId,
              scene_type: sceneType,
              title,
              description,
              language_code: languageCode,
            }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            const msg = data?.message || data?.error || 'Ошибка добавления';
            throw new Error(msg);
          }
          newLocationId.value = '';
          newQuestId.value = '';
          newSceneType.value = 'before';
          newTitle.value = '';
          newDesc.value = '';
          await Promise.all([loadScenes(), loadFormOptions()]);
        } catch (err) {
          const msg = err && err.message ? err.message : err;
          setStatus('Ошибка: ' + msg, 'error');
        } finally {
          addBtn.disabled = false;
        }
      });
    </script>
    ${theme.script}
  </body>
</html>`;
  }

  @Get('api/ui')
  async listUi(): Promise<Array<{ id: string; name: string }>> {
    const rows = await this.dataSource.query(
      'SELECT id, name FROM ui ORDER BY id ASC'
    );
    return rows.map((row: { id: string; name: string }) => ({
      id: String(row.id),
      name: row.name,
    }));
  }

  @Post('api/ui')
  async createUi(
    @Body() body: { name?: string }
  ): Promise<{ id: string; name: string }> {
    const name = (body.name ?? '').trim();
    if (!name) {
      throw new BadRequestException('Name is required');
    }

    try {
      const rows = await this.dataSource.query(
        'INSERT INTO ui (name) VALUES ($1) RETURNING id, name',
        [name]
      );
      return { id: String(rows[0].id), name: rows[0].name };
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : 'Insert failed';
      throw new BadRequestException(message);
    }
  }

  @Delete('api/ui/:id')
  async deleteUiItem(@Param('id') id: string): Promise<{ ok: true }> {
    const rows = await this.dataSource.query(
      'DELETE FROM ui WHERE id = $1 RETURNING id',
      [id]
    );
    if (!rows.length) {
      throw new NotFoundException('UI item not found');
    }
    return { ok: true };
  }

  @Get('api/scenes')
  async listScenes(): Promise<
    Array<{
      id: string;
      locationId: string;
      questId: string;
      sceneType: string;
      languageCode: string | null;
      title: string | null;
      description: string | null;
    }>
  > {
    const rows = await this.dataSource.query(
      `SELECT s.id,
              s.location_id,
              s.quest_id,
              s.scene_type,
              st.language_code,
              st.title,
              st.description
         FROM scenes s
         LEFT JOIN scene_translations st
           ON st.scene_id = s.id
        ORDER BY s.id ASC, st.language_code ASC`
    );
    return rows.map(
      (row: {
        id: string;
        location_id: string;
        quest_id: string;
        scene_type: string;
        language_code: string | null;
        title: string | null;
        description: string | null;
      }) => ({
        id: String(row.id),
        locationId: String(row.location_id),
        questId: String(row.quest_id),
        sceneType: String(row.scene_type),
        languageCode: row.language_code ?? null,
        title: row.title ?? null,
        description: row.description ?? null,
      })
    );
  }

  @Post('api/scenes')
  async createScene(
    @Body()
    body: {
      location_id?: string;
      quest_id?: string;
      scene_type?: string;
      title?: string;
      description?: string;
      language_code?: string;
    }
  ): Promise<{
    id: string;
    locationId: string;
    questId: string;
    sceneType: string;
    languageCode: string;
    title: string | null;
    description: string | null;
  }> {
    try {
      if (!body || typeof body !== 'object') {
        throw new BadRequestException('Request body is required');
      }
      const locationId = String(body.location_id || '').trim();
      const questId = String(body.quest_id || '').trim();
      const sceneType = String(body.scene_type || '')
        .trim()
        .toLowerCase();
      const languageCode = String(body.language_code || '')
        .trim()
        .toLowerCase();
      const title = (body.title ?? '').trim();
      const description = (body.description ?? '').trim();
      if (!locationId || !questId) {
        throw new BadRequestException('Location id and quest id are required');
      }
      if (!['before', 'during', 'after'].includes(sceneType)) {
        throw new BadRequestException(
          'Scene type must be one of: before, during, after'
        );
      }
      if (!languageCode) {
        throw new BadRequestException('Language code is required');
      }
      if (!title || !description) {
        throw new BadRequestException('Title and description are required');
      }
      const allowedLanguages = ['en', 'pl', 'ru', 'uk', 'es'];
      let translations: Array<{
        code: string;
        title: string;
        description: string;
      }> = [];
      try {
        const availableLanguages = await getLibreLanguages();
        const targetLanguages = availableLanguages.filter((code) =>
          allowedLanguages.includes(code)
        );
        if (!targetLanguages.length) {
          throw new Error('LibreTranslate returned no allowed languages');
        }
        if (!targetLanguages.includes(languageCode)) {
          throw new Error(`Language ${languageCode} is not supported`);
        }
        for (const code of targetLanguages) {
          if (code === languageCode) {
            translations.push({ code, title, description });
            continue;
          }
          const translatedTitle = await translateText(
            title,
            languageCode,
            code
          );
          const translatedDescription = await translateText(
            description,
            languageCode,
            code
          );
          translations.push({
            code,
            title: translatedTitle,
            description: translatedDescription,
          });
        }
      } catch (err) {
        console.warn(
          '[LibreTranslate] Scene translation failed, saving source only:',
          err
        );
        translations = [{ code: languageCode, title, description }];
      }
      const result = await this.dataSource.transaction(async (manager) => {
        const rows = await manager.query(
          `INSERT INTO scenes (location_id, quest_id, scene_type)
           VALUES ($1, $2, $3)
           RETURNING id, location_id, quest_id, scene_type`,
          [locationId, questId, sceneType]
        );
        const sceneId = rows[0]?.id;
        if (!sceneId) {
          throw new Error('Scene id not returned');
        }
        for (const item of translations) {
          await manager.query(
            `INSERT INTO scene_translations
               (id, scene_id, language_code, title, description)
             VALUES (uuid_generate_v4(), $1, $2, $3, $4)`,
            [sceneId, item.code, item.title, item.description]
          );
        }
        return {
          id: String(sceneId),
          locationId: String(rows[0].location_id),
          questId: String(rows[0].quest_id),
          sceneType: String(rows[0].scene_type),
          languageCode,
          title,
          description,
        };
      });
      return result;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : 'Insert failed';
      throw new BadRequestException(message);
    }
  }

  @Delete('api/scenes/:id')
  async deleteScene(@Param('id') id: string): Promise<{ ok: true }> {
    const deleted = await this.dataSource.transaction(async (manager) => {
      await manager.query(
        'DELETE FROM scene_translations WHERE scene_id = $1',
        [id]
      );
      const rows = await manager.query(
        'DELETE FROM scenes WHERE id = $1 RETURNING id',
        [id]
      );
      return rows.length > 0;
    });
    if (!deleted) {
      throw new NotFoundException('Scene not found');
    }
    return { ok: true };
  }

  @Get('api/locations')
  async listLocations(): Promise<
    Array<{
      id: string;
      lat: number;
      lng: number;
      languageCode: string | null;
      title: string | null;
      description: string | null;
    }>
  > {
    const rows = await this.dataSource.query(
      `SELECT l.id, l.lat, l.lng, lt.language_code, lt.title, lt.description
       FROM locations l
       LEFT JOIN location_translations lt
         ON lt.location_id = l.id
       ORDER BY l.id ASC, lt.language_code ASC`
    );
    return rows.map(
      (row: {
        id: string;
        lat: number | string;
        lng: number | string;
        language_code: string | null;
        title: string | null;
        description: string | null;
      }) => ({
        id: String(row.id),
        lat: Number(row.lat),
        lng: Number(row.lng),
        languageCode: row.language_code ?? null,
        title: row.title ?? null,
        description: row.description ?? null,
      })
    );
  }

  @Post('api/locations')
  async createLocation(
    @Body()
    body: {
      lat?: number;
      lng?: number;
      title?: string;
      description?: string;
      language_code?: string;
    }
  ): Promise<{
    id: string;
    lat: number;
    lng: number;
    languageCode: string;
    title: string | null;
    description: string | null;
  }> {
    try {
      if (!body || typeof body !== 'object') {
        throw new BadRequestException('Request body is required');
      }
      const languageCode = String(body.language_code || '')
        .trim()
        .toLowerCase();
      const title = (body.title ?? '').trim();
      const description = (body.description ?? '').trim();
      const lat = Number(body.lat);
      const lng = Number(body.lng);
      if (!languageCode) {
        throw new BadRequestException('Language code is required');
      }
      if (!title || !description) {
        throw new BadRequestException('Title and description are required');
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new BadRequestException('Lat and lng are required');
      }
      const allowedLanguages = ['en', 'pl', 'ru', 'uk', 'es'];
      let translations: Array<{
        code: string;
        title: string;
        description: string;
      }> = [];
      try {
        const availableLanguages = await getLibreLanguages();
        const targetLanguages = availableLanguages.filter((code) =>
          allowedLanguages.includes(code)
        );
        if (!targetLanguages.length) {
          throw new Error('LibreTranslate returned no allowed languages');
        }
        if (!targetLanguages.includes(languageCode)) {
          throw new Error(`Language ${languageCode} is not supported`);
        }
        for (const code of targetLanguages) {
          if (code === languageCode) {
            translations.push({ code, title, description });
            continue;
          }
          const translatedTitle = await translateText(
            title,
            languageCode,
            code
          );
          const translatedDescription = await translateText(
            description,
            languageCode,
            code
          );
          translations.push({
            code,
            title: translatedTitle,
            description: translatedDescription,
          });
        }
      } catch (err) {
        console.warn(
          '[LibreTranslate] Location translation failed, saving source only:',
          err
        );
        translations = [{ code: languageCode, title, description }];
      }
      const result = await this.dataSource.transaction(async (manager) => {
        const rows = await manager.query(
          'INSERT INTO locations (lat, lng) VALUES ($1, $2) RETURNING id, lat, lng',
          [lat, lng]
        );
        const locationId = rows[0]?.id;
        if (!locationId) {
          throw new Error('Location id not returned');
        }
        for (const item of translations) {
          await manager.query(
            `INSERT INTO location_translations
               (id, location_id, language_code, title, description)
             VALUES (uuid_generate_v4(), $1, $2, $3, $4)`,
            [locationId, item.code, item.title, item.description]
          );
        }
        return {
          id: String(locationId),
          lat: Number(rows[0].lat),
          lng: Number(rows[0].lng),
          languageCode,
          title,
          description,
        };
      });
      return result;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : 'Insert failed';
      throw new BadRequestException(message);
    }
  }

  @Delete('api/locations/:id')
  async deleteLocation(@Param('id') id: string): Promise<{ ok: true }> {
    const rows = await this.dataSource.query(
      'DELETE FROM locations WHERE id = $1 RETURNING id',
      [id]
    );
    if (!rows.length) {
      throw new NotFoundException('Location not found');
    }
    return { ok: true };
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

  @Get('api/quests')
  async listQuests(@Query('lang') lang?: string): Promise<
    Array<{
      id: string;
      duration: number;
      distance: number;
      difficulty: number;
      price: number;
      is_active: boolean;
      title?: string;
      district?: string;
      city?: string;
      description?: string;
    }>
  > {
    const language = (lang ?? '').trim();
    const defaultLangSql =
      '(SELECT code FROM languages WHERE is_default = true LIMIT 1)';

    const qb = this.dataSource
      .createQueryBuilder(QuestRecord, 'q')
      .leftJoin(
        QuestTranslation,
        't_lang',
        language
          ? 't_lang.quest_id = q.id AND t_lang.language_code = :lang'
          : `t_lang.quest_id = q.id AND t_lang.language_code = ${defaultLangSql}`
      )
      .leftJoin(
        QuestTranslation,
        't_def',
        `t_def.quest_id = q.id AND t_def.language_code = ${defaultLangSql}`
      )
      .select([
        'q.id as id',
        'q.duration as duration',
        'q.distance as distance',
        'q.difficulty as difficulty',
        'q.price as price',
        'q.is_active as is_active',
        language
          ? 'COALESCE(t_lang.title, t_def.title) as title'
          : 't_lang.title as title',
        language
          ? 'COALESCE(t_lang.district, t_def.district) as district'
          : 't_lang.district as district',
        language
          ? 'COALESCE(t_lang.city, t_def.city) as city'
          : 't_lang.city as city',
        language
          ? 'COALESCE(t_lang.description, t_def.description) as description'
          : 't_lang.description as description',
      ])
      .orderBy('q.created_at', 'DESC');

    if (language) {
      qb.setParameter('lang', language);
    }

    const rows = await qb.getRawMany();

    return rows.map((row) => ({
      id: row.id,
      duration: Number(row.duration),
      distance: Number(row.distance),
      difficulty: Number(row.difficulty),
      price: Number(row.price),
      is_active: row.is_active === true || row.is_active === 't',
      title: row.title ?? undefined,
      district: row.district ?? undefined,
      city: row.city ?? undefined,
      description: row.description ?? undefined,
    }));
  }

  @Delete('api/quests/:id')
  async deleteQuest(@Param('id') id: string): Promise<{ ok: true }> {
    const existing = await this.questRecordRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Quest not found');
    }
    await this.questRecordRepo.delete({ id });
    return { ok: true };
  }
}
