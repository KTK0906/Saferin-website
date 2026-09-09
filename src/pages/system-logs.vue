<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'

type Log = {
    id: string
    occurred_at: string
    staff_id?: string | null
    action: string
    log_type: string
    severity: string
    details: string
}

const logs = ref<Log[]>([])
const staff = ref<any[]>([])
const search = ref('')
const logType = ref('All Log Types')
const severity = ref('All Severities')
const page = ref(1)
const itemsPerPage = ref(10)
const loading = ref(false)

const types = [
    'All Log Types',
    'Authentication',
    'System Alert',
    'Data Modification',
    'Care Activity',
    'System Maintenance',
    'Security Alert',
    'Data Creation',
    'Security Change',
]
const severities = ['All Severities', 'Info', 'Warning', 'Error']

const load = async () => {
    loading.value = true
    const [a, b] = await Promise.all([
        supabase.from('system_logs').select('*').order('occurred_at', { ascending: false }),
        supabase.from('staff').select('id,name'),
    ])
    logs.value = (a.data || []) as Log[]
    staff.value = b.data || []
    loading.value = false
}

const filtered = computed(() =>
    logs.value.filter(
        l =>
            (!search.value || `${l.action} ${l.details} ${staff.value.find(s => s.id === l.staff_id)?.name || ''}`.toLowerCase().includes(search.value.toLowerCase()))
            && (logType.value === 'All Log Types' || l.log_type === logType.value)
            && (severity.value === 'All Severities' || l.severity === severity.value),
    ),
)

const paginated = computed(() =>
    filtered.value.slice((page.value - 1) * itemsPerPage.value, page.value * itemsPerPage.value),
)

const copyDetails = (details: string) => navigator.clipboard?.writeText(details)

const exportLogs = () => {
    const csv = [
        'Timestamp,User,Action,Log Type,Severity,Details',
        ...filtered.value.map(l =>
            [
                l.occurred_at,
                staff.value.find(s => s.id === l.staff_id)?.name || '',
                l.action,
                l.log_type,
                l.severity,
                l.details,
            ]
                .map(v => `"${String(v).replaceAll('"', '""')}"`)
                .join(','),
        ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'system-logs.csv'
    a.click()
    URL.revokeObjectURL(a.href)
}

onMounted(load)
</script>

<template>
    <section>
        <div class="d-flex align-center mb-6">
            <h4 class="text-h4 mb-0">System Logs</h4>
        </div>

        <VCard>
            <!-- Filters Section -->
            <VCardText>
                <div class="text-subtitle-1 font-weight-bold mb-4">Filters</div>
                <VRow align="center">
                    <VCol cols="12" sm="6" md="3">
                        <AppSelect v-model="logType" :items="types" placeholder="Log Type" />
                    </VCol>
                    <VCol cols="12" sm="6" md="3">
                        <AppSelect v-model="severity" :items="severities" placeholder="Severity" />
                    </VCol>
                </VRow>
            </VCardText>

            <VDivider />

            <!-- Table Controls & Export -->
            <VCardText class="d-flex justify-space-between align-center flex-wrap gap-4">
                <AppSelect v-model="itemsPerPage" :items="[5, 10, 20, 50]" style="inline-size: 80px" />
                <div class="d-flex gap-4 align-center">
                    <AppTextField v-model="search" placeholder="Search" style="inline-size: 220px" />
                    <VBtn prepend-icon="tabler-download" @click="exportLogs">
                        Export Logs
                    </VBtn>
                </div>
            </VCardText>

            <VDivider />

            <!-- Data Table -->
            <VDataTableServer v-model:page="page" v-model:items-per-page="itemsPerPage" :items="paginated"
                :items-length="filtered.length" :headers="[
                    { title: 'Timestamp', key: 'occurred_at', sortable: false },
                    { title: 'User Name', key: 'user', sortable: false },
                    { title: 'Action', key: 'action', sortable: false },
                    { title: 'Log Type', key: 'log_type', sortable: false },
                    { title: 'Severity', key: 'severity', sortable: false },
                    { title: 'Details', key: 'details', sortable: false },
                    { title: 'Actions', key: 'actions', sortable: false },
                ]" class="text-no-wrap">
                <template #item.occurred_at="{ item }">
                    {{ new Date(item.occurred_at).toLocaleString() }}
                </template>
                <template #item.user="{ item }">
                    {{staff.find(s => s.id === item.staff_id)?.name || 'System'}}
                </template>
                <template #item.severity="{ item }">
                    <VChip size="small"
                        :color="item.severity === 'Error' ? 'error' : item.severity === 'Warning' ? 'warning' : 'info'"
                        variant="tonal">
                        {{ item.severity }}
                    </VChip>
                </template>
                <template #item.actions="{ item }">
                    <VBtn icon variant="text">
                        <VIcon icon="tabler-dots-vertical" />
                        <VMenu activator="parent">
                            <VList>
                                <VListItem @click="copyDetails(item.details)">
                                    Copy Details
                                </VListItem>
                            </VList>
                        </VMenu>
                    </VBtn>
                </template>
                <template #bottom>
                    <TablePagination v-model:page="page" :items-per-page="itemsPerPage"
                        :total-items="filtered.length" />
                </template>
            </VDataTableServer>
        </VCard>
    </section>
</template>