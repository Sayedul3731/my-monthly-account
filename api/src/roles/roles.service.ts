import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppRole, DefaultRole } from './app-role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

const DEFAULT_ROLE_DESCRIPTIONS: Record<DefaultRole, string> = {
  [DefaultRole.ADMIN]: 'Full access to manage users, roles and data',
  [DefaultRole.USER]: 'Standard application user',
};

@Injectable()
export class RolesService implements OnModuleInit {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(AppRole)
    private readonly rolesRepository: Repository<AppRole>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureDefaultRoles();
  }

  findAll(): Promise<AppRole[]> {
    return this.rolesRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<AppRole> {
    const role = await this.rolesRepository.findOne({ where: { id } });

    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }

    return role;
  }

  findByName(name: string): Promise<AppRole | null> {
    return this.rolesRepository.findOne({ where: { name } });
  }

  async create(dto: CreateRoleDto): Promise<AppRole> {
    await this.ensureNameAvailable(dto.name);

    const role = this.rolesRepository.create({
      name: dto.name,
      description: dto.description ?? null,
    });

    return this.rolesRepository.save(role);
  }

  async update(id: string, dto: UpdateRoleDto): Promise<AppRole> {
    const role = await this.findOne(id);

    if (dto.name !== undefined && dto.name !== role.name) {
      await this.ensureNameAvailable(dto.name);
      role.name = dto.name;
    }

    if (dto.description !== undefined) role.description = dto.description;

    return this.rolesRepository.save(role);
  }

  async remove(id: string): Promise<void> {
    const result = await this.rolesRepository.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException(`Role ${id} not found`);
    }
  }

  private async ensureNameAvailable(name: string): Promise<void> {
    const existing = await this.findByName(name);

    if (existing) {
      throw new ConflictException(`Role "${name}" already exists`);
    }
  }

  private async ensureDefaultRoles(): Promise<void> {
    for (const name of Object.values(DefaultRole)) {
      const existing = await this.findByName(name);

      if (!existing) {
        await this.rolesRepository.save(
          this.rolesRepository.create({
            name,
            description: DEFAULT_ROLE_DESCRIPTIONS[name],
          }),
        );
        this.logger.log(`Seeded default role "${name}"`);
      }
    }
  }
}
