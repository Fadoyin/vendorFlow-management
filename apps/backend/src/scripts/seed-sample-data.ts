import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InventoryService } from '../modules/inventory/inventory.service';
import { VendorsService } from '../modules/vendors/vendors.service';
import { SuppliersService } from '../modules/suppliers/suppliers.service';
import { UsersService } from '../modules/users/users.service';
import {
  SupplierCategory,
  SupplierStatus,
} from '../common/schemas/supplier.schema';

async function seedData() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const inventoryService = app.get(InventoryService);
  const vendorsService = app.get(VendorsService);
  const suppliersService = app.get(SuppliersService);
  const usersService = app.get(UsersService);

  console.log('🌱 Starting data seeding...');

  // Default tenant and user IDs for demo
  const tenantId = 'demo-tenant';
  const userId = 'demo-user';

  // Sample vendors
  const vendors = [
    {
      name: 'Fresh Produce Co.',
      vendorCode: 'FPC001',
      category: 'raw_materials',
      address: {
        street: '123 Farm Road',
        city: 'Farmville',
        state: 'CA',
        zipCode: '12345',
        country: 'USA',
      },
      contacts: [
        {
          name: 'John Smith',
          email: 'john@freshproduce.com',
          phone: '555-0101',
          isPrimary: true,
        },
      ],
      rating: 4.5,
      status: SupplierStatus.ACTIVE,
    },
    {
      name: 'Quality Meats Ltd.',
      vendorCode: 'QML002',
      category: 'raw_materials',
      address: {
        street: '456 Meat Market St',
        city: 'Butcherville',
        state: 'TX',
        zipCode: '67890',
        country: 'USA',
      },
      contacts: [
        {
          name: 'Jane Doe',
          email: 'jane@qualitymeats.com',
          phone: '555-0202',
          isPrimary: true,
        },
      ],
      rating: 4.8,
      status: SupplierStatus.ACTIVE,
    },
    {
      name: 'Dairy Best Suppliers',
      vendorCode: 'DBS003',
      category: 'raw_materials',
      address: {
        street: '789 Dairy Lane',
        city: 'Milktown',
        state: 'WI',
        zipCode: '54321',
        country: 'USA',
      },
      contacts: [
        {
          name: 'Bob Johnson',
          email: 'bob@dairybest.com',
          phone: '555-0303',
          isPrimary: true,
        },
      ],
      rating: 4.2,
      status: SupplierStatus.ACTIVE,
    },
  ];

  // Sample suppliers
  const suppliers = [
    {
      supplierName: 'Global Supply Chain Ltd',
      supplierCode: 'GSC001',
      category: SupplierCategory.EQUIPMENT,
      contactPerson: 'Alice Wilson',
      email: 'alice@globalsupply.com',
      phone: '555-1001',
      website: 'https://globalsupply.com',
      address: '100 Supply Chain Ave',
      city: 'Commerce City',
      state: 'CO',
      zipCode: '80022',
      country: 'USA',
      paymentTerms: 'Net 30',
      qualityRating: 4.5,
      reliabilityScore: 4.8,
      status: SupplierStatus.ACTIVE,
    },
    {
      supplierName: 'Tech Components Inc',
      supplierCode: 'TCI002',
      category: SupplierCategory.EQUIPMENT,
      contactPerson: 'David Chen',
      email: 'david@techcomponents.com',
      phone: '555-1002',
      website: 'https://techcomponents.com',
      address: '250 Tech Park Dr',
      city: 'Silicon Valley',
      state: 'CA',
      zipCode: '94043',
      country: 'USA',
      paymentTerms: 'Net 15',
      qualityRating: 4.7,
      reliabilityScore: 4.6,
      status: SupplierStatus.ACTIVE,
    },
    {
      supplierName: 'Material Masters Corp',
      supplierCode: 'MMC003',
      category: SupplierCategory.OTHER,
      contactPerson: 'Sarah Thompson',
      email: 'sarah@materialmasters.com',
      phone: '555-1003',
      website: 'https://materialmasters.com',
      address: '500 Industrial Blvd',
      city: 'Manufacturing City',
      state: 'OH',
      zipCode: '44102',
      country: 'USA',
      paymentTerms: 'Net 45',
      qualityRating: 4.3,
      reliabilityScore: 4.4,
      status: SupplierStatus.ACTIVE,
    },
  ];

  // Sample inventory items
  const items = [
    {
      sku: 'PROD-001',
      name: 'Laptop Computer',
      category: SupplierCategory.EQUIPMENT,
      description: 'High-performance laptop computer',
      unitOfMeasure: 'piece',
      costPrice: 899.99,
      currency: 'USD',
      currentStock: 50,
      reorderPoint: 10,
      reorderQuantity: 25,
    },
    {
      sku: 'PROD-002',
      name: 'Office Chair',
      category: SupplierCategory.EQUIPMENT,
      description: 'Ergonomic office chair with lumbar support',
      unitOfMeasure: 'piece',
      costPrice: 249.99,
      currency: 'USD',
      currentStock: 30,
      reorderPoint: 8,
      reorderQuantity: 20,
    },
    {
      sku: 'PROD-003',
      name: 'Wireless Mouse',
      category: SupplierCategory.EQUIPMENT,
      description: 'Ergonomic wireless mouse with long battery life',
      unitOfMeasure: 'piece',
      costPrice: 29.99,
      currency: 'USD',
      currentStock: 150,
      reorderPoint: 30,
      reorderQuantity: 100,
    },
    {
      sku: 'PROD-004',
      name: 'Notebook Set',
      category: 'supplies',
      description: 'Set of 5 professional notebooks',
      unitOfMeasure: 'set',
      costPrice: 15.99,
      currency: 'USD',
      currentStock: 200,
      reorderPoint: 40,
      reorderQuantity: 150,
    },
    {
      sku: 'PROD-005',
      name: 'Coffee Machine',
      category: SupplierCategory.EQUIPMENT,
      description: 'Automatic coffee machine for office use',
      unitOfMeasure: 'piece',
      costPrice: 199.99,
      currency: 'USD',
      currentStock: 20,
      reorderPoint: 5,
      reorderQuantity: 15,
    },
  ];

  try {
    // Create vendors
    console.log('Creating vendors...');
    for (const vendor of vendors) {
      try {
        await vendorsService.create(vendor, tenantId, userId);
        console.log(`✅ Created vendor: ${vendor.name}`);
      } catch (error) {
        console.log(`⚠️  Vendor ${vendor.name} might already exist`);
      }
    }

    // Create suppliers
    console.log('\nCreating suppliers...');
    for (const supplier of suppliers) {
      try {
        await suppliersService.create(supplier);
        console.log(`✅ Created supplier: ${supplier.supplierName}`);
      } catch (error) {
        console.log(
          `⚠️  Supplier ${supplier.supplierName} might already exist`,
        );
      }
    }

    // Create inventory items
    console.log('\nCreating inventory items...');
    for (const item of items) {
      try {
        await inventoryService.create(item, tenantId, userId);
        console.log(`✅ Created item: ${item.name}`);
      } catch (error) {
        console.log(`⚠️  Item ${item.name} might already exist`);
      }
    }

    console.log('\n🎉 Sample data seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await app.close();
  }
}

seedData();
