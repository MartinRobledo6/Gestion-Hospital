<template>
  <div class="app-layout">
    <header class="top-navbar">
      <div class="brand">
        <span class="logo-icon">🏥</span>
        <h1>Gestión Hospitalaria</h1>
      </div>
      <nav class="nav-links">
        <router-link to="/facturacion">Facturación</router-link>
      </nav>
    </header>
    <main class="main-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background-color: #ffffff;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
}
.top-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background: white;
  border-bottom: 2px solid #0077b6;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand h1 {
  margin: 0;
  font-size: 1.2rem;
  color: #2c3e50;
  font-weight: 600;
}
.logo-icon {
  font-size: 1.5rem;
}
.nav-links {
  display: flex;
  gap: 15px;
}
.nav-links a {
  text-decoration: none;
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.2s;
}
.nav-links a:hover,
.nav-links a.router-link-active {
  color: #0077b6;
  background-color: #f0f8ff;
}
.main-content {
  padding: 40px;
  width: 100%;
  max-width: none;
  margin: 0 auto;
  box-sizing: border-box;
}
</style>
