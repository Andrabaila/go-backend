import { Controller, Get, Header } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { renderDbStatusBar } from './common/db-status.js';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dataSource: DataSource
  ) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getHello(): string {
    const dbStatus = renderDbStatusBar(this.dataSource);
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
    ${dbStatus.html}
    <div class="wrap">
      <h1>Backend</h1>
      <p>${greeting}</p>
    </div>
  </body>
</html>`;
  }
}
