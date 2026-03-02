import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import type { User } from '../users/user.entity.js';
import type { RegisterDto } from './dto/register.dto.js';

type AuthResponse = {
  access_token: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async validateUser(
    email: string,
    password: string
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // Создаём новый объект без passwordHash
    const result: Omit<User, 'passwordHash'> = {
      id: user.id,
      email: user.email,
    };

    return result;
  }

  async login(user: Omit<User, 'passwordHash'>): Promise<AuthResponse> {
    const payload = { email: user.email, sub: user.id };
    return { access_token: this.jwtService.sign(payload) };
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const { email, password } = dto;

    // Проверка, есть ли уже пользователь
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new UnauthorizedException('User already exists');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      email,
      passwordHash,
    });

    // Возвращаем JWT сразу после регистрации
    return this.login(user);
  }
}
