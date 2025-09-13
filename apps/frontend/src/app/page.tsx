'use client'

import Header from './components/Header'
import Hero from './components/Hero'
import Features from './components/Features'
import Pricing from './components/Pricing'
import HowItWorks from './components/HowItWorks'
import Testimonials from './components/Testimonials'
import CallToAction from './components/CallToAction'
import Footer from './components/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-revtrack-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <HowItWorks />
        <Testimonials />
        <CallToAction />
      </main>
      <Footer />
    </div>
  )
}
