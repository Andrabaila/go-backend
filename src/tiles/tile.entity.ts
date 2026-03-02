// src/tiles/tile.entity.ts
import { Entity, PrimaryColumn, Column } from 'typeorm';

export type TileStatus = 'undiscovered' | 'discovered' | 'fully_explored';

@Entity('tiles')
export class TileEntity {
  @PrimaryColumn()
  tileId!: string;

  @Column('int')
  x!: number;

  @Column('int')
  y!: number;

  @Column('float')
  minLat!: number;

  @Column('float')
  minLng!: number;

  @Column('float')
  maxLat!: number;

  @Column('float')
  maxLng!: number;

  @Column({
    type: 'varchar',
    default: 'undiscovered',
  })
  status!: TileStatus;
}
