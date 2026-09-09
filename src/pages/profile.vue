<script setup lang="ts">
import { computed, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { clearRolePermissions } from '@/utils/permissions'

const currentPassword = ref('')
const router = useRouter()
const newPassword = ref('')
const confirmPassword = ref('')
const saving = ref(false)
const message = ref('')
const errorMessage = ref('')

const requirements = computed(() => [
  { label: 'At least 8 characters long', valid: newPassword.value.length >= 8 },
  { label: 'Contains at least one uppercase letter', valid: /[A-Z]/.test(newPassword.value) },
  { label: 'Contains at least one lowercase letter', valid: /[a-z]/.test(newPassword.value) },
  { label: 'Contains at least one number', valid: /\d/.test(newPassword.value) },
  { label: 'Contains at least one special character', valid: /[^A-Za-z0-9]/.test(newPassword.value) },
])
const passwordValid = computed(() => requirements.value.every(item => item.valid))
const passwordsMatch = computed(() => Boolean(confirmPassword.value) && newPassword.value === confirmPassword.value)

const updatePassword = async () => {
  message.value = ''
  errorMessage.value = ''
  if (!currentPassword.value || !passwordValid.value || !passwordsMatch.value) {
    errorMessage.value = 'Please enter your current password and satisfy all password requirements.'
    return
  }
  saving.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) throw new Error('Unable to identify the logged-in account.')
    const verification = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword.value })
    if (verification.error) throw new Error('Current password is incorrect.')
    const update = await supabase.auth.updateUser({ password: newPassword.value })
    if (update.error) throw update.error
    await supabase.auth.signOut()
    clearRolePermissions()
    await router.replace('/login')
  } catch (error: any) {
    errorMessage.value = error.message || 'Unable to update password.'
  } finally { saving.value = false }
}
</script>

<template>
  <section>
    <div class="d-flex align-center gap-4 mb-6"><h4 class="text-h4 mb-0">User Profile</h4></div>
    <VRow>
      <VCol cols="12" md="8"><VCard><VCardItem><VCardTitle>Change Password</VCardTitle><VCardSubtitle>Update your password to keep your account secure</VCardSubtitle></VCardItem><VDivider /><VCardText><VAlert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</VAlert><VAlert v-if="message" type="success" variant="tonal" class="mb-4">{{ message }}</VAlert><VForm @submit.prevent="updatePassword"><AppTextField v-model="currentPassword" type="password" label="Current Password" placeholder="Enter your current password" class="mb-4" /><AppTextField v-model="newPassword" type="password" label="New Password" placeholder="Enter your new password" class="mb-4" /><AppTextField v-model="confirmPassword" type="password" label="Confirm New Password" placeholder="Confirm your new password" class="mb-2" /><div v-if="confirmPassword" class="text-caption" :class="passwordsMatch ? 'text-success' : 'text-error'">{{ passwordsMatch ? 'Passwords match' : 'Passwords do not match' }}</div><div class="d-flex justify-end mt-6"><VBtn type="submit" color="primary" :loading="saving">Update Password</VBtn></div></VForm></VCardText></VCard></VCol>
      <VCol cols="12" md="4"><VCard><VCardItem><VCardTitle>Password Requirements</VCardTitle></VCardItem><VCardText><div v-for="requirement in requirements" :key="requirement.label" class="requirement-row"><VIcon :icon="requirement.valid ? 'tabler-circle-check' : 'tabler-circle-x'" :color="requirement.valid ? 'success' : 'secondary'" size="18" /><span>{{ requirement.label }}</span></div><VDivider class="my-5" /><div class="text-caption text-warning"><VIcon icon="tabler-alert-triangle" size="16" class="me-1" />For security reasons, you will be logged out after changing your password.</div><div class="text-caption text-warning mt-3"><VIcon icon="tabler-alert-triangle" size="16" class="me-1" />Do not reuse passwords from other websites.</div></VCardText></VCard></VCol>
    </VRow>
  </section>
</template>

<style scoped>
.requirement-row { display: flex; align-items: center; gap: 8px; margin-block: 12px; }
</style>
