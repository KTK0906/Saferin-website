<script setup lang="ts">
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import type { VForm } from 'vuetify/components/VForm'

interface Emit {
  (e: 'update:isDrawerOpen', value: boolean): void
  (e: 'userData', value: any): void
}

interface Props {
  isDrawerOpen: boolean
  user?: any
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const isFormValid = ref(false)
const refForm = ref<VForm>()
const fullName = ref('')
const userName = ref('')
const phone = ref('')
const role = ref()
const status = ref()
const zone = ref()
const device = ref('')
const recentLocation = ref('')

watch(() => props.user, user => {
  if (!user) return
  fullName.value = user.name || ''
  userName.value = user.username || ''
  phone.value = user.phone_number || ''
  device.value = user.device || ''
  zone.value = user.zone || ''
  recentLocation.value = user.recent_location || ''
  role.value = user.role || ''
  status.value = user.status || 'Active'
}, { immediate: true })

// Phone number regex validator
const phoneValidator = (val: string) => {
  return /^[0-9+\-\s()]{7,15}$/.test(val) || 'Enter a valid phone number'
}

const resetFormFields = () => {
  fullName.value = ''
  userName.value = ''
  phone.value = ''
  role.value = null
  status.value = null
  zone.value = null
  device.value = ''
  recentLocation.value = ''
}

// 👉 drawer close
const closeNavigationDrawer = () => {
  emit('update:isDrawerOpen', false)

  nextTick(() => {
    refForm.value?.reset()
    refForm.value?.resetValidation()
    resetFormFields()
  })
}

const onSubmit = () => {
  refForm.value?.validate().then(({ valid }) => {
    if (valid) {
      emit('userData', {
        id: 0,
        fullName: fullName.value,
        username: userName.value,
        phone_number: phone.value,
        role: role.value,
        status: status.value,
        zone: zone.value,
        device: device.value,
        recent_location: recentLocation.value,
        avatar: '',
        billing: 'Auto Debit',
      })
      emit('update:isDrawerOpen', false)
      nextTick(() => {
        refForm.value?.reset()
        refForm.value?.resetValidation()
        resetFormFields()
      })
    }
  })
}

const handleDrawerModelValueUpdate = (val: boolean) => {
  emit('update:isDrawerOpen', val)
}
</script>

<template>
  <VNavigationDrawer data-allow-mismatch temporary :width="400" location="end" class="scrollable-content"
    :model-value="props.isDrawerOpen" @update:model-value="handleDrawerModelValueUpdate">
    <AppDrawerHeaderSection :title="props.user ? 'Edit User' : 'Add New User'" @cancel="closeNavigationDrawer" />

    <VDivider />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit">
            <VRow>
              <VCol cols="12">
                <AppTextField v-model="fullName" :rules="[requiredValidator]" label="Full Name"
                  placeholder="Enter name" />
              </VCol>

              <VCol cols="12">
                <AppTextField v-model="userName" :rules="[requiredValidator]" label="Username"
                  placeholder="Enter username" />
              </VCol>

              <VCol cols="12">
                <AppTextField v-model="phone" :rules="[requiredValidator, phoneValidator]" label="Phone Number"
                  placeholder="Enter phone number" />
              </VCol>

              <VCol cols="12">
                <AppTextField v-model="device" :rules="[requiredValidator]" label="Device" placeholder="Enter device" />
              </VCol>

              <VCol cols="12">
                <AppTextField v-model="zone" :rules="[requiredValidator]" label="Zone" placeholder="Enter zone" />
              </VCol>

              <VCol cols="12">
                <AppTextField v-model="recentLocation" :rules="[requiredValidator]" label="Recent Location"
                  placeholder="Enter recent location" />
              </VCol>

              <VCol cols="12">
                <AppSelect v-model="role" label="Select Role" placeholder="Select Role" :rules="[requiredValidator]"
                  :items="['Admin', 'Nurse', 'Doctor', 'Caregiver', 'Principal', 'OT/PT']" />
              </VCol>

              <VCol cols="12">
                <AppSelect v-model="status" label="Select Status" placeholder="Select Status"
                  :rules="[requiredValidator]" :items="['Active', 'Inactive']" />
              </VCol>

              <VCol cols="12">
                <VBtn type="submit" class="me-3">
                  Submit
                </VBtn>
                <VBtn type="reset" variant="tonal" color="error" @click="closeNavigationDrawer">
                  Cancel
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
</template>
