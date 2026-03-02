// src/tiles/tile.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TileEntity } from './tile.entity.js';
import { TileService } from './tile.service.js';
import { TileController } from './tile.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([TileEntity])],
  controllers: [TileController],
  providers: [TileService],
  exports: [TileService],
})
export class TileModule {}
