import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { QuestsService } from './quests.service.js';
import { Quest } from './quest.entity.js';
import type { CreateQuestInput } from './quests.service.js';
import { QuestRecord } from './quest-record.entity.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

function getAuthenticatedUserId(req: AuthenticatedRequest): string {
  const userId = req.user?.userId;
  if (!userId) {
    throw new UnauthorizedException('Missing authenticated user');
  }
  return userId;
}

@Controller('quests')
export class QuestsController {
  constructor(private readonly questsService: QuestsService) {}

  @Post()
  async create(
    @Body('title') title: string,
    @Body('description') description: string,
    @Body('playerId') playerId?: string
  ): Promise<Quest> {
    return this.questsService.create(title, description, playerId);
  }

  @Post('new')
  async createNew(@Body() input: CreateQuestInput): Promise<QuestRecord> {
    return this.questsService.createQuest(input);
  }

  @Get()
  async findAll(@Query('playerId') playerId?: string): Promise<Quest[]> {
    if (playerId) {
      return this.questsService.findByPlayer(playerId);
    }
    return this.questsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Quest | null> {
    return this.questsService.findById(id);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'active' | 'completed' | 'pending'
  ): Promise<Quest | null> {
    return this.questsService.updateStatus(id, status);
  }

  @Put(':id/progress')
  async updateProgress(
    @Param('id') id: string,
    @Body('visitedPointIds') visitedPointIds: string[]
  ): Promise<Quest | null> {
    return this.questsService.updateProgress(id, visitedPointIds ?? []);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.questsService.delete(id);
  }
}

@Controller('me/quests')
@UseGuards(JwtAuthGuard)
export class MyQuestsController {
  constructor(private readonly questsService: QuestsService) {}

  @Get()
  async findMine(@Req() req: AuthenticatedRequest): Promise<Quest[]> {
    return this.questsService.findByPlayer(getAuthenticatedUserId(req));
  }

  @Post(':id/activate')
  async activate(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('lang') languageCode?: string
  ): Promise<Quest> {
    const quest = await this.questsService.activateForUser(
      getAuthenticatedUserId(req),
      id,
      languageCode
    );

    if (!quest) {
      throw new NotFoundException('Quest is not available');
    }

    return quest;
  }

  @Put(':id/status')
  async updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('status') status: 'active' | 'completed' | 'pending'
  ): Promise<Quest> {
    const quest = await this.questsService.updateUserQuestStatus(
      getAuthenticatedUserId(req),
      id,
      status
    );

    if (!quest) {
      throw new NotFoundException('Quest was not found');
    }

    return quest;
  }

  @Put(':id/progress')
  async updateProgress(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('visitedPointIds') visitedPointIds: string[]
  ): Promise<Quest> {
    const quest = await this.questsService.updateUserQuestProgress(
      getAuthenticatedUserId(req),
      id,
      visitedPointIds ?? []
    );

    if (!quest) {
      throw new NotFoundException('Quest was not found');
    }

    return quest;
  }
}
