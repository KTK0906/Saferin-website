<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabaseClient'

const props = defineProps<{ modelValue: boolean; elderlyId: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const activeTab = ref('overview')
const loading = ref(false)
const resident = ref({ name: 'Elderly', zone: '-', bed: '-', age: '-', care_level: '-', avatar_url: '' })
const dialog = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', value) })
const detailError = ref('')
const personal = ref<Record<string, unknown>>({})
const contacts = ref<Record<string, unknown>>({})
const medical = ref<Record<string, unknown>>({})
const medicalCheck = ref<Record<string, unknown>>({})
const currentVitals = ref<Record<string, unknown>>({})
const currentSensors = ref<Record<string, unknown>>({})
const healthRisk = ref<Record<string, unknown>>({})
const otPtStatus = ref<Record<string, unknown>>({})
const latestNote = ref<Record<string, unknown>>({})
const heartRateHistory = ref<Array<{ heart_rate?: string | null; recorded_at: string | null }>>([])
const schedules = ref<Array<Record<string, unknown>>>([])
const alerts = ref<Array<Record<string, unknown>>>([])
const familyVisits = ref<Array<Record<string, unknown>>>([])
const tabLoading = ref(false)
const scheduleDialogOpen = ref(false)
const scheduleSaving = ref(false)
const scheduleError = ref('')
const editingScheduleId = ref<string | null>(null)
const scheduleForm = ref({ category: 'Medication', item: '', scheduledTime: '', scheduleType: 'Routine', remarks: '' })
const scheduleCategories = ['Medication', 'Meal', 'Exercise', 'Activity']
const scheduleTypes = ['Routine', 'Once Only', 'Focus', 'Recently Added']

const recorded = (value: unknown) => value === null || value === undefined || value === '' ? 'Not recorded' : String(value)
const valueOf = (record: Record<string, unknown>, ...keys: string[]) => recorded(keys.map(key => record[key]).find(value => value !== null && value !== undefined && value !== ''))
const listOf = (value: unknown) => Array.isArray(value) ? value : typeof value === 'string' && value ? value.split(',').map(item => item.trim()).filter(Boolean) : []
const careStatus = computed(() => valueOf(personal.value, 'status', 'care_level') === 'Not recorded' ? valueOf(resident.value as unknown as Record<string, unknown>, 'care_level') : valueOf(personal.value, 'status', 'care_level'))
const statusColor = (status: unknown) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'normal' || normalized === 'routine') return 'success'
    if (normalized === 'recently added' || normalized === 'warning' || normalized === 'attention' || normalized === 'alert') return 'warning'
    if (normalized === 'critical') return 'error'
    return 'secondary'
}
const healthRows = computed(() => [
    { icon: 'tabler-heart', label: 'Heart Rate:', value: valueOf(currentVitals.value, 'heart_rate'), status: valueOf(currentVitals.value, 'heart_rate_status') },
    { icon: 'tabler-activity', label: 'Blood Pressure:', value: valueOf(currentVitals.value, 'blood_pressure'), status: valueOf(currentVitals.value, 'blood_pressure_status') },
    { icon: 'tabler-thermometer', label: 'Temperature:', value: valueOf(currentVitals.value, 'temperature'), status: valueOf(currentVitals.value, 'temperature_status') },
    { icon: 'tabler-droplet', label: 'Oxygen Saturation:', value: valueOf(currentVitals.value, 'oxygen_saturation'), status: valueOf(currentVitals.value, 'oxygen_saturation_status') },
    { icon: 'tabler-health-recognition', label: 'Blood Glucose:', value: valueOf(currentVitals.value, 'blood_glucose'), status: valueOf(currentVitals.value, 'blood_glucose_status') },
])
const sensorRows = computed(() => [
    { icon: 'tabler-heart', label: 'Heart Rate:', value: valueOf(currentSensors.value, 'heart_rate'), status: valueOf(currentSensors.value, 'heart_rate_status') },
    { icon: 'tabler-activity', label: 'Blood Pressure:', value: valueOf(currentSensors.value, 'blood_pressure'), status: valueOf(currentSensors.value, 'blood_pressure_status') },
    { icon: 'tabler-thermometer', label: 'Temperature:', value: valueOf(currentSensors.value, 'temperature'), status: valueOf(currentSensors.value, 'temperature_status') },
    { icon: 'tabler-droplet', label: 'Oxygen Saturation:', value: valueOf(currentSensors.value, 'oxygen_saturation'), status: valueOf(currentSensors.value, 'oxygen_saturation_status') },
    { icon: 'tabler-health-recognition', label: 'Blood Glucose:', value: valueOf(currentSensors.value, 'blood_glucose'), status: valueOf(currentSensors.value, 'blood_glucose_status') },
])
const trendPoints = computed(() => {
    const values = heartRateHistory.value
        .map(item => Number.parseFloat(String(item.heart_rate || '').replace(/[^\d.]/g, '')))
        .filter(Number.isFinite)
    if (values.length < 2) return ''
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    return values.map((value, index) => {
        const x = 20 + index * (720 / (values.length - 1))
        const y = 172 - ((value - min) / range) * 135
        return `${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
})
const formatDateTime = (value: unknown) => {
    if (!value) return 'Not recorded'
    const date = new Date(String(value))
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
const formatTime = (value: unknown) => value ? String(value).slice(0, 5) : 'Not recorded'
const categoryIcon = (category: unknown) => ({ medication: 'tabler-pill', meal: 'tabler-tools-kitchen-2', exercise: 'tabler-activity', activity: 'tabler-users-group' }[String(category).toLowerCase()] || 'tabler-calendar-event')

const openScheduleDialog = (schedule?: Record<string, unknown>) => {
    scheduleError.value = ''
    editingScheduleId.value = schedule ? String(schedule.id) : null
    scheduleForm.value = {
        category: String(schedule?.category || 'Medication'),
        item: String(schedule?.item || ''),
        scheduledTime: String(schedule?.scheduled_time || '').slice(0, 5),
        scheduleType: String(schedule?.schedule_type || 'Routine'),
        remarks: String(schedule?.remarks || ''),
    }
    scheduleDialogOpen.value = true
}

const saveSchedule = async () => {
    if (!props.elderlyId || !scheduleForm.value.item.trim() || !scheduleForm.value.scheduledTime) {
        scheduleError.value = 'Enter the schedule item and time.'
        return
    }
    scheduleSaving.value = true
    scheduleError.value = ''
    try {
        const payload = {
            elderly_id: props.elderlyId,
            category: scheduleForm.value.category,
            item: scheduleForm.value.item.trim(),
            scheduled_time: scheduleForm.value.scheduledTime,
            schedule_type: scheduleForm.value.scheduleType,
            remarks: scheduleForm.value.remarks.trim() || null,
        }
        const result = editingScheduleId.value
            ? await supabase.from('elderly_schedules').update(payload).eq('id', editingScheduleId.value)
            : await supabase.from('elderly_schedules').insert(payload)
        if (result.error) throw result.error
        scheduleDialogOpen.value = false
        await loadTabData('schedule')
    } catch (error) {
        scheduleError.value = error instanceof Error ? error.message : 'Unable to save schedule.'
    } finally { scheduleSaving.value = false }
}

const deleteSchedule = async (schedule: Record<string, unknown>) => {
    if (!window.confirm(`Delete "${valueOf(schedule, 'item')}"?`)) return
    tabLoading.value = true
    detailError.value = ''
    try {
        const { error } = await supabase.from('elderly_schedules').delete().eq('id', String(schedule.id))
        if (error) throw error
        await loadTabData('schedule')
    } catch (error) {
        detailError.value = error instanceof Error ? error.message : 'Unable to delete schedule.'
        tabLoading.value = false
    }
}

const loadTabData = async (tab: string) => {
    if (!props.elderlyId || !['schedule', 'alerts', 'visits'].includes(tab)) return
    tabLoading.value = true
    detailError.value = ''
    try {
        if (tab === 'schedule') {
            const { data, error } = await supabase.from('elderly_schedules').select('*').eq('elderly_id', props.elderlyId).order('scheduled_time', { ascending: true })
            if (error) throw error
            schedules.value = data ?? []
        } else if (tab === 'alerts') {
            const { data, error } = await supabase.from('elderly_alerts').select('*').eq('elderly_id', props.elderlyId).order('occurred_at', { ascending: false }).limit(5)
            if (error) throw error
            alerts.value = data ?? []
        } else {
            const { data, error } = await supabase.from('family_visit_records').select('*').eq('elderly_id', props.elderlyId).order('visited_at', { ascending: false }).limit(5)
            if (error) throw error
            familyVisits.value = data ?? []
        }
    } catch (error) {
        detailError.value = error instanceof Error ? error.message : 'Unable to load tab data.'
    } finally {
        tabLoading.value = false
    }
}

const fetchResident = async () => {
    if (!props.elderlyId) return
    loading.value = true
    try {
        detailError.value = ''
        const [
            residentResult,
            personalResult,
            contactsResult,
            medicalResult,
            checkResult,
            vitalsResult,
            sensorsResult,
            historyResult,
            healthRiskResult,
            otPtResult,
            notesResult
        ] = await Promise.all([
            supabase.from('elderly').select('name, zone, bed, age, care_level, avatar_url').eq('id', props.elderlyId).maybeSingle(),
            supabase.from('personal_information').select('*').eq('elderly_id', props.elderlyId).maybeSingle(),
            // The updated schema links a contact to its resident through `elderly_id`.
            // Querying the retired `elderly` field returned a database error and left the panel empty.
            supabase.from('emergency_contacts').select('*').eq('elderly_id', props.elderlyId).maybeSingle(),
            supabase.from('medical_information').select('conditions, allergies, medications').eq('elderly_id', props.elderlyId).maybeSingle(),
            supabase.from('medical_checks').select('check_date, next_visit').eq('elderly_id', props.elderlyId).order('check_date', { ascending: false }).limit(1).maybeSingle(),
            supabase.from('health_vitals').select('*').eq('elderly_id', props.elderlyId).order('recorded_at', { ascending: false }).limit(1).maybeSingle(),
            supabase.from('sensor_readings').select('*').eq('elderly_id', props.elderlyId).order('recorded_at', { ascending: false }).limit(1).maybeSingle(),
            supabase.from('health_vitals').select('heart_rate, recorded_at').eq('elderly_id', props.elderlyId).order('recorded_at', { ascending: true }),
            supabase.from('health_risk').select('*').eq('elderly_id', props.elderlyId).maybeSingle(),
            supabase.from('ot_pt_status').select('*').eq('elderly_id', props.elderlyId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
            supabase.from('notes_remarks').select('*').eq('elderly_id', props.elderlyId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        ])

        if (residentResult.data) {
            resident.value = residentResult.data
        }
        if (contactsResult.error) throw contactsResult.error
        if (medicalResult.error) throw medicalResult.error
        if (checkResult.error) throw checkResult.error
        if (vitalsResult.error) throw vitalsResult.error
        if (sensorsResult.error) throw sensorsResult.error
        if (historyResult.error) throw historyResult.error
        if (notesResult.error) throw notesResult.error

        personal.value = personalResult.data ?? {}
        contacts.value = contactsResult.data ?? {}
        medical.value = medicalResult.data ?? {}
        medicalCheck.value = checkResult.data ?? {}
        currentVitals.value = vitalsResult.data ?? {}
        currentSensors.value = sensorsResult.data ?? {}
        heartRateHistory.value = historyResult.data ?? []
        healthRisk.value = healthRiskResult.data ?? {}
        otPtStatus.value = otPtResult.data ?? {}
        latestNote.value = notesResult.data ?? {}

    } catch (error) {
        console.error('Unable to load elderly detail:', error)
        detailError.value = error instanceof Error ? error.message : 'Unable to load resident details.'
    } finally {
        loading.value = false
    }
}

watch(() => props.modelValue, value => { if (value) { activeTab.value = 'overview'; fetchResident() } }, { immediate: true })
watch(activeTab, tab => void loadTabData(tab))
</script>

<template>
    <VDialog v-model="dialog" max-width="900" scrollable>
        <VCard class="elderly-detail-dialog">
            <VCardTitle class="detail-header">
                <span>Zone {{ resident.zone }} - Bed {{ resident.bed }} - {{ resident.name }} Details</span>
                <IconBtn aria-label="Close patient details" @click="dialog = false">
                    <VIcon icon="tabler-x" />
                </IconBtn>
            </VCardTitle>

            <VTabs v-model="activeTab" class="detail-tabs" density="compact">
                <VTab value="overview" @click="activeTab = 'overview'">Overview</VTab>
                <VTab value="vitals" @click="activeTab = 'vitals'">Health Vitals</VTab>
                <VTab value="schedule" @click="activeTab = 'schedule'">Schedule</VTab>
                <VTab value="alerts" @click="activeTab = 'alerts'">Alerts</VTab>
                <VTab value="visits" @click="activeTab = 'visits'">Family Visits</VTab>
            </VTabs>

            <VCardText class="detail-body">
                <VProgressLinear v-if="loading" indeterminate color="primary" class="mb-4" />
                <VAlert v-if="detailError" type="error" variant="tonal" class="mb-4">{{ detailError }}</VAlert>
                <VWindow v-model="activeTab">
                    <VWindowItem value="overview">
                        <VRow dense>
                            <VCol cols="12" md="6">
                                <VCard class="overview-panel" variant="flat">
                                    <h3>Personal Information</h3>
                                    <div class="personal-grid">
                                        <VAvatar size="48" color="secondary">
                                            <VImg v-if="valueOf(resident, 'avatar_url') !== 'Not recorded'"
                                                :src="valueOf(resident, 'avatar_url')" />
                                            <VIcon v-else icon="tabler-user" />
                                        </VAvatar>
                                        <div>
                                            <p><strong>Age:</strong> {{ valueOf(resident, 'age') !== 'Not recorded' ?
                                                `${valueOf(resident, 'age')} years` : 'Not recorded' }}</p>
                                            <p><strong>Room:</strong> Zone {{ resident.zone }} - Bed {{ resident.bed }}
                                            </p>
                                            <p><strong>Status:</strong>
                                                <VChip size="x-small" color="success">{{ careStatus }}</VChip>
                                            </p>
                                            <p><strong>Health Risk:</strong>
                                                <VChip size="x-small"
                                                    :color="statusColor(valueOf(healthRisk, 'status'))">{{
                                                    valueOf(healthRisk, 'status') }}</VChip>
                                            </p>
                                            <p><strong>Caregiver:</strong> {{ valueOf(personal, 'caregiver',
                                                'caregiver_name') }}</p>
                                        </div>
                                    </div>
                                </VCard>
                            </VCol>
                            <VCol cols="12" md="6">
                                <VCard class="overview-panel" variant="flat">
                                    <h3>Emergency Contacts</h3>
                                    <p><strong>Primary:</strong> {{ valueOf(contacts, 'primary_contact') }}</p>
                                    <p><strong>Secondary:</strong> {{ valueOf(contacts, 'secondary_contact') }}</p>
                                    <p><strong>Doctor Contact:</strong> {{ valueOf(contacts, 'doctor_contact') }}</p>
                                </VCard>
                            </VCol>
                            <VCol cols="12" md="6">
                                <VCard class="overview-panel" variant="flat">
                                    <h3>Medical Information</h3>
                                    <p><strong>Conditions:</strong> <span v-if="listOf(medical.conditions).length"
                                            class="chip-list">
                                            <VChip v-for="condition in listOf(medical.conditions)" :key="condition"
                                                size="x-small">{{ condition }}</VChip>
                                        </span><span v-else>Not recorded</span></p>
                                    <p><strong>Allergies:</strong> <span v-if="listOf(medical.allergies).length"
                                            class="chip-list">
                                            <VChip v-for="allergy in listOf(medical.allergies)" :key="allergy"
                                                size="x-small" color="error">{{ allergy }}</VChip>
                                        </span><span v-else>Not recorded</span></p>
                                    <p><strong>Medications:</strong> {{ valueOf(medical, 'medications', 'medication') }}
                                    </p>
                                </VCard>
                            </VCol>
                            <VCol cols="12" md="6">
                                <VCard class="overview-panel" variant="flat">
                                    <h3>Medical Check & Remarks</h3>
                                    <p><strong>Check Date:</strong> {{ formatDateTime(valueOf(medicalCheck, 'check_date')) }}
                                    </p>
                                    <p><strong>Next Visit:</strong> {{ formatDateTime(valueOf(medicalCheck, 'next_visit')) }}</p>
                                    <p><strong>Latest Note:</strong> {{ valueOf(latestNote, 'details') }}</p>
                                </VCard>
                            </VCol>
                        </VRow>
                    </VWindowItem>
                    <VWindowItem value="vitals">
                        <VRow dense>
                            <VCol cols="12" md="6">
                                <VCard class="vitals-panel" variant="flat">
                                    <h3>Current Vitals</h3>
                                    <div v-for="row in healthRows" :key="row.label" class="vital-row">
                                        <VIcon :icon="row.icon" color="info" size="18" /><strong>{{ row.label
                                        }}</strong><span>{{ row.value }}</span>
                                        <VChip :color="statusColor(row.status)" size="x-small">{{ row.status }}</VChip>
                                    </div>
                                </VCard>
                            </VCol>
                            <VCol cols="12" md="6">
                                <VCard class="vitals-panel" variant="flat">
                                    <h3>Sensor Readings</h3>
                                    <div v-for="row in sensorRows" :key="row.label" class="vital-row">
                                        <VIcon :icon="row.icon" color="info" size="18" /><strong>{{ row.label
                                        }}</strong><span>{{ row.value }}</span>
                                        <VChip :color="statusColor(row.status)" size="x-small">{{ row.status }}</VChip>
                                    </div>
                                </VCard>
                            </VCol>
                            <VCol cols="12">
                                <VCard class="trend-panel" variant="flat">
                                    <h3>Vital Trends</h3>
                                    <div v-if="!trendPoints" class="detail-placeholder">At least two recorded heart-rate
                                        readings are required to show a trend.</div><svg v-else class="trend-graph"
                                        viewBox="0 0 760 210" preserveAspectRatio="none" role="img"
                                        aria-label="Heart-rate trend">
                                        <line x1="0" y1="185" x2="760" y2="185" class="trend-axis" />
                                        <polyline :points="trendPoints" class="trend-line" />
                                    </svg>
                                </VCard>
                            </VCol>
                        </VRow>
                    </VWindowItem>
                    <VWindowItem value="schedule">
                        <VCard class="tab-panel" variant="flat">
                            <div class="schedule-heading"><h3>Recent Schedule</h3><VBtn color="primary" size="small" prepend-icon="tabler-plus" @click="openScheduleDialog()">Add Schedule</VBtn></div>
                            <VProgressLinear v-if="tabLoading" indeterminate color="primary" />
                            <div v-else-if="!schedules.length" class="detail-placeholder">No schedule records found.
                            </div>
                            <div v-else v-for="schedule in schedules" :key="String(schedule.id)" class="schedule-row">
                                <VIcon :icon="categoryIcon(schedule.category)" color="primary" />
                                <div><strong>{{ valueOf(schedule, 'item') }}</strong><small>{{
                                    formatTime(schedule.scheduled_time) }}</small></div>
                                <VChip :color="statusColor(schedule.schedule_type)" size="x-small">{{ valueOf(schedule,
                                    'schedule_type') }}</VChip>
                                <div class="schedule-actions"><VBtn icon="tabler-edit" variant="text" size="x-small" color="warning" aria-label="Edit schedule" @click="openScheduleDialog(schedule)" /><VBtn icon="tabler-trash" variant="text" size="x-small" color="error" aria-label="Delete schedule" @click="deleteSchedule(schedule)" /></div>
                            </div>
                        </VCard>
                    </VWindowItem>
                    <VWindowItem value="alerts">
                        <VCard class="tab-panel" variant="flat">
                            <h3>Recent Alerts</h3>
                            <VProgressLinear v-if="tabLoading" indeterminate color="primary" />
                            <VTable v-else-if="alerts.length" density="compact">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Severity</th>
                                        <th>Description</th>
                                        <th>Person in charge</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="alert in alerts" :key="String(alert.id)">
                                        <td>{{ formatDateTime(alert.occurred_at) }}</td>
                                        <td>
                                            <VChip :color="statusColor(alert.severity)" size="x-small">{{ valueOf(alert,
                                                'severity') }}</VChip>
                                        </td>
                                        <td>{{ valueOf(alert, 'description') }}</td>
                                        <td>{{ valueOf(alert, 'person_in_charge') }}</td>
                                    </tr>
                                </tbody>
                            </VTable>
                            <div v-else class="detail-placeholder">No alert records found.</div>
                        </VCard>
                    </VWindowItem>
                    <VWindowItem value="visits">
                        <VCard class="tab-panel" variant="flat">
                            <h3>Family Visit Records</h3>
                            <VProgressLinear v-if="tabLoading" indeterminate color="primary" />
                            <VTable v-else-if="familyVisits.length" density="compact">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Visitor</th>
                                        <th>Relationship</th>
                                        <th>Duration</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="visit in familyVisits" :key="String(visit.id)">
                                        <td>{{ formatDateTime(visit.visited_at) }}</td>
                                        <td>{{ valueOf(visit, 'visitor') }}</td>
                                        <td>{{ valueOf(visit, 'relationship') }}</td>
                                        <td>{{ valueOf(visit, 'duration') }}</td>
                                        <td>{{ valueOf(visit, 'notes') }}</td>
                                    </tr>
                                </tbody>
                            </VTable>
                            <div v-else class="detail-placeholder">No family visit records found.</div>
                        </VCard>
                    </VWindowItem>
                </VWindow>
            </VCardText>
        </VCard>
    </VDialog>

    <VDialog v-model="scheduleDialogOpen" max-width="420">
        <VCard class="schedule-editor">
            <VCardTitle class="d-flex align-center justify-space-between">{{ editingScheduleId ? 'Edit Schedule' : 'Add Schedule' }}<VBtn icon="tabler-x" variant="text" size="small" @click="scheduleDialogOpen = false" /></VCardTitle>
            <VCardText>
                <VAlert v-if="scheduleError" type="error" variant="tonal" density="compact" class="mb-3">{{ scheduleError }}</VAlert>
                <VSelect v-model="scheduleForm.category" :items="scheduleCategories" label="Category" variant="outlined" class="mb-3" />
                <VTextField v-model="scheduleForm.item" label="Item" placeholder="Description of the schedule item" variant="outlined" class="mb-3" />
                <VTextField v-model="scheduleForm.scheduledTime" type="time" label="Time" variant="outlined" class="mb-3" />
                <VSelect v-model="scheduleForm.scheduleType" :items="scheduleTypes" label="Type" variant="outlined" class="mb-3" />
                <VTextarea v-model="scheduleForm.remarks" label="Remarks" variant="outlined" rows="2" />
            </VCardText>
            <VCardActions class="justify-end"><VBtn variant="text" @click="scheduleDialogOpen = false">Cancel</VBtn><VBtn color="primary" :loading="scheduleSaving" @click="saveSchedule">Save Changes</VBtn></VCardActions>
        </VCard>
    </VDialog>
</template>

<style scoped>
.elderly-detail-dialog {
    background: #1e1e23;
    color: rgb(255 255 255 / 92%);
    border-radius: .75rem;
}

.detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1rem .75rem 1.25rem;
    font-size: 1rem;
    font-weight: 700;
}

.detail-tabs {
    padding-inline: 1rem;
}

.detail-tabs :deep(.v-tab) {
    min-inline-size: auto;
    padding-inline: .8rem;
    border-radius: .45rem .45rem 0 0;
    color: rgb(255 255 255 / 65%);
    font-size: .75rem;
    text-transform: none;
}

.detail-tabs :deep(.v-tab--selected) {
    background: #4b4b55;
    color: #fff;
}

.detail-body {
    padding: .6rem 1rem 1rem;
}

.overview-panel {
    min-block-size: 145px;
    padding: .75rem;
    border: 1px solid #252530;
    border-radius: .75rem;
    background: #202025;
}

.overview-panel h3 {
    margin: 0 0 .55rem;
    font-size: .9rem;
}

.overview-panel p {
    display: flex;
    align-items: flex-start;
    gap: .5rem;
    margin: .35rem 0;
    font-size: .75rem;
}

.overview-panel p>strong {
    flex: 0 0 92px;
    color: rgb(255 255 255 / 70%);
}

.personal-grid {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr);
    gap: .75rem;
}

.chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: .25rem;
}

.vitals-panel,
.trend-panel {
    padding: .75rem;
    border: 1px solid #252530;
    border-radius: .75rem;
    background: #202025;
}

.vitals-panel {
    min-block-size: 145px;
}

.trend-panel {
    min-block-size: 238px;
}

.vitals-panel h3,
.trend-panel h3 {
    margin: 0 0 .55rem;
    font-size: .9rem;
}

.vital-row {
    display: grid;
    grid-template-columns: 20px minmax(108px, 1fr) minmax(62px, auto) auto;
    align-items: center;
    gap: .35rem;
    min-block-size: 25px;
    font-size: .75rem;
}

.vital-row strong {
    color: rgb(255 255 255 / 82%);
}

.trend-graph {
    display: block;
    inline-size: 100%;
    block-size: 185px;
}

.trend-axis {
    stroke: rgb(255 255 255 / 18%);
    stroke-width: 1;
}

.trend-line {
    fill: none;
    stroke: #1689df;
    stroke-width: 2;
}

.tab-panel {
    min-block-size: 190px;
    padding: .75rem;
    border: 1px solid #252530;
    border-radius: .75rem;
    background: #202025;
}

.tab-panel h3 {
    margin: 0 0 .75rem;
    font-size: .9rem;
}

.tab-panel :deep(.v-table) {
    background: transparent;
}

.tab-panel :deep(th) {
    color: rgb(255 255 255 / 60%);
    font-size: .7rem;
    white-space: nowrap;
}

.tab-panel :deep(td) {
    font-size: .72rem;
}

.tab-panel :deep(th),
.tab-panel :deep(td) {
    padding: .45rem .35rem !important;
}

.schedule-row {
    display: grid;
    grid-template-columns: 30px minmax(0, 1fr) auto auto;
    align-items: center;
    gap: .5rem;
    padding: .65rem 0;
    border-bottom: 1px solid rgb(255 255 255 / 18%);
    font-size: .78rem;
}

.schedule-row:last-child {
    border-bottom: 0;
}

.schedule-row small {
    display: block;
    color: rgb(255 255 255 / 55%);
}

.schedule-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .75rem;
}

.schedule-heading h3 { margin-block-end: 0; }
.schedule-actions { display: flex; align-items: center; gap: 0; }
.schedule-editor { background: #202025; color: #fff; }

.detail-placeholder {
    padding: 3rem 1rem;
    color: rgb(255 255 255 / 60%);
    text-align: center;
}
</style>
