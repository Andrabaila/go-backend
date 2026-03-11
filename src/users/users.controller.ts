import {
  Controller,
  Get,
  Param,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import type { User } from './user.entity.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users
   * Возвращает всех пользователей без паролей
   */
  @Get()
  async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.usersService.findAll();
    return users.map((user) => ({
      id: user.id,
      email: user.email,
    }));
  }

  /**
   * GET /users/:email
   * Возвращает пользователя по email без пароля
   */
  @Get(':email')
  async findByEmail(
    @Param('email') email: string
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    // Явное перечисление полей без пароля
    return {
      id: user.id,
      email: user.email,
    };
  }
}
