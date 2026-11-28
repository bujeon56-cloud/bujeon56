import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import router from './router';
import './style.css';
import App from './App.vue';
import { authErrorMessage } from './stores/authStore';

const app = createApp(App);
const pinia = createPinia();

app.config.errorHandler = error => {
  console.error(error);
  window.dispatchEvent(new CustomEvent('bujeon-error', { detail: authErrorMessage(error) }));
};
app.use(pinia);
app.use(createVuetify({
  icons: { aliases, sets: { mdi } },
  defaults: { VBtn: { rounded: 'lg', elevation: 0 } },
  theme: {
    defaultTheme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
    themes: {
      light: { colors: { primary: '#2563eb', 'on-primary': '#ffffff', surface: '#ffffff', 'on-surface': '#0f172a', error: '#b91c1c' } },
      dark: { colors: { primary: '#2563eb', 'on-primary': '#ffffff', surface: '#192233', 'on-surface': '#f1f5fb', error: '#fda4af' } },
    },
  },
}));
app.use(router);

app.mount('#app');
