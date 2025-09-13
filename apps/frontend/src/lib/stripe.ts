import { StripeCardElementOptions } from '@stripe/stripe-js';

// Stripe Card Element styling options
export const cardElementOptions: StripeCardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
      iconColor: '#fa755a',
    },
  },
  hidePostalCode: false,
  iconStyle: 'solid',
};

// Stripe error message mapping for user-friendly display
export const getStripeErrorMessage = (error: any): string => {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  // Handle Stripe-specific errors
  if (error.type === 'card_error') {
    switch (error.code) {
      case 'card_declined':
        return 'Your card was declined. Please try a different payment method.';
      case 'expired_card':
        return 'Your card has expired. Please use a different payment method.';
      case 'incorrect_cvc':
        return 'Your card\'s security code is incorrect. Please try again.';
      case 'insufficient_funds':
        return 'Your card has insufficient funds. Please try a different payment method.';
      case 'invalid_expiry_month':
        return 'Your card\'s expiration month is invalid.';
      case 'invalid_expiry_year':
        return 'Your card\'s expiration year is invalid.';
      case 'invalid_number':
        return 'Your card number is invalid.';
      case 'invalid_cvc':
        return 'Your card\'s security code is invalid.';
      case 'processing_error':
        return 'An error occurred while processing your card. Please try again.';
      case 'rate_limit':
        return 'Too many requests. Please wait a moment and try again.';
      default:
        return error.message || 'Your card could not be processed. Please try again.';
    }
  }

  // Handle validation errors
  if (error.type === 'validation_error') {
    return error.message || 'Please check your payment information and try again.';
  }

  // Handle API connection errors
  if (error.type === 'api_connection_error') {
    return 'Unable to connect to our payment processor. Please check your internet connection and try again.';
  }

  // Handle API errors
  if (error.type === 'api_error') {
    return 'A payment processing error occurred. Please try again later.';
  }

  // Handle authentication errors
  if (error.type === 'authentication_error') {
    return 'Authentication with our payment processor failed. Please try again.';
  }

  // Handle rate limit errors
  if (error.type === 'rate_limit_error') {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Handle generic errors with message
  if (error.message) {
    return error.message;
  }

  // Fallback for unknown errors
  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
};

// Format currency for display
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
};

// Validate card information
export const validateCardInfo = (cardElement: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!cardElement) {
    errors.push('Card information is required');
    return { isValid: false, errors };
  }

  // Card element validation is handled by Stripe internally
  // This function can be extended for additional custom validation
  
  return { isValid: errors.length === 0, errors };
};

// Payment method type mapping
export const getPaymentMethodIcon = (type: string): string => {
  const icons: Record<string, string> = {
    'visa': '💳',
    'mastercard': '💳',
    'amex': '💳',
    'discover': '💳',
    'diners': '💳',
    'jcb': '💳',
    'unionpay': '💳',
    'card': '💳',
    'unknown': '💳'
  };
  
  return icons[type] || icons['unknown'];
};

// Format card brand name
export const formatCardBrand = (brand: string): string => {
  const brandMap: Record<string, string> = {
    'amex': 'American Express',
    'diners': 'Diners Club',
    'discover': 'Discover',
    'jcb': 'JCB',
    'mastercard': 'Mastercard',
    'unionpay': 'UnionPay',
    'visa': 'Visa',
    'unknown': 'Unknown'
  };
  
  return brandMap[brand] || brandMap['unknown'];
};

// Stripe publishable key validation
export const validateStripeKey = (key: string): boolean => {
  return key && (key.startsWith('pk_test_') || key.startsWith('pk_live_'));
}; 