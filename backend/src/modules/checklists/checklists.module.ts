import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistsService } from './checklists.service';
import { ChecklistsController } from './checklists.controller';
import { ChecklistTemplate } from './entities/checklist-template.entity';
import { ChecklistInstance } from './entities/checklist-instance.entity';
import { ChecklistItem } from './entities/checklist-item.entity';
import { Intervention } from '../interventions/entities/intervention.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChecklistTemplate,
      ChecklistInstance,
      ChecklistItem,
      Intervention,
    ]),
  ],
  controllers: [ChecklistsController],
  providers: [ChecklistsService],
  exports: [ChecklistsService],
})
export class ChecklistsModule {}
