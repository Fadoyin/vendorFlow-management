# Testing Guide

This document provides comprehensive guidance for testing the Vendor Management Platform across all layers: unit tests, integration tests, end-to-end tests, and performance tests.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Performance Testing](#performance-testing)
6. [Test Data Management](#test-data-management)
7. [Continuous Testing](#continuous-testing)
8. [Test Coverage](#test-coverage)

## Testing Strategy

Our testing strategy follows the testing pyramid approach:

```
    /\
   /  \     E2E Tests (Few)
  /____\    Integration Tests (Some)
 /      \   Unit Tests (Many)
/________\
```

- **Unit Tests**: Fast, isolated tests for individual functions/components
- **Integration Tests**: Tests for service interactions and database operations
- **End-to-End Tests**: Full user journey tests
- **Performance Tests**: Load and stress testing

## Unit Testing

### Backend (NestJS)

#### Setup

```bash
cd apps/backend
npm install
npm run test
```

#### Test Structure

```typescript
// Example: inventory.service.spec.ts
describe('InventoryService', () => {
  let service: InventoryService;
  let itemModel: Model<Item>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getModelToken(Item.name),
          useValue: mockItemModel,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should create a new item successfully', async () => {
    // Test implementation
  });
});
```

#### Running Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test -- inventory.service.spec.ts

# Run tests matching pattern
npm run test -- --testNamePattern="create"
```

#### Test Coverage

```bash
# Generate coverage report
npm run test:cov

# View coverage in browser
npm run test:cov:html
```

### Frontend (Next.js)

#### Setup

```bash
cd apps/frontend
npm install
npm run test
```

#### Test Structure

```typescript
// Example: InventoryTable.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { InventoryTable } from './InventoryTable';

describe('InventoryTable', () => {
  it('renders inventory items correctly', () => {
    const mockItems = [/* mock data */];
    render(<InventoryTable items={mockItems} />);
    
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  it('handles item selection', () => {
    const mockOnSelect = jest.fn();
    render(<InventoryTable items={mockItems} onSelect={mockOnSelect} />);
    
    fireEvent.click(screen.getByText('Test Item'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockItems[0]);
  });
});
```

#### Running Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run tests in CI mode
npm run test:ci
```

### ML Service (FastAPI)

#### Setup

```bash
cd apps/ml-service
pip install -r requirements.txt
pip install pytest pytest-cov pytest-asyncio
```

#### Test Structure

```python
# Example: test_ml_service.py
import pytest
from app.services.ml_service import MLService

class TestMLService:
    @pytest.fixture
    def ml_service(self):
        return MLService()
    
    @pytest.mark.asyncio
    async def test_train_demand_model(self, ml_service):
        # Test implementation
        pass
    
    @pytest.mark.asyncio
    async def test_generate_forecast(self, ml_service):
        # Test implementation
        pass
```

#### Running Tests

```bash
# Run all tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest test_ml_service.py

# Run tests matching pattern
pytest -k "test_train"
```

## Integration Testing

### Backend Integration Tests

#### Database Integration

```typescript
// Example: inventory.integration.spec.ts
describe('Inventory Integration Tests', () => {
  let app: INestApplication;
  let mongooseConnection: Connection;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    mongooseConnection = app.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await mongooseConnection.close();
    await app.close();
  });

  beforeEach(async () => {
    // Clear test data
    await mongooseConnection.dropDatabase();
  });

  it('should create and retrieve inventory item', async () => {
    // Test implementation
  });
});
```

#### Service Integration

```typescript
// Example: vendor-inventory.integration.spec.ts
describe('Vendor-Inventory Integration', () => {
  it('should update vendor performance when items are received', async () => {
    // Test vendor and inventory service interaction
  });
});
```

### API Integration Tests

```typescript
// Example: inventory.api.integration.spec.ts
describe('Inventory API Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('POST /api/inventory should create item', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/inventory')
      .send(createItemDto)
      .expect(201);

    expect(response.body.sku).toBe(createItemDto.sku);
  });
});
```

## End-to-End Testing

### Playwright Setup

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

### E2E Test Structure

```typescript
// Example: inventory-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Inventory Management Flow', () => {
  test('should complete full inventory lifecycle', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');

    // Navigate to inventory
    await page.click('[data-testid="inventory-nav"]');
    
    // Create item
    await page.click('[data-testid="create-item-button"]');
    await page.fill('[data-testid="sku-input"]', 'TEST-SKU-001');
    await page.fill('[data-testid="name-input"]', 'Test Item');
    await page.click('[data-testid="save-button"]');
    
    // Verify item created
    await expect(page.locator('text=Test Item')).toBeVisible();
  });
});
```

### Running E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run tests in headed mode
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

## Performance Testing

### Load Testing with Artillery

#### Setup

```bash
npm install -g artillery
```

#### Load Test Configuration

```yaml
# load-test.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrival_rate: 10
      name: "Warm up"
    - duration: 300
      arrival_rate: 50
      name: "Sustained load"
    - duration: 60
      arrival_rate: 100
      name: "Peak load"

scenarios:
  - name: "Inventory API"
    weight: 70
    flow:
      - get:
          url: "/api/inventory"
          expect:
            - statusCode: 200
      - post:
          url: "/api/inventory"
          json:
            sku: "{{ $randomString() }}"
            name: "Load Test Item"
          expect:
            - statusCode: 201

  - name: "Vendor API"
    weight: 30
    flow:
      - get:
          url: "/api/vendors"
          expect:
            - statusCode: 200
```

#### Running Load Tests

```bash
# Run load test
artillery run load-test.yml

# Run with custom target
artillery run --target http://staging.example.com load-test.yml

# Generate HTML report
artillery run --output report.json load-test.yml
artillery report report.json
```

### Stress Testing

```yaml
# stress-test.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 300
      arrival_rate: 100
      name: "Baseline"
    - duration: 300
      arrival_rate: 200
      name: "Stress"
    - duration: 300
      arrival_rate: 500
      name: "Break point"
    - duration: 300
      arrival_rate: 100
      name: "Recovery"
```

### Database Performance Testing

```typescript
// Example: database.performance.spec.ts
describe('Database Performance Tests', () => {
  it('should handle bulk item creation efficiently', async () => {
    const startTime = Date.now();
    
    const items = Array.from({ length: 1000 }, (_, i) => ({
      sku: `BULK-${i}`,
      name: `Bulk Item ${i}`,
      // ... other fields
    }));

    await Promise.all(
      items.map(item => inventoryService.create(item, tenantId, userId))
    );

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(10000); // Should complete in < 10s
  });
});
```

## Test Data Management

### Test Data Factories

```typescript
// Example: test-factories.ts
export class TestDataFactory {
  static createVendor(overrides: Partial<CreateVendorDto> = {}): CreateVendorDto {
    return {
      name: `Test Vendor ${Date.now()}`,
      vendorCode: `V${Date.now()}`,
      category: 'raw_materials',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'US',
      },
      contacts: [{
        name: 'Test Contact',
        email: 'contact@testvendor.com',
        phone: '555-1234',
      }],
      ...overrides,
    };
  }

  static createItem(overrides: Partial<CreateItemDto> = {}): CreateItemDto {
    return {
      sku: `TEST-${Date.now()}`,
      name: `Test Item ${Date.now()}`,
      category: 'raw_materials',
      unitOfMeasure: 'piece',
      pricing: {
        costPrice: 10.99,
        currency: 'USD',
      },
      inventory: {
        currentStock: 100,
        reorderPoint: 20,
        reorderQuantity: 50,
        stockUnit: 'piece',
      },
      ...overrides,
    };
  }
}
```

### Test Database Setup

```typescript
// Example: test-database.ts
export class TestDatabase {
  static async setup() {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  }

  static async teardown() {
    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }

  static async seed() {
    // Seed test data
    const vendor = await vendorService.create(
      TestDataFactory.createVendor(),
      'test-tenant',
      'test-user'
    );

    const item = await inventoryService.create(
      TestDataFactory.createItem(),
      'test-tenant',
      'test-user'
    );

    return { vendor, item };
  }
}
```

## Continuous Testing

### Pre-commit Hooks

```json
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint
npm run test:quick
npm run type-check
```

### CI/CD Pipeline Tests

The CI/CD pipeline includes:

1. **Linting**: Code style and quality checks
2. **Type Checking**: TypeScript compilation validation
3. **Unit Tests**: Fast feedback on code changes
4. **Integration Tests**: Service interaction validation
5. **Security Scanning**: Vulnerability detection
6. **Performance Tests**: Load testing in staging

### Test Automation

```yaml
# .github/workflows/test-automation.yml
name: Test Automation

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  automated-testing:
    runs-on: ubuntu-latest
    steps:
      - name: Run E2E tests
        run: npx playwright test --reporter=html
      
      - name: Run performance tests
        run: artillery run load-test.yml
      
      - name: Generate test report
        run: |
          echo "Test Results:" >> report.md
          echo "- E2E Tests: ${{ steps.e2e.outcome }}" >> report.md
          echo "- Performance Tests: ${{ steps.performance.outcome }}" >> report.md
```

## Test Coverage

### Coverage Targets

- **Unit Tests**: > 90%
- **Integration Tests**: > 80%
- **E2E Tests**: Critical user journeys
- **Performance Tests**: All major API endpoints

### Coverage Reports

```bash
# Backend coverage
cd apps/backend
npm run test:cov

# Frontend coverage
cd apps/frontend
npm run test:cov

# ML Service coverage
cd apps/ml-service
pytest --cov=app --cov-report=html
```

### Coverage Badges

Add coverage badges to README:

```markdown
[![Backend Coverage](https://img.shields.io/badge/backend-95%25-brightgreen)](https://codecov.io/gh/your-repo)
[![Frontend Coverage](https://img.shields.io/badge/frontend-92%25-brightgreen)](https://codecov.io/gh/your-repo)
[![ML Service Coverage](https://img.shields.io/badge/ml--service-88%25-yellow)](https://codecov.io/gh/your-repo)
```

## Best Practices

### Test Organization

1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain the expected behavior
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests independent** and isolated
5. **Use meaningful test data** with factories

### Test Maintenance

1. **Update tests when features change**
2. **Refactor tests to reduce duplication**
3. **Monitor test execution time** and optimize slow tests
4. **Regularly review and update test coverage**
5. **Use test data builders** for complex objects

### Performance Considerations

1. **Mock external dependencies** in unit tests
2. **Use test databases** for integration tests
3. **Clean up test data** after each test
4. **Run performance tests** in isolated environments
5. **Monitor resource usage** during test execution

## Troubleshooting

### Common Issues

1. **Test timeouts**: Increase timeout values for slow operations
2. **Database connection issues**: Ensure test database is accessible
3. **Mock failures**: Verify mock implementations match expected behavior
4. **Environment variables**: Check test environment configuration
5. **Async test failures**: Use proper async/await patterns

### Debug Tips

1. **Use `console.log`** in tests for debugging
2. **Run tests in isolation** to identify problematic tests
3. **Check test logs** for detailed error information
4. **Use test debugging tools** like `--inspect-brk`
5. **Review test coverage** to identify untested code paths

This testing guide provides a comprehensive approach to ensuring code quality and reliability across all components of the Vendor Management Platform.
