import 'dotenv/config';
import net from 'node:net';

import { Module } from '@nestjs/common';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { PlayersModule } from './players/players.module.js';
import { GameObjectsModule } from './game-objects/game-objects.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { TileModule } from './tiles/tile.module.js';
import { QuestsModule } from './quests/quests.module.js';
import { AdminModule } from './admin/admin.module.js';

import { Player } from './players/player.entity.js';
import { User } from './users/user.entity.js';
import { Quest } from './quests/quest.entity.js';
import { QuestRecord } from './quests/quest-record.entity.js';
import { QuestTranslation } from './quests/quest-translation.entity.js';
import { Language } from './quests/language.entity.js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getDatabaseHost(): string {
  return (
    process.env.DATABASE_HOST ||
    process.env.DATABASE_HOST_FALLBACK ||
    'localhost'
  );
}

function canReachHost(
  host: string,
  port: number,
  timeoutMs = 1500
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let resolved = false;

    const finish = (isReachable: boolean) => {
      if (resolved) {
        return;
      }
      resolved = true;
      socket.destroy();
      resolve(isReachable);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function getDatabaseConnectionOptions(): Promise<TypeOrmModuleOptions> {
  if (process.env.DATABASE_URL) {
    console.log('[DB] Using DATABASE_URL for PostgreSQL connection');
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      entities: [Player, User, Quest, QuestRecord, QuestTranslation, Language],
      synchronize: true,
    };
  }

  const primaryHost = getDatabaseHost();
  const fallbackHost = process.env.DATABASE_HOST_FALLBACK;
  const port = Number(requireEnv('DATABASE_PORT'));
  const database = requireEnv('DATABASE_NAME');
  const username = requireEnv('DATABASE_USERNAME');
  const password = requireEnv('DATABASE_PASSWORD');
  let selectedHost = primaryHost;

  if (fallbackHost && fallbackHost !== primaryHost) {
    const primaryReachable = await canReachHost(primaryHost, port);
    if (!primaryReachable) {
      console.warn(
        `[DB] Primary host ${primaryHost}:${port} is unreachable. Falling back to ${fallbackHost}:${port}`
      );
      selectedHost = fallbackHost;
    }
  }

  console.log(
    `[DB] Using env PostgreSQL connection host=${selectedHost} port=${port} database=${database}`
  );

  return {
    type: 'postgres',
    host: selectedHost,
    port,
    username,
    password,
    database,
    entities: [Player, User, Quest, QuestRecord, QuestTranslation, Language],
    synchronize: true,
  };
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: getDatabaseConnectionOptions,
    }),
    PlayersModule,
    GameObjectsModule,
    AuthModule,
    UsersModule,
    TileModule,
    QuestsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
