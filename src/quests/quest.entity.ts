import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Player } from '../players/player.entity.js';

export interface QuestObjectivePoint {
  id: string;
  label?: string;
  lat?: number;
  lng?: number;
}

export interface QuestObjectivesVisitPoints {
  type: 'visit_points';
  requiredCount: number;
  radiusMeters: number;
  points: QuestObjectivePoint[];
}

export type QuestObjectives = QuestObjectivesVisitPoints;

export interface QuestProgress {
  visitedPointIds?: string[];
}

export interface QuestReward {
  gold?: number;
  item?: string;
}

@Entity()
export class Quest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column({ type: 'enum', enum: ['active', 'completed', 'pending'] })
  status!: 'active' | 'completed' | 'pending';

  @Column({ type: 'jsonb', nullable: true })
  objectives?: QuestObjectives;

  @Column({ type: 'jsonb', nullable: true })
  progress?: QuestProgress;

  @Column({ type: 'jsonb', nullable: true })
  reward?: QuestReward;

  @ManyToOne(() => Player, { nullable: true })
  @JoinColumn({ name: 'playerId' })
  player?: Player;

  @Column({ nullable: true })
  playerId?: string;
}
