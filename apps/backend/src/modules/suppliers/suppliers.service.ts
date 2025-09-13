import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Supplier } from '../../common/schemas/supplier.schema';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<Supplier>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto, tenantId?: string): Promise<Supplier> {
    try {
      if (!tenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      // Check if supplier code already exists within the same tenant
      const filter: any = {
        supplierCode: createSupplierDto.supplierCode,
      };
      
      if (tenantId) {
        filter.tenantId = new Types.ObjectId(tenantId);
      }
      
      const existingSupplier = await this.supplierModel.findOne(filter);

      if (existingSupplier) {
        throw new BadRequestException(
          `Supplier with code ${createSupplierDto.supplierCode} already exists`,
        );
      }

      // Set default values
      const supplierData = {
        ...createSupplierDto,
        tenantId: new Types.ObjectId(tenantId),
        status: createSupplierDto.status || 'active',
        isActive:
          createSupplierDto.isActive !== undefined
            ? createSupplierDto.isActive
            : true,
        totalOrders: 0,
        totalSpent: 0,
        rating: createSupplierDto.rating || 0,
        qualityRating: createSupplierDto.qualityRating || 0,
        reliabilityScore: createSupplierDto.reliabilityScore || 0,
      };

      const createdSupplier = new this.supplierModel(supplierData);
      const savedSupplier = await createdSupplier.save();

      this.logger.log(
        `Supplier created successfully: ${savedSupplier.supplierCode}`,
      );
      return savedSupplier;
    } catch (error) {
      this.logger.error(`Error creating supplier: ${error.message}`);
      throw error;
    }
  }

  async findAll(query: any = {}, tenantId?: string): Promise<{ suppliers: Supplier[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        category,
        status,
        isActive,
        sortBy = 'supplierName',
        sortOrder = 'asc',
      } = query;

      // Build filter conditions
      const filter: any = {};

      // Add tenant filtering
      if (tenantId) {
        filter.tenantId = new Types.ObjectId(tenantId);
      }

      if (search && search !== 'undefined' && search.trim() !== '') {
        filter.$or = [
          { supplierName: { $regex: search, $options: 'i' } },
          { supplierCode: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      if (category && category !== 'undefined' && category.trim() !== '') {
        filter.category = category;
      }

      if (status && status !== 'undefined' && status.trim() !== '') {
        filter.status = status;
      }

      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }

      // Build sort conditions
      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination and get total count
      const [suppliers, total] = await Promise.all([
        this.supplierModel
          .find(filter)
          .sort(sort)
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .exec(),
        this.supplierModel.countDocuments(filter),
      ]);

      this.logger.log(`Retrieved ${suppliers.length} suppliers out of ${total} total`);
      return { suppliers, total };
    } catch (error) {
      this.logger.error(`Error retrieving suppliers: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<Supplier> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid supplier ID format');
      }

      const supplier = await this.supplierModel.findById(id).exec();

      if (!supplier) {
        throw new NotFoundException(`Supplier with ID ${id} not found`);
      }

      this.logger.log(`Retrieved supplier: ${supplier.supplierCode}`);
      return supplier;
    } catch (error) {
      this.logger.error(`Error retrieving supplier ${id}: ${error.message}`);
      throw error;
    }
  }

  async findByCode(supplierCode: string): Promise<Supplier> {
    try {
      const supplier = await this.supplierModel
        .findOne({ supplierCode })
        .exec();

      if (!supplier) {
        throw new NotFoundException(
          `Supplier with code ${supplierCode} not found`,
        );
      }

      return supplier;
    } catch (error) {
      this.logger.error(
        `Error retrieving supplier by code ${supplierCode}: ${error.message}`,
      );
      throw error;
    }
  }

  async update(
    id: string,
    updateSupplierDto: UpdateSupplierDto,
  ): Promise<Supplier> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid supplier ID format');
      }

      // Check if supplier code is being updated and if it already exists
      if (updateSupplierDto.supplierCode) {
        const existingSupplier = await this.supplierModel.findOne({
          supplierCode: updateSupplierDto.supplierCode,
          _id: { $ne: id },
        });

        if (existingSupplier) {
          throw new BadRequestException(
            `Supplier with code ${updateSupplierDto.supplierCode} already exists`,
          );
        }
      }

      const updatedSupplier = await this.supplierModel
        .findByIdAndUpdate(id, updateSupplierDto, {
          new: true,
          runValidators: true,
        })
        .exec();

      if (!updatedSupplier) {
        throw new NotFoundException(`Supplier with ID ${id} not found`);
      }

      this.logger.log(
        `Supplier updated successfully: ${updatedSupplier.supplierCode}`,
      );
      return updatedSupplier;
    } catch (error) {
      this.logger.error(`Error updating supplier ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid supplier ID format');
      }

      const supplier = await this.supplierModel.findById(id).exec();

      if (!supplier) {
        throw new NotFoundException(`Supplier with ID ${id} not found`);
      }

      // Check if supplier has associated data
      if (supplier.totalOrders > 0 || supplier.totalSpent > 0) {
        // Soft delete instead of hard delete
        await this.supplierModel
          .findByIdAndUpdate(id, { isActive: false })
          .exec();
        this.logger.log(`Supplier soft deleted: ${supplier.supplierCode}`);
      } else {
        // Hard delete if no associated data
        await this.supplierModel.findByIdAndDelete(id).exec();
        this.logger.log(`Supplier hard deleted: ${supplier.supplierCode}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting supplier ${id}: ${error.message}`);
      throw error;
    }
  }

  async getSupplierStats(): Promise<any> {
    try {
      const stats = await this.supplierModel.aggregate([
        {
          $group: {
            _id: null,
            totalSuppliers: { $sum: 1 },
            activeSuppliers: { $sum: { $cond: ['$isActive', 1, 0] } },
            inactiveSuppliers: { $sum: { $cond: ['$isActive', 0, 1] } },
            averageRating: { $avg: '$rating' },
            averageQualityRating: { $avg: '$qualityRating' },
            averageReliabilityScore: { $avg: '$reliabilityScore' },
            totalOrders: { $sum: '$totalOrders' },
            totalSpent: { $sum: '$totalSpent' },
          },
        },
      ]);

      const categoryStats = await this.supplierModel.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            averageRating: { $avg: '$rating' },
          },
        },
        { $sort: { count: -1 } },
      ]);

      return {
        overview: stats[0] || {},
        byCategory: categoryStats,
      };
    } catch (error) {
      this.logger.error(`Error retrieving supplier stats: ${error.message}`);
      throw error;
    }
  }

  async updateSupplierRating(
    id: string,
    rating: number,
    qualityRating?: number,
    reliabilityScore?: number,
  ): Promise<Supplier> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid supplier ID format');
      }

      if (rating < 0 || rating > 5) {
        throw new BadRequestException('Rating must be between 0 and 5');
      }

      const updateData: any = { rating };

      if (qualityRating !== undefined) {
        if (qualityRating < 0 || qualityRating > 5) {
          throw new BadRequestException(
            'Quality rating must be between 0 and 5',
          );
        }
        updateData.qualityRating = qualityRating;
      }

      if (reliabilityScore !== undefined) {
        if (reliabilityScore < 0 || reliabilityScore > 5) {
          throw new BadRequestException(
            'Reliability score must be between 0 and 5',
          );
        }
        updateData.reliabilityScore = reliabilityScore;
      }

      const updatedSupplier = await this.supplierModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();

      if (!updatedSupplier) {
        throw new NotFoundException(`Supplier with ID ${id} not found`);
      }

      this.logger.log(
        `Supplier rating updated: ${updatedSupplier.supplierCode}`,
      );
      return updatedSupplier;
    } catch (error) {
      this.logger.error(
        `Error updating supplier rating ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async getSuppliersByCategory(category: string): Promise<Supplier[]> {
    try {
      const suppliers = await this.supplierModel
        .find({ category, isActive: true })
        .sort({ rating: -1, supplierName: 1 })
        .exec();

      this.logger.log(
        `Retrieved ${suppliers.length} suppliers for category: ${category}`,
      );
      return suppliers;
    } catch (error) {
      this.logger.error(
        `Error retrieving suppliers by category ${category}: ${error.message}`,
      );
      throw error;
    }
  }

  async searchSuppliers(searchTerm: string): Promise<Supplier[]> {
    try {
      const suppliers = await this.supplierModel
        .find({
          $or: [
            { supplierName: { $regex: searchTerm, $options: 'i' } },
            { supplierCode: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } },
            { city: { $regex: searchTerm, $options: 'i' } },
            { state: { $regex: searchTerm, $options: 'i' } },
          ],
          isActive: true,
        })
        .limit(20)
        .exec();

      this.logger.log(
        `Search results for "${searchTerm}": ${suppliers.length} suppliers`,
      );
      return suppliers;
    } catch (error) {
      this.logger.error(`Error searching suppliers: ${error.message}`);
      throw error;
    }
  }
}
