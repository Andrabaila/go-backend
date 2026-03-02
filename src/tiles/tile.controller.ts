// src/tiles/tile.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { TileService } from './tile.service.js';

@Controller('tiles')
export class TileController {
  constructor(private readonly service: TileService) {}

  @Get()
  async getTiles(
    @Query('minLat') minLat: string,
    @Query('minLng') minLng: string,
    @Query('maxLat') maxLat: string,
    @Query('maxLng') maxLng: string
  ) {
    return this.service.findByBBox(
      Number(minLat),
      Number(minLng),
      Number(maxLat),
      Number(maxLng)
    );
  }
}
