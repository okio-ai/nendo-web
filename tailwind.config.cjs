/** @type {import('tailwindcss').Config} */

const plugin = require('tailwindcss/plugin')

module.exports = {
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                ngreyblack: '#171717',
                ngreyblackhover: '#26252A',
                ngreyblacktransparent: 'rgba(0,0,0,0.3)',
                ngreytransparent: 'rgba(255,255,255,0.05)',
                ngreyoverlay: 'rgba(0,0,0,0.3)',
                bgreytext: '#B1B1B1',
                ngreen: '#0DBA71',
                ngreenhover: '#11E98E',
                npurple: '#605dff',
                npurpledark: '#26263E',
                nwhite: 'white'
            },
            borderRadius: {
                md: '0.5rem',
                xl: '1rem'
            }
        }
    },
    darkMode: 'class',
    plugins: [
        plugin(function ({ addBase, theme }) {
            addBase({
                h1: { fontSize: theme('fontSize.2xl') },
                h2: { fontSize: theme('fontSize.xl') },
                h3: { fontSize: theme('fontSize.lg') }
            })
        })
    ]
}
