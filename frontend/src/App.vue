<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <nav class="hospital-navbar">
    <div class="navbar-brand">
      <span class="logo-icon">🏥</span>
      <h1>Gestión Hospitalaria</h1>
    </div>

    <div class="navbar-links">
      <RouterLink to="/camas" class="nav-item">Camas</RouterLink>
      <RouterLink to="/inventario" class="nav-item">Inventario</RouterLink>
    </div>
  </nav>

  <main class="main-content">
    <RouterView />
  </main>
</template>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.hospital-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  padding: 1rem 3rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border-bottom: 3px solid #0284c7;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.navbar-brand h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #334155;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.logo-icon {
  font-size: 1.8rem;
}

.navbar-links {
  display: flex;
  gap: 1rem;
}

.nav-item {
  text-decoration: none;
  color: #64748b;
  font-weight: 600;
  font-size: 1rem;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: #f1f5f9;
  color: #0284c7;
}

.router-link-active {
  background-color: #e0f2fe;
  color: #0284c7;
}

.main-content {
  padding-top: 1rem;
}
</style>
