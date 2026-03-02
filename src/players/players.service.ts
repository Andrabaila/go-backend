import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './player.entity.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>
  ) {}

  async create(username: string): Promise<Player> {
    const player = this.playerRepo.create({ username });
    return this.playerRepo.save(player);
  }

  async findAll(): Promise<Player[]> {
    return this.playerRepo.find();
  }

  async findById(id: string): Promise<Player | null> {
    return this.playerRepo.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<Player | null> {
    return this.playerRepo.findOne({ where: { email } });
  }

  async register(
    username: string,
    email: string,
    password: string
  ): Promise<Player> {
    // хэшируем пароль перед сохранением
    const passwordHash = await bcrypt.hash(password, 10);

    // создаем нового игрока с правильными полями
    const newPlayer = this.playerRepo.create({
      username,
      email,
      passwordHash, // 👈 правильное имя поля
    });

    return await this.playerRepo.save(newPlayer);
  }
}
