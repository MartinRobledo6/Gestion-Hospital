import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { LoginResponse, Rol, Usuario } from '../type/auth';

// A dónde va cada rol apenas inicia sesión
export const HOME_POR_ROL: Record<Rol, string> = {
  ADMINISTRADOR: '/usuarios',
  RECEPCIONISTA: '/admision',
  MEDICO: '/mi-agenda',
  ENFERMERO: '/inicio', // cambiar cuando exista su módulo
  PACIENTE: '/solicitar-turno',
};

const leerUsuario = (): Usuario | null => {
  try {
    return JSON.parse(localStorage.getItem('usuario') ?? 'null');
  } catch {
    return null;
  }
};

// El JWT es header.payload.signature; el payload (base64url) trae "exp" en segundos
const tokenVencido = (token: string): boolean => {
  try {
    const b64 = (token.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(b64));
    return typeof exp === 'number' && exp * 1000 < Date.now();
  } catch {
    return true; // si no se puede leer, lo tratamos como inválido
  }
};

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const usuario = ref<Usuario | null>(leerUsuario());

  const rol = computed(() => usuario.value?.rol ?? null);
  const home = computed(() => (rol.value ? HOME_POR_ROL[rol.value] : '/login'));

  // Es función y no computed porque depende de la hora actual
  const haySesion = () =>
    !!token.value && !!usuario.value && !tokenVencido(token.value);

  const guardarSesion = (data: LoginResponse) => {
    token.value = data.access_token;
    usuario.value = data.usuario;
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
  };

  const logout = () => {
    token.value = null;
    usuario.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  };

  // roles undefined = cualquier usuario logueado; el admin entra siempre
  const puedeEntrar = (roles?: Rol[], exacto?: unknown) => {
    if (!rol.value) return false;
    if (!roles || roles.length === 0) return true;
    return rol.value === 'ADMINISTRADOR' || roles.includes(rol.value);
  };

  return { token, usuario, rol, home, haySesion, guardarSesion, logout, puedeEntrar };
});