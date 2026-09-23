<template>
  <main class="page">
    <h2>MAINTRONIC</h2>

    <p class="page-description">
      Plataforma de monitoreo IoT para sistemas industriales y fotovoltaicos.
    </p>

    <div class="module-grid">
      <RouterLink class="module-card" to="/solar">
        <h3>Sistema Solar</h3>
        <p>Monitoreo del arreglo fotovoltaico.</p>
      </RouterLink>

      <RouterLink class="module-card" to="/industrial">
        <h3>Sistema Industrial</h3>
        <p>Monitoreo de variables eléctricas.</p>
      </RouterLink>

      <RouterLink class="module-card" to="/medidores">
        <h3>Medidores</h3>
        <p>Configuración y monitoreo dinámico.</p>
      </RouterLink>

      <RouterLink class="module-card" to="/alarmas">
        <h3>Alarmas</h3>
        <p>Supervisión de eventos y condiciones anormales.</p>
      </RouterLink>
    </div>
  </main>
</template>
