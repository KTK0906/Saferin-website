<script setup lang="ts">
import SafrinDashboard from '@/pages/front-pages/landing-page/index.vue'

definePage({
  meta: {
    // Use all available workspace width even if a user previously saved the
    // template's boxed-content preference in a cookie.
    layoutWrapperClasses: 'dashboard-fluid-layout',
  },
})
</script>

<template>
  <SafrinDashboard />
</template>