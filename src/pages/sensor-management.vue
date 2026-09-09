<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { supabase } from '@/lib/supabaseClient'

type SensorDevice = {
  id: string
  name: string
  sensor_type: string
  zone: string
  location: string
  status: string
  signal_strength: number | null
  last_reading: string | null
  last_maintenance: string | null
}

const devices = ref<SensorDevice[]>([])
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const lastUpdated = ref('Not loaded yet')
const drawer = ref(false)
const editingDevice = ref<SensorDevice | null>(null)

const search = ref('')
const statusFilter = ref('All Statuses')
const typeFilter = ref('All Types')
const zoneFilter = ref('All Zones')
const itemsPerPage = ref(10)
const page = ref(1)

const defaultStatuses = ['All Statuses', 'Active', 'Inactive', 'Maintenance', 'Warning']
const defaultTypes = ['All Types', 'Motion', 'Fall', 'Pressure', 'Contact', 'Temperature', 'Wearable']
const defaultZones = ['All Zones', 'A', 'B', 'C', 'D']

const form = ref({
  id: '',
  name: '',
  sensorType: 'Motion',
  zone: 'A',
  location: '',
  status: 'Active',
  signalStrength: 85,
  lastReading: '',
  lastMaintenance: '',
})

const uniqueOptions = (defaults: string[], values: Array<string | null | undefined>) => (
  Array.from(new Set([...defaults, ...values.map(value => value || '').filter(Boolean)]))
)

const statusOptions = computed(() => uniqueOptions(defaultStatuses, devices.value.map(device => device.status)))
const typeOptions = computed(() => uniqueOptions(defaultTypes, devices.value.map(device => device.sensor_type)))
const zoneOptions = computed(() => uniqueOptions(defaultZones, devices.value.map(device => device.zone)))

const loadDevices = async () => {
  loading.value = true
  errorMessage.value = ''

  const { data, error } = await supabase
    .from('sensor_devices')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    errorMessage.value = error.message
    devices.value = []
  } else {
    devices.value = data ?? []
    lastUpdated.value = new Date().toLocaleString()
  }

  loading.value = false
}

const filteredDevices = computed(() => devices.value.filter(device => {
  const term = search.value.trim().toLowerCase()
  const matchesSearch = !term
    || device.id.toLowerCase().includes(term)
    || device.name.toLowerCase().includes(term)
    || device.location.toLowerCase().includes(term)

  const matchesStatus = statusFilter.value === 'All Statuses' || device.status === statusFilter.value
  const matchesType = typeFilter.value === 'All Types' || device.sensor_type === typeFilter.value
  const matchesZone = zoneFilter.value === 'All Zones' || device.zone === zoneFilter.value

  return matchesSearch && matchesStatus && matchesType && matchesZone
}))

const paginatedDevices = computed(() => {
  const size = Number(itemsPerPage.value) || 10
  const start = (page.value - 1) * size

  return filteredDevices.value.slice(start, start + size)
})

watch([search, statusFilter, typeFilter, zoneFilter], () => {
  page.value = 1
})

const resetForm = () => {
  form.value = {
    id: '',
    name: '',
    sensorType: 'Motion',
    zone: 'A',
    location: '',
    status: 'Active',
    signalStrength: 85,
    lastReading: '',
    lastMaintenance: '',
  }
}

const openAddDialog = () => {
  editingDevice.value = null
  resetForm()
  errorMessage.value = ''
  successMessage.value = ''
  drawer.value = true
}

const openEditDialog = (device: SensorDevice) => {
  editingDevice.value = device
  form.value = {
    id: device.id,
    name: device.name,
    sensorType: device.sensor_type,
    zone: device.zone,
    location: device.location,
    status: device.status,
    signalStrength: device.signal_strength ?? 0,
    lastReading: device.last_reading ? device.last_reading.slice(0, 16) : '',
    lastMaintenance: device.last_maintenance || '',
  }
  errorMessage.value = ''
  successMessage.value = ''
  drawer.value = true
}

const saveDevice = async () => {
  if (!form.value.name.trim() || !form.value.sensorType || !form.value.zone || !form.value.location.trim()) {
    errorMessage.value = 'Please fill in all required fields.'
    return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  const payload: Record<string, string | number | null> = {
    name: form.value.name.trim(),
    sensor_type: form.value.sensorType,
    zone: form.value.zone,
    location: form.value.location.trim(),
    status: form.value.status,
    signal_strength: Number(form.value.signalStrength) || 0,
    last_reading: form.value.lastReading ? new Date(form.value.lastReading).toISOString() : null,
    last_maintenance: form.value.lastMaintenance || null,
  }

  let result
  if (editingDevice.value) {
    result = await supabase.from('sensor_devices').update(payload).eq('id', editingDevice.value.id)
  } else {
    // Older databases may have a sequence that was not advanced after demo rows
    // were inserted with explicit IDs. Resolve the next ID from the current data
    // so a new sensor never reuses an existing primary key.
    let sensorId = form.value.id.trim()
    if (!sensorId) {
      const { data: existing } = await supabase.from('sensor_devices').select('id')
      const maxNumber = (existing ?? []).reduce((max, row) => {
        const number = Number(String(row.id).match(/(\d+)$/)?.[1] ?? 0)
        return Math.max(max, number)
      }, 0)
      sensorId = `SN-${String(maxNumber + 1).padStart(3, '0')}`
    }
    result = await supabase.from('sensor_devices').insert({ id: sensorId, ...payload })
  }

  if (result.error) {
    errorMessage.value = result.error.code === '23505'
      ? 'This Sensor ID already exists. Please use a different ID.'
      : result.error.message
  } else {
    successMessage.value = editingDevice.value ? 'Sensor updated successfully.' : 'Sensor added successfully.'
    drawer.value = false
    await loadDevices()
  }

  saving.value = false
}

const deleteDevice = async (device: SensorDevice) => {
  if (!window.confirm(`Delete sensor "${device.name}"?`)) return

  const { error } = await supabase
    .from('sensor_devices')
    .delete()
    .eq('id', device.id)

  if (error) {
    errorMessage.value = error.message
  } else {
    successMessage.value = 'Sensor deleted successfully.'
    await loadDevices()
  }
}

const formatDateTime = (value: string | null) => {
  if (!value) return 'Not recorded'
  return new Date(value).toLocaleString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(',', '')
}

const formatDate = (value: string | null) => {
  if (!value) return 'Not recorded'
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-CA')
}

const statusColor = (value: string) => {
  const normalized = value.toLowerCase()
  if (normalized === 'active') return 'success'
  if (normalized === 'inactive') return 'error'
  if (normalized === 'maintenance') return 'info'
  if (normalized === 'warning') return 'warning'
  return 'secondary'
}

const sensorIcon = (value: string) => {
  const normalized = value.toLowerCase()
  if (normalized.includes('motion')) return 'tabler-activity'
  if (normalized.includes('fall')) return 'tabler-alert-triangle'
  if (normalized.includes('pressure')) return 'tabler-wave-sine'
  if (normalized.includes('contact')) return 'tabler-door'
  if (normalized.includes('temperature')) return 'tabler-temperature'
  if (normalized.includes('wearable')) return 'tabler-device-watch'
  return 'tabler-photo-sensor'
}

const signalColor = (value: number | null) => {
  const signal = value ?? 0
  if (signal >= 80) return 'success'
  if (signal >= 45) return 'warning'
  return 'error'
}

onMounted(loadDevices)
</script>

<template>
  <section>
    <VCard>
      <VCardText>
        <h6 class="text-h6 mb-4">
          Filters
        </h6>
        <VRow>
          <VCol cols="12" sm="4">
            <AppSelect v-model="statusFilter" :items="statusOptions" label="Status" />
          </VCol>
          <VCol cols="12" sm="4">
            <AppSelect v-model="typeFilter" :items="typeOptions" label="Sensor Type" />
          </VCol>
          <VCol cols="12" sm="4">
            <AppSelect v-model="zoneFilter" :items="zoneOptions" label="Zone" />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardText class="d-flex align-center justify-space-between flex-wrap gap-4">
        <AppSelect v-model="itemsPerPage" :items="[5, 10, 20, 50]" style="inline-size:80px"
          @update:model-value="page = 1" />
        <div class="d-flex align-center gap-4 flex-wrap">
          <div class="sensor-search">
            <AppTextField v-model="search" placeholder="Search" prepend-inner-icon="tabler-search" />
          </div>
          <VBtn prepend-icon="tabler-plus" @click="openAddDialog">
            Add Sensor
          </VBtn>
        </div>
      </VCardText>
      <VDivider />

      <VCardText>
        <VAlert v-if="errorMessage && !drawer" type="error" variant="tonal" class="mb-4">
          {{ errorMessage }}
        </VAlert>
        <VAlert v-if="successMessage && !drawer" type="success" variant="tonal" class="mb-4">
          {{ successMessage }}
        </VAlert>
        <VProgressLinear v-if="loading" indeterminate color="primary" class="mb-4" />

        <div class="overflow-x-auto">
          <VTable v-if="!loading" class="text-no-wrap">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Zone</th>
                <th>Location</th>
                <th>Status</th>
                <th>Signal Strength</th>
                <th>Last Reading</th>
                <th>Last Maintenance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="device in paginatedDevices" :key="device.id">
                <td>{{ device.id }}</td>
                <td>
                  <div class="icon-text">
                    <VIcon :icon="sensorIcon(device.sensor_type)" size="17" />
                    <span>{{ device.name }}</span>
                  </div>
                </td>
                <td>{{ device.sensor_type }}</td>
                <td>{{ device.zone }}</td>
                <td>{{ device.location }}</td>
                <td>
                  <VChip size="x-small" :color="statusColor(device.status)" class="sensor-chip">
                    {{ device.status }}
                  </VChip>
                </td>
                <td>
                  <div class="icon-text">
                    <VIcon icon="tabler-antenna-bars-5" :color="signalColor(device.signal_strength)" size="15" />
                    <span>{{ device.signal_strength ?? 0 }}%</span>
                  </div>
                </td>
                <td>{{ formatDateTime(device.last_reading) }}</td>
                <td>{{ formatDate(device.last_maintenance) }}</td>
                <td>
                  <div class="action-buttons">
                    <VBtn icon="tabler-edit" variant="text" color="primary" size="small"
                      aria-label="View or edit sensor details" @click="openEditDialog(device)" />
                    <VBtn icon="tabler-trash" variant="text" color="error" size="small" aria-label="Delete sensor"
                      @click="deleteDevice(device)" />
                  </div>
                </td>
              </tr>
              <tr v-if="!filteredDevices.length">
                <td colspan="10" class="empty-row">No sensor devices found.</td>
              </tr>
            </tbody>
          </VTable>
        </div>
      </VCardText>
      <VDivider />
      <VCardText class="d-flex justify-space-between align-center text-medium-emphasis">
        <span>Showing {{ filteredDevices.length ? ((page - 1) * Number(itemsPerPage) + 1) : 0 }} to
          {{ Math.min(page * Number(itemsPerPage), filteredDevices.length) }} of {{ filteredDevices.length }} entries</span>
        <TablePagination v-model:page="page" :items-per-page="itemsPerPage" :total-items="filteredDevices.length" />
      </VCardText>
    </VCard>

    <VNavigationDrawer v-model="drawer" location="end" temporary :width="460">
      <AppDrawerHeaderSection :title="editingDevice ? 'Edit Sensor' : 'Add New Sensor'" @cancel="drawer = false" />
      <VDivider />
      <VCard flat>
        <VCardText>
          <VAlert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
            {{ errorMessage }}
          </VAlert>

          <VRow>
            <VCol cols="12" sm="6">
              <AppTextField v-model="form.id" :readonly="Boolean(editingDevice)" label="Sensor ID"
                placeholder="Auto generated" />
            </VCol>
            <VCol cols="12" sm="6">
              <AppTextField v-model="form.name" label="Name" placeholder="Enter sensor name" />
            </VCol>
            <VCol cols="12" sm="6">
              <AppSelect v-model="form.sensorType" :items="defaultTypes.filter(item => item !== 'All Types')"
                label="Type" />
            </VCol>
            <VCol cols="12" sm="6">
              <AppSelect v-model="form.zone" :items="defaultZones.filter(item => item !== 'All Zones')" label="Zone" />
            </VCol>
            <VCol cols="12" sm="6">
              <AppTextField v-model="form.location" label="Location" placeholder="e.g. Bed101 - John Smith" />
            </VCol>
            <VCol cols="12" sm="6">
              <AppSelect v-model="form.status" :items="defaultStatuses.filter(item => item !== 'All Statuses')"
                label="Status" />
            </VCol>
            <VCol cols="12" sm="6">
              <AppTextField v-model.number="form.signalStrength" type="number" min="0" max="100" suffix="%"
                label="Signal Strength" />
            </VCol>
            <VCol cols="12" sm="6">
              <AppTextField v-model="form.lastMaintenance" type="date" label="Last Maintenance" />
            </VCol>
            <VCol cols="12">
              <AppTextField v-model="form.lastReading" type="datetime-local" label="Last Reading" />
            </VCol>
          </VRow>

          <div class="d-flex justify-end gap-3 mt-6">
            <VBtn variant="tonal" color="secondary" @click="drawer = false">Cancel</VBtn>
            <VBtn color="primary" class="save-btn" :loading="saving" @click="saveDevice">
              {{ editingDevice ? 'Save Changes' : 'Add Sensor' }}
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VNavigationDrawer>
  </section>
</template>

<style scoped lang="scss">
.sensor-search {
  inline-size: 220px;
}

.icon-text {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.sensor-chip {
  min-inline-size: 5rem;
  justify-content: center;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 5px;
}

.empty-row {
  padding-block: 2rem !important;
  text-align: center;
}
</style>
