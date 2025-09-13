'use client'

import React, { forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    
    const isDisabled = disabled || loading

    // Base classes
    const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    // Variant classes
    const variantClasses = {
      primary: 'text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100',
      secondary: 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500',
      outline: 'text-blue-600 border border-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-500',
      ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-blue-500',
      danger: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-lg hover:shadow-xl',
      success: 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-lg hover:shadow-xl'
    }

    // Size classes
    const sizeClasses = {
      sm: 'text-sm px-3 py-2 rounded-lg',
      md: 'text-sm px-4 py-3 rounded-xl',
      lg: 'text-base px-6 py-3 rounded-xl',
      xl: 'text-lg px-8 py-4 rounded-xl'
    }

    // Width classes
    const widthClasses = fullWidth ? 'w-full' : ''

    // Combine all classes
    const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${className}`

    return (
      <button
        className={buttonClasses}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        
        <span>
          {loading ? (loadingText || 'Loading...') : children}
        </span>
        
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
export type { ButtonProps, ButtonVariant, ButtonSize } 