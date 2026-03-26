import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { NextFunction, Request, Response } from 'express';

dotenv.config();

// Получаем эквивалент __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap() {
  let app;
  let https = false;

  try {
    // Попробуем несколько стандартных имён сертификатов в папке `cert`.
    const certDir = path.join(__dirname, '..', 'cert');
    const candidatePairs: Array<[string, string]> = [
      ['key.pem', 'cert.pem'],
      ['localhost+2-key.pem', 'localhost+2.pem'],
      ['localhost+1-key.pem', 'localhost+1.pem'],
      ['localhost-key.pem', 'localhost.pem'],
    ];

    let httpsOptions: { key: Buffer; cert: Buffer } | null = null;

    for (const [keyName, certName] of candidatePairs) {
      const keyPath = path.join(certDir, keyName);
      const certPath = path.join(certDir, certName);
      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        httpsOptions = {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        };
        console.log(`🔐 Using certs: ${keyName}, ${certName}`);
        break;
      }
    }

    if (httpsOptions) {
      app = await NestFactory.create(AppModule, { httpsOptions });
      https = true;
      console.log('✅ Running with local HTTPS');
    } else {
      // Если сертификатов нет — просто HTTP (например, на хостинге HTTPS обеспечивает прокси)
      app = await NestFactory.create(AppModule);
      console.log(
        '⚠️ Certificates not found in cert/, running on HTTP (proxy provides HTTPS)'
      );
    }
  } catch (err) {
    // В случае любой ошибки — fallback на HTTP
    console.error('❌ HTTPS setup failed, falling back to HTTP:', err);
    app = await NestFactory.create(AppModule);
  }

  const allowedOrigins = new Set(
    (process.env.CLIENT_URLS || '')
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean)
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (!origin) {
      return next();
    }

    const isLocalhost =
      origin.startsWith('http://localhost') ||
      origin.startsWith('https://localhost');
    const isTailnet = origin.endsWith('.tail1d4748.ts.net');
    let isSameHost = false;
    try {
      const originHost = new URL(origin).host;
      const requestHost = req.get('host');
      isSameHost = Boolean(requestHost && originHost === requestHost);
    } catch {
      isSameHost = false;
    }

    if (allowedOrigins.has(origin) || isLocalhost || isTailnet || isSameHost) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header(
        'Access-Control-Allow-Methods',
        'GET,HEAD,PUT,PATCH,POST,DELETE'
      );
      const reqHeaders = req.headers['access-control-request-headers'];
      res.header(
        'Access-Control-Allow-Headers',
        reqHeaders ? String(reqHeaders) : 'Content-Type, Authorization'
      );
      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }
      return next();
    }

    return res.status(403).send('Not allowed by CORS');
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(
    `🚀 Server running on ${https ? 'https' : 'http'}://localhost:${port}`
  );
}

bootstrap().catch((err) => {
  console.error('❌ Failed to bootstrap:', err);
  process.exit(1);
});
