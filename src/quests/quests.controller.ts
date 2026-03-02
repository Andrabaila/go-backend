import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { QuestsService } from './quests.service.js';
import { Quest } from './quest.entity.js';

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
