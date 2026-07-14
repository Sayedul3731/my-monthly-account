import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

@Entity('transaction_types')
@Index(['name'], { unique: true, where: '"deletedAt" IS NULL' })
export class TransactionTypeEntity extends BaseEntity {
  @ApiProperty({ example: 'income', maxLength: 50 })
  @Column({ length: 50 })
  name: string;

  @ApiProperty({ example: 'Income', maxLength: 50 })
  @Column({ length: 50 })
  label: string;

  @ApiPropertyOptional({ example: '💰', maxLength: 10 })
  @Column({ length: 10, default: '' })
  icon: string;
}
