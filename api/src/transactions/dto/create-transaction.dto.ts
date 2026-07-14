import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    format: 'uuid',
    description: 'ID from GET /transaction-types',
  })
  @IsUUID()
  transactionTypeId: string;

  @ApiProperty({
    format: 'uuid',
    description: 'ID from GET /categories',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 49.99, minimum: 0.01 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'Weekly groceries', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @ApiProperty({ example: '2026-06-15', format: 'date' })
  @IsDateString()
  date: string;
}
