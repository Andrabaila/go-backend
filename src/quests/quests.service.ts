import { Injectable, type OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Quest } from './quest.entity.js';
import { QuestRecord } from './quest-record.entity.js';
import { QuestTranslation } from './quest-translation.entity.js';
import { Language } from './language.entity.js';

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
}

type QuestTranslationInput = Pick<
  CreateQuestInput,
  'title' | 'description' | 'district' | 'city'
>;

@Injectable()
export class QuestsService implements OnModuleInit {
  constructor(
    @InjectRepository(Quest)
    private readonly questRepo: Repository<Quest>,
    @InjectRepository(Language)
    private readonly languageRepo: Repository<Language>,
    private readonly dataSource: DataSource
  ) {}

  async onModuleInit(): Promise<void> {
    const desiredObjectives = {
      type: 'visit_points' as const,
      requiredCount: 3,
      radiusMeters: 50,
      points: [
        { id: 'imielin-1', label: 'Метка 1', lat: 52.141771, lng: 21.025956 },
        { id: 'imielin-2', label: 'Метка 2', lat: 52.144618, lng: 21.03702 },
        { id: 'imielin-3', label: 'Метка 3', lat: 52.150143, lng: 21.025983 },
      ],
    };

    const existing = await this.questRepo.findOne({
      where: { title: 'Первый след' },
    });

    if (existing) {
      const updates: Partial<Quest> = {};
      if (!existing.objectives) {
        updates.objectives = desiredObjectives;
        updates.status = existing.status ?? 'active';
      }
      if (!existing.reward) {
        updates.reward = {
          gold: 30,
          item: 'Старый жетон',
        };
      }
      if (Object.keys(updates).length > 0) {
        await this.questRepo.update(existing.id, {
          ...updates,
        });
      }
      return;
    }

    const quest = this.questRepo.create({
      title: 'Первый след',
      description:
        'Посети 3 метки в Старом Имелине. Каждая метка засчитывается при подходе на 50 м. Награда: 30 монет и артефакт “Старый жетон”.',
      status: 'active',
      objectives: desiredObjectives,
      reward: {
        gold: 30,
        item: 'Старый жетон',
      },
    });
    await this.questRepo.save(quest);
  }

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
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }

    const languages = await this.languageRepo.find({
      order: { isDefault: 'DESC', code: 'ASC' },
    });

    if (languages.length === 0) {
      throw new Error('No languages found in languages table');
    }

    const defaultLanguage =
      languages.find((lang) => lang.isDefault) ?? languages[0];
    const otherLanguages = languages.filter(
      (lang) => lang.code !== defaultLanguage.code
    );

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
      translations.push(
        manager.create(QuestTranslation, {
          questId: savedQuest.id,
          languageCode: defaultLanguage.code,
          title: input.title,
          description: input.description,
          district: input.district,
          city: input.city,
        })
      );

      if (otherLanguages.length > 0) {
        const translated = await this.translateQuestFields(
          {
            title: input.title,
            description: input.description,
            district: input.district,
            city: input.city,
          },
          otherLanguages,
          apiKey
        );

        for (const lang of otherLanguages) {
          const entry = translated[lang.code];
          if (!entry) {
            throw new Error(
              `Missing translation for language ${lang.code} (${lang.name})`
            );
          }
          translations.push(
            manager.create(QuestTranslation, {
              questId: savedQuest.id,
              languageCode: lang.code,
              title: entry.title,
              description: entry.description,
              district: entry.district,
              city: entry.city,
            })
          );
        }
      }

      await manager.save(QuestTranslation, translations);
      return savedQuest;
    });
  }

  private async translateQuestFields(
    source: QuestTranslationInput,
    languages: Language[],
    apiKey: string
  ): Promise<Record<string, QuestTranslationInput>> {
    const model = process.env.OPENAI_MODEL ?? 'gpt-5-mini-2025-08-07';
    const languageList = languages
      .map((lang) => `${lang.code} (${lang.name})`)
      .join(', ');

    const prompt = [
      'Translate the quest fields into each target language.',
      'Detect the source language automatically.',
      'Return ONLY valid JSON with this shape:',
      '{ "translations": { "lang_code": { "title": "...", "description": "...", "district": "...", "city": "..." } } }',
      'Keep meaning accurate and natural; keep proper names if appropriate.',
      `Target languages: ${languageList}.`,
      'Fields to translate:',
      `title: ${source.title}`,
      `description: ${source.description}`,
      `district: ${source.district}`,
      `city: ${source.city}`,
    ].join('\\n');

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: prompt,
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const message =
        typeof data?.error?.message === 'string'
          ? data.error.message
          : 'OpenAI request failed';
      throw new Error(message);
    }

    const outputText = this.extractOutputText(data);
    const parsed = this.parseTranslations(outputText);
    return parsed;
  }

  private extractOutputText(response: unknown): string {
    const output = (response as { output?: unknown[] })?.output;
    if (!Array.isArray(output)) {
      return '';
    }

    const chunks: string[] = [];
    for (const item of output) {
      const content = (item as { content?: unknown[] })?.content;
      if (!Array.isArray(content)) {
        continue;
      }
      for (const part of content) {
        if (part && (part as { type?: string }).type === 'output_text') {
          const text = (part as { text?: string }).text;
          if (text) {
            chunks.push(text);
          }
        }
      }
    }

    return chunks.join('').trim();
  }

  private parseTranslations(
    raw: string
  ): Record<string, QuestTranslationInput> {
    const text = raw.trim();
    if (!text) {
      throw new Error('Empty translation response');
    }

    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('Translation response is not valid JSON');
    }

    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
      translations?: Record<string, QuestTranslationInput>;
    };

    if (!parsed.translations || typeof parsed.translations !== 'object') {
      throw new Error('Translation response missing translations object');
    }

    return parsed.translations;
  }
}
