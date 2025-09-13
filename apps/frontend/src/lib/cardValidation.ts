// Card validation utilities for VendorFlow payments

export interface CardType {
  name: string
  regex: RegExp
  length: number[]
  cvcLength: number[]
}

// Supported card types
export const CARD_TYPES: Record<string, CardType> = {
  visa: {
    name: 'Visa',
    regex: /^4/,
    length: [13, 16, 19],
    cvcLength: [3]
  },
  mastercard: {
    name: 'Mastercard',
    regex: /^5[1-5]|^2[2-7]/,
    length: [16],
    cvcLength: [3]
  },
  amex: {
    name: 'American Express',
    regex: /^3[47]/,
    length: [15],
    cvcLength: [4]
  },
  discover: {
    name: 'Discover',
    regex: /^6(?:011|5)/,
    length: [16],
    cvcLength: [3]
  },
  diners: {
    name: 'Diners Club',
    regex: /^3[068]/,
    length: [14],
    cvcLength: [3]
  },
  jcb: {
    name: 'JCB',
    regex: /^35/,
    length: [16],
    cvcLength: [3]
  }
}

// Test card numbers for development (Stripe test cards)
export const TEST_CARD_NUMBERS = {
  visa: {
    valid: '4242424242424242',
    declined: '4000000000000002',
    insufficientFunds: '4000000000009995',
    expired: '4000000000000069'
  },
  mastercard: {
    valid: '5555555555554444',
    declined: '5000000000000009'
  },
  amex: {
    valid: '378282246310005',
    declined: '371449635398431'
  },
  discover: {
    valid: '6011111111111117'
  }
}

// Detect card type from number
export function detectCardType(cardNumber: string): string | null {
  const cleanNumber = cardNumber.replace(/\D/g, '')
  
  for (const [type, config] of Object.entries(CARD_TYPES)) {
    if (config.regex.test(cleanNumber)) {
      return type
    }
  }
  
  return null
}

// Format card number with spaces
export function formatCardNumber(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\D/g, '')
  const cardType = detectCardType(cleanNumber)
  
  if (cardType === 'amex') {
    // American Express: 4-6-5 format
    return cleanNumber.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3')
  } else {
    // Most cards: 4-4-4-4 format
    return cleanNumber.replace(/(\d{4})(?=\d)/g, '$1 ')
  }
}

// Validate card number using Luhn algorithm
export function validateCardNumber(cardNumber: string): boolean {
  const cleanNumber = cardNumber.replace(/\D/g, '')
  
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false
  }
  
  // Luhn algorithm
  let sum = 0
  let isEven = false
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i])
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

// Validate expiry date
export function validateExpiryDate(month: string, year: string): boolean {
  const expMonth = parseInt(month)
  const expYear = parseInt(year)
  
  if (expMonth < 1 || expMonth > 12) {
    return false
  }
  
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  
  // Handle 2-digit years
  const fullYear = expYear < 100 ? 2000 + expYear : expYear
  
  if (fullYear < currentYear) {
    return false
  }
  
  if (fullYear === currentYear && expMonth < currentMonth) {
    return false
  }
  
  return true
}

// Validate CVC/CVV
export function validateCVC(cvc: string, cardType?: string): boolean {
  const cleanCVC = cvc.replace(/\D/g, '')
  
  if (!cardType) {
    // Generic validation
    return cleanCVC.length >= 3 && cleanCVC.length <= 4
  }
  
  const cardConfig = CARD_TYPES[cardType]
  if (!cardConfig) {
    return cleanCVC.length >= 3 && cleanCVC.length <= 4
  }
  
  return cardConfig.cvcLength.includes(cleanCVC.length)
}

// Validate cardholder name
export function validateCardholderName(name: string): boolean {
  const trimmedName = name.trim()
  
  if (trimmedName.length < 2 || trimmedName.length > 50) {
    return false
  }
  
  // Should contain at least one space (first and last name)
  if (!trimmedName.includes(' ')) {
    return false
  }
  
  // Should only contain letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/
  return nameRegex.test(trimmedName)
}

// Comprehensive payment method validation
export interface PaymentMethodValidation {
  isValid: boolean
  errors: string[]
  cardType?: string
}

export function validatePaymentMethod(
  cardNumber: string,
  expiryMonth: string,
  expiryYear: string,
  cvc: string,
  cardholderName: string
): PaymentMethodValidation {
  const errors: string[] = []
  const cleanCardNumber = cardNumber.replace(/\D/g, '')
  const cardType = detectCardType(cleanCardNumber)
  
  // Validate card number
  if (!cleanCardNumber) {
    errors.push('Card number is required')
  } else if (!validateCardNumber(cleanCardNumber)) {
    errors.push('Invalid card number')
  }
  
  // Validate expiry date
  if (!expiryMonth || !expiryYear) {
    errors.push('Expiry date is required')
  } else if (!validateExpiryDate(expiryMonth, expiryYear)) {
    errors.push('Invalid or expired date')
  }
  
  // Validate CVC
  if (!cvc) {
    errors.push('CVC is required')
  } else if (!validateCVC(cvc, cardType || undefined)) {
    errors.push('Invalid CVC')
  }
  
  // Validate cardholder name
  if (!cardholderName) {
    errors.push('Cardholder name is required')
  } else if (!validateCardholderName(cardholderName)) {
    errors.push('Invalid cardholder name')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    cardType: cardType || undefined
  }
}

// Check if a card number is a test card
export function isTestCard(cardNumber: string): boolean {
  const cleanNumber = cardNumber.replace(/\D/g, '')
  
  for (const cardType of Object.values(TEST_CARD_NUMBERS)) {
    for (const testNumber of Object.values(cardType)) {
      if (cleanNumber === testNumber) {
        return true
      }
    }
  }
  
  return false
}

// Format expiry date (MM/YY)
export function formatExpiryDate(value: string): string {
  const cleanValue = value.replace(/\D/g, '')
  
  if (cleanValue.length >= 2) {
    return cleanValue.substring(0, 2) + '/' + cleanValue.substring(2, 4)
  }
  
  return cleanValue
}

// Get card brand logo/icon
export function getCardBrandIcon(cardType: string): string {
  const icons: Record<string, string> = {
    visa: '💳',
    mastercard: '💳',
    amex: '💳',
    discover: '💳',
    diners: '💳',
    jcb: '💳'
  }
  
  return icons[cardType] || '💳'
}

// Mask card number for display
export function maskCardNumber(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\D/g, '')
  
  if (cleanNumber.length < 4) {
    return cardNumber
  }
  
  const lastFour = cleanNumber.slice(-4)
  const masked = '*'.repeat(cleanNumber.length - 4)
  
  return formatCardNumber(masked + lastFour)
}

// Validate postal code (basic validation)
export function validatePostalCode(postalCode: string, country: string = 'US'): boolean {
  const cleanCode = postalCode.trim()
  
  if (country === 'US') {
    // US ZIP code: 5 digits or 5+4 format
    return /^\d{5}(-\d{4})?$/.test(cleanCode)
  } else if (country === 'CA') {
    // Canadian postal code: A1A 1A1 format
    return /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/.test(cleanCode)
  } else {
    // Generic validation for other countries
    return cleanCode.length >= 3 && cleanCode.length <= 10
  }
}

export default {
  detectCardType,
  formatCardNumber,
  validateCardNumber,
  validateExpiryDate,
  validateCVC,
  validateCardholderName,
  validatePaymentMethod,
  isTestCard,
  formatExpiryDate,
  getCardBrandIcon,
  maskCardNumber,
  validatePostalCode,
  CARD_TYPES,
  TEST_CARD_NUMBERS
} 