'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50' 
        : 'bg-transparent'
    }`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between py-4 px-6 lg:px-8" aria-label="Global">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 group">
            <span className="sr-only">VendorFlow</span>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  scrolled 
                    ? 'bg-gradient-to-br from-revtrack-primary to-revtrack-secondary shadow-md' 
                    : 'bg-white/20 backdrop-blur-sm border border-white/30'
                }`}>
                  <svg className={`w-6 h-6 transition-colors duration-300 ${
                    scrolled ? 'text-white' : 'text-white'
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-revtrack-primary to-revtrack-secondary rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </div>
              <span className={`text-xl font-bold transition-colors duration-300 ${
                scrolled ? 'text-revtrack-text-primary' : 'text-white'
              }`}>
                VendorFlow
              </span>
            </div>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className={`-m-2.5 inline-flex items-center justify-center rounded-xl p-2.5 transition-colors duration-300 ${
              scrolled 
                ? 'text-revtrack-text-secondary hover:text-revtrack-primary hover:bg-revtrack-background' 
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-8">
          {[
            { name: 'Features', href: '#features' },
            { name: 'How It Works', href: '#how-it-works' },
            { name: 'Pricing', href: '#pricing' },
            { name: 'Testimonials', href: '#testimonials' },
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 group ${
                scrolled 
                  ? 'text-revtrack-text-secondary hover:text-revtrack-primary' 
                  : 'text-white/90 hover:text-white'
              }`}
            >
              {item.name}
              <span className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${
                scrolled ? 'bg-revtrack-primary' : 'bg-white'
              }`}></span>
            </a>
          ))}
        </div>

        {/* User actions */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4 items-center">
          <Link
            href="/login"
            className={`px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg ${
              scrolled 
                ? 'text-revtrack-text-secondary hover:text-revtrack-primary hover:bg-revtrack-background' 
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            Sign In
          </Link>
          <Link
            href="/auth?mode=signup"
            className={`group relative overflow-hidden px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              scrolled 
                ? 'bg-gradient-to-r from-revtrack-primary to-revtrack-secondary text-white hover:shadow-lg hover:scale-105 focus:ring-revtrack-primary' 
                : 'bg-white text-revtrack-primary hover:shadow-lg hover:scale-105 focus:ring-white'
            }`}
          >
            <span className="relative z-10">Start Free Trial</span>
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
              scrolled 
                ? 'bg-gradient-to-r from-revtrack-secondary to-revtrack-primary' 
                : 'bg-gradient-to-r from-gray-50 to-white'
            }`}></div>
          </Link>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50" />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white/95 backdrop-blur-md px-6 py-6 sm:max-w-sm border-l border-gray-200/50">
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
                <span className="sr-only">VendorFlow</span>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-revtrack-primary to-revtrack-secondary rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold text-revtrack-text-primary">VendorFlow</span>
                </div>
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-xl p-2.5 text-revtrack-text-secondary hover:text-revtrack-primary hover:bg-revtrack-background transition-colors duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mt-8 flow-root">
              <div className="-my-6 divide-y divide-revtrack-border">
                <div className="space-y-2 py-6">
                  {[
                    { name: 'Features', href: '#features' },
                    { name: 'How It Works', href: '#how-it-works' },
                    { name: 'Pricing', href: '#pricing' },
                    { name: 'Testimonials', href: '#testimonials' },
                  ].map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="-mx-3 block rounded-xl px-3 py-3 text-base font-semibold leading-7 text-revtrack-text-primary hover:bg-revtrack-background transition-colors duration-300"
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
                <div className="py-6 space-y-4">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="-mx-3 block rounded-xl px-3 py-3 text-base font-semibold leading-7 text-revtrack-text-primary hover:bg-revtrack-background transition-colors duration-300"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth?mode=signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl bg-gradient-to-r from-revtrack-primary to-revtrack-secondary px-3 py-3 text-base font-semibold text-white text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    Start Free Trial
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
