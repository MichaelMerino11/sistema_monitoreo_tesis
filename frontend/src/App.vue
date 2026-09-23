<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppNavigation from '@/components/layout/AppNavigation.vue'
</script>

<template>
  <div class="app">
    <AppHeader />
    <AppNavigation />

    <RouterView />
  </div>
</template>
