<script setup lang="ts">
import DoseSchedule from '../components/DoseSchedule.vue'
import IndicationForm from '../components/IndicationForm.vue'
import MedicationTable from '../components/MedicationTable.vue'
import SupplyPanel from '../components/SupplyPanel.vue'
</script>

<template>
  <div class="stack">
    <DoseSchedule />
    <SupplyPanel />
    <IndicationForm />
    <MedicationTable />
  </div>
</template>
