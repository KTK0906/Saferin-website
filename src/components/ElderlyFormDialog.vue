<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { supabase } from '@/lib/supabaseClient'

type Elderly = {
  id: string
  name?: string
  resident_name?: string
  age?: number | null
  care_level?: string | null
  status?: string | null
  zone?: string | null
  bed?: string | null
  emergency_contact?: string | null
  conditions?: string[] | string | null
}

const props = defineProps<{ modelValue: boolean; elderly?: Elderly | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; saved: [] }>()

const isEdit = computed(() => Boolean(props.elderly))
const dialog = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', value) })
const saving = ref(false)
const errorMessage = ref('')

const statuses = ref<string[]>([])
const zones = ref<string[]>([])

const form = ref({
  name: '',
  age: null as number | null,
  status: '',
  zone: '',
  bed: '',
  emergencyContact: '',
  medicalConditions: ''
})

const resetForm = () => {
  errorMessage.value = ''
  if (props.elderly) {
    const rawConditions = props.elderly.conditions
    const conditionsString = Array.isArray(rawConditions)
      ? rawConditions.join(', ')
      : rawConditions || ''

    form.value = {
      name: props.elderly.name || props.elderly.resident_name || '',
      age: props.elderly.age ?? null,
      status: props.elderly.care_level || props.elderly.status || statuses.value[0] || '',
      zone: props.elderly.zone || '',
      bed: props.elderly.bed || '',
      emergencyContact: props.elderly.emergency_contact || '',
      medicalConditions: conditionsString
    }
  } else {
    form.value = {
      name: '',
      age: null,
      status: '',
      zone: '',
      bed: '',
      emergencyContact: '',
      medicalConditions: ''
    }
  }
}

const loadOptions = async () => {
  const { data, error } = await supabase
    .from('elderly')
    .select('zone, care_level')

  if (error) {
    console.error('Error loading zone options:', error)
    return
  }

  if (data) {
    zones.value = Array.from(new Set(data.map(item => item.zone).filter(Boolean))).sort()
    statuses.value = Array.from(new Set(data.map(item => item.care_level).filter(Boolean))).sort()
    if (props.elderly?.care_level && !statuses.value.includes(props.elderly.care_level)) statuses.value.push(props.elderly.care_level)
  }
}

const save = async () => {
  saving.value = true
  errorMessage.value = ''
  try {
    if (!form.value.name.trim() || !form.value.age || !form.value.zone || !form.value.bed || !form.value.status) {
      throw new Error('Please fill in all required fields.')
    }

    // Process input string into array format for the related medical_information table.
    const medicalInput = form.value.medicalConditions.trim()
    const conditionsArray = medicalInput
      ? medicalInput.split(',').map(item => item.trim()).filter(Boolean)
      : []

    if (isEdit.value && props.elderly) {
      // Update the current schema's elderly table.
      const { error: elderlyError } = await supabase
        .from('elderly')
        .update({
          name: form.value.name.trim(),
          age: Number(form.value.age),
          care_level: form.value.status,
          zone: form.value.zone,
          bed: form.value.bed.trim()
        })
        .eq('id', props.elderly.id)

      if (elderlyError) throw elderlyError
      await saveRelatedData(props.elderly.id, conditionsArray)
    } else {
      const { data: newElderly, error: insertElderlyError } = await supabase
        .from('elderly')
        .insert({
          name: form.value.name.trim(),
          age: Number(form.value.age),
          care_level: form.value.status,
          zone: form.value.zone,
          bed: form.value.bed.trim()
        })
        .select()
        .single()

      if (insertElderlyError) throw insertElderlyError

      if (newElderly) await saveRelatedData(newElderly.id, conditionsArray)
    }

    emit('saved')
    dialog.value = false
  } catch (error: any) {
    console.error('Supabase Save Error:', error)
    errorMessage.value = error?.message || error?.details || error?.hint || 'Unable to save elderly information.'
  } finally {
    saving.value = false
  }
}

const saveRelatedData = async (elderlyId: string, conditions: string[]) => {
  const { data: existingContact, error: contactReadError } = await supabase.from('emergency_contacts').select('id').eq('elderly_id', elderlyId).maybeSingle()
  if (contactReadError) throw contactReadError
  const contactPayload = { primary_contact: form.value.emergencyContact.trim() || null }
  const contactResult = existingContact
    ? await supabase.from('emergency_contacts').update(contactPayload).eq('id', existingContact.id)
    : contactPayload.primary_contact ? await supabase.from('emergency_contacts').insert({ elderly_id: elderlyId, ...contactPayload }) : { error: null }
  if (contactResult.error) throw contactResult.error

  const { data: existingMedical, error: medicalReadError } = await supabase.from('medical_information').select('id').eq('elderly_id', elderlyId).maybeSingle()
  if (medicalReadError) throw medicalReadError
  const medicalPayload = { conditions }
  const medicalResult = existingMedical
    ? await supabase.from('medical_information').update(medicalPayload).eq('id', existingMedical.id)
    : conditions.length ? await supabase.from('medical_information').insert({ elderly_id: elderlyId, ...medicalPayload }) : { error: null }
  if (medicalResult.error) throw medicalResult.error
}

onMounted(loadOptions)
watch(() => props.modelValue, value => {
  if (value) {
    resetForm()
    loadOptions()
  }
})
</script>

<template>
  <VNavigationDrawer v-model="dialog" location="end" temporary :width="460">
    <AppDrawerHeaderSection :title="isEdit ? 'Edit Elderly' : 'Add New Elderly'" @cancel="dialog = false" />
    <VDivider />
    <VCard flat>
      <VCardText class="edit-dialog-body">
        <VAlert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-3">
          {{ errorMessage }}
        </VAlert>
        <VForm @submit.prevent="save">
          <VRow>
            <VCol cols="12"><AppTextField v-model="form.name" label="Name" placeholder="Enter name" /></VCol>
            <VCol cols="12"><AppTextField v-model.number="form.age" type="number" label="Age" placeholder="Enter age" /></VCol>
            <VCol cols="12"><AppSelect v-model="form.status" :items="statuses" label="Status" /></VCol>
            <VCol cols="12"><AppSelect v-model="form.zone" :items="zones" label="Zone" /></VCol>
            <VCol cols="12"><AppTextField v-model="form.bed" label="Bed Number" placeholder="Enter bed number" /></VCol>
            <VCol cols="12"><AppTextField v-model="form.emergencyContact" label="Emergency Contact" placeholder="Enter emergency contact" /></VCol>
            <VCol cols="12"><AppTextarea v-model="form.medicalConditions" label="Medical Conditions" placeholder="Enter medical conditions (e.g. Asthma, Diabetes)" rows="3" /></VCol>
            <VCol cols="12" class="d-flex justify-end gap-3 pt-2">
              <VBtn variant="text" color="secondary" :disabled="saving" @click="dialog = false">Cancel</VBtn>
              <VBtn type="submit" color="primary" :loading="saving">{{ isEdit ? 'Save Changes' : 'Add Elderly' }}</VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VNavigationDrawer>
</template>

<style scoped lang="scss">
.edit-dialog-card {
  border-radius: 16px !important;
  background-color: #18181b !important;
  color: #ffffff;
  padding: 8px 12px;
}

.edit-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
}

.edit-dialog-body {
  padding: 8px 16px;
  max-height: 75vh;
  overflow-y: auto;
}

.form-fields-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.custom-input-box {
  background-color: #27272a;
  border-radius: 12px;
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
}

.custom-label {
  font-size: 11px;
  font-weight: 500;
  color: #a1a1aa;
  margin-bottom: 2px;
}

.custom-input {
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 13px;
  width: 100%;

  &::placeholder {
    color: #71717a;
  }
}

.readonly-input {
  color: #e4e4e7;
  cursor: not-allowed;
}

:deep(.custom-select) {
  margin-top: -6px;

  .v-field__input {
    padding: 0 !important;
    min-height: 24px !important;
    font-size: 13px !important;
    color: #ffffff !important;
  }

  .v-field__append-inner {
    padding-top: 0 !important;
    align-items: center;
    color: #a1a1aa;
  }
}

.edit-dialog-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.cancel-btn {
  color: #ffffff !important;
  text-transform: none;
  font-size: 13px;
  font-weight: 500;
}

.save-btn {
  background-color: #0084ff !important;
  color: #ffffff !important;
  text-transform: none;
  border-radius: 12px;
  padding: 0 20px;
  height: 38px;
  font-size: 13px;
  font-weight: 600;
}
</style>
