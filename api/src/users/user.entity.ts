import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { AppRole } from '../roles/app-role.entity';

@Entity('users')
@Index(['email'], { unique: true, where: '"deletedAt" IS NULL' })
export class User extends BaseEntity {
  @ApiProperty({ example: 'Jane Doe' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  @Column({ length: 255 })
  email: string;

  @ApiHideProperty()
  @Exclude()
  @Column({ length: 255 })
  password: string;

  @ApiHideProperty()
  @Column({ type: 'uuid' })
  roleId: string;

  @ApiProperty({ type: AppRole })
  @ManyToOne(() => AppRole, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'roleId' })
  role: AppRole;
}
