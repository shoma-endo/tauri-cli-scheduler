/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic Color System
        primary: {
          DEFAULT: '#3b82f6',      // Blue
          50: '#eff6ff',
          600: '#2563eb',          // Hover
          700: '#1d4ed8',          // Active
        },
        secondary: {
          DEFAULT: '#8b5cf6',      // Purple
          600: '#7c3aed',
        },
        surface: {
          base: '#ffffff',
          subtle: '#f9fafb',       // Lightest gray
          muted: '#f3f4f6',        // Light gray
          border: '#e5e7eb',       // Borders
        },
        'surface-dark': {
          base: '#111827',         // Gray-900
          subtle: '#1f2937',       // Gray-800
          muted: '#374151',        // Gray-700
          border: '#4b5563',       // Gray-600
        },
        text: {
          primary: '#111827',      // Gray-900
          secondary: '#6b7280',    // Gray-500
          muted: '#9ca3af',        // Gray-400
          inverse: '#ffffff',      // For dark bg
        },
        'text-dark': {
          primary: '#f9fafb',      // Gray-50
          secondary: '#d1d5db',    // Gray-300
          muted: '#9ca3af',        // Gray-400
        },
        status: {
          success: '#10b981',      // Green-500
          error: '#ef4444',        // Red-500
          warning: '#f59e0b',      // Amber-500
          info: '#3b82f6',         // Blue-500
        },
      },
      spacing: {
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem',
        '2xl': '4rem',
      },
      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.5rem',
        md: '0.625rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.12)',
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          '"Menlo"',
          '"Monaco"',
          '"Cascadia Code"',
          '"Fira Code"',
          'monospace',
        ],
      },
      transitionDuration: {
        DEFAULT: '200ms',
        fast: '100ms',
        slow: '300ms',
      },
      opacity: {
        5: '0.05',
        10: '0.1',
        15: '0.15',
        20: '0.2',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
