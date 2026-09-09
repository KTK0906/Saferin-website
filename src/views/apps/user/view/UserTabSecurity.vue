<script setup lang="ts">
import { computed, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
const props = defineProps<{ staffId?: string }>()
const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const saving = ref(false)
const errorMessage = ref('')
const requirements = computed(() => [
  { label: 'At least 8 characters long', valid: newPassword.value.length >= 8 },
  { label: 'Contains at least one uppercase letter', valid: /[A-Z]/.test(newPassword.value) },
  { label: 'Contains at least one lowercase letter', valid: /[a-z]/.test(newPassword.value) },
  { label: 'Contains at least one number', valid: /\d/.test(newPassword.value) },
  { label: 'Contains at least one special character', valid: /[^A-Za-z0-9]/.test(newPassword.value) },
])
const resetPassword = async () => {
  errorMessage.value = ''
  if (!props.staffId || !requirements.value.every(item => item.valid) || newPassword.value !== confirmPassword.value) { errorMessage.value = 'Enter a valid matching password.'; return }
  saving.value = true
  const { error } = await supabase.functions.invoke('admin-reset-password', { body: { staff_id: props.staffId, password: newPassword.value } })
  saving.value = false
  if (error) {
    let detail = error.message
    try {
      const response = (error as any).context
      if (response?.json) {
        const body = await response.json()
        detail = body?.error || body?.message || detail
      }
    } catch { /* Keep the SDK message when the response body is unavailable. */ }
    errorMessage.value = detail
  }
  else { newPassword.value = ''; confirmPassword.value = ''; alert('Password reset successfully.') }
}
const smsVerificationNumber = ref('+1(968) 819-2547')
const isTwoFactorDialogOpen = ref(false)

// Recent devices Headers
const recentDeviceHeader = [
  { title: 'BROWSER', key: 'browser' },
  { title: 'DEVICE', key: 'device' },
  { title: 'LOCATION', key: 'location' },
  { title: 'RECENT ACTIVITY', key: 'activity' },
]

const recentDevices = [
  {
    browser: ' Chrome on Windows',
    icon: 'tabler-brand-windows',
    color: 'info',
    device: 'HP Spectre 360',
    location: 'Switzerland',
    activity: '10, July 2021 20:07',
  },
  {
    browser: 'Chrome on Android',
    icon: 'tabler-brand-android',
    color: 'success',
    device: 'Oneplus 9 Pro',
    location: 'Dubai',
    activity: '14, July 2021 15:15',
  },
  {
    browser: 'Chrome on macOS',
    icon: 'tabler-brand-apple',
    color: 'secondary',
    device: 'Apple iMac',
    location: 'India',
    activity: '16, July 2021 16:17',
  },
  {
    browser: 'Chrome on iPhone',
    icon: 'tabler-device-mobile',
    color: 'error',
    device: 'iPhone 12x',
    location: 'Australia',
    activity: '13, July 2021 10:10',
  },

]
</script>

<template>
  <VRow>
    <VCol cols="12">
      <!-- 👉 Change password -->
      <VCard title="Change Password">
        <VCardText>
          <VAlert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</VAlert>
          <VAlert
            closable
            variant="tonal"
            color="warning"
            class="mb-4"
            title="Ensure that these requirements are met"
            text="Minimum 8 characters long, uppercase & symbol"
          />

          <VForm @submit.prevent="resetPassword">
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  label="New Password"
                  placeholder="············"
                  v-model="newPassword"
                  :type="isNewPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isNewPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  label="Confirm Password"
                  autocomplete="confirm-password"
                  placeholder="············"
                  v-model="confirmPassword"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                />
              </VCol>

              <VCol cols="12">
                <div class="text-caption mb-3">Password requirements:</div>
                <div v-for="requirement in requirements" :key="requirement.label" class="d-flex align-center gap-2 text-caption mb-1">
                  <VIcon :icon="requirement.valid ? 'tabler-circle-check' : 'tabler-circle-x'" :color="requirement.valid ? 'success' : 'secondary'" size="16" />
                  {{ requirement.label }}
                </div>
              </VCol>
              <VCol cols="12">
                <VBtn type="submit" :loading="saving">
                  Reset Password
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>

    <VCol v-if="false" cols="12">
      <!-- 👉 Two step verification -->
      <VCard
        title="Two-steps verification"
        subtitle="Keep your account secure with authentication step."
      >
        <VCardText>
          <div class="text-h6 mb-1">
            SMS
          </div>
          <AppTextField placeholder="+1(968) 819-2547">
            <template #append>
              <IconBtn color="secondary">
                <VIcon
                  icon="tabler-edit"
                  size="22"
                />
              </IconBtn>
              <IconBtn color="secondary">
                <VIcon
                  icon="tabler-user-plus"
                  size="22"
                />
              </IconBtn>
            </template>
          </AppTextField>

          <p class="mb-0 mt-4">
            Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to log in. <a
              href="javascript:void(0)"
              class="text-decoration-none"
            >Learn more</a>.
          </p>
        </VCardText>
      </VCard>
    </VCol>

    <VCol v-if="false" cols="12">
      <!-- 👉 Recent devices -->

      <VCard title="Recent devices">
        <VDivider />
        <VDataTable
          :items="recentDevices"
          :headers="recentDeviceHeader"
          hide-default-footer
          class="text-no-wrap"
        >
          <template #item.browser="{ item }">
            <div class="d-flex align-center gap-x-4">
              <VIcon
                :icon="item.icon"
                :color="item.color"
                :size="22"
              />
              <div class="text-body-1 text-high-emphasis">
                {{ item.browser }}
              </div>
            </div>
          </template>
          <!-- TODO Refactor this after vuetify provides proper solution for removing default footer -->
          <template #bottom />
        </VDataTable>
      </VCard>
    </VCol>
  </VRow>

  <!-- 👉 Enable One Time Password Dialog -->
  <TwoFactorAuthDialog v-if="false"
    v-model:is-dialog-visible="isTwoFactorDialogOpen"
    :sms-code="smsVerificationNumber"
  />
</template>
