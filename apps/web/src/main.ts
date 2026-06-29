import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './styles/theme.css';
import { useTemaStore } from './stores/tema';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

// Aplicar el tema guardado antes de montar (evita el parpadeo).
useTemaStore(pinia).init();

app.mount('#app');
