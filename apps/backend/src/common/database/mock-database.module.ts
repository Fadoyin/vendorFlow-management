import { Module, Global } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';

// Mock implementations for models
class MockModel {
  private static storage = new Map<string, any[]>();
  private modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
    if (!MockModel.storage.has(modelName)) {
      MockModel.storage.set(modelName, []);
    }
  }

  async create(data: any) {
    const id = Math.random().toString(36).substring(7);
    const doc = { ...data, _id: id, id };
    MockModel.storage.get(this.modelName)?.push(doc);
    return doc;
  }

  async findOne(filter: any) {
    const items = MockModel.storage.get(this.modelName) || [];
    return items.find((item) => {
      return Object.keys(filter).every((key) => item[key] === filter[key]);
    });
  }

  async find(filter: any = {}) {
    const items = MockModel.storage.get(this.modelName) || [];
    if (Object.keys(filter).length === 0) return items;

    return items.filter((item) => {
      return Object.keys(filter).every((key) => item[key] === filter[key]);
    });
  }

  async findById(id: string) {
    const items = MockModel.storage.get(this.modelName) || [];
    return items.find((item) => item._id === id || item.id === id);
  }

  async findByIdAndUpdate(id: string, update: any) {
    const items = MockModel.storage.get(this.modelName) || [];
    const index = items.findIndex((item) => item._id === id || item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...update };
      return items[index];
    }
    return null;
  }

  async deleteOne(filter: any) {
    const items = MockModel.storage.get(this.modelName) || [];
    const index = items.findIndex((item) => {
      return Object.keys(filter).every((key) => item[key] === filter[key]);
    });
    if (index !== -1) {
      items.splice(index, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async countDocuments(filter: any = {}) {
    const items = MockModel.storage.get(this.modelName) || [];
    if (Object.keys(filter).length === 0) return items.length;

    return items.filter((item) => {
      return Object.keys(filter).every((key) => item[key] === filter[key]);
    }).length;
  }

  // Add chainable methods for compatibility
  populate() {
    return this;
  }
  sort() {
    return this;
  }
  skip() {
    return this;
  }
  limit() {
    return this;
  }
  exec() {
    return Promise.resolve([]);
  }
}

// Create mock model factory
function createMockModel(modelName: string) {
  const model = new MockModel(modelName);
  // Make it callable as a constructor
  const ModelConstructor: any = function (data: any) {
    return {
      ...data,
      save: async () => model.create(data),
    };
  };

  // Add static methods
  Object.setPrototypeOf(ModelConstructor, model);
  Object.getOwnPropertyNames(Object.getPrototypeOf(model)).forEach((name) => {
    if (name !== 'constructor') {
      ModelConstructor[name] = (model as any)[name].bind(model);
    }
  });

  return ModelConstructor;
}

@Global()
@Module({
  providers: [
    {
      provide: getModelToken('Item'),
      useValue: createMockModel('Item'),
    },
    {
      provide: getModelToken('User'),
      useValue: createMockModel('User'),
    },
    {
      provide: getModelToken('Vendor'),
      useValue: createMockModel('Vendor'),
    },
    {
      provide: getModelToken('PurchaseOrder'),
      useValue: createMockModel('PurchaseOrder'),
    },
    {
      provide: getModelToken('Forecast'),
      useValue: createMockModel('Forecast'),
    },
    {
      provide: getModelToken('Tenant'),
      useValue: createMockModel('Tenant'),
    },
  ],
  exports: [
    getModelToken('Item'),
    getModelToken('User'),
    getModelToken('Vendor'),
    getModelToken('PurchaseOrder'),
    getModelToken('Forecast'),
    getModelToken('Tenant'),
  ],
})
export class MockDatabaseModule {}
