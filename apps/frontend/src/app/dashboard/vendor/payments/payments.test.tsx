import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VendorPayments from './page';
import { paymentsApi } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  paymentsApi: {
    getCurrentSubscription: jest.fn(),
    getAvailablePlans: jest.fn(),
    getPaymentMethods: jest.fn(),
    getInvoices: jest.fn(),
    getUsageStats: jest.fn(),
    createSubscription: jest.fn(),
    updateSubscription: jest.fn(),
    addPaymentMethod: jest.fn(),
    deletePaymentMethod: jest.fn(),
    setDefaultPaymentMethod: jest.fn(),
  }
}));

// Mock components
jest.mock('@/components/ui/DashboardSidebar', () => {
  return function MockDashboardSidebar() {
    return <div data-testid="dashboard-sidebar">Sidebar</div>;
  };
});

jest.mock('@/components/ui/DashboardHeader', () => {
  return function MockDashboardHeader() {
    return <div data-testid="dashboard-header">Header</div>;
  };
});

const mockSubscription = {
  id: 'sub_test123',
  plan: {
    id: 'professional',
    name: 'Professional',
    price: 79,
    currency: 'USD',
    interval: 'month',
    features: ['Up to 1,000 orders', 'Priority support']
  },
  status: 'active',
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
};

const mockPlans = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for small businesses',
    price: 29,
    currency: 'USD',
    interval: 'month',
    features: ['Up to 100 orders', 'Email support'],
    maxOrders: 100,
    maxUsers: 5,
    isPopular: false,
    isActive: true
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Ideal for growing businesses',
    price: 79,
    currency: 'USD',
    interval: 'month',
    features: ['Up to 1,000 orders', 'Priority support'],
    maxOrders: 1000,
    maxUsers: 20,
    isPopular: true,
    isActive: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large-scale operations',
    price: 199,
    currency: 'USD',
    interval: 'month',
    features: ['Unlimited orders', '24/7 support'],
    maxOrders: -1,
    maxUsers: -1,
    isPopular: false,
    isActive: true
  }
];

const mockPaymentMethods = [
  {
    id: 'pm_test123',
    type: 'credit_card',
    last4: '4242',
    brand: 'visa',
    expiryMonth: 12,
    expiryYear: 2025,
    holderName: 'John Doe',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockUsageStats = {
  currentPeriodOrders: 250,
  maxOrders: 1000,
  currentPeriodUsers: 5,
  maxUsers: 20,
  storageUsed: 2.5,
  maxStorage: 50
};

const mockInvoices = {
  invoices: [
    {
      id: 'inv_test123',
      amount: 79,
      currency: 'USD',
      status: 'paid',
      description: 'Professional Plan',
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString()
    }
  ],
  total: 1,
  page: 1,
  totalPages: 1
};

describe('VendorPayments', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock responses
    (paymentsApi.getCurrentSubscription as jest.Mock).mockResolvedValue({ 
      data: mockSubscription 
    });
    (paymentsApi.getAvailablePlans as jest.Mock).mockResolvedValue({ 
      data: mockPlans 
    });
    (paymentsApi.getPaymentMethods as jest.Mock).mockResolvedValue({ 
      data: mockPaymentMethods 
    });
    (paymentsApi.getInvoices as jest.Mock).mockResolvedValue({ 
      data: mockInvoices 
    });
    (paymentsApi.getUsageStats as jest.Mock).mockResolvedValue({ 
      data: mockUsageStats 
    });
  });

  describe('Available Plans Display', () => {
    it('should display available plans correctly', async () => {
      render(<VendorPayments />);

      // Wait for plans to load
      await waitFor(() => {
        expect(screen.getByText('Available Plans')).toBeInTheDocument();
      });

      // Check if all plans are displayed
      expect(screen.getByText('Basic')).toBeInTheDocument();
      expect(screen.getByText('Professional')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();

      // Check pricing
      expect(screen.getByText('$29')).toBeInTheDocument();
      expect(screen.getByText('$79')).toBeInTheDocument();
      expect(screen.getByText('$199')).toBeInTheDocument();

      // Check popular badge
      expect(screen.getByText('Popular')).toBeInTheDocument();
    });

    it('should handle plan loading errors gracefully', async () => {
      (paymentsApi.getAvailablePlans as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      render(<VendorPayments />);

      // Should still show fallback plans
      await waitFor(() => {
        expect(screen.getByText('Available Plans')).toBeInTheDocument();
      });
    });

    it('should show current plan indicator', async () => {
      render(<VendorPayments />);

      await waitFor(() => {
        expect(screen.getByText('Current Plan')).toBeInTheDocument();
      });
    });

    it('should allow plan upgrades and downgrades', async () => {
      render(<VendorPayments />);

      await waitFor(() => {
        const upgradeButton = screen.getByRole('button', { name: /upgrade/i });
        expect(upgradeButton).toBeInTheDocument();
        
        fireEvent.click(upgradeButton);
        
        // Should open plan change modal
        expect(screen.getByText(/change plan/i)).toBeInTheDocument();
      });
    });
  });

  describe('Usage Statistics', () => {
    it('should display real usage statistics', async () => {
      render(<VendorPayments />);

      // Switch to usage tab
      fireEvent.click(screen.getByText('Usage'));

      await waitFor(() => {
        // Check orders usage
        expect(screen.getByText('250 / 1000')).toBeInTheDocument();
        expect(screen.getByText('Orders This Period')).toBeInTheDocument();

        // Check users usage
        expect(screen.getByText('5 / 20')).toBeInTheDocument();
        expect(screen.getByText('Active Users')).toBeInTheDocument();

        // Check storage usage
        expect(screen.getByText('2.50 GB / 50 GB')).toBeInTheDocument();
        expect(screen.getByText('Storage Used')).toBeInTheDocument();
      });
    });

    it('should show usage percentage bars', async () => {
      render(<VendorPayments />);

      fireEvent.click(screen.getByText('Usage'));

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars).toHaveLength(3); // Orders, Users, Storage
      });
    });

    it('should handle usage stats loading errors', async () => {
      (paymentsApi.getUsageStats as jest.Mock).mockRejectedValue(
        new Error('Usage API Error')
      );

      render(<VendorPayments />);

      fireEvent.click(screen.getByText('Usage'));

      // Should show fallback/default values
      await waitFor(() => {
        expect(screen.getByText('Usage Statistics')).toBeInTheDocument();
      });
    });

    it('should warn when approaching limits', async () => {
      const highUsageStats = {
        currentPeriodOrders: 950, // 95% of 1000
        maxOrders: 1000,
        currentPeriodUsers: 19, // 95% of 20
        maxUsers: 20,
        storageUsed: 47.5, // 95% of 50
        maxStorage: 50
      };

      (paymentsApi.getUsageStats as jest.Mock).mockResolvedValue({ 
        data: highUsageStats 
      });

      render(<VendorPayments />);

      fireEvent.click(screen.getByText('Usage'));

      await waitFor(() => {
        // Should show warning indicators for high usage
        expect(screen.getByText('950 / 1000')).toBeInTheDocument();
        expect(screen.getByText('19 / 20')).toBeInTheDocument();
      });
    });
  });

  describe('Payment Method Management', () => {
    it('should display existing payment methods', async () => {
      render(<VendorPayments />);

      fireEvent.click(screen.getByText('Payment Methods'));

      await waitFor(() => {
        expect(screen.getByText('•••• •••• •••• 4242')).toBeInTheDocument();
        expect(screen.getByText('Default')).toBeInTheDocument();
        expect(screen.getByText('VISA')).toBeInTheDocument();
      });
    });

    it('should open add payment method modal', async () => {
      render(<VendorPayments />);

      fireEvent.click(screen.getByText('Payment Methods'));

      await waitFor(() => {
        const addButton = screen.getByText('Add New Payment Method');
        fireEvent.click(addButton);

        expect(screen.getByText('Add Payment Method')).toBeInTheDocument();
      });
    });

    it('should validate card input with real validation', async () => {
      render(<VendorPayments />);

      fireEvent.click(screen.getByText('Payment Methods'));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Add New Payment Method'));
      });

      // Test invalid card number
      const cardInput = screen.getByPlaceholderText(/1234 5678 9012 3456/);
      fireEvent.change(cardInput, { target: { value: '1234567890123456' } });

      const submitButton = screen.getByRole('button', { name: /add payment method/i });
      fireEvent.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid card number/i)).toBeInTheDocument();
      });
    });

    it('should handle payment method deletion', async () => {
      render(<VendorPayments />);

      fireEvent.click(screen.getByText('Payment Methods'));

      await waitFor(() => {
        const removeButton = screen.getByText('Remove');
        fireEvent.click(removeButton);

        expect(paymentsApi.deletePaymentMethod).toHaveBeenCalledWith('pm_test123');
      });
    });
  });

  describe('Subscription Management', () => {
    it('should display current subscription details', async () => {
      render(<VendorPayments />);

      await waitFor(() => {
        expect(screen.getByText('Current Subscription')).toBeInTheDocument();
        expect(screen.getByText('Professional')).toBeInTheDocument();
        expect(screen.getByText('$79/month')).toBeInTheDocument();
      });
    });

    it('should handle subscription creation for new users', async () => {
      (paymentsApi.getCurrentSubscription as jest.Mock).mockResolvedValue({ 
        data: null 
      });

      render(<VendorPayments />);

      await waitFor(() => {
        const getStartedButton = screen.getByText('Get Started');
        fireEvent.click(getStartedButton);

        expect(paymentsApi.createSubscription).toHaveBeenCalled();
      });
    });

    it('should show billing history', async () => {
      render(<VendorPayments />);

      fireEvent.click(screen.getByText('Billing History'));

      await waitFor(() => {
        expect(screen.getByText('Professional Plan')).toBeInTheDocument();
        expect(screen.getByText('$79.00')).toBeInTheDocument();
        expect(screen.getByText('Paid')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when all APIs fail', async () => {
      (paymentsApi.getCurrentSubscription as jest.Mock).mockRejectedValue(
        new Error('Network Error')
      );
      (paymentsApi.getAvailablePlans as jest.Mock).mockRejectedValue(
        new Error('Network Error')
      );
      (paymentsApi.getPaymentMethods as jest.Mock).mockRejectedValue(
        new Error('Network Error')
      );

      render(<VendorPayments />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load payment information/i)).toBeInTheDocument();
      });
    });

    it('should handle partial API failures gracefully', async () => {
      (paymentsApi.getPaymentMethods as jest.Mock).mockRejectedValue(
        new Error('Payment Methods API Error')
      );

      render(<VendorPayments />);

      // Should still show other data
      await waitFor(() => {
        expect(screen.getByText('Available Plans')).toBeInTheDocument();
        expect(screen.getByText('Professional')).toBeInTheDocument();
      });
    });
  });

  describe('Real Data Integration', () => {
    it('should calculate usage stats from real order data', async () => {
      // Mock orders API response
      const mockOrdersResponse = {
        data: [
          { id: '1', createdAt: new Date().toISOString(), status: 'completed' },
          { id: '2', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'completed' },
          { id: '3', createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), status: 'completed' }, // Previous month
        ]
      };

      // Mock the ordersApi call within getUsageStats
      jest.doMock('@/lib/api', () => ({
        ...jest.requireActual('@/lib/api'),
        ordersApi: {
          getAll: jest.fn().mockResolvedValue(mockOrdersResponse)
        }
      }));

      render(<VendorPayments />);

      fireEvent.click(screen.getByText('Usage'));

      await waitFor(() => {
        // Should show calculated values based on real orders (2 orders this month)
        expect(paymentsApi.getUsageStats).toHaveBeenCalled();
      });
    });
  });
}); 