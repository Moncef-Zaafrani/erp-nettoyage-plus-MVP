import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from './entities/contract.entity';
import { Client } from '../clients/entities/client.entity';
import { Site } from '../sites/entities/site.entity';
import {
  CreateContractDto,
  UpdateContractDto,
  SearchContractDto,
  BatchCreateContractsDto,
  BatchUpdateContractsDto,
  BatchDeleteContractsDto,
  BatchRestoreContractsDto,
} from './dto';
import {
  ContractType,
  ContractStatus,
} from '../../shared/types/contract.types';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
  ) {}

  /**
   * Generate unique contract code (CNT-0001, CNT-0002, etc.)
   */
  private async generateContractCode(): Promise<string> {
    const lastContract = await this.contractRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
      withDeleted: true,
    });

    let nextNumber = 1;
    if (lastContract && lastContract.contractCode) {
      const match = lastContract.contractCode.match(/CNT-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `CNT-${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Validate client and site existence
   */
  private async validateClientAndSite(
    clientId: string,
    siteId: string,
  ): Promise<void> {
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    const site = await this.siteRepository.findOne({
      where: { id: siteId },
    });
    if (!site) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    // Verify site belongs to client
    if (site.clientId !== clientId) {
      throw new BadRequestException(
        `Site ${siteId} does not belong to client ${clientId}`,
      );
    }
  }

  /**
   * Validate contract dates
   */
  private validateDates(
    startDate: string | Date,
    endDate?: string | Date | null,
  ): void {
    const start = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      if (end <= start) {
        throw new BadRequestException('End date must be after start date');
      }
    }
  }

  /**
   * Validate contract type and frequency
   */
  private validateContractType(dto: CreateContractDto | UpdateContractDto): void {
    if (
      dto.type === ContractType.PERMANENT &&
      !dto.frequency &&
      !(dto as any).id
    ) {
      throw new BadRequestException(
        'Frequency is required for PERMANENT contracts',
      );
    }
  }

  /**
   * Create a single contract
   */
  async create(createContractDto: CreateContractDto): Promise<Contract> {
    // Validate client and site
    await this.validateClientAndSite(
      createContractDto.clientId,
      createContractDto.siteId,
    );

    // Validate dates
    this.validateDates(createContractDto.startDate, createContractDto.endDate);

    // Validate contract type
    this.validateContractType(createContractDto);

    // Generate contract code
    const contractCode = await this.generateContractCode();

    // Create contract
    const contract = this.contractRepository.create({
      ...createContractDto,
      contractCode,
      status: ContractStatus.DRAFT,
    });

    return await this.contractRepository.save(contract);
  }

  /**
   * Create multiple contracts at once
   */
  async createBatch(
    batchDto: BatchCreateContractsDto,
  ): Promise<{ created: Contract[]; errors: any[] }> {
    const created: Contract[] = [];
    const errors: any[] = [];

    for (const contractDto of batchDto.contracts) {
      try {
        const contract = await this.create(contractDto);
        created.push(contract);
      } catch (error) {
        errors.push({
          contract: contractDto,
          error: error.message,
        });
      }
    }

    return { created, errors };
  }

  /**
   * Find all contracts with optional filters and pagination
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    clientId?: string,
    siteId?: string,
    type?: ContractType,
    status?: ContractStatus,
    includeDeleted: boolean = false,
  ): Promise<{ data: Contract[]; total: number; page: number; limit: number }> {
    const where: any = {};

    if (clientId) where.clientId = clientId;
    if (siteId) where.siteId = siteId;
    if (type) where.type = type;
    if (status) where.status = status;

    const [data, total] = await this.contractRepository.findAndCount({
      where,
      relations: ['client', 'site'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      withDeleted: includeDeleted,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Search for contracts by various criteria
   */
  async search(searchDto: SearchContractDto): Promise<Contract[]> {
    const where: any = {};

    if (searchDto.id) where.id = searchDto.id;
    if (searchDto.contractCode) where.contractCode = searchDto.contractCode;
    if (searchDto.clientId) where.clientId = searchDto.clientId;
    if (searchDto.siteId) where.siteId = searchDto.siteId;
    if (searchDto.type) where.type = searchDto.type;
    if (searchDto.status) where.status = searchDto.status;

    return await this.contractRepository.find({
      where,
      relations: ['client', 'site'],
    });
  }

  /**
   * Find a single contract by ID
   */
  async findOne(id: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['client', 'site'],
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return contract;
  }

  /**
   * Update a contract
   */
  async update(
    id: string,
    updateContractDto: UpdateContractDto,
  ): Promise<Contract> {
    const contract = await this.findOne(id);

    // Validate dates if provided
    if (updateContractDto.startDate || updateContractDto.endDate) {
      const startDate = updateContractDto.startDate || contract.startDate;
      const endDate = updateContractDto.endDate || contract.endDate;
      this.validateDates(startDate, endDate);
    }

    // Update contract
    Object.assign(contract, updateContractDto);

    return await this.contractRepository.save(contract);
  }

  /**
   * Update multiple contracts at once
   */
  async updateBatch(
    batchDto: BatchUpdateContractsDto,
  ): Promise<{ updated: Contract[]; errors: any[] }> {
    const updated: Contract[] = [];
    const errors: any[] = [];

    for (const item of batchDto.contracts) {
      try {
        const contract = await this.update(item.id, item);
        updated.push(contract);
      } catch (error) {
        errors.push({
          id: item.id,
          error: error.message,
        });
      }
    }

    return { updated, errors };
  }

  /**
   * Soft delete a contract
   */
  async remove(id: string): Promise<void> {
    const contract = await this.findOne(id);

    // Cannot delete active contracts
    if (contract.status === ContractStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot delete an active contract. Suspend or terminate it first.',
      );
    }

    await this.contractRepository.softDelete(id);
  }

  /**
   * Bulk soft delete contracts
   */
  async removeBatch(
    batchDto: BatchDeleteContractsDto,
  ): Promise<{ deleted: string[]; errors: any[] }> {
    const deleted: string[] = [];
    const errors: any[] = [];

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

    return { deleted, errors };
  }

  /**
   * Restore a soft-deleted contract
   */
  async restore(id: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    if (!contract.deletedAt) {
      throw new BadRequestException('Contract is not deleted');
    }

    await this.contractRepository.restore(id);
    return this.findOne(id);
  }

  /**
   * Bulk restore soft-deleted contracts
   */
  async restoreBatch(
    batchDto: BatchRestoreContractsDto,
  ): Promise<{ restored: Contract[]; errors: any[] }> {
    const restored: Contract[] = [];
    const errors: any[] = [];

    for (const id of batchDto.ids) {
      try {
        const contract = await this.restore(id);
        restored.push(contract);
      } catch (error) {
        errors.push({
          id,
          error: error.message,
        });
      }
    }

    return { restored, errors };
  }

  /**
   * Pause a contract (change status to INACTIVE)
   */
  async pause(id: string): Promise<Contract> {
    const contract = await this.findOne(id);

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Only active contracts can be paused');
    }

    contract.status = ContractStatus.INACTIVE;
    return await this.contractRepository.save(contract);
  }

  /**
   * Archive a contract (change status to ARCHIVED)
   */
  async archive(id: string): Promise<Contract> {
    const contract = await this.findOne(id);

    if (
      contract.status !== ContractStatus.ACTIVE &&
      contract.status !== ContractStatus.INACTIVE
    ) {
      throw new BadRequestException(
        'Only active or inactive contracts can be archived',
      );
    }

    contract.status = ContractStatus.ARCHIVED;
    return await this.contractRepository.save(contract);
  }

  /**
   * Renew a contract (create new contract based on existing one)
   */
  async renew(
    id: string,
    newStartDate: string,
    newEndDate?: string,
  ): Promise<Contract> {
    const existingContract = await this.findOne(id);

    // Validate dates
    this.validateDates(newStartDate, newEndDate);

    // Create new contract based on existing one
    const renewalDto: CreateContractDto = {
      clientId: existingContract.clientId,
      siteId: existingContract.siteId,
      type: existingContract.type,
      frequency: existingContract.frequency!,
      startDate: newStartDate,
      endDate: newEndDate,
      pricing: existingContract.pricing!,
      serviceScope: existingContract.serviceScope!,
      notes: `Renewal of contract ${existingContract.contractCode}`,
    };

    return await this.create(renewalDto);
  }
}
