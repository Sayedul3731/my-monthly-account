import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto';
import { UpdateTransactionTypeDto } from './dto/update-transaction-type.dto';
import { TransactionTypeEntity } from './transaction-type.entity';
import { TransactionTypesService } from './transaction-types.service';

@ApiTags('transaction-types')
@Controller('transaction-types')
export class TransactionTypesController {
  constructor(
    private readonly transactionTypesService: TransactionTypesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List transaction types' })
  @ApiOkResponse({ type: TransactionTypeEntity, isArray: true })
  findAll() {
    return this.transactionTypesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction type by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TransactionTypeEntity })
  @ApiNotFoundResponse({ description: 'Transaction type not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transactionTypesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a transaction type' })
  @ApiOkResponse({ type: TransactionTypeEntity })
  create(@Body() dto: CreateTransactionTypeDto) {
    return this.transactionTypesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction type' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TransactionTypeEntity })
  @ApiNotFoundResponse({ description: 'Transaction type not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionTypeDto,
  ) {
    return this.transactionTypesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a transaction type' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Transaction type deleted' })
  @ApiNotFoundResponse({ description: 'Transaction type not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.transactionTypesService.remove(id);
  }
}
