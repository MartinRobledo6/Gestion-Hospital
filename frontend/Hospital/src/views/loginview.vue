<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const API_URL = 'http://localhost:3000/auth';

const route = useRoute();
const router = useRouter();

const email = ref('');
const password = ref('');
const ingresando = ref(false);
const error = ref<string | null>(null);

// Nest puede devolver message como texto o como lista (ValidationPipe)
const leerError = async (res: Response, porDefecto: string) => {
  try {
    const data = await res.json();
    return Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || porDefecto;
  } catch {
    return porDefecto;
  }
};

const iniciarSesion = async () => {
  ingresando.value = true;
  error.value = null;
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    });

    if (!res.ok) {
      throw new Error(await leerError(res, 'No se pudo iniciar sesión.'));
    }

    const data = await res.json();
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));

    // Si el router lo mandó acá desde otra página, vuelve a esa página
    const destino =
      typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    await router.push(destino);
  } catch (err: any) {
    error.value =
      err instanceof TypeError
        ? 'No se pudo conectar con el servidor.'
        : err.message;
  } finally {
    ingresando.value = false;
  }
};
</script>

<template>
  <main class="vista">
    <header class="encabezado">
      <div>
        <h1>Iniciar sesión</h1>
        <p class="subtitulo">Ingresá con tu cuenta del hospital</p>
      </div>
    </header>

    <form class="tarjeta form" @submit.prevent="iniciarSesion">
      <h2>Acceso al sistema</h2>

      <p v-if="error" class="aviso error" role="alert">{{ error }}</p>

      <label>
        Email
        <input
          v-model="email"
          type="email"
          placeholder="Ej: admin@hospital.com"
          maxlength="160"
          autocomplete="username"
          required
        />
      </label>

      <label>
        Contraseña
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        />
      </label>

      <button class="btn btn-primario" type="submit" :disabled="ingresando">
        {{ ingresando ? 'Ingresando…' : 'Ingresar' }}
      </button>
    </form>
  </main>
</template>

<style scoped>
.vista {
  --azul: #0a7bc4;
  --azul-oscuro: #0866a2;
  --texto: #1e293b;
  --suave: #64748b;
  --borde: #e2e8f0;

  max-width: 440px;
  margin: 0 auto;
  padding: 64px 16px;
  color: var(--texto);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  line-height: 1.5;
}

.encabezado {
  margin-bottom: 24px;
}

.encabezado > div {
  padding-left: 16px;
  border-left: 4px solid var(--azul);
}

h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--azul);
}

.subtitulo {
  margin: 2px 0 0;
  color: var(--suave);
}

.tarjeta {
  background: #fff;
  border: 1px solid var(--borde);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  padding: 24px;
}

h2 {
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--borde);
  font-size: 1.05rem;
  font-weight: 700;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--suave);
}

input {
  padding: 10px 12px;
  border: 1px solid var(--borde);
  border-radius: 6px;
  font: inherit;
  font-weight: 400;
  color: var(--texto);
  background: #fff;
}

input::placeholder {
  color: #94a3b8;
}

input:focus-visible,
button:focus-visible {
  outline: 2px solid var(--azul);
  outline-offset: 2px;
}

button {
  font: inherit;
  cursor: pointer;
  border-radius: 6px;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn {
  padding: 10px 18px;
  border: 1px solid transparent;
  font-size: 0.9rem;
  font-weight: 600;
}

.btn-primario {
  background: var(--azul);
  border-color: var(--azul);
  color: #fff;
}

.btn-primario:hover:not(:disabled) {
  background: var(--azul-oscuro);
}

.aviso {
  margin: 0;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid;
  font-size: 0.9rem;
}

.aviso.error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}
</style>