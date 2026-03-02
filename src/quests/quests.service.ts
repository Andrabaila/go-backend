import { Injectable, type OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quest } from './quest.entity.js';

@Injectable()
export class QuestsService implements OnModuleInit {
  constructor(
    @InjectRepository(Quest)
    private readonly questRepo: Repository<Quest>
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
}
