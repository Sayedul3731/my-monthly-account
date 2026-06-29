import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('budgets')
@Unique(['year', 'month', 'category'])
export class Budget {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @ApiProperty({ format: 'date-time' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
