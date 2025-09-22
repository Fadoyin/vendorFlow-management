'use client'

import { useEffect, useState } from 'react'

export default function TestPage() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.error('🔥 TEST PAGE LOADED - JavaScript is working!')
    alert('Test page loaded! JavaScript is working!')
    
    // Add visible indicator
    const indicator = document.createElement('div')
    indicator.innerHTML = '🟢 JAVASCRIPT IS WORKING ON TEST PAGE'
    indicator.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: lime; color: black; padding: 20px; z-index: 9999; border: 5px solid red; font-size: 24px; font-weight: bold;'
    document.body.appendChild(indicator)
  }, [])

  const handleClick = () => {
    console.error('🔥 BUTTON CLICKED ON TEST PAGE!')
    alert('Button clicked! Count: ' + (count + 1))
    setCount(count + 1)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-4">JavaScript Test Page</h1>
        <p className="mb-4">Count: {count}</p>
        <button 
          onClick={handleClick}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Click me! (Count: {count})
        </button>
        <div className="mt-4 p-4 bg-yellow-100 border">
          <p>If you can see this page and the button works, JavaScript is functioning.</p>
          <p>Check the browser console for logs.</p>
        </div>
      </div>
    </div>
  )
} 