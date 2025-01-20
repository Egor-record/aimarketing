<template>
  <div>
    <router-view />
  </div>
</template>

<script>
import { useAuthStore } from '@/store/auth';
export default {
  name: 'App',
  setup() {
    const authStore = useAuthStore();
    return {
      isAuthenticated: authStore.isAuthenticated,
    };
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
