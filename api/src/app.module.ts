import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { ENV_FILE_PATH } from './config/env.loader';
import { Budget } from './budgets/budget.entity';
import { BudgetsModule } from './budgets/budgets.module';
import { Category } from './categories/category.entity';
import { CategoriesModule } from './categories/categories.module';
import { AppRole } from './roles/app-role.entity';
import { RolesModule } from './roles/roles.module';
import { TransactionTypeEntity } from './transaction-types/transaction-type.entity';
import { TransactionTypesModule } from './transaction-types/transaction-types.module';
import { Transaction } from './transactions/transaction.entity';
import { TransactionsModule } from './transactions/transactions.module';
import { User } from './users/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ENV_FILE_PATH,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        entities: [
          Transaction,
          Budget,
          User,
          Category,
          TransactionTypeEntity,
          AppRole,
        ],
        synchronize: config.get<string>('nodeEnv') !== 'production',
      }),
    }),
    TransactionsModule,
    BudgetsModule,
    UsersModule,
    CategoriesModule,
    TransactionTypesModule,
    RolesModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
