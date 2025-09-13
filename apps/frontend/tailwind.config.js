/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // RevTrack Theme Colors
        'revtrack': {
          'primary': '#2176FF', // Primary blue accent
          'secondary': '#003B73', // Darker blue
          'accent': '#6C757D', // Light blue/purple
          'success': '#28A745', // Green for positive indicators
          'background': '#F8F9FA', // Light gray background
          'card': '#FFFFFF', // White card background
          'text': {
            'primary': '#343A40', // Dark gray for main text
            'secondary': '#6C757D', // Medium gray for secondary text
            'light': '#ADB5BD', // Light gray for labels
          },
          'border': '#E9ECEF', // Light gray borders
        }
      },
      fontFamily: {
        'sans': ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0, 0, 0, 0.05)',
        'elevated': '0 4px 6px rgba(0, 0, 0, 0.07)',
      },
    },
  },
  plugins: [],
}
