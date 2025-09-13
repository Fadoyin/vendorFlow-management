import React, { forwardRef, useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showPasswordToggle?: boolean
  containerClassName?: string
  labelClassName?: string
  inputClassName?: string
  errorClassName?: string
  helperTextClassName?: string
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      showPasswordToggle = false,
      containerClassName = '',
      labelClassName = '',
      inputClassName = '',
      errorClassName = '',
      helperTextClassName = '',
      type = 'text',
      className,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type

    const baseInputClasses = `
      appearance-none relative block w-full py-3 px-3
      border rounded-xl
      placeholder-revtrack-text-light text-revtrack-text-primary bg-white
      focus:outline-none focus:ring-2 focus:ring-revtrack-primary focus:border-transparent
      transition-all duration-200 hover:border-revtrack-primary/50
      disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
      ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-revtrack-border'}
      ${leftIcon ? 'pl-10' : ''}
      ${(rightIcon || showPasswordToggle) ? 'pr-10' : ''}
      ${isFocused ? 'ring-2 ring-revtrack-primary border-transparent' : ''}
    `

    return (
      <div className={`space-y-1 ${containerClassName}`}>
        {label && (
          <label 
            htmlFor={props.id} 
            className={`block text-sm font-semibold text-revtrack-text-primary ${labelClassName}`}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-revtrack-text-light">
                {leftIcon}
              </div>
            </div>
          )}
          
          <input
            ref={ref}
            type={inputType}
            className={`${baseInputClasses} ${inputClassName} ${className || ''}`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {(rightIcon || showPasswordToggle) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {showPasswordToggle ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-revtrack-text-light hover:text-revtrack-text-secondary focus:outline-none transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              ) : (
                <div className="h-5 w-5 text-revtrack-text-light">
                  {rightIcon}
                </div>
              )}
            </div>
          )}
        </div>
        
        {error && (
          <p className={`text-sm text-red-600 flex items-center ${errorClassName}`}>
            <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className={`text-sm text-revtrack-text-light ${helperTextClassName}`}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

export default FormInput

// Icon components for common use cases
export const EmailIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
  </svg>
)

export const LockIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

export const UserIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

export const BuildingIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
) 