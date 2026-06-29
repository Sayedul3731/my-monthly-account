import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpsertBudgetDto } from './dto/upsert-budget.dto';
import { Budget } from './budget.entity';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetsRepository: Repository<Budget>,
  ) {}

  findAll(year: number, month: number): Promise<Budget[]> {
    return this.budgetsRepository.find({
      where: { year, month },
      order: { category: 'ASC' },
    });
  }

  async upsert(dto: UpsertBudgetDto): Promise<Budget> {
    const category = dto.category?.trim() ? dto.category.trim() : '';

    const existing = await this.budgetsRepository.findOne({
      where: { year: dto.year, month: dto.month, category },
    });

    if (existing) {
      existing.amount = dto.amount;
      return this.budgetsRepository.save(existing);
    }

    const budget = this.budgetsRepository.create({
      year: dto.year,
      month: dto.month,
      category,
      amount: dto.amount,
    });

    return this.budgetsRepository.save(budget);
  }

  async remove(id: string): Promise<void> {
    await this.budgetsRepository.delete(id);
  }
}
