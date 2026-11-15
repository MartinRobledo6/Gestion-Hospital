<script setup lang="ts">
import DoseSchedule from '../components/DoseSchedule.vue'
import IndicationForm from '../components/IndicationForm.vue'
import MedicationTable from '../components/MedicationTable.vue'
import SupplyPanel from '../components/SupplyPanel.vue'
import { useEnfermeriaStore } from '../useEnfermeriaStore'

const store = useEnfermeriaStore()
</script>

<template>
  <div class="stack">
    <DoseSchedule />
    <SupplyPanel />
    <!-- La indicación la carga el médico; la firma es el usuario logueado -->
    <IndicationForm v-if="store.puedeIndicar" />
    <MedicationTable />
  </div>
</template>
