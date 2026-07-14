import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Category } from '../categories/category.entity';
import { BaseEntity } from '../common/entities/base.entity';
import { TransactionTypeEntity } from '../transaction-types/transaction-type.entity';
import { User } from '../users/user.entity';

@Entity('transactions')
@Index(['userId', 'date'])
export class Transaction extends BaseEntity {
  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ type: User })
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' })
  categoryId: string;

  @ApiProperty({ type: Category })
  @ManyToOne(() => Category, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' })
  transactionTypeId: string;

  @ApiProperty({ type: TransactionTypeEntity })
  @ManyToOne(() => TransactionTypeEntity, {
    eager: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'transactionTypeId' })
  transactionType: TransactionTypeEntity;

  @ApiProperty({ example: 49.99 })
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

  @ApiProperty({ example: 'Weekly groceries' })
  @Column({ length: 255 })
  description: string;

  @ApiProperty({ format: 'date-time' })
  @Column({ type: 'timestamptz' })
  date: Date;
}
