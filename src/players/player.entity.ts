import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string; // имя игрока

  @Column({ unique: true })
  email!: string; // email игрока

  @Column()
  passwordHash!: string; // хеш пароля

  @Column({ default: 0 })
  gold!: number; // игровая валюта

  @Column({ default: 1 })
  level!: number; // уровень игрока
}
