<script setup lang="ts">
import { ref, onMounted } from 'vue';

type Rol =
  | 'ADMINISTRADOR'
  | 'MEDICO'
  | 'ENFERMERO'
  | 'RECEPCIONISTA'
  | 'PACIENTE';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
}

interface Aviso {
  tipo: 'ok' | 'error';
  texto: string;
}

const API_URL = 'http://localhost:3000/usuarios';

const roles: Rol[] = [
  'ADMINISTRADOR',
  'MEDICO',
  'ENFERMERO',
  'RECEPCIONISTA',
  'PACIENTE',
];

const etiquetaRol: Record<Rol, string> = {
  ADMINISTRADOR: 'Administrador',
  MEDICO: 'Médico',
  ENFERMERO: 'Enfermero',
  RECEPCIONISTA: 'Recepcionista',
  PACIENTE: 'Paciente',
};

const usuarios = ref<Usuario[]>([]);
const cargando = ref(false);
const guardando = ref(false);
const aviso = ref<Aviso | null>(null);
const error = ref<string | null>(null);

// Formulario de alta
const nombre = ref('');
const email = ref('');
const password = ref('');
const rol = ref<Rol>('RECEPCIONISTA');

// Id del usuario logueado (para no dejar que se desactive a sí mismo)
const miId: number | null = (() => {
  try {
    return JSON.parse(localStorage.getItem('usuario') ?? 'null')?.id ?? null;
  } catch {
    return null;
  }
})();

// ---------- Mensajes ----------
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

const mostrarAviso = (tipo: Aviso['tipo'], texto: string) => {
  aviso.value = { tipo, texto };
};

// Todos los pedidos de esta vista llevan el token de la sesión
const encabezados = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// Si la respuesta no es exitosa, lanza un error con un mensaje claro
const verificar = async (res: Response, porDefecto: string) => {
  if (res.ok) return;
  if (res.status === 401) {
    throw new Error('Tu sesión venció. Volvé a iniciar sesión.');
  }
  throw new Error(await leerError(res, porDefecto));
};

// ---------- Llamadas al backend ----------
const obtenerUsuarios = async () => {
  cargando.value = true;
  error.value = null;
  try {
    const res = await fetch(API_URL, { headers: encabezados() });
    await verificar(res, 'No se pudo obtener la lista de usuarios.');
    usuarios.value = await res.json();
  } catch (err: any) {
    error.value = err.message;
  } finally {
    cargando.value = false;
  }
};

const crearUsuario = async () => {
  guardando.value = true;
  aviso.value = null;
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: encabezados(),
      body: JSON.stringify({
        nombre: nombre.value,
        email: email.value,
        password: password.value,
        rol: rol.value,
      }),
    });
    await verificar(res, 'No se pudo crear el usuario.');

    mostrarAviso(
      'ok',
      `Usuario "${nombre.value}" creado como ${etiquetaRol[rol.value]}.`,
    );
    nombre.value = '';
    email.value = '';
    password.value = '';
    rol.value = 'RECEPCIONISTA';
    await obtenerUsuarios();
  } catch (err: any) {
    mostrarAviso('error', err.message);
  } finally {
    guardando.value = false;
  }
};

const cambiarActivo = async (u: Usuario) => {
  aviso.value = null;
  try {
    const res = await fetch(`${API_URL}/${u.id}/activo`, {
      method: 'PATCH',
      headers: encabezados(),
      body: JSON.stringify({ activo: !u.activo }),
    });
    await verificar(res, 'No se pudo cambiar el estado del usuario.');

    mostrarAviso(
      'ok',
      `Usuario "${u.nombre}" ${u.activo ? 'desactivado' : 'activado'}.`,
    );
    await obtenerUsuarios();
  } catch (err: any) {
    mostrarAviso('error', err.message);
  }
};

onMounted(obtenerUsuarios);
</script>

<template>
  <main class="vista">
    <header class="encabezado">
      <div>
        <h1>Usuarios y Accesos</h1>
        <p class="subtitulo">Alta de personal y gestión de cuentas</p>
      </div>
      <button
        class="btn btn-secundario"
        :disabled="cargando"
        @click="obtenerUsuarios"
      >
        {{ cargando ? 'Actualizando…' : 'Actualizar lista' }}
      </button>
    </header>

    <p v-if="aviso" :class="['aviso', aviso.tipo]" role="status">
      {{ aviso.texto }}
    </p>

    <!-- Alta -->
    <section class="tarjeta">
      <h2>Nuevo usuario</h2>

      <form class="form" @submit.prevent="crearUsuario">
        <div class="fila">
          <label>
            Nombre y apellido
            <input
              v-model="nombre"
              type="text"
              placeholder="Ej: Dr. Silva"
              minlength="2"
              maxlength="120"
              autocomplete="off"
              required
            />
          </label>

          <label>
            Email
            <input
              v-model="email"
              type="email"
              placeholder="Ej: silva@hospital.com"
              maxlength="160"
              autocomplete="off"
              required
            />
          </label>
        </div>

        <div class="fila">
          <label>
            Contraseña (mínimo 6 caracteres)
            <input
              v-model="password"
              type="password"
              minlength="6"
              autocomplete="new-password"
              required
            />
          </label>

          <label>
            Rol
            <select v-model="rol" required>
              <option v-for="r in roles" :key="r" :value="r">
                {{ etiquetaRol[r] }}
              </option>
            </select>
          </label>
        </div>

        <div class="fila fila-final">
          <button class="btn btn-primario" type="submit" :disabled="guardando">
            {{ guardando ? 'Creando…' : 'Crear usuario' }}
          </button>
        </div>
      </form>
    </section>

    <!-- Listado -->
    <section class="tarjeta">
      <h2>Usuarios registrados</h2>

      <p v-if="error" class="aviso error" role="alert">{{ error }}</p>
      <p v-else-if="cargando && !usuarios.length" class="nota">Cargando…</p>
      <p v-else-if="!usuarios.length" class="nota">No hay usuarios.</p>

      <div v-else class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in usuarios" :key="u.id">
              <td><span class="id-chip">#{{ u.id }}</span></td>
              <td class="fuerte">{{ u.nombre }}</td>
              <td>{{ u.email }}</td>
              <td><span class="badge rol">{{ etiquetaRol[u.rol] }}</span></td>
              <td>
                <span :class="['badge', u.activo ? 'activo' : 'inactivo']">
                  {{ u.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <button
                  class="btn btn-secundario btn-chico"
                  :disabled="u.id === miId"
                  :title="u.id === miId ? 'No podés desactivar tu propia cuenta' : ''"
                  @click="cambiarActivo(u)"
                >
                  {{ u.activo ? 'Desactivar' : 'Activar' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<style scoped>
.vista {
  --azul: #0a7bc4;
  --azul-oscuro: #0866a2;
  --texto: #1e293b;
  --suave: #64748b;
  --borde: #e2e8f0;

  max-width: 920px;
  margin: 0 auto;
  padding: 40px 16px 64px;
  color: var(--texto);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  line-height: 1.5;
}

/* Encabezado de página */
.encabezado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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

/* Tarjetas */
.tarjeta {
  background: #fff;
  border: 1px solid var(--borde);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  padding: 24px;
  margin-bottom: 24px;
}

h2 {
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--borde);
  font-size: 1.05rem;
  font-weight: 700;
}

/* Formularios */
.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.fila {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.fila > label {
  flex: 1 1 180px;
}

.fila-final {
  justify-content: flex-end;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--suave);
}

select,
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

select:focus-visible,
input:focus-visible,
button:focus-visible {
  outline: 2px solid var(--azul);
  outline-offset: 2px;
}

/* Botones */
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
  padding: 9px 18px;
  border: 1px solid transparent;
  font-size: 0.85rem;
  font-weight: 600;
}

.btn-chico {
  padding: 5px 12px;
  font-size: 0.8rem;
}

.btn-primario {
  background: var(--azul);
  border-color: var(--azul);
  color: #fff;
}

.btn-primario:hover:not(:disabled) {
  background: var(--azul-oscuro);
}

.btn-secundario {
  background: #fff;
  border-color: var(--borde);
  color: var(--texto);
}

.btn-secundario:hover:not(:disabled) {
  background: #f1f5f9;
}

/* Avisos */
.aviso {
  margin: 0 0 24px;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid;
  font-size: 0.9rem;
}

.aviso.ok {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.aviso.error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.nota {
  margin: 0;
  font-size: 0.9rem;
  color: var(--suave);
}

/* Tabla */
.tabla-wrap {
  overflow-x: auto;
  border: 1px solid var(--borde);
  border-radius: 8px;
}

.tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.tabla th {
  padding: 14px 16px;
  background: #f1f5f9;
  border-bottom: 1px solid var(--borde);
  text-align: left;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #475569;
  white-space: nowrap;
}

.tabla td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--borde);
  white-space: nowrap;
}

.tabla tbody tr:last-child td {
  border-bottom: 0;
}

.fuerte {
  font-weight: 700;
}

.id-chip {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  background: #e2e8f0;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.rol {
  background: #ede9fe;
  color: #5b21b6;
}

.activo {
  background: #dcfce7;
  color: #166534;
}

.inactivo {
  background: #fee2e2;
  color: #991b1b;
}
</style>