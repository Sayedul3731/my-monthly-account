import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionType } from '../transactions/transaction-type.enum';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  findAll(type?: TransactionType): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: type ? { type } : {},
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    await this.ensureNameAvailable(dto.type, dto.name);

    const category = this.categoriesRepository.create({
      name: dto.name,
      type: dto.type,
      icon: dto.icon ?? '',
    });

    return this.categoriesRepository.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    const nextType = dto.type ?? category.type;
    const nextName = dto.name ?? category.name;

    if (nextType !== category.type || nextName !== category.name) {
      await this.ensureNameAvailable(nextType, nextName, id);
    }

    category.type = nextType;
    category.name = nextName;
    if (dto.icon !== undefined) category.icon = dto.icon;

    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const result = await this.categoriesRepository.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException(`Category ${id} not found`);
    }
  }

  private async ensureNameAvailable(
    type: TransactionType,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.categoriesRepository.findOne({
      where: { type, name },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `Category "${name}" already exists for type "${type}"`,
      );
    }
  }
}
