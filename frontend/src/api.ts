import router from './router';
import { useAuthStore } from './stores/auth';

export async function apiFetch(url: string, options: RequestInit = {}) {
  const auth = useAuthStore();

  const headers = new Headers(options.headers);
  if (auth.token) headers.set('Authorization', `Bearer ${auth.token}`);

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && auth.token) {
    auth.logout();
    await router.push({
      path: '/login',
      query: { redirect: router.currentRoute.value.fullPath },
    });
  }
  return res;
}