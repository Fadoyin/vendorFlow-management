'use client'

// Temporarily simplified providers to bypass dependency issues
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      {/* Temporary simple toast container */}
      <div id="toast-container" style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999
      }}></div>
    </div>
  )
}
