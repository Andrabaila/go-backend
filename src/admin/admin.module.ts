import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller.js';
import { Language } from '../quests/language.entity.js';
import { QuestRecord } from '../quests/quest-record.entity.js';
import { QuestTranslation } from '../quests/quest-translation.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Language, QuestRecord, QuestTranslation]),
  ],
  controllers: [AdminController],
})
export class AdminModule {}
