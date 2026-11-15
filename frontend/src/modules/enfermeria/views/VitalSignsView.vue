<script setup lang="ts">
import VitalSignsForm from '../components/VitalSignsForm.vue'
import VitalSignsTable from '../components/VitalSignsTable.vue'
import { useEnfermeriaStore } from '../useEnfermeriaStore'

const store = useEnfermeriaStore()
</script>

<template>
  <div class="stack">
    <!-- El médico ve los controles pero no los carga -->
    <VitalSignsForm v-if="store.enfermero" />
    <VitalSignsTable />
  </div>
</template>
