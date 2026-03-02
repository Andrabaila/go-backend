import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { PlayersService } from './players.service.js';
import { Player } from './player.entity.js';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post('register')
  async register(
    @Body('username') username: string,
    @Body('email') email: string,
    @Body('password') password: string
  ): Promise<Player> {
    // Проверка на пустые поля
    if (!username || !email || !password) {
      throw new BadRequestException('All fields are required');
    }

    // Проверяем, существует ли уже игрок с таким email
    const existing = await this.playersService.findByEmail(email);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    // Регистрируем игрока
    return await this.playersService.register(username, email, password);
  }
}
