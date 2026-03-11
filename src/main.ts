import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.CLIENT_URLS || '')
        .split(',')
        .map((url) => url.trim());

      // Разрешаем, если origin пустой (например, Postman) или находится в списке
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
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
