<template>
  <div class="page">
    <div class="container">
      <div class="code">404</div>
      <h1 class="title">Page not found</h1>
      <p class="sub">The page you're looking for doesn't exist.</p>
      <RouterLink to="/" class="btn">Go home</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--surface-alt); }
.container { text-align: center; }
.code { font-family: var(--font-display); font-weight: 800; font-size: 96px; color: var(--accent); line-height: 1; margin-bottom: 16px; }
.title { font-family: var(--font-display); font-weight: 700; font-size: 28px; margin-bottom: 12px; }
.sub { font-size: 16px; color: var(--text-muted); margin-bottom: 32px; }
.btn { display: inline-block; padding: 12px 28px; background: var(--accent); color: #fff; border-radius: 10px; text-decoration: none; font-family: var(--font-display); font-weight: 600; font-size: 15px; transition: background 0.2s; }
.btn:hover { background: var(--accent-hover); }
</style>
