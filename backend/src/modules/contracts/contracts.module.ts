import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { Contract } from './entities/contract.entity';
import { Client } from '../clients/entities/client.entity';
import { Site } from '../sites/entities/site.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contract, Client, Site])],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
