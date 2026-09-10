<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'

const categories = ['Alert Related', 'Request Related', 'Permission Related', 'Elderly Extra Fields', 'Staff Task Categories']
const roles = ['Principal', 'Lead Nurse', 'OT/PT', 'Nurse', 'Caregiver']
const pages = ['User Management', 'Staff Task Management', 'Zone Management', 'Reports', 'Family Visits', 'Staff Shift Management', 'Historical Sensor Data', 'Alert/ Request History', 'Sensor Management', 'Dashboard', 'Elderly List', 'House Management', 'Device Management', 'System Logs', 'System Settings']

const tab = ref('Alert Related')
const role = ref('Principal')
const rows = ref<any[]>([])
const drawer = ref(false)
const editing = ref<any>(null)
const saving = ref(false)
const error = ref('')

const form = ref({ name: '', description: '', value: '', unit: '' })
const normalize = (s: string) => s.toLowerCase().replace(/[_-]/g, ' ').trim()
const defaultPermissions = (page: string) => ['read', 'write']
const table = () => tab.value === 'Permission Related' ? 'page_permissions' : tab.value === 'Elderly Extra Fields' ? 'elderly_extra_fields' : tab.value === 'Staff Task Categories' ? 'staff_task_categories' : 'system_settings'
const permissionText = (r: any) => (r.permissions || []).map((p: string) => p[0].toUpperCase() + p.slice(1)).join(', ') || 'None'
const iconLabel = (icon: string) => icon.replace(/^tabler-/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

async function load() {
  error.value = ''
  const t = table()
  let q: any

  if (t === 'system_settings') {
    q = supabase.from(t).select('*').eq('category', tab.value).order('created_at')
  } else if (t === 'page_permissions') {
    q = supabase.from(t).select('*').order('page_name')
  } else {
    q = supabase.from(t).select('*').order(t === 'staff_task_categories' ? 'sort_order' : 'created_at')
  }

  const { data, error: e } = await q
  if (e) {
    error.value = e.message
    return
  }

  if (t === 'page_permissions') {
    rows.value = pages.map(page => {
      const found = (data || []).find((r: any) => r.page_name === page)
      const allowed = (found?.allowed_roles || []).some((x: string) => normalize(x) === normalize(role.value))
      return {
        ...(found || {}),
        id: found?.id || `virtual-${page}`,
        page_name: page,
        allowed_roles: allowed ? (found.allowed_roles || []) : [],
        permissions: allowed ? (found.permissions || defaultPermissions(page)) : []
      }
    })
  } else {
    rows.value = data || []
  }
}

function openAdd() {
  editing.value = null
  form.value = { name: '', description: '', value: '', unit: '' }
  drawer.value = true
}

function openEdit(r: any) {
  editing.value = r
  form.value = {
    name: r.page_name || r.setting_key || r.name || '',
    description: r.description || '',
    value: tab.value === 'Permission Related' ? (r.permissions || []) : (r.value || r.icon || ''),
    unit: r.unit || ''
  }
  drawer.value = true
}

async function save() {
  saving.value = true
  const t = table()
  let result: any

  if (t === 'page_permissions') {
    const perms = (Array.isArray(form.value.value) ? form.value.value : form.value.value.split(','))
      .map((x: string) => x.trim().toLowerCase())
      .filter((x: string) => ['read', 'write', 'delete'].includes(x))

    const payload = {
      page_name: editing.value.page_name,
      allowed_roles: perms.length ? [role.value] : [],
      permissions: perms
    }

    if (String(editing.value.id).startsWith('virtual-')) {
      result = await supabase.from(t).insert(payload)
    } else {
      result = await supabase.from(t).update(payload).eq('id', editing.value.id)
    }
  } else {
    const payload: any = t === 'system_settings'
      ? { category: tab.value, setting_key: form.value.name, description: form.value.description, value: form.value.value, unit: form.value.unit }
      : t === 'elderly_extra_fields'
        ? { name: form.value.name, description: form.value.description, is_required: form.value.value === 'true' }
        : { name: form.value.name, icon: form.value.value, sort_order: Number(form.value.unit) || 0 }

    result = editing.value
      ? await supabase.from(t).update(payload).eq('id', editing.value.id)
      : await supabase.from(t).insert(payload)
  }

  saving.value = false
  if (result.error) {
    error.value = result.error.message
  } else {
    drawer.value = false
    await load()
  }
}

async function remove(r: any) {
  if (!confirm('Remove this permission?')) return
  const t = table()
  let result: any

  if (t === 'page_permissions') {
    const roles = (r.allowed_roles || []).filter((x: string) => normalize(x) !== normalize(role.value))
    result = await supabase.from(t).update({ allowed_roles: roles }).eq('id', r.id)
  } else {
    result = await supabase.from(t).delete().eq('id', r.id)
  }

  if (result.error) error.value = result.error.message
  await load()
}

onMounted(load)
</script>

<template>
  <section>
    <h4 class="text-h4 mb-6">System Settings</h4>

    <VCard>
      <!-- 主 Category Tabs -->
      <VTabs v-model="tab" @update:model-value="load">
        <VTab v-for="c in categories" :key="c" :value="c">{{ c }}</VTab>
      </VTabs>

      <VDivider />

      <!-- 次層 Role 選擇器：採用乾淨的 Chip 標籤組 -->
      <div
        v-if="tab === 'Permission Related'"
        class="d-flex align-center justify-space-between px-6 py-3 flex-wrap gap-4 border-b"
      >
        <div class="d-flex align-center gap-2">
          <span class="text-subtitle-2 text-medium-emphasis me-2">Role:</span>
          <VChipGroup
            v-model="role"
            mandatory
            selected-class="bg-primary text-white"
            @update:model-value="load"
          >
            <VChip
              v-for="r in roles"
              :key="r"
              :value="r"
              variant="tonal"
              size="default"
              class="font-weight-medium px-4"
              style="cursor: pointer;"
            >
              {{ r }}
            </VChip>
          </VChipGroup>
        </div>

        <VBtn color="primary" prepend-icon="tabler-plus" @click="openAdd">
          Add {{ tab }}
        </VBtn>
      </div>

      <!-- 非 Permission 頁面的按鈕列 -->
      <VCardText v-else class="d-flex justify-end">
        <VBtn color="primary" prepend-icon="tabler-plus" @click="openAdd">
          Add {{ tab }}
        </VBtn>
      </VCardText>

      <VCardText>
        <VAlert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</VAlert>

        <VTable class="text-no-wrap">
          <thead>
            <tr>
              <th>{{ tab === 'Permission Related' || tab === 'Elderly Extra Fields' || tab === 'Staff Task Categories' ? 'Name' : 'Key' }}</th>
              <th>{{ tab === 'Permission Related' ? 'Role' : (tab === 'Staff Task Categories' ? 'Icon' : 'Description') }}</th>
              <th>{{ tab === 'Permission Related' ? 'Permission' : (tab === 'Elderly Extra Fields' ? 'Options' : (tab === 'Staff Task Categories' ? 'Order' : 'Value')) }}</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id">
              <td>{{ r.page_name || r.setting_key || r.name }}</td>
              <td>{{ tab === 'Permission Related' ? role : (tab === 'Staff Task Categories' ? '' : (r.description || '—')) }}<VIcon v-if="tab === 'Staff Task Categories' && r.icon" :icon="r.icon" size="22" /></td>
              <td>{{ tab === 'Permission Related' ? permissionText(r) : (tab === 'Elderly Extra Fields' ? (r.is_required ? 'Required' : 'Optional') : (tab === 'Staff Task Categories' ? (r.sort_order ?? 0) : (r.value || '—'))) }}</td>
              <td class="text-end">
                <VBtn icon="tabler-edit" variant="text" size="small" @click="openEdit(r)" />
                <VBtn icon="tabler-trash" variant="text" size="small" color="error" @click="remove(r)" />
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="4" class="text-center py-6">No settings found.</td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>
    </VCard>

    <!-- 右側抽屜 Drawer -->
    <VNavigationDrawer v-model="drawer" location="end" temporary :width="460">
      <AppDrawerHeaderSection :title="editing ? 'Edit Setting' : 'Add Setting'" @cancel="drawer = false" />
      <VCardText>
        <VForm @submit.prevent="save">
          <AppTextField
            v-model="form.name"
            :label="tab === 'Permission Related' ? 'Page' : 'Name / Key'"
            class="mb-4"
            :readonly="tab === 'Permission Related'"
          />

          <template v-if="tab === 'Permission Related'">
            <VLabel class="mb-2">Permissions</VLabel>
            <div class="d-flex flex-column gap-1 mb-4">
              <VCheckbox v-model="form.value" value="read" label="Read" hide-details />
              <VCheckbox v-model="form.value" value="write" label="Write" hide-details />
              <VCheckbox v-model="form.value" value="delete" label="Delete" hide-details />
            </div>
          </template>

          <template v-else-if="tab === 'Staff Task Categories'">
            <AppSelect v-model="form.value" :items="['tabler-check','tabler-user','tabler-heart','tabler-pill','tabler-clock','tabler-alert-circle']" label="Task Icon" class="mb-4">
              <template #item="{ props, item }"><VListItem v-bind="props" :title="iconLabel(item.value)"><template #prepend><VIcon :icon="item.value" /></template></VListItem></template>
              <template #selection="{ item }"><VIcon :icon="item.value" size="20" class="me-2" />{{ iconLabel(item.value) }}</template>
            </AppSelect>
            <AppTextField v-model="form.unit" type="number" label="Task Order" hint="0 is highest priority" persistent-hint class="mb-4" />
          </template>
          <template v-else>
            <AppTextField v-model="form.description" label="Description" class="mb-4" />
            <AppTextField v-model="form.value" label="Value" class="mb-4" />
            <AppTextField v-model="form.unit" label="Unit / Order" class="mb-4" />
          </template>

          <div class="d-flex justify-end gap-3 mt-6">
            <VBtn variant="text" @click="drawer = false">Cancel</VBtn>
            <VBtn type="submit" color="primary" :loading="saving">Save</VBtn>
          </div>
        </VForm>
      </VCardText>
    </VNavigationDrawer>
  </section>
</template>
