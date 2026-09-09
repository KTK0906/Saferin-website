import type { Rule } from '@/plugins/casl/ability'
import { ability } from '@/plugins/casl/ability'
import { supabase } from '@/lib/supabaseClient'

export const roles = ['admin', 'principal', 'lead_nurse', 'nurse', 'ot_pt', 'caregiver'] as const
export type AppRole = typeof roles[number]

export const roleLabels: Record<AppRole, string> = {
  admin: 'Admin',
  principal: 'Principal',
  lead_nurse: 'Lead Nurse',
  nurse: 'Nurse',
  ot_pt: 'OT/PT',
  caregiver: 'Caregiver',
}

// Maps Database text entries (e.g. "Principal", "Lead Nurse", "OT/PT") to app keys
export const dbRoleToAppRole: Record<string, AppRole> = {
  'admin': 'admin',
  'principal': 'principal',
  'lead nurse': 'lead_nurse',
  'lead_nurse': 'lead_nurse',
  'nurse': 'nurse',
  'ot/pt': 'ot_pt',
  'ot_pt': 'ot_pt',
  'caregiver': 'caregiver',
}

let loadedUserId: string | null = null
let loadedRole: AppRole | null = null

// Exact match with your database table rules
export const pageAccess = {
  dashboard: ['admin', 'principal', 'lead_nurse', 'nurse', 'ot_pt', 'caregiver'],
  elderly_list: ['admin', 'principal', 'lead_nurse', 'ot_pt', 'caregiver'],
  family_visits: ['admin', 'principal', 'lead_nurse', 'nurse', 'ot_pt', 'caregiver'],
  staff_assignment_history: ['admin', 'principal', 'lead_nurse'],
  alert_history: ['admin', 'principal', 'lead_nurse', 'nurse', 'ot_pt', 'caregiver'],
  historical_sensor_data: ['admin', 'principal', 'lead_nurse', 'nurse', 'ot_pt', 'caregiver'],
  reports: ['admin', 'principal', 'lead_nurse', 'nurse', 'ot_pt', 'caregiver'],
  sensor_management: ['admin', 'principal', 'lead_nurse', 'nurse', 'caregiver'], // Added 'principal'
  staff_task_management: ['admin', 'principal', 'lead_nurse'],
  staff_shift_management: ['admin', 'principal', 'lead_nurse'],
  user_management: ['admin', 'principal', 'lead_nurse'],
  device_management: ['admin'],
  zone_management: ['admin', 'principal', 'lead_nurse'],
  house_management: ['admin'],
  system_settings: ['admin'],
  system_logs: ['admin'],
  personal_settings: ['admin', 'principal', 'lead_nurse', 'nurse', 'ot_pt', 'caregiver'],
} as const satisfies Record<string, readonly AppRole[]>

export type PagePermission = keyof typeof pageAccess

export const getRoleRules = (role: AppRole): Rule[] => {
  if (role === 'admin') {
    const allSubjects = Object.keys(pageAccess) as PagePermission[]
    
    return [
      { action: 'manage', subject: 'all' },
      { action: 'read', subject: 'all' },
      ...allSubjects.map(subject => ({ action: 'read' as const, subject })),
      ...allSubjects.map(subject => ({ action: 'manage' as const, subject })),
    ]
  }

  return (Object.entries(pageAccess) as [PagePermission, readonly AppRole[]][])
    .filter(([, permittedRoles]) => permittedRoles.includes(role))
    .flatMap(([subject]) => [
      { action: 'read' as const, subject },
      { action: 'manage' as const, subject },
    ])
}

export const applyRolePermissions = (role: AppRole) => {
  const rules = getRoleRules(role)

  console.log(`[PERMISSIONS DEBUG] Applying ${rules.length} rules for role: "${role}"`)
  ability.update(rules)

  useCookie<Rule[]>('userAbilityRules').value = rules
  useCookie<AppRole>('userRole').value = role
}

export const clearRolePermissions = () => {
  ability.update([])
  useCookie<Rule[] | null>('userAbilityRules').value = null
  useCookie<AppRole | null>('userRole').value = null
  loadedUserId = null
  loadedRole = null
}

export const loadCurrentUserRole = async (forceRefresh = true): Promise<AppRole | null> => {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) {
    clearRolePermissions()
    return null
  }

  if (!forceRefresh && loadedUserId === user.id && loadedRole)
    return loadedRole

  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[PERMISSIONS DEBUG] Supabase Query Error:', error.message)
    }

    // Clean up role string (e.g., "Principal " -> "principal")
    const rawRole = (data?.role || user.user_metadata?.role || '').trim().toLowerCase()
    
    const realRole = dbRoleToAppRole[rawRole] 
      || (roles.includes(rawRole as AppRole) ? (rawRole as AppRole) : 'caregiver')

    console.log('[PERMISSIONS DEBUG] Resolved Role:', `"${data?.role}" -> "${realRole}"`)

    loadedUserId = user.id
    loadedRole = realRole
    applyRolePermissions(realRole)

    return realRole
  } catch (error) {
    console.error('[PERMISSIONS DEBUG] Role resolution failed:', error)
    applyRolePermissions('caregiver')
    return 'caregiver'
  }
}

const protectedPathPermissions: Array<[string, PagePermission]> = [
  ['/home', 'dashboard'],
  ['/dashboards/analytics', 'dashboard'],
  ['/elderly-list', 'elderly_list'],
  ['/family-visits', 'family_visits'],
  ['/staff-assignment-history', 'staff_assignment_history'],
  ['/alert-history', 'alert_history'],
  ['/historical-sensor-data', 'historical_sensor_data'],
  ['/reports', 'reports'],
  ['/sensor-management', 'sensor_management'],
  ['/staff-task-management', 'staff_task_management'],
  ['/staff-shift-management', 'staff_shift_management'],
  ['/user-management', 'user_management'],
  ['/device-management', 'device_management'],
  ['/zone-management', 'zone_management'],
  ['/house-management', 'house_management'],
  ['/system-settings', 'system_settings'],
  ['/system-logs', 'system_logs'],
  ['/pages/account-settings', 'personal_settings'],
]

export const requiredPermissionForPath = (path: string): PagePermission | undefined => (
  protectedPathPermissions.find(([protectedPath]) => path.startsWith(protectedPath))?.[1]
)