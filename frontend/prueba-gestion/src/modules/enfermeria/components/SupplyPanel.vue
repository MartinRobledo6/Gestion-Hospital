<script setup lang="ts">
import { ref } from 'vue'
import { useEnfermeriaStore } from '../useEnfermeriaStore'

// Inventario del piso + alta de insumos. Hoy no hay módulo de Farmacia/Inventario real,
// así que este formulario hace de "carga de datos de prueba".
const store = useEnfermeriaStore()

const nombre = ref('')
const stock = ref<string | number>('')
const error = ref('')

async function guardar() {
  const s = Number(stock.value)
  if (!nombre.value.trim()) return (error.value = 'Ingresá el nombre del insumo.')
  if (!Number.isInteger(s) || s < 0) return (error.value = 'El stock debe ser un entero de 0 o más.')
  error.value = ''
  if (await store.crearInsumo({ name: nombre.value.trim(), stock: s })) {
    nombre.value = ''
    stock.value = ''
  }
}
</script>

<template>
  <section class="panel" aria-labelledby="inv-titulo">
    <div class="panel-head">
      <h2 id="inv-titulo">Inventario del piso</h2>
      <p class="hint">Cada dosis administrada descuenta 1 unidad.</p>
    </div>

    <p v-if="!store.inventario.length" class="empty">Todavía no hay insumos cargados.</p>
    <div v-else class="table-wrap">
      <table class="data">
        <thead>
          <tr><th>Insumo</th><th>Stock</th></tr>
        </thead>
        <tbody>
          <tr v-for="s in store.inventario" :key="s.id">
            <td>#{{ s.id }} · {{ s.name }}</td>
            <td>
              <span class="badge" :class="s.stock < 1 ? 'badge-critical' : s.stock <= 5 ? 'badge-warn' : 'badge-ok'">
                {{ s.stock }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <details class="alta">
      <summary>Cargar insumo (datos de prueba)</summary>
      <form class="form-grid" novalidate @submit.prevent="guardar">
        <div class="field">
          <label for="su-nombre">Nombre</label>
          <input id="su-nombre" v-model="nombre" type="text" autocomplete="off" />
        </div>
        <div class="field">
          <label for="su-stock">Stock</label>
          <input id="su-stock" v-model="stock" type="number" min="0" step="1" />
        </div>
        <div class="field acc">
          <button type="submit" class="btn">Agregar</button>
        </div>
      </form>
      <p v-if="error" class="field-error" role="alert">{{ error }}</p>
    </details>
  </section>
</template>

<style scoped>
.alta {
  margin-top: 1rem;
}
.alta summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--brand-dark);
  margin-bottom: 0.75rem;
}
.acc {
  justify-content: flex-end;
}
</style>
