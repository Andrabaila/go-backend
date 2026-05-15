import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quest } from './quest.entity.js';
import { QuestRecord } from './quest-record.entity.js';
import { QuestTranslation } from './quest-translation.entity.js';
import { Language } from './language.entity.js';
import { QuestsService } from './quests.service.js';
import { MyQuestsController, QuestsController } from './quests.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quest, QuestRecord, QuestTranslation, Language]),
  ],
  providers: [QuestsService],
  controllers: [QuestsController, MyQuestsController],
  exports: [QuestsService],
})
export class QuestsModule {}
