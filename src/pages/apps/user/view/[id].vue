<script setup lang="ts">
import UserBioPanel from '@/views/apps/user/view/UserBioPanel.vue'
import { supabase } from '@/lib/supabaseClient'
import UserTabSecurity from '@/views/apps/user/view/UserTabSecurity.vue'

const route = useRoute('apps-user-view-id')

const userTab = ref(null)
const accountEdit = ref(false)
const accountForm = ref<any>({})

const tabs = [
  { icon: 'tabler-users', title: 'Account' },
  { icon: 'tabler-lock', title: 'Security' },
]

const { data: staff } = await supabase.from('staff').select('*').eq('id', route.params.id).maybeSingle()
const { data: activityLogs } = await supabase.from('user_activity_logs').select('*').eq('staff_id', route.params.id).order('occurred_at', { ascending: false }).limit(10)
const userData = computed(() => staff ? {
  id: staff.id, fullName: staff.name || '', firstName: staff.name?.split(' ')[0] || '', lastName: staff.name?.split(' ').slice(1).join(' ') || '',
  company: 'Elderly Care', username: staff.username || '', role: (staff.role || '').toLowerCase(), country: '', contact: staff.phone_number || '', email: staff.email || '',
  currentPlan: 'Staff', status: (staff.status || '').toLowerCase(), avatar: staff.avatar_url || '', taskDone: 0, projectDone: 0, taxId: '', language: 'English', zone: staff.zone, device: staff.device, recent_location: staff.recent_location,
} : null)
const openAccountEdit = () => { accountForm.value = { ...staff }; accountEdit.value = true }
const saveAccount = async () => { if (!staff) return; const { error } = await supabase.from('staff').update({ name: accountForm.value.name, username: accountForm.value.username, role: accountForm.value.role, zone: accountForm.value.zone, status: accountForm.value.status, phone_number: accountForm.value.phone_number, device: accountForm.value.device, recent_location: accountForm.value.recent_location }).eq('id', staff.id); if (!error) { accountEdit.value = false; location.reload() } }
</script>

<template>
  <VRow v-if="userData">
    <VCol
      cols="12"
      md="5"
      lg="4"
    >
      <UserBioPanel :user-data="userData" @edit="openAccountEdit" />
    </VCol>

    <VCol
      cols="12"
      md="7"
      lg="8"
    >
      <VTabs
        v-model="userTab"
        class="v-tabs-pill"
      >
        <VTab
          v-for="tab in tabs"
          :key="tab.icon"
        >
          <VIcon
            :size="18"
            :icon="tab.icon"
            class="me-1"
          />
          <span>{{ tab.title }}</span>
        </VTab>
      </VTabs>

      <VWindow
        v-model="userTab"
        class="mt-6 disable-tab-transition"
        :touch="false"
      >
        <VWindowItem>
        </VWindowItem>

        <VWindowItem><UserTabSecurity :staff-id="String(route.params.id)" /></VWindowItem>

        <VWindowItem>
          <UserTabBillingsPlans />
        </VWindowItem>

        <VWindowItem>
          <UserTabNotifications />
        </VWindowItem>

        <VWindowItem>
          <UserTabConnections />
        </VWindowItem>
      </VWindow>
      <VDialog v-model="accountEdit" max-width="700"><VCard><VCardTitle>Edit User Information</VCardTitle><VCardText><VRow><VCol v-for="field in ['id','name','username','role','zone','status','phone_number','device','recent_location']" :key="field" cols="12" sm="6"><AppTextField v-model="accountForm[field]" :label="field.replace('_',' ')" :readonly="field === 'id'" /></VCol></VRow></VCardText><VCardActions><VSpacer/><VBtn variant="text" @click="accountEdit=false">Cancel</VBtn><VBtn color="primary" @click="saveAccount">Save</VBtn></VCardActions></VCard></VDialog>
      <VCard v-if="userTab === 0" class="mt-6">
        <VCardItem><VCardTitle>User Activity Log</VCardTitle></VCardItem>
        <VCardText>
          <div class="d-flex gap-4 flex-wrap mb-6">
            <VCard variant="tonal" class="pa-4 text-center flex-grow-1"><div class="text-body-2">Login Count</div><div class="text-h4">{{ (activityLogs || []).filter((l: any) => l.succeeded && l.category === 'Login').length }}</div></VCard>
            <VCard variant="tonal" class="pa-4 text-center flex-grow-1"><div class="text-body-2">Failed Attempts</div><div class="text-h4">{{ (activityLogs || []).filter((l: any) => !l.succeeded || l.category === 'Failed Login').length }}</div></VCard>
            <VCard variant="tonal" class="pa-4 text-center flex-grow-1"><div class="text-body-2">Last Active</div><div class="text-h6">{{ activityLogs?.[0]?.occurred_at ? new Date(activityLogs[0].occurred_at).toLocaleString() : 'N/A' }}</div></VCard>
          </div>
          <VTable class="text-no-wrap"><thead><tr><th>Timestamp</th><th>Action</th><th>Details</th></tr></thead><tbody>
            <tr v-for="log in activityLogs" :key="log.id"><td>{{ new Date(log.occurred_at).toLocaleString() }}</td><td>{{ log.category }}</td><td>{{ log.details }}</td></tr>
            <tr v-if="!activityLogs?.length"><td colspan="3" class="text-center py-6">No recent activity logs found.</td></tr>
          </tbody></VTable>
        </VCardText>
      </VCard>
    </VCol>
    <!-- Activity log is intentionally placed in the right column above. -->
    <!--
    <VCol cols="12">
      <VCard>
        <VCardItem><VCardTitle>User Activity Log</VCardTitle></VCardItem>
        <VCardText>
          <div class="d-flex gap-4 flex-wrap mb-6">
            <VCard variant="tonal" class="pa-4 text-center flex-grow-1"><div class="text-body-2">Login Count</div><div class="text-h4">{{ (activityLogs || []).filter((l: any) => l.succeeded && l.category === 'Login').length }}</div></VCard>
            <VCard variant="tonal" class="pa-4 text-center flex-grow-1"><div class="text-body-2">Failed Attempts</div><div class="text-h4">{{ (activityLogs || []).filter((l: any) => !l.succeeded || l.category === 'Failed Login').length }}</div></VCard>
            <VCard variant="tonal" class="pa-4 text-center flex-grow-1"><div class="text-body-2">Last Active</div><div class="text-h6">{{ activityLogs?.[0]?.occurred_at ? new Date(activityLogs[0].occurred_at).toLocaleString() : 'N/A' }}</div></VCard>
          </div>
          <VTable class="text-no-wrap"><thead><tr><th>Timestamp</th><th>Action</th><th>Details</th></tr></thead><tbody>
            <tr v-for="log in activityLogs" :key="log.id"><td>{{ new Date(log.occurred_at).toLocaleString() }}</td><td>{{ log.category }}</td><td>{{ log.details }}</td></tr>
            <tr v-if="!activityLogs?.length"><td colspan="3" class="text-center py-6">No recent activity logs found.</td></tr>
          </tbody></VTable>
        </VCardText>
      </VCard>
    </VCol> -->
  </VRow>
  <div v-else>
    <VAlert
      type="error"
      variant="tonal"
    >
      Invoice with ID  {{ route.params.id }} not found!
    </VAlert>
  </div>
</template>
