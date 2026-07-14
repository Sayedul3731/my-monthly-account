import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

export enum DefaultRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('app_roles')
@Index(['name'], { unique: true, where: '"deletedAt" IS NULL' })
export class AppRole extends BaseEntity {
  @ApiProperty({ example: DefaultRole.USER, maxLength: 50 })
  @Column({ length: 50 })
  name!: string;

  @ApiPropertyOptional({ example: 'Standard application user' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;
}
