import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PurchaseOrder,
  PurchaseOrderDocument,
} from './schemas/purchase-order.schema';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { Vendor } from '../../common/schemas/vendor.schema';
import { Item } from '../../common/schemas/item.schema';
import { User } from '../../common/schemas/user.schema';

export enum PurchaseOrderStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  SENT_TO_VENDOR = 'Sent to Vendor',
  PARTIALLY_RECEIVED = 'Partially Received',
  FULLY_RECEIVED = 'Fully Received',
  CLOSED = 'Closed',
  CANCELLED = 'Cancelled',
}

export enum ApprovalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectModel(PurchaseOrder.name)
    private purchaseOrderModel: Model<PurchaseOrderDocument>,
    @InjectModel(Vendor.name) private vendorModel: Model<Vendor>,
    @InjectModel(Item.name) private itemModel: Model<Item>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(
    createPurchaseOrderDto: CreatePurchaseOrderDto,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseOrder> {
    // Validate vendor exists
    const vendor = await this.vendorModel.findOne({
      _id: createPurchaseOrderDto.vendorId,
      tenantId,
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Validate items exist and belong to tenant
    for (const item of createPurchaseOrderDto.items) {
      const dbItem = await this.itemModel.findOne({
        _id: item.itemId,
        tenantId,
      });
      if (!dbItem) {
        throw new NotFoundException(`Item ${item.itemId} not found`);
      }
    }

    // Generate PO number
    const poNumber = await this.generatePONumber(tenantId);

    // Create purchase order with proper field mapping
    const purchaseOrder = new this.purchaseOrderModel({
      tenantId,
      poNumber,
      vendorId: createPurchaseOrderDto.vendorId,
      description:
        createPurchaseOrderDto.specialInstructions ||
        createPurchaseOrderDto.notes ||
        'Purchase Order',
      items: createPurchaseOrderDto.items.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercentage: item.discountPercentage || 0,
        taxPercentage: item.taxPercentage || 0,
        expectedDeliveryDate: item.expectedDeliveryDate
          ? new Date(item.expectedDeliveryDate)
          : undefined,
        notes: item.specialInstructions,
      })),
      totalAmount: this.calculateTotalAmount(createPurchaseOrderDto.items),
      status: PurchaseOrderStatus.DRAFT,
      orderDate: createPurchaseOrderDto.orderDate
        ? new Date(createPurchaseOrderDto.orderDate)
        : new Date(),
      expectedDeliveryDate: createPurchaseOrderDto.expectedDeliveryDate
        ? new Date(createPurchaseOrderDto.expectedDeliveryDate)
        : undefined,
      paymentTerms: createPurchaseOrderDto.paymentTerms,
      paymentDueDate: createPurchaseOrderDto.paymentDueDate
        ? new Date(createPurchaseOrderDto.paymentDueDate)
        : undefined,
      createdBy: userId,
      notes: createPurchaseOrderDto.notes,
      approvals: this.initializeApprovals(
        createPurchaseOrderDto.approvals || [],
        userId,
      ),
    });

    return purchaseOrder.save();
  }

  async findAll(
    tenantId: string,
    query: any = {},
  ): Promise<{ purchaseOrders: PurchaseOrder[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      status,
      vendorId,
      dateFrom,
      dateTo,
      search,
    } = query;

    const filter: any = { tenantId };

    if (status) filter.status = status;
    if (vendorId) filter.vendorId = vendorId;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    if (search) {
      filter.$or = [
        { poNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [purchaseOrders, total] = await Promise.all([
      this.purchaseOrderModel
        .find(filter)
        .populate('vendorId', 'name email phone')
        .populate('items.itemId', 'name sku')
        .populate('createdBy', 'firstName lastName email')
        .populate('approvals.approvedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.purchaseOrderModel.countDocuments(filter),
    ]);

    return { purchaseOrders, total };
  }

  async findOne(id: string, tenantId: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderModel
      .findOne({ _id: id, tenantId })
      .populate('vendorId', 'name email phone address')
      .populate('items.itemId', 'name sku description unitPrice')
      .populate('createdBy', 'firstName lastName email')
      .populate('approvals.approvedBy', 'firstName lastName email')
      .exec();

    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    return purchaseOrder;
  }

  async findByPONumber(
    poNumber: string,
    tenantId: string,
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderModel
      .findOne({ poNumber, tenantId })
      .populate('vendorId', 'name email phone')
      .populate('items.itemId', 'name sku')
      .populate('createdBy', 'firstName lastName email')
      .exec();

    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    return purchaseOrder;
  }

  async update(
    id: string,
    updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    tenantId: string,
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderModel.findOne({
      _id: id,
      tenantId,
    });
    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    // Prevent updates if PO is not in draft status
    if (purchaseOrder.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException(
        'Cannot update purchase order that is not in draft status',
      );
    }

    // Recalculate total if items changed
    if (updatePurchaseOrderDto.items) {
      // Note: totalAmount will be calculated by the schema virtual
    }

    const updatedPO = await this.purchaseOrderModel
      .findByIdAndUpdate(id, updatePurchaseOrderDto, { new: true })
      .populate('vendorId', 'name email phone')
      .populate('items.itemId', 'name sku')
      .populate('createdBy', 'firstName lastName email')
      .exec();

    return updatedPO;
  }

  async submitForApproval(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderModel.findOne({
      _id: id,
      tenantId,
    });
    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    if (purchaseOrder.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException(
        'Purchase order must be in draft status to submit for approval',
      );
    }

    // Validate required fields
    if (!purchaseOrder.items || purchaseOrder.items.length === 0) {
      throw new BadRequestException(
        'Purchase order must have at least one item',
      );
    }

    if (!purchaseOrder.vendorId) {
      throw new BadRequestException('Vendor must be specified');
    }

    // Update status and submit date
    purchaseOrder.status = PurchaseOrderStatus.SUBMITTED;
    purchaseOrder.submittedAt = new Date();
    purchaseOrder.submittedBy = new Types.ObjectId(userId); // Use userId instead of tenantId

    return purchaseOrder.save();
  }

  async approve(
    id: string,
    approvalId: string,
    comments: string,
    tenantId: string,
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderModel.findOne({
      _id: id,
      tenantId,
    });
    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    if (purchaseOrder.status !== PurchaseOrderStatus.SUBMITTED) {
      throw new BadRequestException(
        'Purchase order must be submitted for approval',
      );
    }

    // Update approval status
    const approval = purchaseOrder.approvals.find(
      (a) => a.approvedBy.toString() === approvalId,
    );
    if (approval) {
      approval.status = ApprovalStatus.APPROVED;
      approval.approvedAt = new Date();
      approval.comments = comments;
    }

    // Check if all approvals are complete
    const allApproved = purchaseOrder.approvals.every(
      (a) => a.status === ApprovalStatus.APPROVED,
    );
    if (allApproved) {
      purchaseOrder.status = PurchaseOrderStatus.APPROVED;
      purchaseOrder.approvedAt = new Date();
    }

    return purchaseOrder.save();
  }

  async reject(
    id: string,
    tenantId: string,
    userId: string,
    comments: string,
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderModel.findOne({
      _id: id,
      tenantId,
    });
    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    if (purchaseOrder.status !== PurchaseOrderStatus.SUBMITTED) {
      throw new BadRequestException(
        'Purchase order must be submitted for approval',
      );
    }

    // Update approval status
    const approval = purchaseOrder.approvals.find(
      (a) => a.approvedBy.toString() === userId,
    );
    if (approval) {
      approval.status = ApprovalStatus.REJECTED;
      approval.rejectedAt = new Date();
      approval.comments = comments;
    }

    // Reject the entire PO
    purchaseOrder.status = PurchaseOrderStatus.REJECTED;
    purchaseOrder.rejectedAt = new Date();
    purchaseOrder.rejectionReason = comments;

    return purchaseOrder.save();
  }

  async sendToVendor(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderModel.findOne({
      _id: id,
      tenantId,
    });
    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    if (purchaseOrder.status !== PurchaseOrderStatus.APPROVED) {
      throw new BadRequestException(
        'Purchase order must be approved before sending to vendor',
      );
    }

    purchaseOrder.status = PurchaseOrderStatus.SENT_TO_VENDOR;
    purchaseOrder.sentToVendorAt = new Date();
    purchaseOrder.sentBy = new Types.ObjectId(userId);

    // TODO: Send email/notification to vendor
    // This would integrate with SES or similar service

    return purchaseOrder.save();
  }

  async receiveItems(
    id: string,
    tenantId: string,
    userId: string,
    receivedItems: any[],
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderModel.findOne({
      _id: id,
      tenantId,
    });
    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    if (
      purchaseOrder.status !== PurchaseOrderStatus.SENT_TO_VENDOR &&
      purchaseOrder.status !== PurchaseOrderStatus.PARTIALLY_RECEIVED
    ) {
      throw new BadRequestException(
        'Purchase order must be sent to vendor to receive items',
      );
    }

    // Update received quantities
    for (const receivedItem of receivedItems) {
      const poItem = purchaseOrder.items.find(
        (item) => item.itemId.toString() === receivedItem.itemId,
      );
      if (poItem) {
        poItem.receivedQuantity =
          (poItem.receivedQuantity || 0) + receivedItem.quantity;
        poItem.receivedAt = new Date();
        poItem.receivedBy = new Types.ObjectId(userId);
      }
    }

    // Check if all items are fully received
    const allReceived = purchaseOrder.items.every(
      (item) => (item.receivedQuantity || 0) >= item.quantity,
    );

    if (allReceived) {
      purchaseOrder.status = PurchaseOrderStatus.FULLY_RECEIVED;
      purchaseOrder.completedAt = new Date();
    } else {
      purchaseOrder.status = PurchaseOrderStatus.PARTIALLY_RECEIVED;
    }

    return purchaseOrder.save();
  }

  async close(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderModel.findOne({
      _id: id,
      tenantId,
    });
    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    if (purchaseOrder.status !== PurchaseOrderStatus.FULLY_RECEIVED) {
      throw new BadRequestException(
        'Purchase order must be fully received before closing',
      );
    }

    purchaseOrder.status = PurchaseOrderStatus.CLOSED;
    purchaseOrder.closedAt = new Date();
    purchaseOrder.closedBy = new Types.ObjectId(userId);

    return purchaseOrder.save();
  }

  async cancel(
    id: string,
    tenantId: string,
    userId: string,
    reason: string,
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderModel.findOne({
      _id: id,
      tenantId,
    });
    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    if (purchaseOrder.status === PurchaseOrderStatus.CLOSED) {
      throw new BadRequestException('Cannot cancel a closed purchase order');
    }

    purchaseOrder.status = PurchaseOrderStatus.CANCELLED;
    purchaseOrder.cancelledAt = new Date();
    purchaseOrder.cancelledBy = new Types.ObjectId(userId);
    purchaseOrder.cancellationReason = reason;

    return purchaseOrder.save();
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const purchaseOrder = await this.purchaseOrderModel.findOne({
      _id: id,
      tenantId,
    });
    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    if (purchaseOrder.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft purchase orders can be deleted',
      );
    }

    await this.purchaseOrderModel.findByIdAndDelete(id).exec();
  }

  async getPurchaseOrderStats(tenantId: string): Promise<any> {
    const stats = await this.purchaseOrderModel.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ]);

    const totalPOs = await this.purchaseOrderModel.countDocuments({ tenantId });
    const totalAmount = await this.purchaseOrderModel.aggregate([
      { $match: { tenantId } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    return {
      totalPOs,
      totalAmount: totalAmount[0]?.total || 0,
      byStatus: stats,
    };
  }

  private async generatePONumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;

    const lastPO = await this.purchaseOrderModel
      .findOne({ tenantId, poNumber: { $regex: `^${prefix}` } })
      .sort({ poNumber: -1 })
      .exec();

    if (lastPO) {
      const lastNumber = parseInt(lastPO.poNumber.replace(prefix, ''));
      return `${prefix}${(lastNumber + 1).toString().padStart(4, '0')}`;
    }

    return `${prefix}0001`;
  }

  private calculateTotalAmount(items: any[]): number {
    return items.reduce((total, item) => {
      return total + item.unitPrice * item.quantity;
    }, 0);
  }

  private initializeApprovals(approvals: any[], userId: string): any[] {
    if (!approvals || approvals.length === 0) {
      return [];
    }

    return approvals.map((approval) => ({
      approvedBy: approval.approverId,
      status: ApprovalStatus.PENDING,
      requestedAt: new Date(),
      requestedBy: userId,
    }));
  }
}
