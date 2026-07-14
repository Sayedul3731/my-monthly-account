import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

@Entity('budgets')
@Index(['year', 'month', 'category'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class Budget extends BaseEntity {
  @ApiProperty({ example: 2026 })
  @Column({ type: 'int' })
  year: number;

  @ApiProperty({ example: 5, description: 'Zero-based month (0 = January)' })
  @Column({ type: 'int' })
  month: number;

  @ApiPropertyOptional({
    example: 'Food',
    description: 'Empty string means overall monthly budget',
  })
  @Column({ type: 'varchar', length: 100, default: '' })
  category: string;

  @ApiProperty({ example: 500 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  amount: number;
}
