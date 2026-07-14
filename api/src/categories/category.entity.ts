import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { TransactionType } from '../transactions/transaction-type.enum';

@Entity('categories')
@Index(['type', 'name'], { unique: true, where: '"deletedAt" IS NULL' })
export class Category extends BaseEntity {
  @ApiProperty({ example: 'Food', maxLength: 100 })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE })
  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @ApiPropertyOptional({ example: '🍔', maxLength: 10 })
  @Column({ length: 10, default: '' })
  icon: string;
}
