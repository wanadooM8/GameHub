/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F4EFE4',
        surface: '#FBF8F1',
        surface2: '#EFE7D8',
        border: '#E0D5BE',
        border2: '#CBBB98',
        accent: '#5B7F5E',
        'accent-hover': '#4C6E4F',
        'accent-pressed': '#3E5B41',
        'accent-soft': '#E4EDDD',
        'accent-border': '#C3D6B8',
        text: '#3A342A',
        text2: '#6B6355',
        text3: '#9C927E',
        danger: '#B5502F',
        'danger-soft': '#F7E9E1',
        success: '#C98A2C',
        'success-soft': '#F6EAD2',
        'success-border': '#E8CB98'
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px'
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgba(58, 52, 42, 0.08)',
        'soft-md': '0 4px 14px 0 rgba(58, 52, 42, 0.14)',
        'soft-lg': '0 12px 32px 0 rgba(58, 52, 42, 0.18)',
        'soft-xl': '0 20px 48px 0 rgba(58, 52, 42, 0.22)'
      },
      fontFamily: {
        ui: ['"Segoe UI Variable Text"', '"Segoe UI"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
