// src/tiles/dto/update-tile.dto.ts
import { TileStatus } from '../tile-status.enum.js';

export class UpdateTileDto {
  status: TileStatus | undefined;
}
