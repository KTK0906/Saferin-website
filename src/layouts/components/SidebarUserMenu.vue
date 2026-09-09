<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { clearRolePermissions } from '@/utils/permissions'

const router = useRouter()
const rawUsername = ref('User')
const email = ref('')
const isLoading = ref(false)

// Capitalize the first letter of the username
const username = computed(() => {
  if (!rawUsername.value) return 'User'
  return rawUsername.value.charAt(0).toUpperCase() + rawUsername.value.slice(1)
})

const initials = computed(() => username.value.slice(0, 1).toUpperCase())

const loadUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user)
    return

  rawUsername.value = typeof user.user_metadata.username === 'string'
    ? user.user_metadata.username
    : user.email?.split('@')[0] || 'User'
  email.value = user.email || ''
}

const goToSettings = async () => {
  await router.push({ name: 'pages-account-settings-tab', params: { tab: 'account' } })
}

const goToProfile = async () => {
  await router.push('/profile')
}

const logout = async () => {
  isLoading.value = true

  try {
    const { error } = await supabase.auth.signOut()

    if (error)
      throw error

    clearRolePermissions()
    await router.replace('/login')
  }
  finally {
    isLoading.value = false
  }
}

onMounted(loadUser)
</script>

<template>
  <div class="sidebar-user-menu">
    <VAvatar size="36" color="rgba(255, 255, 255, 0.22)">
      <span class="text-body-2 font-weight-medium">{{ initials }}</span>
    </VAvatar>

    <div class="sidebar-user-menu__details">
      <div class="sidebar-user-menu__name">
        {{ username }}
      </div>
      <div v-if="email" class="sidebar-user-menu__email">
        {{ email }}
      </div>
    </div>

    <VMenu location="end top" offset="12">
      <template #activator="{ props }">
        <IconBtn v-bind="props" class="sidebar-user-menu__more" aria-label="User menu">
          <VIcon icon="tabler-dots-vertical" />
        </IconBtn>
      </template>

      <VList min-width="180">
        <VListItem prepend-icon="tabler-user" title="Profile" @click="goToProfile" />
        <VListItem prepend-icon="tabler-settings" title="Settings" @click="goToSettings" />
        <VDivider />
        <VListItem prepend-icon="tabler-logout" title="Logout" :disabled="isLoading" @click="logout" />
      </VList>
    </VMenu>
  </div>
</template>

<style lang="scss">
@use "@configured-variables" as variables;

.sidebar-user-menu {
  display: flex;
  align-items: center;
  min-block-size: 72px;
  padding: 0.75rem 1rem;
  border-block-start: 1px solid rgb(255 255 255 / 18%);
  color: rgb(255 255 255 / 92%);
  gap: 0.75rem;

  &__details {
    min-inline-size: 0;
    overflow: hidden;
  }

  &__name,
  &__email {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__name {
    font-size: 0.875rem;
    font-weight: 600;
  }

  &__email {
    color: rgb(255 255 255 / 70%);
    font-size: 0.75rem;
  }

  &__more {
    margin-inline-start: auto;
    color: inherit;
  }
}

#{variables.$selector-vertical-nav-mini} .sidebar-user-menu {
  justify-content: center;
  padding-inline: 0;

  &__details,
  &__more {
    display: none;
  }
}
</style>
