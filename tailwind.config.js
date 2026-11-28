import colors from 'tailwindcss/colors';
import plugin from 'tailwindcss/plugin';

const accents = {
  amber: ['#312612', '#403115', '#61491e', colors.amber[300]],
  blue: ['#14263e', '#1a3352', '#294e79', colors.blue[300]],
  emerald: ['#102c27', '#143b31', '#25614d', colors.emerald[300]],
  indigo: ['#202447', '#2c315c', '#444c83', colors.indigo[300]],
  purple: ['#2b2140', '#392952', '#594174', colors.purple[300]],
  rose: ['#371f2b', '#482536', '#71394d', colors.rose[300]],
};

const surfaces = {
  white: '#192233',
  'slate-50': '#101725',
  'slate-100': '#222e41',
  'slate-200': '#2e3d54',
  'emerald-500': '#047857',
  'emerald-600': '#047857',
  'amber-600': '#92400e',
};
const ink = {
  'slate-300': colors.slate[400],
  'slate-400': colors.slate[400],
  'slate-500': '#a9b8cc',
  'slate-600': '#becadc',
  'slate-700': '#d4dfed',
  'slate-800': '#e3ebf6',
  'slate-900': '#f1f5fb',
};
const edges = { 'slate-100': '#2a374b', 'slate-200': '#35445b', 'slate-300': '#4b5d76' };
const shadows = {};

for (const [name, [surface, raised, edge, accent]] of Object.entries(accents)) {
  surfaces[`${name}-50`] = surface;
  surfaces[`${name}-100`] = raised;
  surfaces[`${name}-200`] = edge;
  for (const shade of [100, 200, 300]) edges[`${name}-${shade}`] = edge;
  for (const shade of [500, 600, 700, 800, 900]) ink[`${name}-${shade}`] = accent;
  for (const shade of [100, 200]) shadows[`${name}-${shade}`] = '#090e19';
}
const palettes = { surface: surfaces, ink, edge: edges, shadow: shadows };
const channels = hex => hex.slice(1).match(/../g).map(pair => parseInt(pair, 16)).join(' ');
const token = (role, name) => `--app-${role}-${name}`;
const themeColors = role => Object.fromEntries(Object.keys(palettes[role]).map(name => {
  const [family, shade] = name.split('-');
  const light = shade ? colors[family][shade] : colors[family];
  return [name, `rgb(var(${token(role, name)}, ${channels(light)}) / <alpha-value>)`];
}));

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundColor: themeColors('surface'),
      gradientColorStops: themeColors('surface'),
      textColor: themeColors('ink'),
      borderColor: themeColors('edge'),
      divideColor: themeColors('edge'),
      ringColor: themeColors('edge'),
      boxShadowColor: themeColors('shadow'),
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        church: {
          gold: '#f59e0b',
          blue: '#2563eb',
          green: '#10b981',
          purple: '#8b5cf6'
        }
      }
    },
  },
  plugins: [plugin(({ addBase }) => {
    addBase({
      '@media screen': {
        'html[data-theme="dark"]': {
          colorScheme: 'dark',
          ...Object.fromEntries(Object.entries(palettes).flatMap(([role, palette]) =>
            Object.entries(palette).map(([name, hex]) => [token(role, name), channels(hex)]),
          )),
        },
      },
    });
  })],
}
