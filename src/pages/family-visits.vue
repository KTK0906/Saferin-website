<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'

type Elderly = { id: string; name: string; zone?: string | null }
type Visit = { id: string; elderly_id: string; visited_at: string; visitor: string; relationship?: string; duration?: string; status: string; notes?: string; elderly?: Elderly }

const visits = ref<Visit[]>([])
const elderly = ref<Elderly[]>([])
const loading = ref(false)
const errorMessage = ref('')
const search = ref('')
const status = ref('All Statuses')
const dateRange = ref('All Dates')
const dialog = ref(false)
const saving = ref(false)
const page = ref(1)
const itemsPerPage = ref(10)
const form = ref({ elderlyId: '', visitDate: '', visitTime: '', visitor: '', relationship: '', duration: '', status: 'Scheduled', notes: '' })
const statuses = ['All Statuses', 'Completed', 'Scheduled']
const dateRanges = ['All Dates', 'Today', 'This Week', 'This Month']
const relationshipOptions = ['Daughter', 'Son', 'Grandson', 'Granddaughter', 'Spouse', 'Friend', 'Other']

const load = async () => {
  loading.value = true; errorMessage.value = ''
  const [visitResult, elderlyResult] = await Promise.all([
    supabase.from('family_visit_records').select('*').order('visited_at', { ascending: false }),
    supabase.rpc('resident_directory').order('name'),
  ])
  if (visitResult.error) errorMessage.value = visitResult.error.message
  if (elderlyResult.error) errorMessage.value = elderlyResult.error.message
  const people: Elderly[] = elderlyResult.data ?? []
  elderly.value = people
  visits.value = (visitResult.data ?? []).map(visit => ({ ...visit, elderly: people.find(person => person.id === visit.elderly_id) })) as Visit[]
  loading.value = false
}

const filteredVisits = computed(() => visits.value.filter(visit => {
  const term = search.value.trim().toLowerCase()
  const matchesSearch = !term || visit.visitor.toLowerCase().includes(term) || (visit.elderly?.name || '').toLowerCase().includes(term)
  const matchesStatus = status.value === 'All Statuses' || visit.status === status.value
  const date = new Date(visit.visited_at); const now = new Date()
  const matchesDate = dateRange.value === 'All Dates' || (dateRange.value === 'Today' && date.toDateString() === now.toDateString()) || (dateRange.value === 'This Week' && date >= new Date(now.getTime() - 7 * 86400000)) || (dateRange.value === 'This Month' && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear())
  return matchesSearch && matchesStatus && matchesDate
}))

const formatDate = (value: string) => new Date(value).toLocaleDateString('en-CA')
const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const statusColor = (value: string) => value === 'Completed' ? 'success' : value === 'Cancelled' ? 'error' : 'info'
const openDialog = () => { errorMessage.value = ''; form.value = { elderlyId: '', visitDate: '', visitTime: '', visitor: '', relationship: '', duration: '', status: 'Scheduled', notes: '' }; dialog.value = true }
const saveVisit = async () => {
  if (!form.value.elderlyId || !form.value.visitDate || !form.value.visitTime || !form.value.visitor.trim() || !form.value.relationship) { errorMessage.value = 'Complete all required fields before scheduling the visit.'; return }
  saving.value = true
  const { error } = await supabase.from('family_visit_records').insert({ elderly_id: form.value.elderlyId, visited_at: new Date(`${form.value.visitDate}T${form.value.visitTime}`).toISOString(), visitor: form.value.visitor.trim(), relationship: form.value.relationship, duration: form.value.duration.trim() || null, status: form.value.status, notes: form.value.notes.trim() || null })
  if (error) errorMessage.value = error.message; else { dialog.value = false; await load() }
  saving.value = false
}
const deleteVisit = async (visit: Visit) => { if (!window.confirm(`Delete visit by ${visit.visitor}?`)) return; const { error } = await supabase.from('family_visit_records').delete().eq('id', visit.id); if (error) errorMessage.value = error.message; else await load() }
onMounted(load)
</script>

<template>
  <section>
    <VCard>
      <VCardText>
        <div class="text-subtitle-1 font-weight-bold mb-4">Filters</div>
        <VRow>
          <VCol cols="12" md="6">
            <AppSelect v-model="status" :items="statuses" placeholder="Select Status" />
          </VCol>
          <VCol cols="12" md="6">
            <AppSelect v-model="dateRange" :items="dateRanges" placeholder="Select Date Range" />
          </VCol>
        </VRow>
      </VCardText>
      <VDivider />
      <VCardText class="d-flex justify-space-between align-center flex-wrap gap-4">
        <AppSelect v-model="itemsPerPage" :items="[5, 10, 20, 50]" style="inline-size:80px" />
        <div class="d-flex gap-4 align-center flex-wrap">
          <AppTextField v-model="search" placeholder="Search" prepend-inner-icon="tabler-search" clearable
            style="inline-size:220px" />
          <VBtn prepend-icon="tabler-plus" @click="openDialog">New Visit</VBtn>
        </div>
      </VCardText>
      <VDivider />
      <VDataTableServer v-model:page="page" v-model:items-per-page="itemsPerPage" :items="filteredVisits"
        item-value="id" :items-length="filteredVisits.length"
        :headers="[{ title: 'Date', key: 'date' }, { title: 'Time', key: 'time' }, { title: 'Visitor', key: 'visitor' }, { title: 'Relationship', key: 'relationship' }, { title: 'Resident', key: 'resident' }, { title: 'Duration', key: 'duration' }, { title: 'Status', key: 'status' }, { title: 'Notes', key: 'notes' }, { title: 'Actions', key: 'actions', sortable: false }]"
        class="text-no-wrap"><template #item.date="{ item }">{{ formatDate(item.visited_at) }}</template><template
          #item.time="{ item }">{{ formatTime(item.visited_at) }}</template><template #item.resident="{ item }">{{
            item.elderly?.name || 'Not recorded' }}</template><template #item.status="{ item }">
          <VChip :color="statusColor(item.status)" size="small" variant="tonal">{{ item.status }}</VChip>
        </template><template #item.actions="{ item }">
          <IconBtn @click="deleteVisit(item)">
            <VIcon icon="tabler-trash" />
          </IconBtn>
        </template><template #bottom>
          <TablePagination v-model:page="page" :items-per-page="itemsPerPage" :total-items="filteredVisits.length" />
        </template>
      </VDataTableServer>
    </VCard>
  </section>
  <VNavigationDrawer v-model="dialog" location="end" temporary :width="460">
    <AppDrawerHeaderSection title="Schedule New Family Visit" @cancel="dialog = false" />
    <VDivider />
    <VCard flat>
      <VCardText>
        <VForm @submit.prevent="saveVisit">
          <VRow>
            <VCol cols="12">
              <AppTextField v-model="form.visitDate" type="date" label="Visit Date" />
            </VCol>
            <VCol cols="12">
              <AppTextField v-model="form.visitTime" type="time" label="Visit Time" />
            </VCol>
            <VCol cols="12">
              <AppTextField v-model="form.visitor" label="Visitor Name" />
            </VCol>
            <VCol cols="12">
              <AppSelect v-model="form.relationship" :items="relationshipOptions" label="Relationship" />
            </VCol>
            <VCol cols="12">
              <AppSelect v-model="form.elderlyId" :items="elderly" item-title="name" item-value="id"
                label="Resident Name" />
            </VCol>
            <VCol cols="12">
              <AppTextField v-model="form.duration" label="Duration" placeholder="e.g. 1 hour" />
            </VCol>
            <VCol cols="12">
              <AppTextarea v-model="form.notes" label="Notes" rows="3" />
            </VCol>
            <VCol cols="12" class="d-flex justify-end gap-3">
              <VBtn variant="text" @click="dialog = false">Cancel</VBtn>
              <VBtn type="submit" color="primary" :loading="saving">Schedule Visit</VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VNavigationDrawer>
  <template v-if="false">
    <VRow class="family-visits-page">
      <VCol cols="12" class="d-flex align-center flex-wrap gap-3">
        <h1 class="text-h5 font-weight-bold text-white mb-0">Family Visit Management</h1><span
          class="text-caption text-slate-400">Updated: {{ new Date().toLocaleString() }}</span>
        <VBtn color="primary" size="small" prepend-icon="tabler-refresh" @click="load">Refresh</VBtn>
      </VCol>
      <VCol cols="12">
        <VCard class="visit-card pa-4">
          <h2 class="text-subtitle-1 text-white mb-3">Filters</h2>
          <div class="visit-filters">
            <VSelect v-model="status" :items="statuses" label="Status" variant="solo" hide-details
              class="filter-select" />
            <VSelect v-model="dateRange" :items="dateRanges" label="Date Range" variant="solo" hide-details
              class="filter-select" />
          </div>
        </VCard>
      </VCol>
      <VCol cols="12">
        <VCard class="visit-card pa-4">
          <div class="d-flex align-center gap-3 mb-3">
            <h2 class="text-subtitle-1 text-white mb-0">Family Visit Records</h2>
            <VBtn color="primary" size="small" prepend-icon="tabler-plus" @click="openDialog">New Visit</VBtn>
          </div>
          <VAlert v-if="errorMessage" type="error" variant="tonal" class="mb-3">{{ errorMessage }}</VAlert>
          <VProgressLinear v-if="loading" indeterminate color="primary" />
          <div class="overflow-x-auto">
            <VTable v-if="!loading" class="visit-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Visitor</th>
                  <th>Relationship</th>
                  <th>Resident</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="visit in filteredVisits" :key="visit.id">
                  <td>{{ formatDate(visit.visited_at) }}</td>
                  <td>{{ formatTime(visit.visited_at) }}</td>
                  <td>{{ visit.visitor }}</td>
                  <td>{{ visit.relationship || 'Not recorded' }}</td>
                  <td>{{ visit.elderly?.name || 'Not recorded' }}</td>
                  <td>{{ visit.duration || 'Not recorded' }}</td>
                  <td>
                    <VChip size="x-small" :color="statusColor(visit.status)">{{ visit.status }}</VChip>
                  </td>
                  <td>{{ visit.notes || 'Not recorded' }}</td>
                  <td>
                    <VBtn v-if="$can('delete', 'family_visits')" icon="tabler-trash" variant="text" color="error" size="small" @click="deleteVisit(visit)" />
                  </td>
                </tr>
                <tr v-if="!filteredVisits.length">
                  <td colspan="9" class="text-center py-8 text-medium-emphasis">No family visit records found.</td>
                </tr>
              </tbody>
            </VTable>
          </div>
        </VCard>
      </VCol>
    </VRow>
    <VDialog v-model="dialog" max-width="630" class="visit-dialog">
      <VCard class="visit-editor">
        <VCardTitle class="visit-editor-title"><span>
            <VIcon icon="tabler-users" size="22" /> Schedule New Family Visit
          </span>
          <VBtn icon="tabler-x" variant="text" size="small" @click="dialog = false" />
        </VCardTitle>
        <VCardText class="visit-editor-body">
          <VAlert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-3">{{ errorMessage }}
          </VAlert>
          <div class="visit-form-grid">
            <div class="visit-field"><label>Visit Date <b>*</b></label>
              <VTextField v-model="form.visitDate" type="date" placeholder="dd/mm/yyyy" variant="solo" hide-details />
            </div>
            <div class="visit-field"><label>Visit Time <b>*</b></label>
              <VTextField v-model="form.visitTime" type="time" variant="solo" hide-details />
            </div>
            <div class="visit-field"><label>Visitor Name <b>*</b></label>
              <VTextField v-model="form.visitor" placeholder="Enter visitor name" prepend-inner-icon="tabler-user-plus"
                variant="solo" hide-details />
            </div>
            <div class="visit-field"><label>Relationship <b>*</b></label>
              <VSelect v-model="form.relationship" :items="relationshipOptions" placeholder="Select relationship"
                variant="solo" hide-details />
            </div>
            <div class="visit-field"><label>Resident <b>*</b></label>
              <VSelect v-model="form.elderlyId" :items="elderly" item-title="name" item-value="id"
                placeholder="Select resident" variant="solo" hide-details />
            </div>
            <div class="visit-field"><label>Duration</label>
              <VTextField v-model="form.duration" placeholder="e.g. 1 hour" variant="solo" hide-details />
            </div>
          </div>
          <div class="visit-field visit-notes"><label>Notes</label>
            <VTextarea v-model="form.notes" placeholder="Enter any special notes or requests for this visit" rows="3"
              variant="solo" hide-details />
          </div>
        </VCardText>
        <VCardActions class="visit-editor-actions">
          <VBtn variant="text" class="visit-cancel" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" class="schedule-submit" :loading="saving" @click="saveVisit">Schedule Visit</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </template>
</template>

<style scoped lang="scss">
.visit-card {
  background: #1d1d22;
  border-radius: 10px;
}

.visit-filters {
  display: flex;
  align-items: flex-end;
  gap: 14px;
}

.filter-select {
  flex: 0 1 165px;
}

.visit-filters :deep(.v-field) {
  min-height: 46px;
  border-radius: 9px;
  background: #35353b;
}

.visit-filters :deep(.v-field__input) {
  min-height: 46px;
  padding-top: 20px;
  font-size: 12px;
}

.visit-filters :deep(.v-label) {
  font-size: 10px;
}

.visit-table {
  background: transparent;
  min-inline-size: 900px;
}

.visit-table th {
  color: rgb(255 255 255 / 65%);
  font-size: .7rem;
  white-space: nowrap;
}

.visit-table td {
  color: rgb(255 255 255 / 88%);
  font-size: .75rem;
  white-space: nowrap;
}

.visit-editor {
  overflow: hidden;
  border-radius: 10px;
  background: #202025;
  color: #fff;
}

.visit-editor-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px 10px;
  font-size: 17px;
  font-weight: 600;
}

.visit-editor-title>span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.visit-editor-body {
  padding: 10px 18px 4px;
}

.visit-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 13px 15px;
}

.visit-field label {
  display: block;
  margin: 0 0 5px 2px;
  color: #d7d7dc;
  font-size: 11px;
}

.visit-field label b {
  color: #ff4c74;
}

.visit-field :deep(.v-field) {
  min-height: 50px;
  border-radius: 10px;
  background: #36363d;
  box-shadow: none;
}

.visit-field :deep(.v-field__input) {
  min-height: 50px;
  padding: 10px 12px;
  color: #f5f5f6;
  font-size: 13px;
}

.visit-field :deep(.v-field__input::placeholder) {
  color: #a7a7ae;
  opacity: 1;
}

.visit-notes {
  margin-top: 13px;
}

.visit-notes :deep(.v-field),
.visit-notes :deep(.v-field__input) {
  min-height: 89px;
}

.visit-editor-actions {
  justify-content: flex-end;
  gap: 8px;
  padding: 15px 18px 16px;
}

.visit-cancel {
  color: #ff4d77;
  text-transform: none;
}

.schedule-submit {
  border-radius: 9px;
  text-transform: none;
}

@media (max-width: 700px) {
  .visit-filters {
    flex-wrap: wrap;
  }

  .filter-select {
    flex: 1 1 100%;
    max-inline-size: none;
  }

  .visit-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
