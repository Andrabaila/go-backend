import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'quests', synchronize: false })
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

  // Relation removed to avoid ESM circular init; translations live in quest_translations.
}
