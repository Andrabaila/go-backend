import { Module } from '@nestjs/common';
import { GameObjectsService } from './game-objects.service.js';
import { GameObjectsController } from './game-objects.controller.js';

@Module({
  providers: [GameObjectsService],
  controllers: [GameObjectsController],
})
export class GameObjectsModule {}
