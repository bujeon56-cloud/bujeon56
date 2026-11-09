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
app.use(createVuetify({ icons: { aliases, sets: { mdi } } }));
app.use(router);

app.mount('#app');
