'use client'

import { ReactNode } from 'react'
import { DashboardLayout } from './DashboardLayout'
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute'

interface ProtectedDashboardLayoutProps {
  children: ReactNode
  title: string
  description?: string
  allowedRoles: string[]
  className?: string
}

export function ProtectedDashboardLayout({
  children,
  title,
  description,
  allowedRoles,
  className
}: ProtectedDashboardLayoutProps) {
  return (
    <RoleProtectedRoute allowedRoles={allowedRoles}>
      <DashboardLayout 
        title={title} 
        description={description}
        className={className}
      >
        {children}
      </DashboardLayout>
    </RoleProtectedRoute>
  )
}

// Convenience components for specific roles
export function AdminDashboardLayout({
  children,
  title,
  description,
  className
}: Omit<ProtectedDashboardLayoutProps, 'allowedRoles'>) {
  return (
    <ProtectedDashboardLayout
      allowedRoles={['admin']}
      title={title}
      description={description}
      className={className}
    >
      {children}
    </ProtectedDashboardLayout>
  )
}

export function VendorDashboardLayout({
  children,
  title,
  description,
  className
}: Omit<ProtectedDashboardLayoutProps, 'allowedRoles'>) {
  return (
    <ProtectedDashboardLayout
      allowedRoles={['vendor']}
      title={title}
      description={description}
      className={className}
    >
      {children}
    </ProtectedDashboardLayout>
  )
}

export function SupplierDashboardLayout({
  children,
  title,
  description,
  className
}: Omit<ProtectedDashboardLayoutProps, 'allowedRoles'>) {
  return (
    <ProtectedDashboardLayout
      allowedRoles={['supplier']}
      title={title}
      description={description}
      className={className}
    >
      {children}
    </ProtectedDashboardLayout>
  )
} 