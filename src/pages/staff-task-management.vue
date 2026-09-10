<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'

type Task = { id: string; time?: string; zone?: string | null; elderly?: string | null; task?: string; action?: string; description?: string | null; staff?: string; due_date?: string; priority?: string; status?: string }
const tasks = ref<Task[]>([])
const staff = ref<string[]>([])
const taskCategories = ref<string[]>([])
const loading = ref(false)
const errorMessage = ref('')
const search = ref('')
const selectedStaff = ref<string[]>([])
const selectedPriorities = ref<string[]>([])
const selectedStatuses = ref<string[]>([])
const dateFrom = ref('')
const dateTo = ref('')
const taskDialog = ref(false)
const detailDialog = ref(false)
const editingTask = ref<Task | null>(null)
const taskSaving = ref(false)
const page = ref(1)
const itemsPerPage = ref(10)
const taskForm = ref({ task: '', description: '', staff: '', dueDate: '', priority: 'Medium', status: 'Pending' })
const priorities = ['High', 'Medium', 'Low']
const statuses = ['Completed', 'In Progress', 'Pending']

const load = async () => {
  loading.value = true; errorMessage.value = ''
  const [taskResult, staffResult, categoryResult] = await Promise.all([
    supabase.from('staff_tasks').select('*').order('id'),
    supabase.from('staff').select('name').order('name'),
    supabase.from('staff_task_categories').select('name').order('sort_order').order('name'),
  ])
  if (taskResult.error) errorMessage.value = taskResult.error.message
  tasks.value = (taskResult.data ?? []) as Task[]
  staff.value = [...new Set((staffResult.data ?? []).map(person => person.name).filter(Boolean))]
  taskCategories.value = (categoryResult.data ?? []).map((item: any) => item.name).filter(Boolean)
  loading.value = false
}

const filteredTasks = computed(() => tasks.value.filter(task => {
  const taskName = task.task || task.action || ''
  const matchesSearch = !search.value.trim() || `${taskName} ${task.staff || ''} ${task.id}`.toLowerCase().includes(search.value.trim().toLowerCase())
  const matchesStaff = !selectedStaff.value.length || selectedStaff.value.includes(task.staff || '')
  const matchesPriority = !selectedPriorities.value.length || selectedPriorities.value.includes(task.priority || '')
  const matchesStatus = !selectedStatuses.value.length || selectedStatuses.value.includes(task.status || '')
  return matchesSearch && matchesStaff && matchesPriority && matchesStatus
}))
const priorityColor = (value?: string) => value === 'High' ? 'error' : value === 'Medium' ? 'warning' : 'success'
const statusColor = (value?: string) => value === 'Completed' ? 'success' : value === 'In Progress' ? 'info' : 'warning'
const openAddTask = () => { editingTask.value = null; taskForm.value = { task: '', description: '', staff: '', dueDate: '', priority: 'Medium', status: 'Pending' }; taskDialog.value = true }
const openEditTask = (task: Task) => { editingTask.value = task; taskForm.value = { task: task.task || task.action || '', description: task.description || '', staff: task.staff || '', dueDate: task.due_date || '', priority: task.priority || 'Medium', status: task.status || 'Pending' }; taskDialog.value = true }
const openTaskDetails = (task: Task) => { editingTask.value = task; detailDialog.value = true }
const saveTask = async () => {
  if (!taskForm.value.task.trim() || !taskForm.value.staff) { errorMessage.value = 'Task title and assigned staff are required.'; return }
  taskSaving.value = true
  const legacyTime = editingTask.value?.time || new Date().toTimeString().slice(0, 5)
  const payload = { time: legacyTime, zone: editingTask.value?.zone || '', elderly: editingTask.value?.elderly || '', task: taskForm.value.task.trim(), action: taskForm.value.task.trim(), description: taskForm.value.description.trim() || null, staff: taskForm.value.staff, due_date: taskForm.value.dueDate || null, priority: taskForm.value.priority, status: taskForm.value.status }
  const result = editingTask.value ? await supabase.from('staff_tasks').update(payload).eq('id', editingTask.value.id) : await supabase.from('staff_tasks').insert(payload)
  if (result.error) errorMessage.value = result.error.message; else { taskDialog.value = false; await load() }
  taskSaving.value = false
}
const deleteTask = async (task: Task) => { if (!window.confirm(`Delete task "${task.task || task.action || task.id}"?`)) return; const { error } = await supabase.from('staff_tasks').delete().eq('id', task.id); if (error) errorMessage.value = error.message; else await load() }
onMounted(load)
</script>

<template>
  <section>
    <VCard>
      <VCardText>
        <div class="text-subtitle-1 font-weight-bold mb-4">Filters</div>
        <VRow>
          <VCol cols="12" md="4">
            <AppSelect v-model="selectedStaff" multiple :items="staff" placeholder="Staff" />
          </VCol>
          <VCol cols="12" md="4">
            <AppSelect v-model="selectedPriorities" multiple :items="priorities" placeholder="Priority" />
          </VCol>
          <VCol cols="12" md="4">
            <AppSelect v-model="selectedStatuses" multiple :items="statuses" placeholder="Status" />
          </VCol>
        </VRow>
      </VCardText>
      <VDivider />
      <VCardText class="d-flex justify-space-between align-center flex-wrap gap-4">
        <AppSelect v-model="itemsPerPage" :items="[5, 10, 20, 50]" style="inline-size:80px" />
        <div class="d-flex gap-4 align-center">
          <AppTextField v-model="search" placeholder="Search" prepend-inner-icon="tabler-search"
            style="inline-size:220px" />
          <VBtn prepend-icon="tabler-plus" @click="openAddTask">Add Task</VBtn>
        </div>
      </VCardText>
      <VDivider />
      <VDataTableServer v-model:page="page" v-model:items-per-page="itemsPerPage" :items="filteredTasks" item-value="id"
        :items-length="filteredTasks.length" :headers="[
          { title: 'ID', key: 'id', sortable: false },
          { title: 'Task', key: 'task', sortable: false },
          { title: 'Assigned To', key: 'staff', sortable: false },
          { title: 'Due Date', key: 'due_date', sortable: false },
          { title: 'Priority', key: 'priority', sortable: false },
          { title: 'Status', key: 'status', sortable: false },
          { title: 'Actions', key: 'actions', sortable: false }
        ]" class="text-no-wrap">
        <template #item.priority="{ item }">
          <VChip :color="priorityColor(item.priority)" size="small" variant="tonal">{{ item.priority }}</VChip>
        </template>
        <template #item.status="{ item }">
          <VChip :color="statusColor(item.status)" size="small" variant="tonal">{{ item.status }}</VChip>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn icon variant="text">
              <VIcon icon="tabler-dots-vertical" />
              <VMenu activator="parent">
                <VList>
                  <VListItem @click="openTaskDetails(item)">View</VListItem>
                  <VListItem v-if="$can('manage', 'staff_task_management')" @click="openEditTask(item)">Edit</VListItem>
                  <VListItem v-if="$can('delete', 'staff_task_management')" @click="deleteTask(item)">Delete</VListItem>
                </VList>
              </VMenu>
            </VBtn>
          </div>
        </template>
        <template #bottom>
          <TablePagination v-model:page="page" :items-per-page="itemsPerPage" :total-items="filteredTasks.length" />
        </template>
      </VDataTableServer>
    </VCard>
  </section>
  <VNavigationDrawer v-model="taskDialog" location="end" temporary :width="460">
    <AppDrawerHeaderSection :title="editingTask ? 'Edit Task' : 'Add New Task'" @cancel="taskDialog = false" />
    <VDivider />
    <VCard flat>
      <VCardText>
        <VForm @submit.prevent="saveTask">
          <VRow>
            <VCol cols="12">
              <AppSelect v-model="taskForm.task" :items="taskCategories" label="Task Title" />
            </VCol>
            <VCol cols="12">
              <AppTextarea v-model="taskForm.description" label="Description" rows="3" />
            </VCol>
            <VCol cols="12">
              <AppSelect v-model="taskForm.staff" :items="staff" label="Assigned To" />
            </VCol>
            <VCol cols="12">
              <AppTextField v-model="taskForm.dueDate" type="date" label="Due Date" />
            </VCol>
            <VCol cols="12">
              <AppSelect v-model="taskForm.priority" :items="priorities" label="Priority" />
            </VCol>
            <VCol cols="12">
              <AppSelect v-model="taskForm.status" :items="statuses.slice(1)" label="Status" />
            </VCol>
            <VCol cols="12" class="d-flex justify-end gap-3">
              <VBtn variant="text" @click="taskDialog = false">Cancel</VBtn>
              <VBtn type="submit" color="primary" :loading="taskSaving">Save Task</VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VNavigationDrawer>
</template>

<style scoped lang="scss">
.task-card {
  background: #1d1d22;
  border-radius: 10px;
}

.task-filters {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.task-search {
  flex: 1 1 225px;
  min-inline-size: 210px;
}

.task-filter {
  flex: 0 1 145px;
  min-inline-size: 135px;
}

.task-filters :deep(.v-field) {
  min-height: 46px;
  border-radius: 9px;
  background: #35353b;
}

.task-filters :deep(.v-field__input) {
  min-height: 46px;
  padding-top: 20px;
  font-size: 12px;
}

.task-filters :deep(.v-label) {
  font-size: 10px;
}

.date-filter {
  flex: 1 1 250px;
}

.date-filter label {
  display: block;
  margin: 0 0 5px 2px;
  color: #d7d7dc;
  font-size: 10px;
}

.date-filter>div {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 46px;
  padding: 0 10px;
  border-radius: 9px;
  background: #35353b;
}

.date-filter input {
  min-inline-size: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #eee;
  font-size: 11px;
}

.task-table {
  min-inline-size: 900px;
  background: transparent;
}

.task-table th {
  color: rgb(255 255 255 / 65%);
  font-size: .7rem;
  white-space: nowrap;
}

.task-table td {
  color: rgb(255 255 255 / 88%);
  font-size: .75rem;
}

.task-actions {
  white-space: nowrap;
}

.task-editor {
  overflow: hidden;
  border-radius: 12px;
  background: #202025;
  color: #fff;
}

.task-editor-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 17px;
}

.task-editor-title>span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-editor-body {
  padding: 10px 20px 4px;
}

.task-editor :deep(.v-field) {
  border-radius: 10px;
  background: #36363d;
  box-shadow: none;
}

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.task-editor-actions {
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px 18px;
}

.task-cancel {
  color: #ff4d77;
  text-transform: none;
}
</style>
