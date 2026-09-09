<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { supabase } from '@/lib/supabaseClient'

type AlertHistoryRecord = {
  id: string
  occurred_at: string
  alert_type: string
  resident: string
  location: string
  severity: string
  status: string
  response_time?: string | null
  details?: string | null
  responded_by?: string | null
  notes?: string | null
}

const alerts = ref<AlertHistoryRecord[]>([])
const loading = ref(false)
const errorMessage = ref('')
const selectedAlert = ref<AlertHistoryRecord | null>(null)
const detailsDialog = ref(false)
const lastUpdated = ref('Not loaded yet')

const search = ref('')
const fromDate = ref('')
const toDate = ref('')
const alertType = ref('All Types')
const severity = ref('All Severities')
const status = ref('All Statuses')
const page = ref(1)
const itemsPerPage = ref(10)

const defaultTypes = ['All Types', 'Fall Detection', 'Medication Alert', 'Wandering', 'Vital Signs', 'Call Button', 'Request']
const defaultSeverities = ['All Severities', 'High', 'Medium', 'Low']
const defaultStatuses = ['All Statuses', 'Resolved', 'Pending', 'In Progress', 'Cancelled']

const uniqueOptions = (defaultItems: string[], values: Array<string | null | undefined>) => {
  const cleanValues = values.map(value => value || '').filter(Boolean)
  return Array.from(new Set([...defaultItems, ...cleanValues]))
}

const alertTypeOptions = computed(() => uniqueOptions(defaultTypes, alerts.value.map(alert => alert.alert_type)))
const severityOptions = computed(() => uniqueOptions(defaultSeverities, alerts.value.map(alert => alert.severity)))
const statusOptions = computed(() => uniqueOptions(defaultStatuses, alerts.value.map(alert => alert.status)))

const loadAlerts = async () => {
  loading.value = true
  errorMessage.value = ''

  const { data, error } = await supabase
    .from('alert_request_history')
    .select('*')
    .order('occurred_at', { ascending: false })

  if (error) {
    errorMessage.value = error.message
    alerts.value = []
  } else {
    alerts.value = data ?? []
    lastUpdated.value = new Date().toLocaleString()
  }

  loading.value = false
}

// 根據過濾條件進行篩選
const filteredAlerts = computed(() => alerts.value.filter(alert => {
  const term = search.value.trim().toLowerCase()
  const matchesSearch = !term
    || alert.id.toLowerCase().includes(term)
    || alert.resident.toLowerCase().includes(term)
    || alert.location.toLowerCase().includes(term)

  const alertDate = new Date(alert.occurred_at)
  const afterFrom = !fromDate.value || alertDate >= new Date(`${fromDate.value}T00:00:00`)
  const beforeTo = !toDate.value || alertDate <= new Date(`${toDate.value}T23:59:59`)
  const matchesType = alertType.value === 'All Types' || alert.alert_type === alertType.value
  const matchesSeverity = severity.value === 'All Severities' || alert.severity === severity.value
  const matchesStatus = status.value === 'All Statuses' || alert.status === status.value

  return matchesSearch && afterFrom && beforeTo && matchesType && matchesSeverity && matchesStatus
}))

// 當前頁面要顯示的資料 (根據 page 和 itemsPerPage 裁切)
const pagedAlerts = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value
  return filteredAlerts.value.slice(start, start + itemsPerPage.value)
})

// 當搜尋條件或每頁筆數改變時，重置回第一頁
watch([search, fromDate, toDate, alertType, severity, status, itemsPerPage], () => {
  page.value = 1
})

const formatDateTime = (value: string) => {
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

const typeIcon = (type: string) => {
  const normalized = (type || '').toLowerCase()
  if (normalized.includes('fall')) return 'tabler-alert-triangle'
  if (normalized.includes('medication')) return 'tabler-pill'
  if (normalized.includes('vital')) return 'tabler-heart-rate-monitor'
  if (normalized.includes('wandering')) return 'tabler-walk'
  if (normalized.includes('call')) return 'tabler-bell'
  return 'tabler-info-circle'
}

const viewDetails = (alert: AlertHistoryRecord) => {
  selectedAlert.value = alert
  detailsDialog.value = true
}

onMounted(loadAlerts)
</script>

<template>
  <section>
    <VCard>
      <!-- Filters 區塊 -->
      <VCardText>
        <div class="text-subtitle-1 font-weight-bold mb-4">Filters</div>
        <VRow>
          <VCol cols="12" md="4">
            <AppSelect v-model="alertType" :items="alertTypeOptions" placeholder="Select Alert Type" />
          </VCol>
          <VCol cols="12" md="4">
            <AppSelect v-model="severity" :items="severityOptions" placeholder="Select Severity" />
          </VCol>
          <VCol cols="12" md="4">
            <AppSelect v-model="status" :items="statusOptions" placeholder="Select Status" />
          </VCol>
          <VCol cols="12" md="4">
            <AppTextField v-model="fromDate" type="date" label="From Date" />
          </VCol>
          <VCol cols="12" md="4">
            <AppTextField v-model="toDate" type="date" label="To Date" />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <!-- 控制欄：使用 VRow 搭配 justify="space-between"，確保 Search 完全對齊最右側的 Actions 欄 -->
      <VCardText class="py-3">
        <VRow align="center" justify="space-between" no-gutters>
          <VCol cols="auto">
            <AppSelect 
              v-model="itemsPerPage" 
              :items="[5, 10, 20, 50]" 
              style="inline-size: 80px" 
            />
          </VCol>
          
          <VCol cols="12" sm="4" md="3" lg="2" class="d-flex justify-end">
            <AppTextField 
              v-model="search" 
              placeholder="Search" 
              prepend-inner-icon="tabler-search" 
              clearable 
              class="w-100"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <!-- 數據表格 -->
      <VDataTableServer 
        v-model:page="page" 
        v-model:items-per-page="itemsPerPage" 
        :items="pagedAlerts" 
        item-value="id" 
        :items-length="filteredAlerts.length" 
        :headers="[
          { title: 'ID', key: 'id' },
          { title: 'Timestamp', key: 'occurred_at' },
          { title: 'Type', key: 'alert_type' },
          { title: 'Resident', key: 'resident' },
          { title: 'Location', key: 'location' },
          { title: 'Severity', key: 'severity' },
          { title: 'Status', key: 'status' },
          { title: 'Response Time', key: 'response_time' },
          { title: 'Actions', key: 'actions', sortable: false }
        ]" 
        class="text-no-wrap"
      >
        <template #item.occurred_at="{ item }">
          {{ formatDateTime(item.occurred_at) }}
        </template>
        <template #item.severity="{ item }">
          <VChip size="small" :color="item.severity === 'High' ? 'error' : item.severity === 'Medium' ? 'warning' : 'success'" variant="tonal">
            {{ item.severity }}
          </VChip>
        </template>
        <template #item.status="{ item }">
          <VChip size="small" color="success" variant="tonal">
            {{ item.status }}
          </VChip>
        </template>
        <template #item.actions="{ item }">
          <IconBtn @click="viewDetails(item)">
            <VIcon icon="tabler-eye" />
          </IconBtn>
        </template>
        <template #bottom>
          <TablePagination v-model:page="page" :items-per-page="itemsPerPage" :total-items="filteredAlerts.length" />
        </template>
      </VDataTableServer>
    </VCard>
  </section>

  <!-- 詳情彈窗 -->
  <VDialog v-model="detailsDialog" max-width="620">
    <VCard>
      <VCardTitle>Alert Details</VCardTitle>
      <VCardText>
        <VRow>
          <VCol cols="12" sm="6"><b>Timestamp</b><div>{{ selectedAlert ? formatDateTime(selectedAlert.occurred_at) : '—' }}</div></VCol>
          <VCol cols="12" sm="6"><b>Status</b><div>{{ selectedAlert?.status || '—' }}</div></VCol>
          <VCol cols="12" sm="6"><b>Alert Type</b><div>{{ selectedAlert?.alert_type || '—' }}</div></VCol>
          <VCol cols="12" sm="6"><b>Resident</b><div>{{ selectedAlert?.resident || '—' }}</div></VCol>
          <VCol cols="12" sm="6"><b>Location</b><div>{{ selectedAlert?.location || '—' }}</div></VCol>
          <VCol cols="12" sm="6"><b>Severity</b><div>{{ selectedAlert?.severity || '—' }}</div></VCol>
          <VCol cols="12" sm="6"><b>Response Time</b><div>{{ selectedAlert?.response_time || '—' }}</div></VCol>
          <VCol cols="12" sm="6"><b>Responded By</b><div>{{ selectedAlert?.responded_by || '—' }}</div></VCol>
          <VCol cols="12"><b>Notes</b><div>{{ selectedAlert?.notes || selectedAlert?.details || '—' }}</div></VCol>
        </VRow>
      </VCardText>
      <VCardActions>
        <VSpacer/>
        <VBtn @click="detailsDialog = false">Close</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>