import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { DefaultRole } from '../roles/app-role.entity';
import { RolesService } from '../roles/roles.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly rolesService: RolesService,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return user;
  }

  /**
   * Looks up a user by email including the hashed password, for use during
   * authentication. Not exposed via the controller.
   */
  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(dto: CreateUserDto): Promise<User> {
    await this.ensureEmailAvailable(dto.email);
    const roleId = dto.roleId ?? (await this.getDefaultRoleId());

    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: await bcrypt.hash(dto.password, SALT_ROUNDS),
      roleId,
    });
    const saved = await this.usersRepository.save(user);

    // Reload so the eager `role` relation reflects the assigned roleId.
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.email !== undefined && dto.email !== user.email) {
      await this.ensureEmailAvailable(dto.email);
      user.email = dto.email;
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.password !== undefined) {
      user.password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }
    const roleChanged = dto.roleId !== undefined && dto.roleId !== user.roleId;
    if (dto.roleId !== undefined) user.roleId = dto.roleId;

    const saved = await this.usersRepository.save(user);

    // Reload so the eager `role` relation reflects the new roleId, if changed.
    return roleChanged ? this.findOne(saved.id) : saved;
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException(`User ${id} not found`);
    }
  }

  private async ensureEmailAvailable(email: string): Promise<void> {
    const existing = await this.usersRepository.findOne({ where: { email } });

    if (existing) {
      throw new ConflictException(`Email ${email} is already in use`);
    }
  }

  private async getDefaultRoleId(): Promise<string> {
    const role = await this.rolesService.findByName(DefaultRole.USER);

    if (!role) {
      throw new NotFoundException(
        `Default role "${DefaultRole.USER}" is not seeded`,
      );
    }

    return role.id;
  }
}
