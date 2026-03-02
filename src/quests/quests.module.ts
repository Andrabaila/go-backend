import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quest } from './quest.entity.js';
import { QuestsService } from './quests.service.js';
import { QuestsController } from './quests.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Quest])],
  providers: [QuestsService],
  controllers: [QuestsController],
  exports: [QuestsService],
})
export class QuestsModule {}
