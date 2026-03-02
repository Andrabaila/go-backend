// src/tiles/tile.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TileEntity, type TileStatus } from './tile.entity.js';

@Injectable()
export class TileService {
  constructor(
    @InjectRepository(TileEntity)
    private repo: Repository<TileEntity>
  ) {}

  async findByBBox(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number
  ): Promise<TileEntity[]> {
    return this.repo
      .createQueryBuilder('tile')
      .where('tile.minLat >= :minLat', { minLat })
      .andWhere('tile.minLng >= :minLng', { minLng })
      .andWhere('tile.maxLat <= :maxLat', { maxLat })
      .andWhere('tile.maxLng <= :maxLng', { maxLng })
      .getMany();
  }

  async upsertTile(tile: Partial<TileEntity>): Promise<TileEntity> {
    await this.repo.save(tile);

    const saved = await this.repo.findOne({
      where: { tileId: tile.tileId },
    });

    if (!saved) {
      throw new Error(`Tile not found after save: ${tile.tileId}`);
    }

    return saved;
  }

  async updateStatus(tileId: string, status: TileStatus) {
    await this.repo.update({ tileId }, { status });
  }
}
