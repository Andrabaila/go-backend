import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { QuestRecord } from './quest-record.entity.js';

@Entity({ name: 'quest_translations' })
@Index(['questId', 'languageCode'], { unique: true })
export class QuestTranslation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'quest_id', type: 'uuid' })
  questId!: string;

  @Column({ name: 'language_code', type: 'varchar', length: 16 })
  languageCode!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text' })
  district!: string;

  @Column({ type: 'text' })
  city!: string;

  @ManyToOne(() => QuestRecord, (quest) => quest.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quest_id' })
  quest?: QuestRecord;
}
