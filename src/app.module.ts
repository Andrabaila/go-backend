import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { PlayersModule } from './players/players.module.js';
import { GameObjectsModule } from './game-objects/game-objects.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { TileModule } from './tiles/tile.module.js';
import { QuestsModule } from './quests/quests.module.js';

import { Player } from './players/player.entity.js';
import { User } from './users/user.entity.js';
import { Quest } from './quests/quest.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',

      ...(process.env.DATABASE_URL
        ? {
            url: process.env.DATABASE_URL,
            ssl: {
              rejectUnauthorized: false,
            },
          }
        : {
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: 'very-secret-password',
            database: 'go_game',
          }),

      entities: [Player, User, Quest],
      synchronize: true,
    }),
    PlayersModule,
    GameObjectsModule,
    AuthModule,
    UsersModule,
    TileModule,
    QuestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
