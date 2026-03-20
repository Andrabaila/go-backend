import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { QuestTranslation } from './quest-translation.entity.js';

@Entity({ name: 'quests' })
export class QuestRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  duration!: number;

  @Column({ type: 'double precision' })
  distance!: number;

  @Column({ type: 'int' })
  difficulty!: number;

  @Column({ type: 'double precision' })
  price!: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => QuestTranslation, (translation) => translation.quest)
  translations?: QuestTranslation[];
}
