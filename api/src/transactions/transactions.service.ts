import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Category } from '../categories/category.entity';
import { TransactionTypeEntity } from '../transaction-types/transaction-type.entity';
import { User } from '../users/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionType } from './transaction-type.enum';
import { Transaction } from './transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(TransactionTypeEntity)
    private readonly transactionTypesRepository: Repository<TransactionTypeEntity>,
  ) {}

  async findAll(
    userId: string,
    year?: number,
    month?: number,
  ): Promise<Transaction[]> {
    const where =
      year !== undefined && month !== undefined
        ? {
            userId,
            date: Between(
              new Date(year, month, 1),
              new Date(year, month + 1, 0, 23, 59, 59, 999),
            ),
          }
        : { userId };

    return this.transactionsRepository.find({
      where,
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id, userId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    return transaction;
  }

  async create(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<Transaction> {
    const [user, category, transactionType] = await Promise.all([
      this.findUser(userId),
      this.findCategory(dto.categoryId),
      this.findTransactionType(dto.transactionTypeId),
    ]);
    this.ensureCategoryMatchesType(category, transactionType);

    const transaction = this.transactionsRepository.create({
      userId,
      user,
      categoryId: category.id,
      category,
      transactionTypeId: transactionType.id,
      transactionType,
      amount: dto.amount,
      description: dto.description,
      date: new Date(dto.date),
    });

    return this.transactionsRepository.save(transaction);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.findOne(id, userId);
    const [category, transactionType] = await Promise.all([
      dto.categoryId
        ? this.findCategory(dto.categoryId)
        : Promise.resolve(transaction.category),
      dto.transactionTypeId
        ? this.findTransactionType(dto.transactionTypeId)
        : Promise.resolve(transaction.transactionType),
    ]);
    this.ensureCategoryMatchesType(category, transactionType);

    transaction.categoryId = category.id;
    transaction.category = category;
    transaction.transactionTypeId = transactionType.id;
    transaction.transactionType = transactionType;
    if (dto.amount !== undefined) transaction.amount = dto.amount;
    if (dto.description !== undefined)
      transaction.description = dto.description;
    if (dto.date !== undefined) transaction.date = new Date(dto.date);

    return this.transactionsRepository.save(transaction);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.transactionsRepository.softDelete({ id, userId });

    if (!result.affected) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }
  }

  async getSummary(userId: string, year: number, month: number) {
    const transactions = await this.findAll(userId, year, month);

    const income = transactions
      .filter((t) => t.transactionType.name === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.transactionType.name === TransactionType.EXPENSE)
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

  private async findUser(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  private async findCategory(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  private async findTransactionType(
    id: string,
  ): Promise<TransactionTypeEntity> {
    const transactionType = await this.transactionTypesRepository.findOne({
      where: { id },
    });
    if (!transactionType) {
      throw new NotFoundException(`Transaction type ${id} not found`);
    }
    return transactionType;
  }

  private ensureCategoryMatchesType(
    category: Category,
    transactionType: TransactionTypeEntity,
  ): void {
    if (category.type !== transactionType.name) {
      throw new BadRequestException(
        `Category "${category.name}" is not valid for transaction type "${transactionType.name}"`,
      );
    }
  }
}
