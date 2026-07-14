import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto';
import { UpdateTransactionTypeDto } from './dto/update-transaction-type.dto';
import { TransactionTypeEntity } from './transaction-type.entity';

@Injectable()
export class TransactionTypesService {
  constructor(
    @InjectRepository(TransactionTypeEntity)
    private readonly transactionTypesRepository: Repository<TransactionTypeEntity>,
  ) {}

  findAll(): Promise<TransactionTypeEntity[]> {
    return this.transactionTypesRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<TransactionTypeEntity> {
    const transactionType = await this.transactionTypesRepository.findOne({
      where: { id },
    });

    if (!transactionType) {
      throw new NotFoundException(`Transaction type ${id} not found`);
    }

    return transactionType;
  }

  async create(dto: CreateTransactionTypeDto): Promise<TransactionTypeEntity> {
    await this.ensureNameAvailable(dto.name);

    const transactionType = this.transactionTypesRepository.create({
      name: dto.name,
      label: dto.label,
      icon: dto.icon ?? '',
    });

    return this.transactionTypesRepository.save(transactionType);
  }

  async update(
    id: string,
    dto: UpdateTransactionTypeDto,
  ): Promise<TransactionTypeEntity> {
    const transactionType = await this.findOne(id);

    if (dto.name !== undefined && dto.name !== transactionType.name) {
      await this.ensureNameAvailable(dto.name, id);
      transactionType.name = dto.name;
    }

    if (dto.label !== undefined) transactionType.label = dto.label;
    if (dto.icon !== undefined) transactionType.icon = dto.icon;

    return this.transactionTypesRepository.save(transactionType);
  }

  async remove(id: string): Promise<void> {
    const result = await this.transactionTypesRepository.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException(`Transaction type ${id} not found`);
    }
  }

  private async ensureNameAvailable(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.transactionTypesRepository.findOne({
      where: { name },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Transaction type "${name}" already exists`);
    }
  }
}
