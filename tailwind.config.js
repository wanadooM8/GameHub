/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F3F3F3',
        surface: '#FFFFFF',
        surface2: '#FAFAFA',
        border: '#E5E5E5',
        border2: '#D1D1D1',
        accent: '#0078D4',
        'accent-hover': '#106EBE',
        'accent-pressed': '#005A9E',
        'accent-soft': '#E5F1FB',
        'accent-border': '#C7E0F4',
        text: '#1B1B1B',
        text2: '#5C5C5C',
        text3: '#8A8A8A',
        danger: '#C42B1C',
        'danger-soft': '#FDF3F2',
        success: '#107C10'
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px'
      },
      fontFamily: {
        ui: ['"Segoe UI Variable Text"', '"Segoe UI"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
