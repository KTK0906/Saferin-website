<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import AddNewUserDrawer from '@/views/apps/user/list/AddNewUserDrawer.vue'

type Staff = {
  id: string;
  name: string;
  username?: string;
  role?: string;
  zone?: string;
  status?: string;
  phone_number?: string;
  email?: string;
  emergency_contact?: string;
  address?: string;
  device?: string;
  recent_location?: string
}

type Log = {
  id: string;
  occurred_at: string;
  category: string;
  details: string;
  succeeded: boolean
}

type Elderly = {
  id: string;
  name: string;
  room: string;
  status: string;
}

const users = ref<Staff[]>([])
const logs = ref<Log[]>([])
const assignedElderly = ref<Elderly[]>([])
const loading = ref(false)
const loadingLogs = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const search = ref('')
const role = ref('All Roles')
const zone = ref('All Zones')
const status = ref('All Status')
const selected = ref<Staff | null>(null)
const modal = ref<'edit' | 'add' | 'activity' | 'details' | null>(null)
const saving = ref(false)
const resettingMfa = ref(false)
const lastUpdated = ref('')
const templateAddOpen = ref(false)
const templateEditOpen = ref(false)
const page = ref(1)
const itemsPerPage = ref(10)

const roles = ['Admin', 'Nurse', 'Doctor', 'Caregiver', 'Principal', 'OT/PT']
const zones = ['Zone A', 'Zone B', 'Zone C', 'Zone D']
const statusOptions = ['All Status', 'Active', 'Inactive']

const form = ref({
  name: '',
  username: '',
  phone: '',
  role: 'Admin',
  zone: 'Zone 1',
  status: 'Active',
  newPassword: '',
  confirmPassword: ''
})

const filtered = computed(() =>
  users.value.filter(u => {
    const q = search.value.toLowerCase()
    return (!q || `${u.id} ${u.name} ${u.username || ''}`.toLowerCase().includes(q)) &&
      (role.value === 'All Roles' || u.role === role.value) &&
      (zone.value === 'All Zones' || u.zone === zone.value || u.zone === zone.value.replace('Zone ', '')) &&
      (status.value === 'All Status' || u.status === status.value)
  })
)

const loginCount = computed(() => logs.value.filter(l => l.category === 'Login' && l.succeeded).length)
const failedAttempts = computed(() => logs.value.filter(l => !l.succeeded || l.category === 'Failed Login').length)
const lastActiveText = computed(() => {
  if (!logs.value.length) return 'N/A'
  return '2 hours ago'
})

const load = async () => {
  loading.value = true
  errorMessage.value = ''
  const { data, error } = await supabase.from('staff').select('*').order('id')
  if (error) errorMessage.value = error.message
  users.value = (data ?? []) as Staff[]

  const now = new Date()
  lastUpdated.value = now.toISOString().replace('T', ' ').substring(0, 19)
  loading.value = false
}

const openAdd = () => {
  templateAddOpen.value = true
  return
  /* legacy modal state retained for edit compatibility */
  selected.value = null
  form.value = {
    name: '',
    username: '',
    phone: '',
    role: 'Admin',
    zone: 'Zone A',
    status: 'Active',
    newPassword: '',
    confirmPassword: ''
  }
  errorMessage.value = ''
  successMessage.value = ''
  modal.value = 'add'
}

const openEdit = (u: Staff) => {
  selected.value = u
  templateEditOpen.value = true
  return
  /* legacy modal state retained for compatibility */
  selected.value = u
  form.value = {
    name: u.name,
    username: u.username || '',
    phone: u.phone_number || '',
    role: u.role || 'Admin',
    zone: u.zone || 'Zone 1',
    status: u.status || 'Active',
    newPassword: '',
    confirmPassword: ''
  }
  errorMessage.value = ''
  successMessage.value = ''
  modal.value = 'edit'
}

const openDetails = async (u: Staff) => {
  selected.value = u
  modal.value = 'details'

  // Fetch assigned elderly if available in DB
  const { data } = await supabase.from('assigned_elderly').select('*').eq('staff_id', u.id)
  assignedElderly.value = (data ?? []) as Elderly[]
}

const save = async () => {
  saving.value = true
  errorMessage.value = ''

  if (form.value.newPassword || form.value.confirmPassword) {
    if (form.value.newPassword !== form.value.confirmPassword) {
      errorMessage.value = 'New password and confirm password do not match.'
      saving.value = false
      return
    }
  }

  if (modal.value === 'add') {
    const { error } = await supabase.from('staff').insert({
      name: form.value.name,
      username: form.value.username,
      phone_number: form.value.phone || null,
      role: form.value.role,
      zone: form.value.zone,
      status: form.value.status
    })
    if (error) errorMessage.value = error.message
    else { modal.value = null; await load() }
  } else {
    const { error } = await supabase.from('staff').update({
      name: form.value.name,
      username: form.value.username,
      phone_number: form.value.phone || null,
      role: form.value.role,
      zone: form.value.zone,
      status: form.value.status
    }).eq('id', selected.value!.id)

    if (error) errorMessage.value = error.message
    else { modal.value = null; await load() }
  }
  saving.value = false
}

const resetMfa = async () => {
  if (!selected.value) return
  resettingMfa.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    successMessage.value = `MFA has been reset for ${selected.value.name}.`
  } catch (err: any) {
    errorMessage.value = err.message || 'Failed to reset MFA.'
  } finally {
    resettingMfa.value = false
  }
}

const openActivity = async (u: Staff) => {
  selected.value = u
  modal.value = 'activity'
  await fetchLogs()
}

const fetchLogs = async () => {
  if (!selected.value) return
  loadingLogs.value = true
  const { data, error } = await supabase
    .from('user_activity_logs')
    .select('*')
    .eq('staff_id', selected.value.id)
    .order('occurred_at', { ascending: false })
    .limit(10)

  if (error) errorMessage.value = error.message
  logs.value = (data ?? []) as Log[]
  loadingLogs.value = false
}

const remove = async (u: Staff) => {
  if (!window.confirm(`Delete ${u.name}?`)) return
  const { error } = await supabase.from('staff').delete().eq('id', u.id)
  if (error) errorMessage.value = error.message
  else await load()
}

const getRoleClass = (roleStr?: string) => {
  switch ((roleStr || '').toLowerCase()) {
    case 'admin': return 'role-badge admin'
    case 'nurse': return 'role-badge nurse'
    case 'doctor': return 'role-badge doctor'
    case 'caregiver': return 'role-badge caregiver'
    default: return 'role-badge default'
  }
}

const formatTimestamp = (ts: string) => {
  return ts ? ts.replace('T', ' ').substring(0, 19) : '—'
}

const saveTemplateUser = async (data: any) => {
  const { error } = await supabase.from('staff').insert({
    name: data.fullName,
    username: data.username || data.fullName,
    phone_number: data.phone_number || null,
    role: data.role,
    zone: data.zone,
    status: data.status,
    device: data.device,
    recent_location: data.recent_location,
  })
  if (error) {
    errorMessage.value = error.message
    return
  }
  await load()
}

const updateTemplateUser = async (data: any) => {
  if (!selected.value) return
  const { error } = await supabase.from('staff').update({ name: data.fullName, username: data.username, phone_number: data.phone_number || null, role: data.role, zone: data.zone, status: data.status, device: data.device, recent_location: data.recent_location }).eq('id', selected.value.id)
  if (error) { errorMessage.value = error.message; return }
  templateEditOpen.value = false
  await load()
}

onMounted(load)
</script>

<template>
  <div class="ecommerce-list-layout">
    <VCard>
      <VAlert v-if="errorMessage" type="error" variant="tonal" class="ma-4">{{ errorMessage }}</VAlert>
      <VCardText>
        <div class="text-subtitle-1 font-weight-bold mb-4">Filters</div>
        <div class="d-flex flex-column gap-4">
          <!-- First Row: Zone, Role, Status Selects -->
          <VRow density="compact">
            <VCol cols="12" md="4">
              <AppSelect v-model="zone" :items="['All Zones', ...zones]" placeholder="Zone" />
            </VCol>
            <VCol cols="12" md="4">
              <AppSelect v-model="role" :items="['All Roles', ...roles]" placeholder="Role / Care Level" />
            </VCol>
            <VCol cols="12" md="4">
              <AppSelect v-model="status" :items="statusOptions" placeholder="Status" />
            </VCol>
          </VRow>

          <!-- Second Row: Search input on the left, Page size and Add button on the right -->
          <div class="d-flex justify-space-between align-center flex-wrap gap-4 mt-2">
            <AppSelect :items="[5, 10, 20, 50, 100]" model-value="10" style="inline-size: 100px;" />
            <VSpacer />
            <div class="d-flex align-center gap-4 flex-wrap">
              <AppTextField v-model="search" style="max-inline-size: 250px; min-inline-size: 200px;"
                placeholder="Search" prepend-inner-icon="tabler-search" clearable />
              <VBtn prepend-icon="tabler-plus" color="primary" @click="openAdd">
                Add New User
              </VBtn>
            </div>
          </div>
        </div>
      </VCardText>
      <VDivider />
      <VDataTableServer v-model:page="page" v-model:items-per-page="itemsPerPage" :items="filtered" item-value="id"
        :headers="[
          { title: 'Staff ID', key: 'id', sortable: false },
          { title: 'Name', key: 'name', sortable: false },
          { title: 'Username', key: 'username', sortable: false },
          { title: 'Role', key: 'role', sortable: false },
          { title: 'Zone', key: 'zone', sortable: false },
          { title: 'Status', key: 'status', sortable: false },
          { title: 'Phone Number', key: 'phone_number', sortable: false },
          { title: 'Device', key: 'device', sortable: false },
          { title: 'Recent Location', key: 'recent_location', sortable: false },
          { title: 'Actions', key: 'actions', sortable: false },
        ]" :items-length="filtered.length" class="text-no-wrap">
        <template #item.name="{ item }">
          <div class="d-flex align-center gap-x-3">
            <VAvatar size="34" variant="tonal"><span>{{ item.name?.slice(0, 2).toUpperCase() }}</span></VAvatar>
            <span class="font-weight-medium">{{ item.name }}</span>
          </div>
        </template>
        <template #item.role="{ item }">
          <VChip color="primary" size="small" variant="tonal">{{ item.role || 'Unassigned' }}</VChip>
        </template>
        <template #item.status="{ item }">
          <VChip :color="item.status === 'Active' ? 'success' : 'error'" size="small" variant="tonal">
            {{ item.status || 'Inactive' }}
          </VChip>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex align-center gap-1">
            <VBtn icon variant="text" color="medium-emphasis">
              <VIcon icon="tabler-dots-vertical" />
              <VMenu activator="parent">
                <VList>
                  <VListItem :to="{ name: 'apps-user-view-id', params: { id: item.id } }"><template #prepend>
                      <VIcon icon="tabler-eye" />
                    </template>
                    <VListItemTitle>View</VListItemTitle>
                  </VListItem>
                  <VListItem @click="openEdit(item)"><template #prepend>
                      <VIcon icon="tabler-pencil" />
                    </template>
                    <VListItemTitle>Edit</VListItemTitle>
                  </VListItem>
                  <VListItem @click="remove(item)"><template #prepend>
                      <VIcon icon="tabler-trash" />
                    </template>
                    <VListItemTitle>Delete</VListItemTitle>
                  </VListItem>
                </VList>
              </VMenu>
            </VBtn>
          </div>
        </template>
        <template #bottom>
          <TablePagination v-model:page="page" :items-per-page="itemsPerPage" :total-items="filtered.length" />
        </template>
      </VDataTableServer>
    </VCard>
  </div>
  <AddNewUserDrawer v-model:is-drawer-open="templateAddOpen" @user-data="saveTemplateUser" />
  <AddNewUserDrawer v-model:is-drawer-open="templateEditOpen" :user="selected" @user-data="updateTemplateUser" />

  <div v-if="modal" class="user-management-page">
    <!-- Header Row -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div class="d-flex align-center gap-4">
        <h1 class="text-h5 font-weight-bold text-white mb-0">User Management</h1>
        <span class="text-grey-lighten-1 text-body-2">Updated: {{ lastUpdated }}</span>
        <VBtn color="primary" class="refresh-btn text-none" density="comfortable" :loading="loading" @click="load">
          <VIcon start size="18">tabler-refresh</VIcon>
          Refresh
        </VBtn>
      </div>
    </div>

    <!-- Filters Section -->
    <VCard class="dark-card pa-5 mb-6">
      <h2 class="section-heading mb-4">Filters</h2>
      <div class="filters-row">
        <!-- Search Input -->
        <VTextField v-model="search" placeholder="Search Name, Staff ID..." variant="outlined" density="compact"
          hide-details class="custom-filter-input">
          <template #prepend-inner>
            <VIcon color="grey-darken-1" size="18">tabler-search</VIcon>
          </template>
        </VTextField>

        <!-- Role Select -->
        <VSelect v-model="role" :items="['All Roles', ...roles]" placeholder="Role" variant="outlined" density="compact"
          hide-details class="custom-filter-input" />

        <!-- Status Select -->
        <VSelect v-model="status" :items="statusOptions" placeholder="Status" variant="outlined" density="compact"
          hide-details class="custom-filter-input" />
      </div>
    </VCard>

    <!-- Staff Users Table Section -->
    <VCard class="dark-card pa-5">
      <div class="d-flex align-center gap-4 mb-4">
        <h2 class="section-heading mb-0">Staff Users</h2>
        <VBtn color="primary" class="add-user-btn text-none" density="comfortable" @click="openAdd">
          <VIcon start size="18">tabler-user-plus</VIcon>
          Add New User
        </VBtn>
      </div>

      <VAlert v-if="errorMessage && !modal" type="error" class="mb-4">{{ errorMessage }}</VAlert>

      <div class="table-responsive">
        <VTable class="custom-dark-table">
          <thead>
            <tr>
              <th>STAFF ID</th>
              <th>NAME</th>
              <th>USERNAME</th>
              <th>ROLE</th>
              <th>ZONE</th>
              <th>STATUS</th>
              <th>PHONE NUMBER</th>
              <th>DEVICE</th>
              <th>RECENT LOCATION</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filtered" :key="u.id">
              <td class="text-grey-lighten-1 font-weight-medium">{{ u.id }}</td>
              <td class="font-weight-medium text-white">{{ u.name }}</td>
              <td class="text-grey-lighten-1">{{ u.username || '—' }}</td>
              <td>
                <span :class="getRoleClass(u.role)">
                  {{ u.role || 'Unassigned' }}
                </span>
              </td>
              <td class="text-grey-lighten-1">{{ u.zone || '—' }}</td>
              <td>
                <span v-if="u.status === 'Active'" class="status-badge active">
                  <VIcon size="14" class="mr-1">tabler-circle-check</VIcon> Active
                </span>
                <span v-else class="status-badge inactive">
                  <VIcon size="14" class="mr-1">tabler-circle-x</VIcon> Inactive
                </span>
              </td>
              <td class="text-grey-lighten-1">{{ u.phone_number || '—' }}</td>
              <td class="text-grey-lighten-1">{{ u.device || '—' }}</td>
              <td class="text-grey-lighten-1">{{ u.recent_location || '—' }}</td>
              <td>
                <div class="d-flex align-center gap-1">
                  <VBtn icon variant="text" color="grey-lighten-1" density="compact" @click="openEdit(u)">
                    <VIcon size="18">tabler-edit</VIcon>
                  </VBtn>
                  <VBtn icon variant="text" color="grey-lighten-1" density="compact" @click="openActivity(u)">
                    <VIcon size="18">tabler-activity</VIcon>
                  </VBtn>
                  <VBtn icon variant="text" color="grey-lighten-1" density="compact" @click="openDetails(u)">
                    <VIcon size="18">tabler-eye</VIcon>
                  </VBtn>
                  <VBtn icon variant="text" color="grey-lighten-1" density="compact" @click="remove(u)">
                    <VIcon size="18">tabler-trash</VIcon>
                  </VBtn>
                </div>
              </td>
            </tr>
          </tbody>
        </VTable>
      </div>
    </VCard>

    <!-- Modal Dialogs -->
    <VDialog :model-value="!!modal" @update:model-value="modal = null" max-width="620">
      <!-- EDIT / ADD USER DIALOG -->
      <VCard v-if="modal === 'edit' || modal === 'add'" class="dialog-card pa-2">
        <VCardTitle class="d-flex justify-space-between align-center pa-4 text-h6 font-weight-bold text-white">
          {{ modal === 'add' ? 'Add New User' : 'Edit User Details' }}
          <VBtn icon="tabler-x" variant="text" density="compact" color="grey-lighten-1" @click="modal = null" />
        </VCardTitle>

        <VCardText class="pa-4 pt-0">
          <VAlert v-if="errorMessage" type="error" density="compact" class="mb-4">{{ errorMessage }}</VAlert>
          <VAlert v-if="successMessage" type="success" density="compact" class="mb-4">{{ successMessage }}</VAlert>

          <div class="grid-form mb-4">
            <div class="field-group">
              <label class="field-label">Name</label>
              <VTextField v-model="form.name" variant="solo" hide-details class="custom-dialog-input" />
            </div>
            <div class="field-group" v-if="modal === 'edit'">
              <label class="field-label">Staff ID</label>
              <VTextField :model-value="selected?.id" readonly variant="solo" hide-details
                class="custom-dialog-input readonly" />
            </div>
            <div class="field-group">
              <label class="field-label">Username</label>
              <VTextField v-model="form.username" variant="solo" hide-details class="custom-dialog-input" />
            </div>
            <div class="field-group">
              <label class="field-label">Phone Number</label>
              <VTextField v-model="form.phone" variant="solo" hide-details class="custom-dialog-input" />
            </div>
            <div class="field-group">
              <label class="field-label">Role</label>
              <VSelect v-model="form.role" :items="roles" variant="solo" hide-details class="custom-dialog-input" />
            </div>
            <div class="field-group">
              <label class="field-label">Zone</label>
              <VSelect v-model="form.zone" :items="zones" variant="solo" hide-details class="custom-dialog-input" />
            </div>
            <div class="field-group">
              <label class="field-label">Status</label>
              <VSelect v-model="form.status" :items="statusOptions.slice(1)" variant="solo" hide-details
                class="custom-dialog-input" />
            </div>
          </div>

          <VDivider v-if="modal === 'edit'" class="my-5 divider-line" />

          <div v-if="modal === 'edit'" class="reset-password-section">
            <h3 class="section-title mb-3">Reset Password</h3>
            <div class="d-flex flex-column gap-3">
              <div class="field-group">
                <label class="field-label">New Password</label>
                <VTextField v-model="form.newPassword" type="password" placeholder="Enter new password" variant="solo"
                  hide-details class="custom-dialog-input" />
              </div>
              <div class="field-group">
                <label class="field-label">Confirm New Password</label>
                <VTextField v-model="form.confirmPassword" type="password" placeholder="Confirm new password"
                  variant="solo" hide-details class="custom-dialog-input" />
              </div>
            </div>
          </div>

          <VDivider v-if="modal === 'edit'" class="my-5 divider-line" />

          <div v-if="modal === 'edit'">
            <VBtn color="primary" class="blue-btn text-none" :loading="resettingMfa" @click="resetMfa">
              Reset MFA
            </VBtn>
          </div>
        </VCardText>

        <VCardActions class="pa-4 pt-0 d-flex justify-end gap-2">
          <VBtn variant="text" color="grey-lighten-1" class="text-none" @click="modal = null">Cancel</VBtn>
          <VBtn color="primary" class="blue-btn text-none" :loading="saving" @click="save">
            Save Changes
          </VBtn>
        </VCardActions>
      </VCard>

      <!-- USER ACTIVITY LOG DIALOG -->
      <VCard v-else-if="modal === 'activity'" class="activity-modal-card pa-4">
        <div class="d-flex justify-space-between align-center mb-4 pa-2">
          <h2 class="text-h6 font-weight-bold text-white mb-0">User Activity Log</h2>
          <VBtn icon="tabler-x" variant="text" density="compact" color="grey-lighten-1" @click="modal = null" />
        </div>

        <VCardText class="pa-2">
          <!-- Activity Summary -->
          <div class="mb-5">
            <h3 class="section-subheading mb-3">Activity Summary</h3>
            <div class="summary-cards-grid">
              <div class="summary-card">
                <span class="summary-label">Login Count</span>
                <span class="summary-value">{{ loginCount }}</span>
              </div>
              <div class="summary-card">
                <span class="summary-label">Failed Attempts</span>
                <span class="summary-value">{{ failedAttempts }}</span>
              </div>
              <div class="summary-card">
                <span class="summary-label">Last Active</span>
                <span class="summary-value text-body-1 font-weight-bold">{{ lastActiveText }}</span>
              </div>
            </div>
          </div>

          <VDivider class="modal-divider mb-5" />

          <!-- Recent Activities -->
          <div>
            <h3 class="section-subheading mb-3">Recent Activities</h3>
            <div class="table-container-card">
              <VTable class="activity-table">
                <thead>
                  <tr>
                    <th class="table-header-cell">TIMESTAMP</th>
                    <th class="table-header-cell">ACTION</th>
                    <th class="table-header-cell">DETAILS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="log in logs" :key="log.id">
                    <td class="text-grey-lighten-1">{{ formatTimestamp(log.occurred_at) }}</td>
                    <td class="text-white font-weight-medium">{{ log.category }}</td>
                    <td class="text-grey-lighten-1">{{ log.details }}</td>
                  </tr>
                  <tr v-if="!logs.length">
                    <td colspan="3" class="text-center text-grey py-6">No recent activity logs found.</td>
                  </tr>
                </tbody>
              </VTable>
            </div>
          </div>
        </VCardText>

        <VCardActions class="pa-2 pt-4 d-flex justify-end gap-3">
          <VBtn variant="text" class="close-btn text-none" @click="modal = null">
            Close
          </VBtn>
          <VBtn color="primary" class="refresh-modal-btn text-none" :loading="loadingLogs" @click="fetchLogs">
            <VIcon start size="16">tabler-refresh</VIcon>
            Refresh
          </VBtn>
        </VCardActions>
      </VCard>

      <!-- USER DETAILS DIALOG (Matching Attached UI) -->
      <VCard v-else-if="modal === 'details'" class="details-modal-card pa-4">
        <div class="d-flex justify-space-between align-center mb-4 pa-2">
          <h2 class="text-h6 font-weight-bold text-white mb-0">User Details</h2>
          <VBtn icon="tabler-x" variant="text" density="compact" color="grey-lighten-1" @click="modal = null" />
        </div>

        <VCardText class="pa-2 text-white">
          <!-- Section 1: Personal Information -->
          <div class="details-section mb-4">
            <h3 class="section-subheading mb-3">Personal Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Full Name</span>
                <span class="info-value font-weight-bold">{{ selected?.name || 'John Doe' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Staff ID</span>
                <span class="info-value font-weight-bold">{{ selected?.id || 'ST-001' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Username</span>
                <span class="info-value font-weight-bold">{{ selected?.username || 'john.doe' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Role</span>
                <div class="mt-1">
                  <span :class="getRoleClass(selected?.role || 'Admin')">
                    {{ selected?.role || 'Admin' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <VDivider class="modal-divider mb-4" />

          <!-- Section 2: Contact Information -->
          <div class="details-section mb-4">
            <h3 class="section-subheading mb-3">Contact Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Phone Number</span>
                <span class="info-value font-weight-bold">{{ selected?.phone_number || '+1 (555) 123-4567' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value font-weight-bold">{{ selected?.email || 'Not provided' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Emergency Contact</span>
                <span class="info-value font-weight-bold">{{ selected?.emergency_contact || 'Not provided' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Address</span>
                <span class="info-value font-weight-bold">{{ selected?.address || 'Not provided' }}</span>
              </div>
            </div>
          </div>

          <VDivider class="modal-divider mb-4" />

          <!-- Section 3: Work Information -->
          <div class="details-section mb-4">
            <h3 class="section-subheading mb-3">Work Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Zone</span>
                <span class="info-value font-weight-bold">{{ selected?.zone || 'Zone 1' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Status</span>
                <div class="mt-1">
                  <span v-if="(selected?.status || 'Active') === 'Active'" class="status-badge active">
                    <VIcon size="14" class="mr-1">tabler-circle-check</VIcon> Active
                  </span>
                  <span v-else class="status-badge inactive">
                    <VIcon size="14" class="mr-1">tabler-circle-x</VIcon> Inactive
                  </span>
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Device</span>
                <span class="info-value font-weight-bold">{{ selected?.device || 'Mobile 1' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Last Location</span>
                <span class="info-value font-weight-bold">{{ selected?.recent_location || 'Main Building, Floor 1'
                  }}</span>
              </div>
            </div>
          </div>

          <VDivider class="modal-divider mb-4" />

          <!-- Section 4: Assigned Elderly -->
          <div class="details-section">
            <h3 class="section-subheading mb-3">Assigned Elderly</h3>
            <div class="table-container-card">
              <VTable class="elderly-table">
                <thead>
                  <tr>
                    <th class="table-header-cell">NAME</th>
                    <th class="table-header-cell">ROOM</th>
                    <th class="table-header-cell">STATUS</th>
                    <th class="table-header-cell">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in assignedElderly" :key="item.id">
                    <td class="text-white font-weight-medium">{{ item.name }}</td>
                    <td class="text-grey-lighten-1">{{ item.room }}</td>
                    <td>
                      <span class="status-badge active">{{ item.status }}</span>
                    </td>
                    <td>
                      <VBtn icon variant="text" color="grey-lighten-1" density="compact">
                        <VIcon size="18">tabler-eye</VIcon>
                      </VBtn>
                    </td>
                  </tr>
                  <tr v-if="!assignedElderly.length">
                    <td colspan="4" class="text-center text-grey py-8 text-body-2">
                      No elderly assigned to this user
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped lang="scss">
.user-management-page {
  background-color: #121319;
  min-height: 100vh;
  padding: 16px;
}

/* Dark Container Cards */
.dark-card {
  background-color: #1c1d24 !important;
  border-radius: 12px !important;
  border: 1px solid #272832;
  box-shadow: none !important;
}

.section-heading {
  font-size: 1.15rem;
  font-weight: 600;
  color: #ffffff;
}

/* Header Buttons */
.refresh-btn,
.add-user-btn {
  background-color: #0088ff !important;
  color: #ffffff !important;
  border-radius: 20px !important;
  font-weight: 600;
  padding: 0 16px;
}

/* Filters Row */
.filters-row {
  display: flex;
  gap: 16px;
  max-width: 650px;
}

.filter-item {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.filter-label {
  font-size: 0.75rem;
  color: #a0a0ab;
  margin-bottom: 6px;
  font-weight: 500;
}

:deep(.custom-filter-input) {
  .v-field {
    background-color: #2a2b35 !important;
    border-radius: 8px !important;
    color: #ffffff !important;
    box-shadow: none !important;
  }

  .v-field__input {
    min-height: 40px !important;
    padding-top: 6px !important;
    padding-bottom: 6px !important;
    font-size: 0.85rem;
  }

  input::placeholder {
    color: #71717a !important;
  }
}

/* Table Design */
.table-responsive {
  overflow-x: auto;
}

.custom-dark-table {
  background: transparent !important;
  width: 100%;

  th {
    background: transparent !important;
    color: #71717a !important;
    font-size: 0.7rem !important;
    font-weight: 700 !important;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #272832 !important;
    padding: 12px 16px !important;
  }

  td {
    border-bottom: 1px solid #23242e !important;
    font-size: 0.82rem !important;
    padding: 12px 16px !important;
    white-space: nowrap;
  }

  tr:hover td {
    background-color: #242530 !important;
  }
}

/* Role Badges */
.role-badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 16px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #ffffff;
  text-align: center;

  &.admin {
    background-color: #0088ff;
  }

  &.nurse {
    background-color: #e69d00;
  }

  &.doctor {
    background-color: #00c853;
  }

  &.caregiver {
    background-color: #9c27b0;
  }

  &.default {
    background-color: #555560;
  }
}

/* Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.78rem;
  font-weight: 600;

  &.active {
    background-color: rgba(0, 200, 83, 0.15);
    color: #00e676;
    border: 1px solid rgba(0, 230, 118, 0.3);
  }

  &.inactive {
    background-color: rgba(255, 23, 68, 0.15);
    color: #ff5252;
    border: 1px solid rgba(255, 82, 82, 0.3);
  }
}

/* Dialog / Modal Styling */
.dialog-card {
  background: #1c1d24 !important;
  border-radius: 12px !important;
  border: 1px solid #272832;
}

.grid-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field-group {
  display: flex;
  flex-direction: column;
}

.field-label {
  font-size: 0.8rem;
  color: #a0a0ab;
  margin-bottom: 6px;
}

:deep(.custom-dialog-input) {
  .v-field {
    background-color: #2a2b35 !important;
    border-radius: 8px !important;
    color: #ffffff !important;
  }

  &.readonly .v-field {
    background-color: #22232b !important;
    opacity: 0.8;
  }
}

.divider-line {
  border-color: #272832 !important;
}

.blue-btn {
  background-color: #0088ff !important;
  color: #ffffff !important;
  border-radius: 10px !important;
  font-weight: 600;
  padding: 0 20px;
  height: 40px;
}

/* Activity Modal Specifics */
.activity-modal-card,
.details-modal-card {
  background-color: #17181e !important;
  border-radius: 12px !important;
  border: 1px solid #282932;
  color: #ffffff;
}

.section-subheading {
  font-size: 0.9rem;
  font-weight: 600;
  color: #d1d5db;
}

.summary-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.summary-card {
  background-color: #21222b;
  border-radius: 10px;
  border: 1px solid #2d2e3a;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.summary-label {
  font-size: 0.78rem;
  color: #9ca3af;
  margin-bottom: 6px;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
}

.modal-divider {
  border-color: #282932 !important;
}

.table-container-card {
  background-color: #21222b;
  border-radius: 10px;
  border: 1px solid #2d2e3a;
  overflow: hidden;
}

.activity-table,
.elderly-table {
  background: transparent !important;
  width: 100%;

  thead tr {
    background-color: #2a2b37 !important;
  }

  .table-header-cell {
    color: #9ca3af !important;
    font-size: 0.7rem !important;
    font-weight: 700 !important;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #2d2e3a !important;
    padding: 12px 16px !important;
  }

  td {
    border-bottom: 1px solid #282934 !important;
    font-size: 0.82rem !important;
    padding: 12px 16px !important;
  }

  tbody tr:last-child td {
    border-bottom: none !important;
  }

  tbody tr:hover td {
    background-color: #262733 !important;
  }
}

.close-btn {
  color: #0088ff !important;
  font-weight: 600;
}

.refresh-modal-btn {
  background-color: #0088ff !important;
  color: #ffffff !important;
  border-radius: 20px !important;
  font-weight: 600;
  padding: 0 18px;
}

/* User Details Modal Specific Grid & Text Styles */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.78rem;
  color: #8b8e9b;
  margin-bottom: 4px;
}

.info-value {
  font-size: 0.9rem;
  color: #ffffff;
}
</style>
