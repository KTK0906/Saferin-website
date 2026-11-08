<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import {residentAge} from '@/utils/resident-profile-data'
import type { RealtimeChannel } from '@supabase/supabase-js'
import ElderlyFormDialog from '@/components/ElderlyFormDialog.vue'
import ResidentForms from '@/components/ResidentForms.vue'
import type {ResidentContext,ResidentFormRow} from '@/utils/resident-forms-service'

export interface ElderlyRecord {
    id: string
    zone: string
    bed: string
    name: string
    resident_name?: string
    avatar_url?: string
    age: number | null
    care_level: string
    last_activity: string
    sensor_status: string
    status?: string | null
    details?: string | null
    created_at?: string
}

export interface DetailedElderlyData {
    personal: {
        age?: number
        room_bed?: string
        status?: string
        caregiver?: string
        avatar_url?: string
    }
    contacts: {
        primary?: string
        secondary?: string
        doctor?: string
    }
    medical: {
        conditions?: string[]
        allergies?: string[]
        medications?: string
    }
    lastCheck: {
        date?: string
        doctor?: string
        notes?: string
        next_visit?: string
    }
}

// Data State
const elderlyList = ref<ElderlyRecord[]>([])
const loading = ref(true)
const fetchError = ref('')
const lastUpdated = ref('')
const isElderlyFormOpen = ref(false)
const elderlyToEdit = ref<ElderlyRecord | null>(null)
const formResident=ref<ResidentContext|null>(null)
const savedFormResident=ref<string|null>(null)
const formNotice=ref('')
function handleFormSaved(row:ResidentFormRow){savedFormResident.value=row.elderly_id;formNotice.value=`Form saved for ${formResident.value?.name||'this resident'}.`}

// Modal / Dialog State
const showDetailsModal = ref(false)
const activeTab = ref('overview')
const modalLoading = ref(false)
const selectedElderlyName = ref('')
const selectedLocation = ref('')

const detailedData = ref<DetailedElderlyData>({
    personal: {},
    contacts: {},
    medical: { conditions: [], allergies: [] },
    lastCheck: {}
})

// Filter Controls State
const searchQuery = ref('')
const selectedZone = ref<string | null>(null)
const selectedCareLevel = ref<string | null>(null)
const selectedAgeRange = ref<string | null>(null)
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

const updateOptions = (options: any) => {
    sortBy.value = options.sortBy?.[0]?.key
    orderBy.value = options.sortBy?.[0]?.order
}

// Dropdown Options
const zoneOptions = ['All', 'A', 'B', 'C', 'D']
const careLevelOptions = ['All', 'Disabled', 'Normal', 'Mental Issue', 'Emergency']
const ageRangeOptions = ['All', '60-69', '70-79', '80+']

let realtimeChannel: RealtimeChannel | null = null

const fetchElderlyData = async () => {
    loading.value = true
    fetchError.value = ''

    try {
        const { data, error } = await supabase
            .from('elderly')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        elderlyList.value = (data ?? []).map(item => ({
            ...item,
            age:residentAge(item),
            name: item.name || item.resident_name || ''
        }))

        const now = new Date()
        const hkTimeStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Hong_Kong',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(now).replace(',', '')

        lastUpdated.value = hkTimeStr
    } catch (err: any) {
        console.error('Error fetching elderly list:', err)
        fetchError.value = err.message || 'Failed to fetch data from Supabase.'
    } finally {
        loading.value = false
    }
}

const router = useRouter()

const openElderlyDetail = (item: ElderlyRecord) => router.push(`/elderly-view/${item.id}`)

const openNewElderly = () => {
    elderlyToEdit.value = null
    isElderlyFormOpen.value = true
}

const openEditElderly = (item: ElderlyRecord) => {
    elderlyToEdit.value = item
    isElderlyFormOpen.value = true
}

const handleElderlySaved = async () => {
    await fetchElderlyData()
}

const deleteElderly = async (item: ElderlyRecord) => {
    if (!window.confirm(`Delete elderly record for "${item.name}"?`)) return

    const { error } = await supabase.from('elderly').delete().eq('id', item.id)
    if (error) {
        fetchError.value = error.message
        return
    }

    await fetchElderlyData()
}

const setupRealtimeSubscription = () => {
    realtimeChannel = supabase
        .channel('public:elderly')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'elderly' },
            () => {
                fetchElderlyData()
            }
        )
        .subscribe()
}

onMounted(() => {
    fetchElderlyData()
    setupRealtimeSubscription()
})

onUnmounted(() => {
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
    }
})

const filteredElderlyList = computed(() => {
    return elderlyList.value.filter((item) => {
        const matchesName = !searchQuery.value ||
            item.name.toLowerCase().includes(searchQuery.value.toLowerCase())

        const matchesZone = !selectedZone.value ||
            selectedZone.value === 'All' ||
            item.zone === selectedZone.value

        const matchesCareLevel = !selectedCareLevel.value ||
            selectedCareLevel.value === 'All' ||
            item.care_level === selectedCareLevel.value

        let matchesAge = true
        if (selectedAgeRange.value && selectedAgeRange.value !== 'All') {
            if (selectedAgeRange.value === '60-69') {
                matchesAge = item.age !== null && item.age >= 60 && item.age <= 69
            } else if (selectedAgeRange.value === '70-79') {
                matchesAge = item.age !== null && item.age >= 70 && item.age <= 79
            } else if (selectedAgeRange.value === '80+') {
                matchesAge = item.age !== null && item.age >= 80
            }
        }

        return matchesName && matchesZone && matchesCareLevel && matchesAge
    })
})

const getInitials = (name: string) => {
    if (!name) return ''
    return name.slice(0, 3)
}

const getSensorStatusColor = (status: string) => {
    switch (status) {
        case 'Issue':
        case 'Warning': return 'warning'
        case 'Error': return 'error'
        case 'Normal':
        case 'Good': return 'success'
        default: return 'default'
    }
}
</script>

<template>
    <div class="ecommerce-list-layout">
        <VAlert v-if="formNotice" type="success" variant="tonal" closable class="mb-5" @click:close="formNotice=''">{{formNotice}}<VBtn variant="text" size="small" @click="router.push({path:`/elderly-view/${savedFormResident}`,query:{tab:'forms'}})">View Forms</VBtn></VAlert>
        <VCard>
            <!-- Filter Section -->
            <VCardText class="pa-6">
                <div class="text-subtitle-1 font-weight-bold text-white mb-3">Filters</div>
                <VRow dense class="mb-4">
                    <VCol cols="12" sm="4">
                        <AppSelect v-model="selectedZone" :items="zoneOptions" placeholder="Zone" clearable />
                    </VCol>
                    <VCol cols="12" sm="4">
                        <AppSelect v-model="selectedCareLevel" :items="careLevelOptions" placeholder="Care Level"
                            clearable />
                    </VCol>
                    <VCol cols="12" sm="4">
                        <AppSelect v-model="selectedAgeRange" :items="ageRangeOptions" placeholder="Age" clearable />
                    </VCol>
                </VRow>

                <VDivider class="mb-4" />

                <!-- Action Controls Bar -->
                <div class="d-flex justify-space-between flex-wrap gap-4 align-center">
                    <!-- Items per page dropdown in the original position on the left -->
                    <AppSelect v-model="itemsPerPage" :items="[5, 10, 20, 50, 100]" style="width: 80px;" />

                    <!-- Search bar on the left hand side of the Add Elderly button -->
                    <div class="d-flex flex-row gap-4 align-center">
                        <AppTextField v-model="searchQuery" style="max-inline-size: 220px; min-inline-size: 220px;"
                            placeholder="Search" prepend-inner-icon="tabler-search" clearable />
                        <VBtn prepend-icon="tabler-plus" color="primary" @click="openNewElderly">
                            Add Elderly
                        </VBtn>
                    </div>
                </div>
            </VCardText>

            <!-- Table Data Section -->
            <VDataTableServer v-model:items-per-page="itemsPerPage" v-model:page="page" :items="filteredElderlyList"
                item-value="id" :headers="[
                    { title: 'Elderly', key: 'name', sortable: false },
                    { title: 'Zone', key: 'zone', sortable: false },
                    { title: 'Bed', key: 'bed', sortable: false },
                    { title: 'Age', key: 'age', sortable: false },
                    { title: 'Care Level', key: 'care_level', sortable: false },
                    { title: 'Last Activity', key: 'last_activity', sortable: false },
                    { title: 'Sensor Status', key: 'sensor_status', sortable: false },
                    { title: 'Actions', key: 'actions', sortable: false, align: 'center' },
                ]" :items-length="filteredElderlyList.length" class="text-no-wrap" @update:options="updateOptions">
                <template #item.name="{ item }">
                    <div class="d-flex align-center gap-x-3">
                        <VAvatar size="34" variant="tonal">
                            <VImg v-if="item.avatar_url" :src="item.avatar_url" />
                            <span v-else>{{ getInitials(item.name) }}</span>
                        </VAvatar>
                        <span class="font-weight-medium">{{ item.name }}</span>
                    </div>
                </template>

                <template #item.care_level="{ item }">
                    <VChip color="primary" size="small" variant="tonal">{{ item.care_level || 'Normal' }}</VChip>
                </template>

                <template #item.sensor_status="{ item }">
                    <VChip :color="getSensorStatusColor(item.sensor_status)" size="small" variant="tonal">
                        {{ item.sensor_status }}
                    </VChip>
                </template>

                <template #item.actions="{ item }">
                    <div class="d-flex justify-center align-center gap-1">
                        <VMenu location="bottom end">
                            <template #activator="{ props: menuProps }">
                                <VBtn v-bind="menuProps" icon="tabler-dots-vertical" variant="text" color="secondary"
                                    size="small" aria-label="Elderly actions" />
                            </template>
                            <VList density="compact">
                                <VListItem prepend-icon="tabler-eye" title="View" @click="openElderlyDetail(item)" />
                                <VListItem v-if="$can('read','elderly_list')&&$can('manage','elderly_list')" prepend-icon="tabler-file-plus" title="Create Form" @click="formResident=item" />
                                <VListItem v-if="$can('manage', 'elderly_list')" prepend-icon="tabler-edit" title="Edit" @click="openEditElderly(item)" />
                                <VListItem v-if="$can('delete', 'elderly_list')" prepend-icon="tabler-trash" title="Delete" @click="deleteElderly(item)" />
                            </VList>
                        </VMenu>
                    </div>
                </template>

                <template #bottom>
                    <TablePagination v-model:page="page" :items-per-page="itemsPerPage"
                        :total-items="filteredElderlyList.length" />
                </template>
            </VDataTableServer>
        </VCard>
    </div>

    <!-- Elderly Detail Side Drawer / Dialog Component -->
    <ElderlyFormDialog v-model="isElderlyFormOpen" :elderly="elderlyToEdit" @saved="handleElderlySaved" />
    <ResidentForms v-if="formResident" :key="formResident.id" :resident="formResident" :show-list="false" create-on-mount @saved="handleFormSaved" @close="formResident=null" />
</template>

<style scoped>
:deep(.v-table) {
    background: transparent !important;
}

:deep(.v-table th) {
    padding: 0.75rem 1rem !important;
    border-bottom: 1px solid #334155 !important;
    color: #94a3b8 !important;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}

:deep(.v-table td) {
    padding: 0.85rem 1rem !important;
    border-bottom: 1px solid rgba(51, 65, 85, 0.4) !important;
    font-size: 0.875rem;
    vertical-align: middle;
}
</style>
