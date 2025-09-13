'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUserRole } from '@/hooks/useUserRole'

interface DashboardSidebarProps {
  className?: string
  isOpen?: boolean
  setIsOpen?: (open: boolean) => void
}

// Enhanced navigation structure with categories and modern icons
const navigationStructure = {
  admin: {
    sections: [
      {
        title: 'Overview',
        items: [
          {
            id: 'admin-dashboard',
            name: 'Dashboard',
            href: '/dashboard',
            icon: '🏠',
            description: 'Main overview'
          }
        ]
      },
      {
        title: 'Operations',
        items: [
          {
            id: 'orders',
            name: 'Orders',
            href: '/dashboard/orders',
            icon: '📋',
            description: 'Manage all orders'
          },
          {
            id: 'inventory',
            name: 'Inventory',
            href: '/dashboard/inventory',
            icon: '📦',
            description: 'Stock management'
          },
          {
            id: 'forecasting',
            name: 'Forecasting',
            href: '/dashboard/forecasting',
            icon: '📊',
            description: 'Demand prediction'
          }
        ]
      },
      {
        title: 'Partners',
        items: [
          {
            id: 'suppliers',
            name: 'Suppliers',
            href: '/dashboard/suppliers',
            icon: '🏭',
            description: 'Supplier network'
          },
          {
            id: 'vendors',
            name: 'Vendors',
            href: '/dashboard/vendors',
            icon: '🏪',
            description: 'Vendor management'
          }
        ]
      },
      {
        title: 'Finance',
        items: [
          {
            id: 'payments',
            name: 'Payments',
            href: '/dashboard/payments',
            icon: '💳',
            description: 'Payment processing'
          }
        ]
      },
      {
        title: 'System',
        items: [
          {
            id: 'users',
            name: 'Users',
            href: '/dashboard/users',
            icon: '👥',
            description: 'User management'
          }
        ]
      }
    ]
  },
  vendor: {
    sections: [
      {
        title: 'Overview',
        items: [
          {
            id: 'vendor-dashboard',
            name: 'Dashboard',
            href: '/dashboard/vendor',
            icon: '🏠',
            description: 'Your overview'
          }
        ]
      },
      {
        title: 'Business',
        items: [
          {
            id: 'vendor-orders',
            name: 'Orders',
            href: '/dashboard/vendor/orders',
            icon: '📋',
            description: 'Order management'
          },
          {
            id: 'vendor-inventory',
            name: 'Inventory',
            href: '/dashboard/vendor/inventory',
            icon: '📦',
            description: 'Your stock'
          },
          {
            id: 'vendor-forecasting',
            name: 'Forecasting',
            href: '/dashboard/vendor/forecasting',
            icon: '📊',
            description: 'Demand insights'
          }
        ]
      },
      {
        title: 'Finance',
        items: [
          {
            id: 'vendor-payments',
            name: 'Payments',
            href: '/dashboard/vendor/payments',
            icon: '💳',
            description: 'Payment history'
          }
        ]
      },
      {
        title: 'Settings',
        items: [
          {
            id: 'vendor-profile',
            name: 'Profile',
            href: '/dashboard/vendor/profile',
            icon: '⚙️',
            description: 'Account settings'
          }
        ]
      }
    ]
  },
  supplier: {
    sections: [
      {
        title: 'Overview',
        items: [
          {
            id: 'supplier-dashboard',
            name: 'Dashboard',
            href: '/dashboard/supplier',
            icon: '🏠',
            description: 'Your overview'
          }
        ]
      },
      {
        title: 'Business',
        items: [
          {
            id: 'supplier-orders',
            name: 'Orders',
            href: '/dashboard/supplier/orders',
            icon: '📋',
            description: 'Incoming orders'
          }
        ]
      },
      {
        title: 'Billing',
        items: [
          {
            id: 'subscription-plans',
            name: 'Subscription Plans',
            href: '/dashboard/subscription-plans',
            icon: '💎',
            description: 'Manage your plan'
          }
        ]
      },
      {
        title: 'Settings',
        items: [
          {
            id: 'supplier-profile',
            name: 'Profile',
            href: '/dashboard/supplier/profile',
            icon: '⚙️',
            description: 'Account settings'
          }
        ]
      }
    ]
  }
}

export function DashboardSidebar({ className = '', isOpen = false, setIsOpen }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { role: userRole } = useUserRole()
  const router = useRouter()
  const [isPrefetching, setIsPrefetching] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [clientRole, setClientRole] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Handle mounting and hydration
  useEffect(() => {
    setIsMounted(true)
    
    // Get role from localStorage directly to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      const storedUserData = localStorage.getItem('mockUserData')
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData)
          setClientRole(userData.role?.toLowerCase() || 'admin')
        } catch (e) {
          setClientRole('admin')
        }
      } else {
        setClientRole('admin')
      }
    }
  }, [])

  // Update client role when userRole changes
  useEffect(() => {
    if (userRole && isMounted) {
      setClientRole(userRole.toLowerCase())
    }
  }, [userRole, isMounted])

  // Prevent body scrolling on mobile when sidebar is open (Android fix)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isOpen) {
        // Store original styles
        const originalStyle = window.getComputedStyle(document.body).overflow
        const originalPosition = window.getComputedStyle(document.body).position
        
        // Prevent scrolling
        document.body.style.overflow = 'hidden'
        document.body.style.position = 'fixed'
        document.body.style.width = '100%'
        document.body.style.height = '100%'
        
        return () => {
          // Restore original styles
          document.body.style.overflow = originalStyle
          document.body.style.position = originalPosition
          document.body.style.width = ''
          document.body.style.height = ''
        }
      }
    }
  }, [isOpen])

  // Prefetch routes on sidebar mount for faster navigation
  useEffect(() => {
    if (!isPrefetching && isMounted) {
      setIsPrefetching(true)
      const prefetchRoutes = async () => {
        const currentNav = getCurrentNavigation()
        const routes = currentNav.sections.flatMap(section => 
          section.items.map(item => item.href)
        )
        
        // Prefetch critical routes with slight delays to avoid overwhelming
        for (let i = 0; i < Math.min(routes.length, 3); i++) {
          setTimeout(() => {
            router.prefetch(routes[i])
          }, i * 100)
        }
      }
      
      prefetchRoutes()
    }
  }, [router, isPrefetching, isMounted, clientRole])

  // Get navigation structure based on user role
  const getCurrentNavigation = () => {
    if (!isMounted || !clientRole) {
      return navigationStructure.admin
    }
    
    return navigationStructure[clientRole as keyof typeof navigationStructure] || navigationStructure.admin
  }

  const currentNavigation = getCurrentNavigation()

  const isActiveLink = (path: string) => {
    // Prevent hydration mismatch by not showing active state during SSR
    if (!isMounted) {
      return false
    }
    
    if (path === "/dashboard" || path === "/dashboard/vendor" || path === "/dashboard/supplier") {
      return pathname === path
    }
    return pathname.startsWith(path)
  }

  const handleLinkClick = (href: string) => {
    // Immediate navigation with optimistic UI
    router.push(href)
    
    if (setIsOpen) {
      setIsOpen(false)
    }
  }

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }))
  }

  // Enhanced Nav Item Component
  const NavItem = ({ item, isInCollapsedSidebar = false }: { 
    item: any, 
    isInCollapsedSidebar?: boolean 
  }) => {
    const isActive = isActiveLink(item.href)
    
    return (
      <Link
        href={item.href}
        onClick={(e) => {
          e.preventDefault()
          handleLinkClick(item.href)
        }}
                 className={`nav-item relative flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-r from-revtrack-primary to-revtrack-secondary text-white shadow-lg shadow-revtrack-primary/25'
            : 'text-gray-700 hover:bg-gray-50 hover:text-revtrack-primary'
        } ${isInCollapsedSidebar ? 'justify-center' : 'space-x-3'}`}
        title={isInCollapsedSidebar ? item.name : undefined}
      >
                 {/* Icon */}
         <div className={`nav-icon flex-shrink-0 text-xl transition-transform duration-200 ${
           isActive ? 'text-white' : ''
         }`}>
           {item.icon}
         </div>
        
        {/* Content */}
        {!isInCollapsedSidebar && (
          <>
            <div className="flex-1 min-w-0">
              <div className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-gray-900'}`}>
                {item.name}
              </div>
              {item.description && (
                <div className={`text-xs mt-0.5 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                  {item.description}
                </div>
              )}
            </div>
            
                         {/* Badge */}
             {item.badge && (
               <div className={`nav-badge px-2 py-1 rounded-full text-xs font-bold transition-transform duration-200 ${
                 isActive 
                   ? 'bg-white/20 text-white' 
                   : 'bg-revtrack-primary text-white'
               }`}>
                 {item.badge}
               </div>
             )}
          </>
        )}

        {/* Active indicator */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
        )}
      </Link>
    )
  }

  // Section Component
  const SectionComponent = ({ section }: { section: any }) => {
    const isCollapsedSection = collapsedSections[section.title]
    
    return (
      <div className="space-y-2">
        {/* Section Header */}
        {!isCollapsed && (
          <button
            onClick={() => toggleSection(section.title)}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-revtrack-primary transition-colors duration-200"
          >
            <span>{section.title}</span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${isCollapsedSection ? '-rotate-90' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
        
        {/* Section Items */}
        <div className={`space-y-1 transition-all duration-200 ${
          isCollapsedSection && !isCollapsed ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-none opacity-100'
        }`}>
          {section.items.map((item: any) => (
            <NavItem key={item.id} item={item} isInCollapsedSidebar={isCollapsed} />
          ))}
        </div>
      </div>
    )
  }

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <>
        {/* Mobile backdrop */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setIsOpen?.(false)}
          />
        )}
        
        {/* Loading skeleton */}
        <aside className={`
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:relative lg:w-72 lg:flex lg:flex-col lg:border-r lg:border-gray-200 lg:shadow-lg
          ${className}
        `}>
          <div className="flex items-center justify-between p-6 border-b border-gray-200 lg:hidden">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
          </div>
          
          <div className="flex-1 p-6">
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-12 bg-gray-200 rounded-xl animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </>
    )
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="mobile-sidebar-backdrop lg:hidden"
          onClick={() => setIsOpen?.(false)}
          onTouchStart={() => setIsOpen?.(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          mobile-sidebar-container mobile-sidebar-fix lg:relative lg:top-0 lg:flex lg:flex-col lg:border-r lg:border-gray-200 lg:shadow-lg lg:translate-x-0
          ${isOpen ? 'mobile-sidebar-open' : 'mobile-sidebar-closed'}
          ${isCollapsed ? 'w-20 lg:w-20' : 'w-80 lg:w-72'}
          ${className}
        `}
        style={{ 
          height: '100dvh'
        }}
      >
        
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 lg:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-revtrack-primary to-revtrack-secondary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">VendorFlow</span>
          </div>
          <button
            onClick={() => setIsOpen?.(false)}
            onTouchStart={() => setIsOpen?.(false)}
            className="p-3 min-w-[44px] min-h-[44px] rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 flex items-center justify-center active:bg-gray-200"
            style={{ touchAction: 'manipulation' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Desktop Collapse Toggle */}
        <div className="hidden lg:flex items-center justify-between p-6 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="text-lg font-bold text-gray-900">Navigation</div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
        
        {/* Navigation */}
        <nav 
          className={`flex-1 overflow-y-auto py-6 ${isCollapsed ? 'px-3' : 'px-6'}`}
          style={{ 
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          <div className="space-y-6">
            {currentNavigation.sections.map((section) => (
              <SectionComponent key={section.title} section={section} />
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className={`border-t border-gray-200 p-6 ${isCollapsed ? 'px-3' : 'px-6'}`}>
          {!isCollapsed ? (
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-2">VendorFlow v2.0</div>
              <div className="text-xs text-gray-400">© 2024 All rights reserved</div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-revtrack-primary to-revtrack-secondary rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">VF</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
} 