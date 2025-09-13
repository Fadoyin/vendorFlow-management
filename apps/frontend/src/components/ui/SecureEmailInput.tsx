'use client'

import React, { useState, useCallback } from 'react'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { validateEmail } from '@/lib/api'

interface SecureEmailInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  showValidation?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export function SecureEmailInput({
  value,
  onChange,
  placeholder = "Enter email address",
  className = "",
  required = false,
  showValidation = true,
  onValidationChange
}: SecureEmailInputProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [showingValidation, setShowingValidation] = useState(false)

  const handleEmailChange = useCallback((newValue: string) => {
    onChange(newValue)
    
    if (newValue.length > 0) {
      const valid = validateEmail(newValue)
      setIsValid(valid)
      setShowingValidation(true)
      onValidationChange?.(valid)
    } else {
      setIsValid(null)
      setShowingValidation(false)
      onValidationChange?.(false)
    }
  }, [onChange, onValidationChange])

  const getInputStyles = () => {
    if (!showingValidation) return 'border-gray-300 focus:border-blue-500'
    return isValid 
      ? 'border-green-500 focus:border-green-500 focus:ring-green-200' 
      : 'border-red-500 focus:border-red-500 focus:ring-red-200'
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="email"
          value={value}
          onChange={(e) => handleEmailChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`w-full ${showingValidation ? 'pr-10' : ''} pl-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${getInputStyles()} ${className}`}
          autoComplete="email"
        />
        
        {/* Validation Icon */}
        {showingValidation && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {isValid ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-500" />
            )}
          </div>
        )}
      </div>

      {/* Validation Messages */}
      {showValidation && showingValidation && (
        <div className="text-sm">
          {isValid ? (
            <p className="text-green-600 flex items-center">
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Valid email address
            </p>
          ) : (
            <p className="text-red-600 flex items-center">
              <XCircleIcon className="w-4 h-4 mr-1" />
              Please enter a valid email address
            </p>
          )}
        </div>
      )}
    </div>
  )
} 