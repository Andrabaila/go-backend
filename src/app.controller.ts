import { Controller, Get, Header, Req } from '@nestjs/common';
import type { Request } from 'express';
import { DataSource } from 'typeorm';
import { renderDbStatusBar } from './common/db-status.js';
import { renderThemeToggle } from './common/theme-toggle.js';
import { AppService } from './app.service.js';

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

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dataSource: DataSource
  ) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getHello(@Req() req: Request): string {
    const dbStatus = renderDbStatusBar(
      this.dataSource,
      getBackendAddresses(req)
    );
    const theme = renderThemeToggle();
    const greeting = this.appService.getHello();
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Backend · Status</title>
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
        max-width: 860px;
        margin: 48px auto;
        padding: 24px;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.08);
      }
      h1 { margin: 0 0 12px; font-size: 28px; }
      p { margin: 0; color: #4a5875; }
      @media (max-width: 600px) {
        .wrap { margin: 16px; padding: 16px; border-radius: 12px; }
      }
    </style>
  </head>
  <body>
    ${theme.html}
    ${dbStatus.html}
    <div class="wrap">
      <h1>Backend</h1>
      <p>${greeting}</p>
      <p style="margin-top: 16px;">
        <a href="/admin" style="color:#2d6cdf; text-decoration:none; font-weight:600;">
          Перейти в админку
        </a>
      </p>
    </div>
    ${theme.script}
  </body>
</html>`;
  }
}
