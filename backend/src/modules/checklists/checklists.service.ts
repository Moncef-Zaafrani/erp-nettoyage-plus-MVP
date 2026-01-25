import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChecklistTemplate } from './entities/checklist-template.entity';
import { ChecklistInstance } from './entities/checklist-instance.entity';
import { ChecklistItem } from './entities/checklist-item.entity';
import { Intervention } from '../interventions/entities/intervention.entity';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateInstanceDto,
  CompleteItemDto,
  ReviewInstanceDto,
} from './dto';
import {
  ChecklistStatus,
  ChecklistFrequency,
  CompletionStats,
} from '../../shared/types/checklist.types';

@Injectable()
export class ChecklistsService {
  constructor(
    @InjectRepository(ChecklistTemplate)
    private readonly templateRepository: Repository<ChecklistTemplate>,
    @InjectRepository(ChecklistInstance)
    private readonly instanceRepository: Repository<ChecklistInstance>,
    @InjectRepository(ChecklistItem)
    private readonly itemRepository: Repository<ChecklistItem>,
    @InjectRepository(Intervention)
    private readonly interventionRepository: Repository<Intervention>,
  ) {}

  /**
   * Create a new checklist template
   */
  async createTemplate(dto: CreateTemplateDto): Promise<ChecklistTemplate> {
    const template = this.templateRepository.create(dto);
    return await this.templateRepository.save(template);
  }

  /**
   * Find all templates with filters
   */
  async findAllTemplates(
    frequency?: ChecklistFrequency,
    isActive?: boolean,
  ): Promise<ChecklistTemplate[]> {
    const where: any = {};
    if (frequency) where.frequency = frequency;
    if (isActive !== undefined) where.isActive = isActive;

    return await this.templateRepository.find({
      where,
      order: { frequency: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Find a single template by ID
   */
  async findOneTemplate(id: string): Promise<ChecklistTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });

    if (!template) {
      throw new NotFoundException(`Checklist template with ID ${id} not found`);
    }

    return template;
  }

  /**
   * Update a template
   */
  async updateTemplate(
    id: string,
    dto: UpdateTemplateDto,
  ): Promise<ChecklistTemplate> {
    const template = await this.findOneTemplate(id);
    Object.assign(template, dto);
    return await this.templateRepository.save(template);
  }

  /**
   * Delete a template (soft delete)
   */
  async removeTemplate(id: string): Promise<void> {
    await this.findOneTemplate(id);
    await this.templateRepository.softDelete(id);
  }

  /**
   * Create a checklist instance from a template for an intervention
   */
  async createInstance(dto: CreateInstanceDto): Promise<ChecklistInstance> {
    // Validate intervention exists
    const intervention = await this.interventionRepository.findOne({
      where: { id: dto.interventionId },
    });

    if (!intervention) {
      throw new NotFoundException(
        `Intervention with ID ${dto.interventionId} not found`,
      );
    }

    // Check if instance already exists for this intervention
    const existing = await this.instanceRepository.findOne({
      where: { interventionId: dto.interventionId },
    });

    if (existing) {
      throw new BadRequestException(
        'Checklist instance already exists for this intervention',
      );
    }

    // Get template
    const template = await this.findOneTemplate(dto.templateId);

    // Create instance
    const instance = this.instanceRepository.create({
      interventionId: dto.interventionId,
      templateId: dto.templateId,
      status: ChecklistStatus.NOT_STARTED,
      completionPercentage: 0,
    });

    const savedInstance = await this.instanceRepository.save(instance);

    // Create items from template zones
    const items: ChecklistItem[] = [];
    for (const zone of template.zones) {
      for (const task of zone.tasks) {
        const item = this.itemRepository.create({
          checklistInstanceId: savedInstance.id,
          zoneName: zone.zoneName,
          taskDescription: task,
          isCompleted: false,
        });
        items.push(item);
      }
    }

    await this.itemRepository.save(items);

    // Return instance with items
    return await this.findOneInstance(savedInstance.id);
  }

  /**
   * Find all instances with filters
   */
  async findAllInstances(
    interventionId?: string,
    status?: ChecklistStatus,
  ): Promise<ChecklistInstance[]> {
    const where: any = {};
    if (interventionId) where.interventionId = interventionId;
    if (status) where.status = status;

    return await this.instanceRepository.find({
      where,
      relations: ['template', 'intervention', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find a single instance by ID
   */
  async findOneInstance(id: string): Promise<ChecklistInstance> {
    const instance = await this.instanceRepository.findOne({
      where: { id },
      relations: ['template', 'intervention', 'items', 'items.completedByUser'],
    });

    if (!instance) {
      throw new NotFoundException(`Checklist instance with ID ${id} not found`);
    }

    return instance;
  }

  /**
   * Get instance by intervention ID
   */
  async getInstanceByIntervention(
    interventionId: string,
  ): Promise<ChecklistInstance> {
    const instance = await this.instanceRepository.findOne({
      where: { interventionId },
      relations: ['template', 'intervention', 'items', 'items.completedByUser'],
    });

    if (!instance) {
      throw new NotFoundException(
        `No checklist found for intervention ${interventionId}`,
      );
    }

    return instance;
  }

  /**
   * Calculate completion percentage
   */
  private calculateCompletionPercentage(items: ChecklistItem[]): number {
    if (items.length === 0) return 0;
    const completed = items.filter((item) => item.isCompleted).length;
    return Math.round((completed / items.length) * 100);
  }

  /**
   * Complete a checklist item
   */
  async completeItem(
    itemId: string,
    dto: CompleteItemDto,
  ): Promise<ChecklistItem> {
    const item = await this.itemRepository.findOne({
      where: { id: itemId },
      relations: ['checklistInstance', 'checklistInstance.items'],
    });

    if (!item) {
      throw new NotFoundException(`Checklist item with ID ${itemId} not found`);
    }

    if (item.isCompleted) {
      throw new BadRequestException('Item is already completed');
    }

    // Update item
    item.isCompleted = true;
    item.completedAt = new Date();
    item.completedBy = dto.completedBy;
    if (dto.photoUrls) item.photoUrls = dto.photoUrls;
    if (dto.notes) item.notes = dto.notes;
    if (dto.qualityRating) item.qualityRating = dto.qualityRating;

    const savedItem = await this.itemRepository.save(item);

    // Update instance status and completion percentage
    const instance = item.checklistInstance;
    const completionPercentage = this.calculateCompletionPercentage(
      instance.items,
    );

    instance.completionPercentage = completionPercentage;

    if (instance.status === ChecklistStatus.NOT_STARTED) {
      instance.status = ChecklistStatus.IN_PROGRESS;
      instance.startedAt = new Date();
    }

    if (completionPercentage === 100) {
      instance.status = ChecklistStatus.COMPLETED;
      instance.completedAt = new Date();
    }

    await this.instanceRepository.save(instance);

    return savedItem;
  }

  /**
   * Uncomplete a checklist item (for corrections)
   */
  async uncompleteItem(itemId: string): Promise<ChecklistItem> {
    const item = await this.itemRepository.findOne({
      where: { id: itemId },
      relations: ['checklistInstance', 'checklistInstance.items'],
    });

    if (!item) {
      throw new NotFoundException(`Checklist item with ID ${itemId} not found`);
    }

    if (!item.isCompleted) {
      throw new BadRequestException('Item is not completed');
    }

    // Update item
    item.isCompleted = false;
    item.completedAt = null;

    const savedItem = await this.itemRepository.save(item);

    // Update instance
    const instance = item.checklistInstance;
    const completionPercentage = this.calculateCompletionPercentage(
      instance.items,
    );

    instance.completionPercentage = completionPercentage;

    if (completionPercentage < 100) {
      instance.status = ChecklistStatus.IN_PROGRESS;
      instance.completedAt = null;
    }

    await this.instanceRepository.save(instance);

    return savedItem;
  }

  /**
   * Add photo to a checklist item
   */
  async addPhotoToItem(itemId: string, photoUrl: string): Promise<ChecklistItem> {
    const item = await this.itemRepository.findOne({ where: { id: itemId } });

    if (!item) {
      throw new NotFoundException(`Checklist item with ID ${itemId} not found`);
    }

    if (!item.photoUrls) {
      item.photoUrls = [];
    }

    item.photoUrls.push(photoUrl);
    return await this.itemRepository.save(item);
  }

  /**
   * Review a checklist instance (Zone Chief quality check)
   */
  async reviewInstance(
    instanceId: string,
    dto: ReviewInstanceDto,
  ): Promise<ChecklistInstance> {
    const instance = await this.findOneInstance(instanceId);

    if (instance.status !== ChecklistStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed checklists');
    }

    instance.qualityScore = dto.qualityScore;
    instance.reviewedBy = dto.reviewedBy;
    if (dto.reviewNotes) {
      instance.reviewNotes = dto.reviewNotes;
    }

    return await this.instanceRepository.save(instance);
  }

  /**
   * Get completion statistics for an instance
   */
  async getCompletionStats(instanceId: string): Promise<CompletionStats> {
    const instance = await this.findOneInstance(instanceId);

    const totalItems = instance.items.length;
    const completedItems = instance.items.filter((item) => item.isCompleted).length;
    const withPhotos = instance.items.filter(
      (item) => item.photoUrls && item.photoUrls.length > 0,
    ).length;

    return {
      totalItems,
      completedItems,
      percentage: this.calculateCompletionPercentage(instance.items),
      withPhotos,
    };
  }
}
