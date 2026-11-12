<script setup lang="ts">
import { useEnfermeriaStore } from '../useEnfermeriaStore'

const store = useEnfermeriaStore()
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
          <tr>
            <th>Insumo</th>
            <th>Stock</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="s in store.inventario" :key="s.id">
            <td>#{{ s.id }} · {{ s.name }}</td>
            <td>
              <span
                class="badge"
                :class="s.stock < 1 ? 'badge-critical' : s.stock <= 5 ? 'badge-warn' : 'badge-ok'"
              >
                {{ s.stock }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
