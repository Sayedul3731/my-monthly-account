import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction, TransactionType } from './transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
  ) {}

  async findAll(year?: number, month?: number): Promise<Transaction[]> {
    const where =
      year !== undefined && month !== undefined
        ? {
            date: Between(
              new Date(year, month, 1),
              new Date(year, month + 1, 0, 23, 59, 59, 999),
            ),
          }
        : {};

    return this.transactionsRepository.find({
      where,
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    return transaction;
  }

  async create(dto: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.transactionsRepository.create({
      ...dto,
      date: new Date(dto.date),
    });

    return this.transactionsRepository.save(transaction);
  }

  async remove(id: string): Promise<void> {
    const result = await this.transactionsRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }
  }

  async getSummary(year: number, month: number) {
    const transactions = await this.findAll(year, month);

    const income = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    return {
      income,
      expenses,
      balance,
      savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
      count: transactions.length,
    };
  }
}
