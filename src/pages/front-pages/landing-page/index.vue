<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'

// --- Interfaces matching schema ---
interface RawAlert {
  id: string
  priority: string
  reason: string
  time: string
  type: string
  elderly?: { name: string; zone: string } | Array<{ name: string; zone: string }> | null
  app_users?: { name: string } | Array<{ name: string }> | null
}

interface AlertDisplay {
  id: string
  priority: string
  reason: string
  zone: string
  elderly: string
  time: string
  status: string
}

// --- State Variables ---
const lastUpdated = ref('Not loaded yet')
const loadError = ref('')

// Modal state for adding task
const isAddTaskOpen = ref(false)
const newTask = ref({
  time: '',
  zone: '',
  elderly: '',
  action: '',
  staff: ''
})

// 1. Current Alerts Data
const alerts = ref<AlertDisplay[]>([])

// 2. Sensors Status Data
const sensorStatus = ref<Array<{
  id: string
  category: string
  total: number
  normal: number
  issue: number
  status: string
}>>([])

// 3. Staff Tasks Data
const staffTasks = ref<Array<{
  id: string
  time: string
  zone: string
  elderly: string
  action: string
  staff: string
}>>([])

// 4. Staff Assignment Summary Data
const summary = ref({
  total_alerts_requests: 0,
  unassigned: 0,
  assigned: 0,
  available: 0,
})

// 5. Staff Directory Data
const availableStaff = ref<Array<{
  id: string
  zone: string
  name: string
  role: string
  status: string
  load: number
}>>([])

// Helper to format ISO timestamp into HH:MM AM/PM
const formatTime = (isoString: string) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Compute summary metrics dynamically from loaded state arrays
const updateSummaryMetrics = () => {
  const totalAlerts = alerts.value.length
  const assignedAlerts = alerts.value.filter(a => a.status.includes('Assigned')).length
  const unassignedAlerts = alerts.value.filter(a => a.status.includes('Unassigned')).length
  const availableStaffCount = availableStaff.value.filter(s => s.status === 'Available').length

  summary.value = {
    total_alerts_requests: totalAlerts,
    unassigned: unassignedAlerts,
    assigned: assignedAlerts,
    available: availableStaffCount,
  }
}

// Fetch Data safely from Supabase
const fetchData = async () => {
  loadError.value = ''

  const [alertsRes, sensorRes, staffRes, tasksRes] = await Promise.allSettled([
    supabase
      .from('current_alerts')
      .select(`
        id,
        priority,
        reason,
        time,
        type,
        elderly:elderly_id ( name, zone ),
        app_users:assigned_staff_id ( name )
      `)
      .order('time', { ascending: false }),

    supabase.from('sensor_status').select('*').order('updated_at', { ascending: true }),

    // Query the main 'staff' table directly
    supabase.from('staff').select('*').order('name', { ascending: true }),

    supabase.from('staff_tasks').select('id, time, zone, elderly, action, staff').order('id', { ascending: true }),
  ])

  // Handle current_alerts
  if (alertsRes.status === 'fulfilled' && !alertsRes.value.error) {
    alerts.value = ((alertsRes.value.data as unknown as RawAlert[]) || []).map(item => {
      const elderlyObj = Array.isArray(item.elderly) ? item.elderly[0] : item.elderly
      const staffObj = Array.isArray(item.app_users) ? item.app_users[0] : item.app_users

      return {
        id: item.id,
        priority: item.priority || 'Normal',
        reason: item.reason || 'N/A',
        zone: elderlyObj?.zone || 'N/A',
        elderly: elderlyObj?.name || 'Unknown',
        time: formatTime(item.time),
        status: staffObj?.name ? `Assigned: ${staffObj.name}` : 'Unassigned',
      }
    })
  } else if (alertsRes.status === 'fulfilled' && alertsRes.value.error) {
    console.error('current_alerts error:', alertsRes.value.error)
  }

  // Handle sensor_status
  if (sensorRes.status === 'fulfilled' && !sensorRes.value.error) {
    sensorStatus.value = sensorRes.value.data ?? []
  }

  // Handle staff table data with custom sort: 'Available' first, then others
  if (staffRes.status === 'fulfilled' && !staffRes.value.error) {
    const rawStaff = (staffRes.value.data ?? []).map((st: any) => ({
      id: st.id,
      zone: st.zone || 'N/A',
      name: st.name || 'Unknown',
      role: st.role || 'Staff',
      status: st.status || 'Available',
      load: st.load ?? 0,
    }))

    rawStaff.sort((a, b) => {
      if (a.status === 'Available' && b.status !== 'Available') return -1
      if (a.status !== 'Available' && b.status === 'Available') return 1
      return a.name.localeCompare(b.name)
    })

    availableStaff.value = rawStaff
  } else if (staffRes.status === 'fulfilled' && staffRes.value.error) {
    console.error('staff fetch error:', staffRes.value.error)
    loadError.value = 'Failed to load staff data.'
  }

  // Handle staff_tasks
  if (tasksRes.status === 'fulfilled' && !tasksRes.value.error) {
    staffTasks.value = tasksRes.value.data ?? []
  }

  // Update summary metrics dynamically
  updateSummaryMetrics()

  // Format explicitly to Hong Kong Time (Asia/Hong_Kong)
  lastUpdated.value = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Hong_Kong' }).replace('T', ' ')
}

// Handle adding a task to Supabase with detailed error surfacing
const handleAddTask = async () => {
  loadError.value = ''

  const { error } = await supabase
    .from('staff_tasks')
    .insert([
      {
        time: newTask.value.time,
        zone: newTask.value.zone,
        elderly: newTask.value.elderly,
        action: newTask.value.action,
        staff: newTask.value.staff,
      }
    ])

  if (error) {
    console.error('Error inserting task:', error)
    loadError.value = `Failed to assign new task: ${error.message}`
  } else {
    newTask.value = { time: '', zone: '', elderly: '', action: '', staff: '' }
    isAddTaskOpen.value = false
    await fetchData()
  }
}

onMounted(() => {
  fetchData()
})

// --- Helper Functions for Dynamic Styling ---
const getPriorityRowStyle = (priority: string) => {
  switch ((priority || '').toLowerCase()) {
    case 'emergency': return 'bg-pink-darken-4'
    case 'warning': return 'bg-amber-darken-3'
    case 'normal': return 'bg-emerald-darken-4'
    default: return ''
  }
}

const getPriorityChipColor = (priority: string) => {
  switch ((priority || '').toLowerCase()) {
    case 'emergency': return 'error'
    case 'warning': return 'warning'
    case 'normal': return 'success'
    default: return 'default'
  }
}

const getStatusChipColor = (status: string) => {
  if (status.includes('Unassigned')) return 'grey-darken-3'
  if (status.includes('Assigned') || status.includes('Completed')) return 'teal-accent-4'
  if (status.includes('Ask for Help')) return 'amber-darken-2'
  return 'primary'
}
</script>

<template>
  <div class="dashboard-wrapper">

    <!-- Header Controls -->
    <div class="dashboard-header mb-6">
      <div class="dashboard-header__content">
        <h1 class="text-h4 font-weight-bold text-white mb-0">Overview</h1>
      </div>
    </div>

    <VAlert v-if="loadError" type="error" variant="tonal" class="mb-4">
      {{ loadError }}
    </VAlert>

    <!-- Main Dashboard Grid -->
    <VRow class="match-height">

      <!-- LEFT SECTION -->
      <VCol cols="12" lg="8">
        <VRow>

          <!-- Section 1: Current Alerts Table -->
          <VCol cols="12">
            <VCard class="dashboard-card pa-4">
              <VCardItem class="d-flex justify-space-between align-center px-0 pt-0 pb-3">
                <VCardTitle class="text-h6 font-weight-bold text-white">Current Alerts</VCardTitle>
                <template #append>
                  <VBtnGroup density="comfortable" variant="outlined" class="alerts-view-btns">
                    <VBtn icon="tabler-list" size="large" active />
                    <VBtn icon="tabler-layout-grid" size="large" />
                  </VBtnGroup>
                </template>
              </VCardItem>

              <VTable class="dashboard-table current-alerts-table">
                <thead>
                  <tr class="text-slate-400">
                    <th class="text-left">Priority</th>
                    <th class="text-left">Reason</th>
                    <th class="text-left">Zone</th>
                    <th class="text-left">Elderly</th>
                    <th class="text-left">Time</th>
                    <th class="text-left">Status</th>
                    <th class="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in alerts" :key="item.id" :class="getPriorityRowStyle(item.priority)">
                    <td>
                      <VChip :color="getPriorityChipColor(item.priority)" size="small" variant="flat">
                        <VIcon start icon="tabler-alert-circle" size="14"
                          v-if="item.priority.toLowerCase() === 'emergency'" />
                        <VIcon start icon="tabler-alert-triangle" size="14"
                          v-if="item.priority.toLowerCase() === 'warning'" />
                        <VIcon start icon="tabler-circle-check" size="14"
                          v-if="item.priority.toLowerCase() === 'normal'" />
                        {{ item.priority }}
                      </VChip>
                    </td>
                    <td class="font-weight-bold">{{ item.reason }}</td>
                    <td>{{ item.zone }}</td>
                    <td>
                      <div class="d-flex align-center gap-1">
                        <span class="font-weight-bold text-red-lighten-2">{{ item.elderly }}</span>
                        <VIcon icon="tabler-info-circle" size="14" class="text-slate-400" />
                      </div>
                    </td>
                    <td>{{ item.time }}</td>
                    <td>
                      <VChip :color="getStatusChipColor(item.status)" size="small" variant="flat">
                        {{ item.status }}
                        <VIcon end icon="tabler-info-circle" size="14" v-if="!item.status.includes('Unassigned')" />
                      </VChip>
                    </td>
                    <td class="text-center">
                      <VBtn icon="tabler-user-plus" variant="text" color="blue-lighten-3" size="small" />
                      <VBtn icon="tabler-circle-check" variant="text" color="green-lighten-2" size="small" />
                    </td>
                  </tr>
                  <tr v-if="alerts.length === 0">
                    <td colspan="7" class="text-center text-slate-400 py-4">No active alerts available</td>
                  </tr>
                </tbody>
              </VTable>
            </VCard>
          </VCol>

          <!-- Section 2: Sensors Status -->
          <VCol cols="12" lg="6">
            <VCard class="dashboard-card pa-3 h-100">
              <VCardItem class="d-flex justify-space-between align-center">
                <VCardTitle class="text-h6 font-weight-bold text-white">Sensors Status</VCardTitle>
                <template #append>
                  <VBtn variant="text" color="primary" size="small">••• More</VBtn>
                </template>
              </VCardItem>

              <div class="overflow-x-auto w-100">
                <VTable class="dashboard-table sensor-status-table text-no-wrap">
                  <thead>
                    <tr class="text-slate-400">
                      <th class="px-4 text-left">SENSOR</th>
                      <th class="px-3 text-center">TOTAL</th>
                      <th class="px-3 text-center">NORMAL</th>
                      <th class="px-3 text-center">ISSUE</th>
                      <th class="px-4 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="sensor in sensorStatus" :key="sensor.id"
                      :class="sensor.status === 'Issue' ? 'bg-amber-darken-3' : ''">
                      <td class="px-4">
                        <div class="d-flex align-center gap-1">
                          <span class="font-weight-bold">{{ sensor.category }}</span>
                          <VIcon icon="tabler-info-circle" size="14" class="text-slate-400" />
                        </div>
                      </td>
                      <td class="px-3 text-center">{{ sensor.total }}</td>
                      <td class="px-3 text-center">{{ sensor.normal }}</td>
                      <td class="px-3 text-center">{{ sensor.issue }}</td>
                      <td class="px-4 text-right">
                        <VChip :color="sensor.status === 'Good' ? 'success' : 'warning'" size="small" variant="flat"
                          class="px-2">
                          {{ sensor.status }}
                          <VIcon end icon="tabler-info-circle" size="14" v-if="sensor.status === 'Issue'" />
                        </VChip>
                      </td>
                    </tr>
                    <tr v-if="sensorStatus.length === 0">
                      <td colspan="5" class="text-center text-slate-400 py-4">No sensor status available</td>
                    </tr>
                  </tbody>
                </VTable>
              </div>
            </VCard>
          </VCol>

          <!-- Section 3: Staff Tasks -->
          <VCol cols="12" md="6">
            <VCard class="dashboard-card pa-3 h-100">
              <VCardItem class="d-flex justify-space-between align-center">
                <VCardTitle class="text-h6 font-weight-bold text-white">Staff Tasks</VCardTitle>
                <template #append>
                  <div class="d-flex align-center gap-2">
                    <VBtn size="small" color="primary" prepend-icon="tabler-plus" class="rounded-lg"
                      @click="isAddTaskOpen = true">
                      Add Task
                    </VBtn>
                    <VBtn variant="text" color="primary" size="small">••• More</VBtn>
                  </div>
                </template>
              </VCardItem>

              <VTable class="dashboard-table staff-tasks-table">
                <thead>
                  <tr class="text-slate-400">
                    <th>Time</th>
                    <th>Zone</th>
                    <th>Elderly</th>
                    <th>Action</th>
                    <th>Staff</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="task in staffTasks" :key="task.id">
                    <td>{{ task.time }}</td>
                    <td>{{ task.zone }}</td>
                    <td>{{ task.elderly }}</td>
                    <td>{{ task.action }}</td>
                    <td>{{ task.staff }}</td>
                  </tr>
                  <tr v-if="staffTasks.length === 0">
                    <td colspan="5" class="text-center text-slate-400 py-4">No tasks assigned</td>
                  </tr>
                </tbody>
              </VTable>
            </VCard>
          </VCol>

        </VRow>
      </VCol>

      <!-- RIGHT SECTION -->
      <VCol cols="12" lg="4">
        <VRow>

          <!-- Section 4: Staff Assignment Summary -->
          <VCol cols="12">
            <VCard class="dashboard-card dashboard-summary pa-5">
              <h2 class="text-h6 font-weight-bold text-white mb-4">Staff Assignment Summary</h2>
              <div class="dashboard-summary__metrics">
                <div>
                  <div class="text-caption text-slate-400">Total Alerts</div>
                  <div class="text-h4 font-weight-bold text-white">{{ summary.total_alerts_requests }}</div>
                </div>
                <div>
                  <div class="text-caption text-slate-400">Unassigned</div>
                  <div class="text-h4 font-weight-bold text-red-lighten-1">{{ summary.unassigned }}</div>
                </div>
                <div>
                  <div class="text-caption text-slate-400">Assigned</div>
                  <div class="text-h4 font-weight-bold text-blue-lighten-2">{{ summary.assigned }}</div>
                </div>
                <div>
                  <div class="text-caption text-slate-400">Available</div>
                  <div class="text-h4 font-weight-bold text-green-lighten-2">{{ summary.available }}</div>
                </div>
              </div>
            </VCard>
          </VCol>

          <!-- Section 5: Staff Status Directory Table -->
          <VCol cols="12">
            <VCard class="dashboard-card pa-3">
              <VCardItem>
                <VCardTitle class="text-h6 font-weight-bold text-white">Staff Status</VCardTitle>
              </VCardItem>

              <VTable class="dashboard-table available-staff-table">
                <thead>
                  <tr class="text-slate-400">
                    <th>Zone</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Load</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="staff in availableStaff" :key="staff.id">
                    <td>{{ staff.zone }}</td>
                    <td>{{ staff.name }}</td>
                    <td>{{ staff.role }}</td>
                    <td>
                      <VChip :color="staff.status === 'Available' ? 'success' : 'warning'" size="small" variant="flat">
                        {{ staff.status }}
                      </VChip>
                    </td>
                    <td>{{ staff.load }}</td>
                  </tr>
                  <tr v-if="availableStaff.length === 0">
                    <td colspan="5" class="text-center text-slate-400 py-4">No staff records available</td>
                  </tr>
                </tbody>
              </VTable>
            </VCard>
          </VCol>

        </VRow>
      </VCol>

    </VRow>

    <!-- Add Task Dialog Form Modal -->
    <VDialog v-model="isAddTaskOpen" max-width="500px">
      <VCard class="dashboard-card pa-4">
        <VCardTitle class="text-h6 text-white mb-3">Assign New Staff Task</VCardTitle>
        <VCardText>
          <VForm @submit.prevent="handleAddTask">
            <VTextField v-model="newTask.time" label="Time (e.g., 10:30 AM)" variant="outlined" class="mb-3" required />
            <VTextField v-model="newTask.zone" label="Zone" variant="outlined" class="mb-3" required />
            <VTextField v-model="newTask.elderly" label="Elderly Name" variant="outlined" class="mb-3" required />
            <VTextField v-model="newTask.action" label="Action / Task Description" variant="outlined" class="mb-3"
              required />
            <VTextField v-model="newTask.staff" label="Assigned Staff Name" variant="outlined" class="mb-4" required />

            <div class="d-flex justify-end gap-2">
              <VBtn variant="tonal" color="grey" @click="isAddTaskOpen = false">Cancel</VBtn>
              <VBtn color="primary" type="submit">Save Task</VBtn>
            </div>
          </VForm>
        </VCardText>
      </VCard>
    </VDialog>

    <div class="text-center text-caption text-slate-500 mt-6">
      Copyright © Sinovated Technology Limited 2026
    </div>
  </div>
</template>

<style scoped>
:global(.layout-wrapper.dashboard-fluid-layout .layout-page-content) {
  max-inline-size: none;
  padding: 0;
}

:global(.layout-wrapper.dashboard-fluid-layout .page-content-container) {
  inline-size: 100%;
  max-inline-size: none;
}

.dashboard-wrapper {
  box-sizing: border-box;
  min-block-size: 100%;
  padding: 1.75rem;
  background: rgb(var(--v-theme-background));
  color: rgba(var(--v-theme-on-background), 0.92);
}

.dashboard-header,
.dashboard-header__content {
  display: flex;
  align-items: center;
}

.dashboard-header__content {
  flex-wrap: wrap;
  gap: 0.75rem;
}

.dashboard-card {
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 1.25rem;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 10px 24px rgb(0 0 0 / 20%);
}

.dashboard-summary__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  text-align: center;
}

/* Make top-right view mode toggle buttons larger and wider */
.alerts-view-btns :deep(.v-btn) {
  padding-inline: 14px !important;
  min-inline-size: 44px !important;
  block-size: 38px !important;
}

.alerts-view-btns :deep(.v-icon) {
  font-size: 20px !important;
}

:deep(.v-table) {
  background: transparent !important;
}

:deep(.dashboard-table .v-table__wrapper) {
  overflow-x: auto;
}

/* Restrict table-layout fixed to tables that explicitly need strict sizing */
:deep(.dashboard-table.current-alerts-table table) {
  inline-size: 100%;
  table-layout: fixed;
}

:deep(.v-table th) {
  color: #94a3b8 !important;
  font-weight: 600;
  border-bottom: 1px solid #334155 !important;
  font-size: 0.75rem;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

:deep(.v-table td) {
  border-bottom: 1px solid rgba(51, 65, 85, 0.4) !important;
  font-size: 0.875rem;
  font-weight: 500;
  vertical-align: middle;
}

:deep(.dashboard-table th),
:deep(.dashboard-table td) {
  padding: 0.8rem 0.75rem !important;
}

:deep(.current-alerts-table th:nth-child(1)) {
  inline-size: 16%;
}

:deep(.current-alerts-table th:nth-child(2)) {
  inline-size: 13%;
}

:deep(.current-alerts-table th:nth-child(3)) {
  inline-size: 7%;
}

:deep(.current-alerts-table th:nth-child(4)) {
  inline-size: 20%;
}

:deep(.current-alerts-table th:nth-child(5)) {
  inline-size: 12%;
}

:deep(.current-alerts-table th:nth-child(6)) {
  inline-size: 22%;
}

:deep(.current-alerts-table th:nth-child(7)) {
  inline-size: 10%;
}

@media (max-width: 1279px) {
  .dashboard-wrapper {
    padding: 1.25rem;
  }
}

@media (max-width: 599px) {
  .dashboard-wrapper {
    padding: 1rem;
  }

  .dashboard-summary__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  :deep(.dashboard-table table) {
    min-inline-size: 42rem;
  }
}
</style>