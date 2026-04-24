import 'dotenv/config';
import { URL } from 'node:url';

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
import { requireEnv } from './common/env.js';

function getDatabaseHost(): string {
  return process.env.DATABASE_HOST || 'localhost';
}

async function getDatabaseConnectionOptions(): Promise<TypeOrmModuleOptions> {
  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      const dbName = parsed.pathname.replace('/', '');
      console.log(
        `[DB] Using DATABASE_URL host=${parsed.hostname} port=${parsed.port || '5432'} database=${dbName}`
      );
    } catch {
      console.log('[DB] Using DATABASE_URL for PostgreSQL connection');
    }
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
  const port = Number(requireEnv('DATABASE_PORT'));
  const database = requireEnv('DATABASE_NAME');
  const username = requireEnv('DATABASE_USERNAME');
  const password = requireEnv('DATABASE_PASSWORD');

  console.log(
    `[DB] Using env PostgreSQL connection host=${primaryHost} port=${port} database=${database}`
  );

  return {
    type: 'postgres',
    host: primaryHost,
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
