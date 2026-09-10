<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'

type Device = {
    id: string
    name: string
    model: string
    assigned_to?: string | null
    status: string
    last_sync?: string | null
    location?: string | null
}

const devices = ref<Device[]>([])
const staff = ref<any[]>([])
const search = ref('')
const status = ref('All Statuses')
const drawer = ref(false)
const editing = ref<Device | null>(null)
const loading = ref(false)
const page = ref(1)
const itemsPerPage = ref(10)

const statuses = ['All Statuses', 'Active', 'Maintenance', 'Inactive']
const form = ref({
    name: '',
    model: '',
    assigned_to: '',
    status: 'Active',
    last_sync: '',
    location: '',
})

const load = async () => {
    loading.value = true
    const [d, s] = await Promise.all([
        supabase.from('devices').select('*').order('name'),
        supabase.from('staff').select('id,name').order('name'),
    ])
    devices.value = (d.data || []) as Device[]
    staff.value = s.data || []
    loading.value = false
}

const filtered = computed(() =>
    devices.value.filter(
        d =>
            (!search.value || `${d.id} ${d.name} ${d.model} ${d.location || ''}`.toLowerCase().includes(search.value.toLowerCase()))
            && (status.value === 'All Statuses' || d.status === status.value),
    ),
)

const openAdd = () => {
    editing.value = null
    form.value = {
        name: '',
        model: '',
        assigned_to: '',
        status: 'Active',
        last_sync: '',
        location: '',
    }
    drawer.value = true
}

const openEdit = (d: Device) => {
    editing.value = d
    form.value = {
        name: d.name,
        model: d.model,
        assigned_to: d.assigned_to || '',
        status: d.status,
        last_sync: d.last_sync || '',
        location: d.location || '',
    }
    drawer.value = true
}

const save = async () => {
    const payload = {
        ...form.value,
        last_sync: form.value.last_sync || null,
        assigned_to: form.value.assigned_to || null,
    }
    if (editing.value)
        await supabase.from('devices').update(payload).eq('id', editing.value.id)
    else
        await supabase.from('devices').insert(payload)

    drawer.value = false
    await load()
}

const remove = async (d: Device) => {
    if (confirm(`Delete ${d.name}?`)) {
        await supabase.from('devices').delete().eq('id', d.id)
        await load()
    }
}

onMounted(load)
</script>

<template>
    <section>
        <VCard>
            <!-- Filters Section -->
            <VCardText>
                <div class="text-subtitle-1 font-weight-bold mb-4">Filters</div>
                <VRow align="center">
                    <VCol cols="12" sm="6" md="3">
                        <AppSelect v-model="status" :items="statuses" placeholder="Status" style="inline-size: 200px" />
                    </VCol>
                </VRow>
            </VCardText>

            <VDivider />

            <!-- Table Controls & Actions -->
            <VCardText class="d-flex justify-space-between align-center flex-wrap gap-4">
                <AppSelect v-model="itemsPerPage" :items="[5, 10, 20, 50]" style="inline-size: 80px" />
                <div class="d-flex gap-4 align-center">
                    <AppTextField v-model="search" placeholder="Search" style="inline-size: 220px" />
                    <VBtn prepend-icon="tabler-plus" @click="openAdd">
                        Add Device
                    </VBtn>
                </div>
            </VCardText>

            <VDivider />

            <!-- Data Table -->
            <VDataTableServer v-model:page="page" v-model:items-per-page="itemsPerPage" :items="filtered"
                :items-length="filtered.length" :headers="[
                    { title: 'Device ID', key: 'id', sortable: false },
                    { title: 'Name', key: 'name', sortable: false },
                    { title: 'Model', key: 'model', sortable: false },
                    { title: 'Assigned To', key: 'assigned', sortable: false },
                    { title: 'Status', key: 'status', sortable: false },
                    { title: 'Last Sync', key: 'last_sync', sortable: false },
                    { title: 'Location', key: 'location', sortable: false },
                    { title: 'Actions', key: 'actions', sortable: false },
                ]" class="text-no-wrap">
                <template #item.assigned="{ item }">
                    {{staff.find(s => s.id === item.assigned_to)?.name || 'Unassigned'}}
                </template>
                <template #item.status="{ item }">
                    <VChip size="small"
                        :color="item.status === 'Active' ? 'success' : item.status === 'Maintenance' ? 'warning' : 'error'"
                        variant="tonal">
                        {{ item.status }}
                    </VChip>
                </template>
                <template #item.actions="{ item }">
                    <IconBtn v-if="$can('manage', 'device_management')" @click="openEdit(item)">
                        <VIcon icon="tabler-edit" />
                    </IconBtn>
                    <IconBtn v-if="$can('delete', 'device_management')" @click="remove(item)">
                        <VIcon icon="tabler-trash" />
                    </IconBtn>
                </template>
                <template #bottom>
                    <TablePagination v-model:page="page" :items-per-page="itemsPerPage"
                        :total-items="filtered.length" />
                </template>
            </VDataTableServer>
        </VCard>

        <!-- Side Drawer Form -->
        <VNavigationDrawer v-model="drawer" location="end" temporary :width="460">
            <AppDrawerHeaderSection :title="editing ? 'Edit Device' : 'Add New Device'" @cancel="drawer = false" />
            <VDivider />
            <VCard flat>
                <VCardText>
                    <VForm @submit.prevent="save">
                        <AppTextField v-model="form.name" label="Device Name" class="mb-4" />
                        <AppTextField v-model="form.model" label="Model" class="mb-4" />
                        <AppSelect v-model="form.assigned_to" :items="staff" item-title="name" item-value="id"
                            label="Assigned To" class="mb-4" />
                        <AppSelect v-model="form.status" :items="statuses.slice(1)" label="Status" class="mb-4" />
                        <AppTextField v-model="form.last_sync" type="datetime-local" placeholder="Last Sync"
                            persistent-placeholder class="mb-4" />
                        <AppTextField v-model="form.location" label="Location" class="mb-4" />
                        <div class="d-flex justify-end">
                            <VBtn type="submit" color="primary">Save Device</VBtn>
                        </div>
                    </VForm>
                </VCardText>
            </VCard>
        </VNavigationDrawer>
    </section>
</template>
