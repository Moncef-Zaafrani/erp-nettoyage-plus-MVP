import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './entities/site.entity';
import { Client } from '../clients/entities/client.entity';
import {
  CreateSiteDto,
  UpdateSiteDto,
  SearchSiteDto,
  BatchCreateSitesDto,
  BatchUpdateSitesDto,
  BatchIdsDto,
} from './dto';

@Injectable()
export class SitesService {
  private readonly logger = new Logger(SitesService.name);

  constructor(
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  // ==================== CREATE OPERATIONS ====================

  /**
   * Create a single site
   */
  async create(createSiteDto: CreateSiteDto): Promise<Site> {
    const { clientId } = createSiteDto;

    // Validate client exists
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    const site = this.siteRepository.create(createSiteDto);
    const savedSite = await this.siteRepository.save(site);

    this.logger.log(
      `Created site: ${savedSite.id} - ${savedSite.name} for client ${clientId}`,
    );
    return savedSite;
  }

  /**
   * Create multiple sites at once
   */
  async createBatch(
    batchDto: BatchCreateSitesDto,
  ): Promise<{
    created: Site[];
    errors: Array<{ name: string; error: string }>;
  }> {
    const created: Site[] = [];
    const errors: Array<{ name: string; error: string }> = [];

    for (const siteDto of batchDto.sites) {
      try {
        const site = await this.create(siteDto);
        created.push(site);
      } catch (error) {
        errors.push({
          name: siteDto.name,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Batch create: ${created.length} succeeded, ${errors.length} failed`,
    );
    return { created, errors };
  }

  // ==================== READ OPERATIONS ====================

  /**
   * Find a single site by flexible criteria
   */
  async findOne(criteria: { id?: string; name?: string }): Promise<Site> {
    const { id, name } = criteria;

    if (!id && !name) {
      throw new BadRequestException(
        'At least one search criterion (id or name) is required',
      );
    }

    const where: any = {};
    if (id) where.id = id;
    if (name) where.name = name;

    const site = await this.siteRepository.findOne({
      where,
      relations: ['client'],
    });

    if (!site) {
      throw new NotFoundException(
        `Site not found with provided criteria: ${JSON.stringify(criteria)}`,
      );
    }

    return site;
  }

  /**
   * Find site by ID
   */
  async findById(id: string, includeDeleted = false): Promise<Site> {
    const site = await this.siteRepository.findOne({
      where: { id },
      relations: ['client'],
      withDeleted: includeDeleted,
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    return site;
  }

  /**
   * Find all sites with pagination, filtering, and sorting
   */
  async findAll(searchDto: SearchSiteDto): Promise<{
    data: Site[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      clientId,
      size,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = searchDto;

    // Build query
    const queryBuilder = this.siteRepository
      .createQueryBuilder('site')
      .leftJoinAndSelect('site.client', 'client');

    // Apply filters
    if (clientId)
      queryBuilder.andWhere('site.clientId = :clientId', { clientId });
    if (size) queryBuilder.andWhere('site.size = :size', { size });
    if (status) queryBuilder.andWhere('site.status = :status', { status });

    // Apply search
    if (search) {
      queryBuilder.andWhere(
        '(site.name ILIKE :search OR site.address ILIKE :search OR site.city ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply sorting
    const allowedSortFields = [
      'name',
      'size',
      'status',
      'createdAt',
      'updatedAt',
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`site.${sortField}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==================== UPDATE OPERATIONS ====================

  /**
   * Update a single site
   */
  async update(id: string, updateSiteDto: UpdateSiteDto): Promise<Site> {
    const site = await this.findById(id);

    Object.assign(site, updateSiteDto);
    const updatedSite = await this.siteRepository.save(site);

    this.logger.log(`Updated site: ${updatedSite.id} - ${updatedSite.name}`);
    return updatedSite;
  }

  /**
   * Update multiple sites at once
   */
  async updateBatch(
    batchDto: BatchUpdateSitesDto,
  ): Promise<{
    updated: Site[];
    errors: Array<{ id: string; error: string }>;
  }> {
    const updated: Site[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const { id, data } of batchDto.sites) {
      try {
        const site = await this.update(id, data);
        updated.push(site);
      } catch (error) {
        errors.push({
          id,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Batch update: ${updated.length} succeeded, ${errors.length} failed`,
    );
    return { updated, errors };
  }

  // ==================== DELETE OPERATIONS ====================

  /**
   * Soft delete a single site
   */
  async remove(id: string): Promise<{ message: string }> {
    const site = await this.findById(id);

    await this.siteRepository.softDelete(id);
    this.logger.log(`Soft deleted site: ${id} - ${site.name}`);

    return { message: `Site ${site.name} successfully deleted` };
  }

  /**
   * Soft delete multiple sites at once
   */
  async removeBatch(
    batchDto: BatchIdsDto,
  ): Promise<{
    deleted: string[];
    errors: Array<{ id: string; error: string }>;
  }> {
    const deleted: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const id of batchDto.ids) {
      try {
        await this.remove(id);
        deleted.push(id);
      } catch (error) {
        errors.push({
          id,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Batch delete: ${deleted.length} succeeded, ${errors.length} failed`,
    );
    return { deleted, errors };
  }

  // ==================== RESTORE OPERATIONS ====================

  /**
   * Restore a soft-deleted site
   */
  async restore(id: string): Promise<Site> {
    const site = await this.siteRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    if (!site.deletedAt) {
      throw new BadRequestException(`Site ${site.name} is not deleted`);
    }

    await this.siteRepository.restore(id);
    this.logger.log(`Restored site: ${id} - ${site.name}`);

    return this.findById(id);
  }

  /**
   * Restore multiple soft-deleted sites at once
   */
  async restoreBatch(
    batchDto: BatchIdsDto,
  ): Promise<{
    restored: Site[];
    errors: Array<{ id: string; error: string }>;
  }> {
    const restored: Site[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const id of batchDto.ids) {
      try {
        const site = await this.restore(id);
        restored.push(site);
      } catch (error) {
        errors.push({
          id,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Batch restore: ${restored.length} succeeded, ${errors.length} failed`,
    );
    return { restored, errors };
  }
}
