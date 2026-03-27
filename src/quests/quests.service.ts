import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Quest } from './quest.entity.js';
import { QuestRecord } from './quest-record.entity.js';
import { QuestTranslation } from './quest-translation.entity.js';
import { getLibreLanguages, translateText } from '../common/libretranslate.js';

export interface CreateQuestInput {
  duration: number;
  distance: number;
  difficulty: number;
  price: number;
  is_active: boolean;
  title: string;
  description: string;
  district: string;
  city: string;
  language_code?: string;
}

@Injectable()
export class QuestsService {
  constructor(
    @InjectRepository(Quest)
    private readonly questRepo: Repository<Quest>,
    private readonly dataSource: DataSource
  ) {}

  async create(
    title: string,
    description: string,
    playerId?: string
  ): Promise<Quest> {
    const quest = this.questRepo.create({
      title,
      description,
      status: 'pending',
      playerId,
    });
    return this.questRepo.save(quest);
  }

  async findAll(): Promise<Quest[]> {
    return this.questRepo.find({ relations: ['player'] });
  }

  async findByPlayer(playerId: string): Promise<Quest[]> {
    return this.questRepo.find({ where: { playerId }, relations: ['player'] });
  }

  async findById(id: string): Promise<Quest | null> {
    return this.questRepo.findOne({ where: { id }, relations: ['player'] });
  }

  async updateStatus(
    id: string,
    status: 'active' | 'completed' | 'pending'
  ): Promise<Quest | null> {
    await this.questRepo.update(id, { status });
    return this.findById(id);
  }

  async updateProgress(
    id: string,
    visitedPointIds: string[]
  ): Promise<Quest | null> {
    const quest = await this.findById(id);
    if (!quest) return null;

    const progress = { visitedPointIds };
    let nextStatus = quest.status;

    if (
      quest.objectives?.type === 'visit_points' &&
      visitedPointIds.length >= quest.objectives.requiredCount
    ) {
      nextStatus = 'completed';
    }

    await this.questRepo.update(id, { progress, status: nextStatus });
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.questRepo.delete(id);
  }

  async createQuest(input: CreateQuestInput): Promise<QuestRecord> {
    const languageCode = String(input.language_code || 'ru')
      .trim()
      .toLowerCase();

    return this.dataSource.transaction(async (manager) => {
      const quest = manager.create(QuestRecord, {
        duration: input.duration,
        distance: input.distance,
        difficulty: input.difficulty,
        price: input.price,
        isActive: input.is_active,
      });

      const savedQuest = await manager.save(quest);

      const translations: QuestTranslation[] = [];
      const makeTranslation = (data: {
        questId: string;
        languageCode: string;
        title: string;
        description: string;
        district: string;
        city: string;
      }) =>
        manager.create(QuestTranslation, {
          id: randomUUID(),
          ...data,
        });
      const allowedLanguages = ['en', 'es', 'pl', 'ru', 'uk'];
      try {
        const availableLanguages = await getLibreLanguages();
        const targetLanguages = availableLanguages.filter((code) =>
          allowedLanguages.includes(code)
        );
        if (!targetLanguages.length) {
          throw new Error('LibreTranslate returned no allowed languages');
        }
        if (!targetLanguages.includes(languageCode)) {
          throw new Error(`Language ${languageCode} is not supported`);
        }

        for (const code of targetLanguages) {
          if (code === languageCode) {
            translations.push(
              makeTranslation({
                questId: savedQuest.id,
                languageCode: code,
                title: input.title,
                description: input.description,
                district: input.district,
                city: input.city,
              })
            );
            continue;
          }
          const title = await translateText(input.title, languageCode, code);
          const description = await translateText(
            input.description,
            languageCode,
            code
          );
          const district = await translateText(
            input.district,
            languageCode,
            code
          );
          const city = await translateText(input.city, languageCode, code);
          translations.push(
            makeTranslation({
              questId: savedQuest.id,
              languageCode: code,
              title,
              description,
              district,
              city,
            })
          );
        }
      } catch (err) {
        console.warn(
          '[LibreTranslate] Quest translation failed, saving source only:',
          err
        );
        translations.push(
          makeTranslation({
            questId: savedQuest.id,
            languageCode,
            title: input.title,
            description: input.description,
            district: input.district,
            city: input.city,
          })
        );
      }

      await manager.save(QuestTranslation, translations);
      return savedQuest;
    });
  }
}
