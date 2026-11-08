<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'

type Reading = {
    id: string
    sensor_id: string
    elderly_id: string
    sensor_type: string
    value: number
    recorded_at: string
}

const readings = ref<Reading[]>([])
const sensors = ref<any[]>([])
const elderly = ref<any[]>([])
const zone = ref('All Zones')
const resident = ref('All Residents')
const sensorType = ref('All Sensor Types')
const loading = ref(false)
const page = ref(1)
const itemsPerPage = ref(10)

const load = async () => {
    loading.value = true
    const [r, s, e] = await Promise.all([
        supabase.from('historical_sensor_readings').select('*').order('recorded_at', { ascending: false }),
        supabase.from('sensor_devices').select('id,name,sensor_type,zone'),
        supabase.rpc('resident_directory').order('name'),
    ])
    readings.value = (r.data || []) as Reading[]
    sensors.value = s.data || []
    elderly.value = e.data || []
    loading.value = false
}

const zones = ['All Zones', 'A', 'B', 'C', 'D']
const sensorTypes = computed(() => ['All Sensor Types', ...new Set(sensors.value.map(s => s.sensor_type))])

const filtered = computed(() =>
    readings.value.filter(r => {
        const s = sensors.value.find(x => x.id === r.sensor_id)
        const e = elderly.value.find(x => x.id === r.elderly_id)
        return (
            (zone.value === 'All Zones' || s?.zone === zone.value)
            && (resident.value === 'All Residents' || e?.id === resident.value)
            && (sensorType.value === 'All Sensor Types' || r.sensor_type === sensorType.value)
        )
    }),
)

const range = (type: string) =>
    type.toLowerCase().includes('heart')
        ? '60-100 (healthy 70)'
        : type.toLowerCase().includes('respiratory')
            ? '12-28 (issue >20)'
            : type.toLowerCase().includes('bed')
                ? '0 = In bed'
                : 'Normal range'

const status = (r: Reading) =>
    r.sensor_type.toLowerCase().includes('heart')
        ? r.value >= 60 && r.value <= 100
            ? 'Normal'
            : 'Issue'
        : r.sensor_type.toLowerCase().includes('respiratory')
            ? r.value >= 12 && r.value <= 20
                ? 'Normal'
                : 'Issue'
            : r.value === 0
                ? 'Normal'
                : 'Issue'

const graphPoints = (type: string) => { const values = filtered.value.filter(r => r.sensor_type === type).slice(0, 60).reverse().map(r => r.value); if (!values.length) return ''; const min = Math.min(...values); const max = Math.max(...values, min + 1); return values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * 100},${100 - ((v - min) / (max - min)) * 85 - 5}`).join(' ') }
const referenceY = (type: string) => type.toLowerCase().includes('heart') ? 45 : type.toLowerCase().includes('respiratory') ? 35 : type.toLowerCase().includes('bed') ? 95 : 50
onMounted(load)
</script>

<template>
    <section>
        <VCard>
            <VCardText>
                <div class="text-subtitle-1 font-weight-bold mb-4">Filters</div>
                <VRow>
                    <VCol cols="12" md="4">
                        <AppSelect v-model="zone" :items="zones" placeholder="Zone" />
                    </VCol>
                    <VCol cols="12" md="4">
                        <AppSelect v-model="resident"
                            :items="[{ title: 'All Residents', value: 'All Residents' }, ...elderly.map(e => ({ title: e.name, value: e.id }))]"
                            placeholder="Resident" />
                    </VCol>
                    <VCol cols="12" md="4">
                        <AppSelect v-model="sensorType" :items="sensorTypes" placeholder="Sensor Type" />
                    </VCol>
                </VRow>
            </VCardText>

            <VCardText>
                <div class="d-flex flex-wrap gap-3 mb-6">
                    <VCard v-for="type in [...new Set(filtered.map(r => r.sensor_type))]" :key="type" variant="tonal"
                        class="pa-4 flex-grow-1">
                        <div class="text-subtitle-2">{{ type }}</div>
                        <div class="text-caption">Reference: {{ range(type) }}</div>
                        <div class="text-h4">{{filtered.find(r => r.sensor_type === type)?.value ?? '—'}}</div><svg viewBox="0 0 100 100" preserveAspectRatio="none" class="sensor-chart"><line x1="0" :y1="referenceY(type)" x2="100" :y2="referenceY(type)" stroke="#94a3b8" stroke-dasharray="2 2"/><polyline :points="graphPoints(type)" fill="none" stroke="#168cff" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>
                    </VCard>
                </div>

                <VDataTableServer v-model:page="page" v-model:items-per-page="itemsPerPage" :items="filtered"
                    :items-length="filtered.length" :headers="[
                        { title: 'Recorded At', key: 'recorded_at' },
                        { title: 'Sensor', key: 'sensor_id' },
                        { title: 'Resident', key: 'resident' },
                        { title: 'Type', key: 'sensor_type' },
                        { title: 'Reading', key: 'value' },
                        { title: 'Reference', key: 'reference' },
                        { title: 'Status', key: 'status' },
                    ]" class="text-no-wrap">
                    <template #item.recorded_at="{ item }">
                        {{ new Date(item.recorded_at).toLocaleString() }}
                    </template>
                    <template #item.resident="{ item }">
                        {{elderly.find(e => e.id === item.elderly_id)?.name || '—'}}
                    </template>
                    <template #item.reference="{ item }">
                        {{ range(item.sensor_type) }}
                    </template>
                    <template #item.status="{ item }">
                        <VChip size="small" :color="status(item) === 'Normal' ? 'success' : 'error'" variant="tonal">
                            {{ status(item) }}
                        </VChip>
                    </template>
                    <template #bottom>
                        <TablePagination v-model:page="page" :items-per-page="itemsPerPage"
                            :total-items="filtered.length" />
                    </template>
                </VDataTableServer>
            </VCardText>
        </VCard>
    </section>
</template>
<style scoped>
.sensor-chart { display:block; inline-size:100%; block-size:120px; margin-top:12px; background:rgba(15,23,42,.18); border-radius:6px; }
</style>
