import { reactive } from 'vue';
import api from '@/utils/api';

const state = reactive({
  user: null,
  token: localStorage.getItem('token') || null,
});

export const useAuthStore = () => ({
  get isAuthenticated() {
    return !!state.token;
  },
  async login(username, password) {
    const response = await api.post('/api/v1/login', { username, password });
    state.token = response.data.token;
    localStorage.setItem('token', state.token);
  },
  logout() {
    state.token = null;
    localStorage.removeItem('token');
  },
});