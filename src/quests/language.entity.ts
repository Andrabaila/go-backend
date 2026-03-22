import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'languages', synchronize: false })
export class Language {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  code!: string;

  @Column({ type: 'varchar', length: 64 })
  name!: string;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;
}
