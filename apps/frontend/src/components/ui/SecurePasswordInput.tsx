'use client'

import React, { useState, useCallback } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { validatePassword } from '@/lib/api'

interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

interface SecurePasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onValidationChange?: (validation: PasswordValidation) => void;
  showStrengthIndicator?: boolean;
  showRequirements?: boolean;
  required?: boolean;
  disabled?: boolean;
}

export default function SecurePasswordInput({
  value,
  onChange,
  placeholder = 'Enter password',
  className = '',
  onValidationChange,
  showStrengthIndicator = true,
  showRequirements = true,
  required = false,
  disabled = false
}: SecurePasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [validation, setValidation] = useState<PasswordValidation>({ 
    isValid: false, 
    errors: [], 
    strength: 'weak' 
  })
  const [focused, setFocused] = useState(false)
  const [touched, setTouched] = useState(false)

  const handlePasswordChange = useCallback((newValue: string) => {
    onChange(newValue)
    
    if (newValue.length > 0) {
      const newValidation = validatePassword(newValue)
      setValidation(newValidation)
      onValidationChange?.(newValidation)
    } else {
      const emptyValidation = { isValid: false, errors: [], strength: 'weak' as const }
      setValidation(emptyValidation)
      onValidationChange?.(emptyValidation)
    }
  }, [onChange, onValidationChange])

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'weak': return 'bg-red-500'
      default: return 'bg-gray-300'
    }
  }

  const getInputBorderStyle = () => {
    if (!touched) return 'border-gray-300 focus:border-blue-500'
    return validation.isValid ? 'border-green-500' : 'border-red-500'
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => handlePasswordChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            setTouched(true)
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors ${getInputBorderStyle()}`}
        />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeSlashIcon className="w-5 h-5" />
          ) : (
            <EyeIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Password Strength Indicator */}
      {showStrengthIndicator && value.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Password strength:</span>
            <span className={`font-medium ${
              validation.strength === 'strong' ? 'text-green-600' :
              validation.strength === 'medium' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {validation.strength.charAt(0).toUpperCase() + validation.strength.slice(1)}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(validation.strength)}`}
              style={{
                width: validation.strength === 'strong' ? '100%' :
                       validation.strength === 'medium' ? '66%' : '33%'
              }}
            />
          </div>
        </div>
      )}

      {/* Password Requirements */}
      {showRequirements && (focused || touched) && value.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700">Password requirements:</p>
          <ul className="text-sm space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index} className="flex items-center space-x-2 text-red-600">
                <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-xs">×</span>
                <span>{error}</span>
              </li>
            ))}
            {validation.isValid && (
              <li className="flex items-center space-x-2 text-green-600">
                <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-xs">✓</span>
                <span>All requirements met</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
} 