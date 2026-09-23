/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        surface: {
          canvas: '#f3f4f6',
          card: '#ffffff',
          muted: '#f9fafb',
          border: '#e5e7eb',
        },
        status: {
          scheduled: {
            bg: '#eff6ff',
            text: '#2563eb',
            dot: '#3b82f6',
          },
          sending: {
            bg: '#2563eb',
            text: '#ffffff',
            dot: '#ffffff',
          },
          rescheduled: {
            bg: '#fffbeb',
            text: '#b45309',
            dot: '#d97706',
          },
          sent: {
            bg: '#ecfdf5',
            text: '#047857',
            dot: '#10b981',
          },
          failed: {
            bg: '#fef2f2',
            text: '#b91c1c',
            dot: '#ef4444',
          },
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
