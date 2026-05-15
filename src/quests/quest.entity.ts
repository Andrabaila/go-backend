import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity.js';

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

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'playerId' })
  player?: User;

  @Column({ nullable: true })
  playerId?: string;
}
