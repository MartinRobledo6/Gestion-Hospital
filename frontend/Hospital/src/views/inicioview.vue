<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// El router manda ?sinPermiso=1 cuando se intenta entrar a una página no permitida
const sinPermiso = computed(() => route.query.sinPermiso === '1');

const etiquetaRol: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  MEDICO: 'Médico',
  ENFERMERO: 'Enfermero',
  RECEPCIONISTA: 'Recepcionista',
  PACIENTE: 'Paciente',
};

const usuario = (() => {
  try {
    return JSON.parse(localStorage.getItem('usuario') ?? 'null');
  } catch {
    return null;
  }
})();
</script>

<template>
  <main class="vista">
    <header class="encabezado">
      <div>
        <h1>Hola, {{ usuario?.nombre }}</h1>
        <p class="subtitulo">
          Tu rol: {{ etiquetaRol[usuario?.rol] ?? usuario?.rol }}
        </p>
      </div>
    </header>

    <p v-if="sinPermiso" class="aviso error" role="alert">
      No tenés permisos para acceder a esa página.
    </p>

    <section class="tarjeta">
      <h2>Inicio</h2>
      <p class="nota">
        Usá el menú superior para entrar a las secciones habilitadas para tu
        rol.
      </p>
    </section>
  </main>
</template>

<style scoped>
.vista {
  --azul: #0a7bc4;
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

.nota {
  margin: 0;
  font-size: 0.9rem;
  color: var(--suave);
}

.aviso {
  margin: 0 0 24px;
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