<script setup lang="ts">
import { supabase } from '@/lib/supabaseClient'
import ResidentForms from '@/components/ResidentForms.vue'
import ElderlyFormDialog from '@/components/ElderlyFormDialog.vue'
import ResidentProfileSummary from '@/components/ResidentProfileSummary.vue'
import {loadResidentProfile} from '@/utils/resident-profile-service'
import {residentAge} from '@/utils/resident-profile-data'
import type {ProfileBundle} from '@/utils/resident-profile-data'
import {useAbility} from '@casl/vue'

const route = useRoute('elderly-view-id')
const router = useRouter()
const profile=ref<ProfileBundle|null>(null)
const profileError=ref('')
try{profile.value=await loadResidentProfile(String(route.params.id))}catch(error:any){profileError.value=error.message||'Unable to load resident profile.'}
const resident=computed(()=>profile.value?.resident)
const permissions=useAbility()
const canEditProfile=computed(()=>permissions.rules.some(r=>!r.inverted&&((r.subject==='all'&&r.action==='manage')||(r.subject==='elderly_list'&&r.action==='read')))&&permissions.rules.some(r=>!r.inverted&&((r.subject==='all'&&r.action==='manage')||(r.subject==='elderly_list'&&r.action==='manage'))))
function applyProfile(bundle:ProfileBundle){profile.value=bundle}
const { data: medicalCheck } = await supabase.from('medical_checks').select('*').eq('elderly_id', route.params.id).order('check_date', { ascending: false }).limit(1).maybeSingle()
const { data: currentVitals } = await supabase.from('health_vitals').select('*').eq('elderly_id', route.params.id).order('recorded_at', { ascending: false }).limit(1).maybeSingle()
const { data: sensorReadings } = await supabase.from('sensor_readings').select('*').eq('elderly_id', route.params.id).order('recorded_at', { ascending: false }).limit(1).maybeSingle()
const { data: schedules, error: scheduleLoadError } = await supabase.from('elderly_schedules').select('*').eq('elderly_id', route.params.id).order('scheduled_time', { ascending: true })
const { data: alerts, error: alertsLoadError } = await supabase.from('elderly_alerts').select('*').eq('elderly_id', route.params.id).order('occurred_at', { ascending: false }).limit(20)
const { data: familyVisits, error: familyVisitsLoadError } = await supabase.from('family_visit_records').select('*').eq('elderly_id', route.params.id).order('visited_at', { ascending: false }).limit(20)

const editOpen = ref(false)
const scheduleDrawer = ref(false)
const scheduleSaving = ref(false)
const editingScheduleId = ref<string | null>(null)
const scheduleForm = ref({ category: 'Medication', item: '', scheduledTime: '', scheduleType: 'Routine', remarks: '' })
const scheduleCategories = ['Medication', 'Meal', 'Exercise', 'Activity']
const scheduleTypes = ['Routine', 'Once Only', 'Focus', 'Recently Added']
const activeTab = ref(route.query.tab==='forms'?5:0)
watch(()=>route.query.tab,tab=>{if(tab==='forms')activeTab.value=5})

const openEdit = () => { if(canEditProfile.value)editOpen.value=true }

const openSchedule = (schedule?: any) => {
  editingScheduleId.value = schedule?.id || null
  scheduleForm.value = {
    category: schedule?.category || 'Medication',
    item: schedule?.item || '',
    scheduledTime: String(schedule?.scheduled_time || '').slice(0, 5),
    scheduleType: schedule?.schedule_type || 'Routine',
    remarks: schedule?.remarks || ''
  }
  scheduleDrawer.value = true
}

const saveSchedule = async () => {
  if (!scheduleForm.value.item.trim() || !scheduleForm.value.scheduledTime) return
  scheduleSaving.value = true
  const payload = {
    elderly_id: route.params.id,
    category: scheduleForm.value.category,
    item: scheduleForm.value.item.trim(),
    scheduled_time: scheduleForm.value.scheduledTime,
    schedule_type: scheduleForm.value.scheduleType,
    remarks: scheduleForm.value.remarks.trim() || null
  }
  const result = editingScheduleId.value
    ? await supabase.from('elderly_schedules').update(payload).eq('id', editingScheduleId.value)
    : await supabase.from('elderly_schedules').insert(payload)
  scheduleSaving.value = false
  if (!result.error) location.reload()
}

const deleteSchedule = async (schedule: any) => {
  if (!window.confirm(`Delete schedule "${schedule.item}"?`)) return
  await supabase.from('elderly_schedules').delete().eq('id', schedule.id)
  location.reload()
}
</script>

<template>
  <VAlert v-if="profileError" type="error" variant="tonal">{{profileError}}</VAlert>
  <VRow v-if="resident">
    <!-- Left Column: Personal Profile -->
    <VCol cols="12" md="5" lg="4">
      <VCard class="pa-6 h-100">
        <div class="d-flex justify-center mb-4">
          <VAvatar size="120" color="primary" variant="tonal">
            <VImg v-if="resident.avatar_url" :src="resident.avatar_url" />
            <span v-else class="text-h3">
              {{ String(resident.name || resident.resident_name || 'E').slice(0, 2).toUpperCase() }}
            </span>
          </VAvatar>
        </div>
        <div class="text-center text-h5 font-weight-bold">{{ resident.name || resident.resident_name }}</div>
        <div class="d-flex justify-center mt-2">
          <VChip color="primary" size="small" variant="tonal">{{ resident.care_level || 'Normal' }}</VChip>
        </div>
        <VDivider class="my-6" />
        <div class="text-h6 mb-4">Personal Information</div>
        <div class="detail-line"><strong>Age:</strong> {{ residentAge(resident) ?? 'Not recorded' }}</div>
        <div class="detail-line"><strong>Sex:</strong> {{ resident.gender || 'Not recorded' }}</div>
        <div class="detail-line"><strong>Zone:</strong> {{ resident.zone || 'Not recorded' }}</div>
        <div class="detail-line"><strong>Room:</strong> {{ resident.room || 'Not recorded' }}</div>
        <div class="detail-line"><strong>Bed:</strong> {{ resident.bed || 'Not recorded' }}</div>
        <div class="detail-line"><strong>Caregiver:</strong> {{ resident.main_caregiver || 'Not recorded' }}</div>
        <div class="d-flex justify-center mt-6">
          <VBtn v-if="canEditProfile" color="primary" prepend-icon="tabler-edit" @click="openEdit">Edit Profile</VBtn>
        </div>
      </VCard>
    </VCol>

    <!-- Right Column: Tabs Navigation & Dynamic Windows -->
    <VCol cols="12" md="7" lg="8">
      <VTabs v-model="activeTab" class="v-tabs-pill">
        <VTab>
          <VIcon icon="tabler-user" class="me-1" />Overview
        </VTab>
        <VTab>
          <VIcon icon="tabler-heart-rate-monitor" class="me-1" />Health Vitals
        </VTab>
        <VTab>
          <VIcon icon="tabler-calendar" class="me-1" />Schedule
        </VTab>
        <VTab>
          <VIcon icon="tabler-bell" class="me-1" />Alerts
        </VTab>
        <VTab>
          <VIcon icon="tabler-users" class="me-1" />Family Visits
        </VTab>
        <VTab><VIcon icon="tabler-clipboard-list" class="me-1" />Forms</VTab>
      </VTabs>

      <VWindow v-model="activeTab" class="mt-6">
        <!-- Overview Tab -->
        <VWindowItem>
          <ResidentProfileSummary v-if="profile" :bundle="profile" show-personal />

          <VCard class="mt-6">
            <VCardItem><VCardTitle>Last Medical Check</VCardTitle></VCardItem>
            <VCardText>
              <VRow>
                <VCol cols="12" sm="6"><div class="text-caption">Date</div><div>{{ medicalCheck?.check_date || 'Not recorded' }}</div></VCol>
                <VCol cols="12" sm="6"><div class="text-caption">Doctor</div><div>{{ medicalCheck?.doctor || 'Not recorded' }}</div></VCol>
                <VCol cols="12" sm="6"><div class="text-caption">Weight</div><div>{{ medicalCheck?.weight || 'Not recorded' }}</div></VCol>
                <VCol cols="12" sm="6"><div class="text-caption">Next Visit</div><div>{{ medicalCheck?.next_visit || 'Not recorded' }}</div></VCol>
                <VCol cols="12"><div class="text-caption">Notes</div><div>{{ medicalCheck?.notes || 'Not recorded' }}</div></VCol>
              </VRow>
            </VCardText>
          </VCard>


        </VWindowItem>

        <!-- Health Vitals Tab -->
        <VWindowItem>
          <VCard>
            <VCardItem><VCardTitle>Current Vitals</VCardTitle></VCardItem>
            <VCardText>
              <VRow>
                <VCol 
                  v-for="vital in [
                    { label: 'Heart Rate', value: currentVitals?.heart_rate, status: currentVitals?.heart_rate_status }, 
                    { label: 'Blood Pressure', value: currentVitals?.blood_pressure, status: currentVitals?.blood_pressure_status }, 
                    { label: 'Temperature', value: currentVitals?.temperature, status: currentVitals?.temperature_status }, 
                    { label: 'Oxygen Saturation', value: currentVitals?.oxygen_saturation, status: currentVitals?.oxygen_saturation_status }, 
                    { label: 'Blood Glucose', value: currentVitals?.blood_glucose, status: currentVitals?.blood_glucose_status }
                  ]" 
                  :key="vital.label" 
                  cols="12" sm="6" md="4"
                >
                  <VCard variant="tonal" class="pa-4 h-100">
                    <div class="text-caption">{{ vital.label }}</div>
                    <div class="text-h6">{{ vital.value || 'Not recorded' }}</div>
                    <VChip v-if="vital.status" size="x-small" color="primary" class="mt-2">{{ vital.status }}</VChip>
                  </VCard>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <VCard class="mt-6">
            <VCardItem><VCardTitle>Sensor Readings</VCardTitle></VCardItem>
            <VCardText>
              <VRow>
                <VCol 
                  v-for="reading in [
                    { label: 'Heart Rate', value: sensorReadings?.heart_rate, status: sensorReadings?.heart_rate_status }, 
                    { label: 'Blood Pressure', value: sensorReadings?.blood_pressure, status: sensorReadings?.blood_pressure_status }, 
                    { label: 'Temperature', value: sensorReadings?.temperature, status: sensorReadings?.temperature_status }, 
                    { label: 'Oxygen Saturation', value: sensorReadings?.oxygen_saturation, status: sensorReadings?.oxygen_saturation_status }, 
                    { label: 'Blood Glucose', value: sensorReadings?.blood_glucose, status: sensorReadings?.blood_glucose_status }
                  ]" 
                  :key="reading.label" 
                  cols="12" sm="6" md="4"
                >
                  <VCard variant="tonal" class="pa-4 h-100">
                    <div class="text-caption">{{ reading.label }}</div>
                    <div class="text-h6">{{ reading.value || 'Not recorded' }}</div>
                    <VChip v-if="reading.status" size="x-small" color="primary" class="mt-2">{{ reading.status }}</VChip>
                  </VCard>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VWindowItem>

        <!-- Schedule Tab -->
        <VWindowItem>
          <VCard>
            <VCardItem>
              <div class="d-flex align-center justify-space-between w-100">
                <VCardTitle>Recent Schedule</VCardTitle>
                <VBtn color="primary" prepend-icon="tabler-plus" @click="openSchedule()">
                  Add Schedule
                </VBtn>
              </div>
            </VCardItem>
            <VCardText>
              <VTable class="text-no-wrap">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Item</th>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Remarks</th>
                    <th class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="schedule in schedules || []" :key="schedule.id">
                    <td>{{ schedule.category }}</td>
                    <td>{{ schedule.item }}</td>
                    <td>{{ String(schedule.scheduled_time).slice(0, 5) }}</td>
                    <td>
                      <VChip size="small" color="primary" variant="tonal">
                        {{ schedule.schedule_type }}
                      </VChip>
                    </td>
                    <td>{{ schedule.remarks || '—' }}</td>
                    <td class="text-end">
                      <VBtn icon="tabler-edit" variant="text" size="small" color="primary" @click="openSchedule(schedule)" />
                      <VBtn icon="tabler-trash" variant="text" size="small" color="error" @click="deleteSchedule(schedule)" />
                    </td>
                  </tr>
                  <tr v-if="!schedules?.length">
                    <td colspan="6" class="text-center text-medium-emphasis py-6">
                      {{ scheduleLoadError?.message || 'No scheduled events or medication routines found.' }}
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </VCardText>
          </VCard>
        </VWindowItem>

        <!-- Alerts Tab -->
        <VWindowItem>
          <VCard>
            <VCardItem><VCardTitle>Recent Alerts</VCardTitle></VCardItem>
            <VCardText><VTable class="text-no-wrap"><thead><tr><th>Date</th><th>Severity</th><th>Description</th></tr></thead><tbody>
              <tr v-for="alert in alerts || []" :key="alert.id"><td>{{ new Date(alert.occurred_at).toLocaleString() }}</td><td><VChip size="small" variant="tonal" :color="['high', 'critical', 'error'].includes(String(alert.severity).toLowerCase()) ? 'error' : ['medium', 'warning'].includes(String(alert.severity).toLowerCase()) ? 'warning' : 'info'">{{ alert.severity }}</VChip></td><td>{{ alert.description }}</td></tr>
              <tr v-if="!alerts?.length"><td colspan="3" class="text-center text-medium-emphasis py-6">{{ alertsLoadError?.message || 'No recent alerts recorded.' }}</td></tr>
            </tbody></VTable></VCardText>
          </VCard>
        </VWindowItem>

        <!-- Family Visits Tab -->
        <VWindowItem>
          <VCard>
            <VCardItem><VCardTitle>Family Visit Records</VCardTitle></VCardItem>
            <VCardText><VTable class="text-no-wrap"><thead><tr><th>Date</th><th>Visitor</th><th>Relationship</th><th>Duration</th><th>Notes</th></tr></thead><tbody>
              <tr v-for="visit in familyVisits || []" :key="visit.id"><td>{{ new Date(visit.visited_at).toLocaleString() }}</td><td>{{ visit.visitor }}</td><td>{{ visit.relationship || 'Not recorded' }}</td><td>{{ visit.duration || 'Not recorded' }}</td><td>{{ visit.notes || '—' }}</td></tr>
              <tr v-if="!familyVisits?.length"><td colspan="5" class="text-center text-medium-emphasis py-6">{{ familyVisitsLoadError?.message || 'No family visits logged.' }}</td></tr>
            </tbody></VTable></VCardText>
          </VCard>
        </VWindowItem>
        <VWindowItem><ResidentForms v-if="activeTab===5&&resident" :key="resident.id" :resident="resident" @profile-updated="applyProfile" /></VWindowItem>
      </VWindow>
    </VCol>
  </VRow>

  <!-- Navigation Drawer: Schedule Create/Edit -->
  <VNavigationDrawer v-model="scheduleDrawer" location="end" temporary :width="460">
    <AppDrawerHeaderSection :title="editingScheduleId ? 'Edit Schedule' : 'Add Schedule'" @cancel="scheduleDrawer = false" />
    <VDivider />
    <VCard flat>
      <VCardText>
        <VForm @submit.prevent="saveSchedule">
          <AppSelect v-model="scheduleForm.category" :items="scheduleCategories" label="Category" class="mb-4" />
          <AppTextField v-model="scheduleForm.item" label="Item" placeholder="Description of the schedule item" class="mb-4" />
          <AppTextField v-model="scheduleForm.scheduledTime" type="time" label="Time" class="mb-4" />
          <AppSelect v-model="scheduleForm.scheduleType" :items="scheduleTypes" label="Type" class="mb-4" />
          <AppTextarea v-model="scheduleForm.remarks" label="Remarks" rows="3" class="mb-4" />
          <div class="d-flex justify-end gap-3">
            <VBtn variant="text" @click="scheduleDrawer = false">Cancel</VBtn>
            <VBtn type="submit" color="primary" :loading="scheduleSaving">Save Schedule</VBtn>
          </div>
        </VForm>
      </VCardText>
    </VCard>
  </VNavigationDrawer>

  <ElderlyFormDialog v-if="resident" v-model="editOpen" :elderly="{id:resident.id}" @saved="applyProfile" />
</template>

<style scoped>
.detail-line {
  margin-block: 10px;
}

.text-caption {
  color: rgba(var(--v-theme-on-surface), .65);
  margin-bottom: 4px;
}
</style>
