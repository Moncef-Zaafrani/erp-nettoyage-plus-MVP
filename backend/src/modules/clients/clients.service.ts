import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Client } from './entities/client.entity';
import {
  CreateClientDto,
  UpdateClientDto,
  SearchClientDto,
  BatchCreateClientsDto,
  BatchUpdateClientsDto,
  BatchIdsDto,
} from './dto';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  // ==================== CREATE OPERATIONS ====================

  /**
   * Generate unique client code (CLI-0001, CLI-0002, etc.)
   */
  private async generateClientCode(): Promise<string> {
    // Get the latest client code
    const latestClient = await this.clientRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
      withDeleted: true,
    });

    if (!latestClient || !latestClient.clientCode) {
      return 'CLI-0001';
    }

    // Extract number from code (CLI-0001 -> 1)
    const match = latestClient.clientCode.match(/CLI-(\d+)/);
    if (!match) {
      return 'CLI-0001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `CLI-${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Create a single client
   */
  async create(createClientDto: CreateClientDto): Promise<Client> {
    const { email } = createClientDto;

    // Check for duplicate email if provided
    if (email) {
      const existingClient = await this.clientRepository.findOne({
        where: { email: email.toLowerCase() },
        withDeleted: true,
      });

      if (existingClient) {
        throw new ConflictException(
          `Client with email ${email} already exists`,
        );
      }
    }

    // Generate unique client code
    const clientCode = await this.generateClientCode();

    const client = this.clientRepository.create({
      ...createClientDto,
      email: email?.toLowerCase() || null,
      clientCode,
    });

    const savedClient = await this.clientRepository.save(client);
    this.logger.log(
      `Created client: ${savedClient.clientCode} - ${savedClient.name}`,
    );
    return savedClient;
  }

  /**
   * Create multiple clients at once
   */
  async createBatch(
    batchDto: BatchCreateClientsDto,
  ): Promise<{ created: Client[]; errors: Array<{ name: string; error: string }> }> {
    const created: Client[] = [];
    const errors: Array<{ name: string; error: string }> = [];

    for (const clientDto of batchDto.clients) {
      try {
        const client = await this.create(clientDto);
        created.push(client);
      } catch (error) {
        errors.push({
          name: clientDto.name,
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
   * Find a single client by flexible criteria
   */
  async findOne(criteria: {
    id?: string;
    email?: string;
    name?: string;
  }): Promise<Client> {
    const { id, email, name } = criteria;

    if (!id && !email && !name) {
      throw new NotFoundException(
        'At least one search criteria must be provided',
      );
    }

    const where: FindOptionsWhere<Client> = {};
    if (id) where.id = id;
    if (email) where.email = email.toLowerCase();
    if (name) where.name = name;

    const client = await this.clientRepository.findOne({ where });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  /**
   * Find a client by ID
   */
  async findById(id: string, includeDeleted = false): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      withDeleted: includeDeleted,
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  /**
   * Find all clients with pagination, filtering, and sorting
   */
  async findAll(searchDto: SearchClientDto): Promise<{
    data: Client[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      city,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      includeDeleted = false,
    } = searchDto;

    const queryBuilder = this.clientRepository.createQueryBuilder('client');

    // Include deleted if requested
    if (includeDeleted) {
      queryBuilder.withDeleted();
    }

    // Search filter (name, email, contactPerson)
    if (search) {
      queryBuilder.andWhere(
        '(client.name ILIKE :search OR client.email ILIKE :search OR client.contactPerson ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Type filter
    if (type) {
      queryBuilder.andWhere('client.type = :type', { type });
    }

    // Status filter
    if (status) {
      queryBuilder.andWhere('client.status = :status', { status });
    }

    // City filter
    if (city) {
      queryBuilder.andWhere('client.city ILIKE :city', { city: `%${city}%` });
    }

    // Sorting
    const validSortFields = [
      'name',
      'email',
      'type',
      'status',
      'city',
      'createdAt',
      'updatedAt',
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`client.${sortField}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== UPDATE OPERATIONS ====================

  /**
   * Update a single client
   */
  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findById(id);

    // Check for duplicate email if changing email
    if (
      updateClientDto.email &&
      updateClientDto.email.toLowerCase() !== client.email
    ) {
      const existingClient = await this.clientRepository.findOne({
        where: { email: updateClientDto.email.toLowerCase() },
        withDeleted: true,
      });

      if (existingClient && existingClient.id !== id) {
        throw new ConflictException(
          `Client with email ${updateClientDto.email} already exists`,
        );
      }
    }

    // Normalize email to lowercase if provided
    if (updateClientDto.email) {
      updateClientDto.email = updateClientDto.email.toLowerCase();
    }

    Object.assign(client, updateClientDto);
    const updatedClient = await this.clientRepository.save(client);
    this.logger.log(`Updated client: ${id}`);
    return updatedClient;
  }

  /**
   * Update multiple clients at once
   */
  async updateBatch(
    batchDto: BatchUpdateClientsDto,
  ): Promise<{ updated: Client[]; errors: Array<{ id: string; error: string }> }> {
    const updated: Client[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const updateDto of batchDto.updates) {
      try {
        const { id, ...data } = updateDto;
        const client = await this.update(id, data);
        updated.push(client);
      } catch (error) {
        errors.push({
          id: updateDto.id,
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
   * Soft delete a single client
   */
  async softDelete(id: string): Promise<{ message: string; id: string }> {
    const client = await this.findById(id);
    await this.clientRepository.softRemove(client);
    this.logger.log(`Soft deleted client: ${id}`);
    return { message: 'Client deleted successfully', id };
  }

  /**
   * Soft delete multiple clients
   */
  async softDeleteBatch(
    batchDto: BatchIdsDto,
  ): Promise<{ deleted: string[]; errors: Array<{ id: string; error: string }> }> {
    const deleted: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const id of batchDto.ids) {
      try {
        await this.softDelete(id);
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
   * Restore a soft-deleted client
   */
  async restore(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    if (!client.deletedAt) {
      throw new ConflictException('Client is not deleted');
    }

    await this.clientRepository.recover(client);
    this.logger.log(`Restored client: ${id}`);

    return this.findById(id);
  }

  /**
   * Restore multiple soft-deleted clients
   */
  async restoreBatch(
    batchDto: BatchIdsDto,
  ): Promise<{ restored: Client[]; errors: Array<{ id: string; error: string }> }> {
    const restored: Client[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const id of batchDto.ids) {
      try {
        const client = await this.restore(id);
        restored.push(client);
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
