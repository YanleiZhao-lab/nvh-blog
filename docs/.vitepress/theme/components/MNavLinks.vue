<script setup lang="ts">
import MNavLink from './MNavLink.vue'
import type { NavLink } from '../untils/types'

defineProps<{
  title: string
  items: NavLink[]
}>()
</script>

<template>
  <div class="m-nav-links">
    <h2 class="m-nav-links-title">
      {{ title }}
    </h2>
    <div class="m-nav-links-grid">
      <MNavLink
        v-for="item in items"
        :key="item.link"
        :icon="item.icon"
        :title="item.title"
        :desc="item.desc"
        :link="item.link"
        :badge="item.badge"
      />
    </div>
  </div>
</template>

<style scoped>
.m-nav-links {
  margin-bottom: 32px;
}

.m-nav-links-title {
  margin: 24px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 20px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.m-nav-links-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .m-nav-links-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .m-nav-links-grid {
    grid-template-columns: 1fr;
  }
}
</style>
