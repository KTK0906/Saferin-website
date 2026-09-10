<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'

type Shift = {
  id: string
  staff_id: string
  staff_name?: string
  department?: string
  shift: string
  shift_date: string
  start_time: string
  end_time: string
  status: string
}
type Attendance = {
  id: string
  staff_id: string
  shift: string
  attendance_date: string
  check_in?: string | null
  check_out?: string | null
  status: string
}

const tab = ref('shifts')
const shifts = ref<Shift[]>([])
const attendance = ref<Attendance[]>([])
const staff = ref<any[]>([])
const search = ref('')
const department = ref('All Departments')
const shift = ref('All Shifts')
const date = ref('')
const loading = ref(false)
const drawer = ref(false)
const attendanceDrawer = ref(false)
const attendanceSearch = ref('')
const attendanceDepartment = ref('All Departments')
const attendanceShift = ref('All Shifts')
const attendanceDate = ref('')
const editingAttendance = ref<Attendance | null>(null)
const attendanceForm = ref({
  staff_id: '',
  shift: 'Morning',
  attendance_date: '',
  check_in: '',
  check_out: '',
  status: 'Present',
})
const editing = ref<Shift | null>(null)
const page = ref(1)
const itemsPerPage = ref(10)

const form = ref({
  staff_id: '',
  shift: 'Morning',
  shift_date: '',
  start_time: '',
  end_time: '',
  status: 'Scheduled',
})

const getStaff = (id: string) => staff.value.find(person => person.id === id)
const departments = computed(() => [
  'All Departments',
  ...new Set(staff.value.map(s => s.department).filter(Boolean)),
])
const shiftOptions = ['All Shifts', 'Morning', 'Afternoon', 'Night']
const statuses = ['Scheduled', 'Completed', 'Absent', 'Leave']

const load = async () => {
  loading.value = true
  const [a, b, c] = await Promise.all([
    supabase.from('staff_shifts').select('*').order('shift_date', { ascending: false }),
    supabase.from('staff').select('id,name,department').order('name'),
    supabase.from('staff_attendance').select('*').order('attendance_date', { ascending: false }),
  ])
  shifts.value = (a.data || []) as Shift[]
  staff.value = b.data || []
  attendance.value = (c.data || []) as Attendance[]
  loading.value = false
}

const filtered = computed(() =>
  shifts.value.filter(
    s =>
      (!search.value || `${s.staff_id} ${getStaff(s.staff_id)?.name || s.staff_name || ''}`.toLowerCase().includes(search.value.toLowerCase()))
      && (department.value === 'All Departments' || getStaff(s.staff_id)?.department === department.value)
      && (shift.value === 'All Shifts' || s.shift === shift.value)
      && (!date.value || s.shift_date === date.value),
  ),
)

const openAdd = () => {
  editing.value = null
  form.value = {
    staff_id: '',
    shift: 'Morning',
    shift_date: '',
    start_time: '',
    end_time: '',
    status: 'Scheduled',
  }
  drawer.value = true
}

const openEdit = (s: Shift) => {
  editing.value = s
  form.value = {
    staff_id: s.staff_id,
    shift: s.shift,
    shift_date: s.shift_date,
    start_time: s.start_time,
    end_time: s.end_time,
    status: s.status,
  }
  drawer.value = true
}

const save = async () => {
  const payload = { ...form.value }
  if (editing.value)
    await supabase.from('staff_shifts').update(payload).eq('id', editing.value.id)
  else
    await supabase.from('staff_shifts').insert(payload)

  drawer.value = false
  await load()
}

const remove = async (s: Shift) => {
  if (confirm('Delete this shift?')) {
    await supabase.from('staff_shifts').delete().eq('id', s.id)
    await load()
  }
}

onMounted(load)

const filteredAttendance = computed(() =>
  attendance.value.filter(
    a =>
      (!attendanceSearch.value || `${a.staff_id} ${getStaff(a.staff_id)?.name || ''}`.toLowerCase().includes(attendanceSearch.value.toLowerCase()))
      && (attendanceDepartment.value === 'All Departments' || getStaff(a.staff_id)?.department === attendanceDepartment.value)
      && (attendanceShift.value === 'All Shifts' || a.shift === attendanceShift.value)
      && (!attendanceDate.value || a.attendance_date === attendanceDate.value),
  ),
)

const openAddAttendance = () => {
  editingAttendance.value = null
  attendanceForm.value = { staff_id: '', shift: 'Morning', attendance_date: '', check_in: '', check_out: '', status: 'Present' }
  attendanceDrawer.value = true
}

const openEditAttendance = (a: Attendance) => {
  editingAttendance.value = a
  attendanceForm.value = {
    staff_id: a.staff_id,
    shift: a.shift,
    attendance_date: a.attendance_date,
    check_in: a.check_in || '',
    check_out: a.check_out || '',
    status: a.status,
  }
  attendanceDrawer.value = true
}

const saveAttendance = async () => {
  const payload = {
    ...attendanceForm.value,
    check_in: attendanceForm.value.check_in || null,
    check_out: attendanceForm.value.check_out || null,
  }
  if (editingAttendance.value)
    await supabase.from('staff_attendance').update(payload).eq('id', editingAttendance.value.id)
  else
    await supabase.from('staff_attendance').insert(payload)

  attendanceDrawer.value = false
  await load()
}
</script>

<template>
  <section>
    <VTabs v-model="tab" class="mb-6">
      <VTab value="shifts">Staff Shifts</VTab>
      <VTab value="attendance">Staff Attendance</VTab>
    </VTabs>

    <VWindow v-model="tab">
      <!-- Staff Shifts Tab -->
      <VWindowItem value="shifts">
        <VCard>
          <!-- Filters Section -->
          <VCardText>
            <div class="text-subtitle-1 font-weight-bold mb-4">Filters</div>
            <VRow align="center">
              <VCol cols="12" md="4">
                <AppSelect v-model="department" :items="departments" placeholder="Department" />
              </VCol>
              <VCol cols="12" md="4">
                <AppSelect v-model="shift" :items="shiftOptions" placeholder="Shift" />
              </VCol>
              <VCol cols="12" md="4">
                <AppTextField v-model="date" type="date" placeholder="Date" persistent-placeholder />
              </VCol>
            </VRow>
          </VCardText>

          <VDivider />

          <!-- Table Controls -->
          <VCardText class="d-flex justify-space-between align-center">
            <AppSelect v-model="itemsPerPage" :items="[5, 10, 20, 50]" style="inline-size: 80px" />
            <div class="d-flex gap-4">
              <AppTextField v-model="search" placeholder="Search" style="inline-size: 220px" />
              <VBtn prepend-icon="tabler-upload">Import Shifts</VBtn>
              <VBtn prepend-icon="tabler-plus" @click="openAdd">Add New Shift</VBtn>
            </div>
          </VCardText>

          <VDivider />

          <!-- Data Table -->
          <VDataTableServer v-model:page="page" v-model:items-per-page="itemsPerPage" :items="filtered"
            :items-length="filtered.length" :headers="[
              { title: 'Staff ID', key: 'staff_id', sortable: false },
              { title: 'Name', key: 'staff_name', sortable: false },
              { title: 'Department', key: 'department', sortable: false },
              { title: 'Shift', key: 'shift', sortable: false },
              { title: 'Date', key: 'shift_date', sortable: false },
              { title: 'Time', key: 'start_time', sortable: false },
              { title: 'Status', key: 'status', sortable: false },
              { title: 'Actions', key: 'actions', sortable: false },
            ]" class="text-no-wrap">
            <template #item.department="{ item }">
              {{ getStaff(item.staff_id)?.department || '—' }}
            </template>
            <template #item.staff_name="{ item }">
              {{staff.find(x => x.id === item.staff_id)?.name || item.staff_name || '—'}}
            </template>
            <template #item.start_time="{ item }">
              {{ item.start_time }} - {{ item.end_time }}
            </template>
            <template #item.status="{ item }">
              <VChip size="small" color="primary" variant="tonal">
                {{ item.status }}
              </VChip>
            </template>
            <template #item.actions="{ item }">
              <IconBtn v-if="$can('manage', 'staff_shift_management')" @click="openEdit(item)">
                <VIcon icon="tabler-edit" />
              </IconBtn>
              <IconBtn v-if="$can('delete', 'staff_shift_management')" @click="remove(item)">
                <VIcon icon="tabler-trash" />
              </IconBtn>
            </template>
            <template #bottom>
              <TablePagination v-model:page="page" :items-per-page="itemsPerPage" :total-items="filtered.length" />
            </template>
          </VDataTableServer>
        </VCard>
      </VWindowItem>

      <!-- Staff Attendance Tab -->
      <VWindowItem value="attendance">
        <VCard>
          <!-- Attendance Filters Section -->
          <VCardText>
            <div class="text-subtitle-1 font-weight-bold mb-4">Filters</div>
            <VRow align="center">
              <VCol cols="12" md="4">
                <AppSelect v-model="attendanceDepartment" :items="departments" placeholder="Department" />
              </VCol>
              <VCol cols="12" md="4">
                <AppSelect v-model="attendanceShift" :items="shiftOptions" placeholder="Shift" />
              </VCol>
              <VCol cols="12" md="4">
                <AppTextField v-model="attendanceDate" type="date" placeholder="Date" persistent-placeholder />
              </VCol>
            </VRow>
          </VCardText>

          <VDivider />

          <!-- Table Controls & Actions -->
          <VCardText class="d-flex justify-space-between align-center">
            <AppSelect v-model="itemsPerPage" :items="[5, 10, 20, 50]" style="inline-size: 80px" />
            <div class="d-flex gap-4 align-center">
              <AppTextField v-model="attendanceSearch" placeholder="Search" style="inline-size: 220px" />
              <VBtn prepend-icon="tabler-plus" @click="openAddAttendance">
                Add Attendance
              </VBtn>
            </div>
          </VCardText>

          <VDivider />

          <!-- Attendance Data Table -->
          <VDataTableServer v-model:page="page" v-model:items-per-page="itemsPerPage" :items="filteredAttendance"
            :items-length="filteredAttendance.length" :headers="[
              { title: 'Staff ID', key: 'staff_id', sortable: false },
              { title: 'Name', key: 'name', sortable: false },
              { title: 'Department', key: 'department', sortable: false },
              { title: 'Shift', key: 'shift', sortable: false },
              { title: 'Date', key: 'attendance_date', sortable: false },
              { title: 'Check In', key: 'check_in', sortable: false },
              { title: 'Check Out', key: 'check_out', sortable: false },
              { title: 'Status', key: 'status', sortable: false },
              { title: 'Actions', key: 'actions', sortable: false },
            ]" class="text-no-wrap">
            <template #item.name="{ item }">
              {{ getStaff(item.staff_id)?.name || '—' }}
            </template>
            <template #item.department="{ item }">
              {{ getStaff(item.staff_id)?.department || '—' }}
            </template>
            <template #item.status="{ item }">
              <VChip size="small" color="success" variant="tonal">
                {{ item.status }}
              </VChip>
            </template>
            <template #item.actions="{ item }">
              <IconBtn v-if="$can('manage', 'staff_shift_management')" @click="openEditAttendance(item)">
                <VIcon icon="tabler-edit" />
              </IconBtn>
            </template>
            <template #bottom>
              <TablePagination v-model:page="page" :items-per-page="itemsPerPage"
                :total-items="filteredAttendance.length" />
            </template>
          </VDataTableServer>
        </VCard>
      </VWindowItem>
    </VWindow>

    <!-- Side Drawer Form for Shift -->
    <VNavigationDrawer v-model="drawer" location="end" temporary :width="460">
      <AppDrawerHeaderSection :title="editing ? 'Edit Shift' : 'Add New Shift'" @cancel="drawer = false" />
      <VDivider />
      <VCard flat>
        <VCardText>
          <VForm @submit.prevent="save">
            <AppSelect v-model="form.staff_id" :items="staff" item-title="name" item-value="id" label="Staff"
              class="mb-4" />
            <AppSelect v-model="form.shift" :items="shiftOptions.slice(1)" label="Shift" class="mb-4" />
            <AppTextField v-model="form.shift_date" type="date" label="Date" class="mb-4" />
            <div class="d-flex gap-3">
              <AppTextField v-model="form.start_time" type="time" label="Start Time" />
              <AppTextField v-model="form.end_time" type="time" label="End Time" />
            </div>
            <AppSelect v-model="form.status" :items="statuses" label="Status" class="mt-4" />
            <div class="d-flex justify-end mt-6">
              <VBtn type="submit" color="primary">Save Shift</VBtn>
            </div>
          </VForm>
        </VCardText>
      </VCard>
    </VNavigationDrawer>

    <!-- Side Drawer Form for Attendance -->
    <VNavigationDrawer v-model="attendanceDrawer" location="end" temporary :width="460">
      <AppDrawerHeaderSection :title="editingAttendance ? 'Edit Attendance' : 'Add Attendance'"
        @cancel="attendanceDrawer = false" />
      <VDivider />
      <VCard flat>
        <VCardText>
          <VForm @submit.prevent="saveAttendance">
            <AppSelect v-model="attendanceForm.staff_id" :items="staff" item-title="name" item-value="id" label="Staff"
              class="mb-4" />
            <AppSelect v-model="attendanceForm.shift" :items="shiftOptions.slice(1)" label="Shift" class="mb-4" />
            <AppTextField v-model="attendanceForm.attendance_date" type="date" label="Date" class="mb-4" />
            <div class="d-flex gap-3">
              <AppTextField v-model="attendanceForm.check_in" type="time" label="Check In" />
              <AppTextField v-model="attendanceForm.check_out" type="time" label="Check Out" />
            </div>
            <AppSelect v-model="attendanceForm.status" :items="['Present', 'Absent', 'Late', 'Leave']" label="Status"
              class="mt-4" />
            <div class="d-flex justify-end mt-6">
              <VBtn type="submit" color="primary">Save Attendance</VBtn>
            </div>
          </VForm>
        </VCardText>
      </VCard>
    </VNavigationDrawer>
  </section>
</template>
