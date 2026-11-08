import type { Rule } from '@/plugins/casl/ability'
import { ability } from '@/plugins/casl/ability'
import { supabase } from '@/lib/supabaseClient'
import type { Session } from '@supabase/supabase-js'

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
const normRole = (value: string) => value.trim().toLowerCase().replace(/[_-]/g, ' ')

let loadedUserId: string | null = null
let loadedRole: AppRole | null = null
let databasePermissions: Record<string, string[]> = {}
let permissionsLoaded = false
let loadedAt = 0
let generation = 0
let pending: { userId: string; promise: Promise<AppRole | null> } | null = null

export async function withAuthTimeout<T>(operation: PromiseLike<T>, label: string, ms = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([Promise.resolve(operation), new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out. Please try again.`)), ms)
    })])
  } finally { if (timer) clearTimeout(timer) }
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await withAuthTimeout(supabase.auth.getSession(), 'Session loading')
  if (error) throw error
  return data.session
}

const pageNameToPermission = (name: string): PagePermission | undefined => {
  const key = name.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_m, c) => String(c).toUpperCase()).replace(/[^a-zA-Z0-9]/g, '')
  const aliases: Record<string, PagePermission> = { userManagement: 'user_management', staffTaskManagement: 'staff_task_management', zoneManagement: 'zone_management', familyVisits: 'family_visits', staffShiftManagement: 'staff_shift_management', historicalSensorData: 'historical_sensor_data', alertRequestHistory: 'alert_history', sensorManagement: 'sensor_management', elderlyList: 'elderly_list', houseManagement: 'house_management', systemSettings: 'system_settings', systemLogs: 'system_logs', deviceManagement: 'device_management', dashboard: 'dashboard', reports: 'reports' }
  return aliases[key]
}

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

  const configured = permissionsLoaded
    ? Object.entries(databasePermissions).map(([subject, permissions]) => ({ subject: subject as PagePermission, permissions }))
    : (Object.entries(pageAccess) as [PagePermission, readonly AppRole[]][]).filter(([, permittedRoles]) => permittedRoles.includes(role)).map(([subject]) => ({ subject, permissions: ['read', 'write', 'delete'] }))
  return configured.flatMap(({ subject, permissions }) => [
    ...(permissions.includes('read') ? [{ action: 'read' as const, subject }] : []),
    ...(permissions.includes('write') ? [{ action: 'manage' as const, subject }] : []),
    ...(permissions.includes('delete') ? [{ action: 'delete' as const, subject }] : []),
  ])
}

export const hasPagePermission = (subject: PagePermission | string, action: 'read' | 'write' | 'delete') => {
  const rules = databasePermissions[subject] || []
  return rules.includes(action) || (action === 'write' && rules.includes('manage'))
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
  databasePermissions = {}
  permissionsLoaded = false
  loadedAt = 0
  generation++
  pending = null
}

export const loadCurrentUserRole = async (forceRefresh = false, knownSession?: Session): Promise<AppRole | null> => {
  const session = knownSession ?? await getCurrentSession()
  const user = session?.user

  if (!user) {
    clearRolePermissions()
    return null
  }

  if (pending?.userId === user.id) return pending.promise
  if (!forceRefresh && loadedUserId === user.id && loadedRole && Date.now() - loadedAt < 30000)
    return loadedRole
  const version = ++generation
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  const promise = (async (): Promise<AppRole | null> => {
    try {
      const [profile, matrix] = await withAuthTimeout(Promise.all([
        supabase.from('app_users').select('role').eq('id', user.id).abortSignal(controller.signal).maybeSingle(),
        supabase.from('page_permissions').select('page_name, allowed_roles, permissions').abortSignal(controller.signal),
      ]), 'Account permissions loading')
      if (profile.error) throw new Error(`Cannot load account: ${profile.error.message}`)
      if (matrix.error) throw new Error(`Cannot load permissions: ${matrix.error.message}`)
      const realRole = dbRoleToAppRole[normRole(profile.data?.role || '')]
      if (!realRole) throw new Error('No valid role is linked to this account. Please contact your administrator.')
      if (version !== generation) return null
      databasePermissions = {}
      ;(matrix.data || []).forEach((row: any) => {
        const subject = pageNameToPermission(row.page_name)
        if (subject && (row.allowed_roles || []).some((r: string) => dbRoleToAppRole[normRole(r)] === realRole))
          databasePermissions[subject] = row.permissions || ['read']
      })
      permissionsLoaded = true
      loadedUserId = user.id
      loadedRole = realRole
      loadedAt = Date.now()
      applyRolePermissions(realRole)
      return realRole
    } catch (error) {
      if (version === generation) clearRolePermissions()
      throw error
    } finally {
      clearTimeout(timeout)
      controller.abort()
      if (version === generation) pending = null
    }
  })()
  pending = { userId: user.id, promise }
  return promise
}

const protectedPathPermissions: Array<[string, PagePermission]> = [
  ['/home', 'dashboard'],
  ['/dashboards/analytics', 'dashboard'],
  ['/elderly-list', 'elderly_list'], ['/elderly-view', 'elderly_list'],
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
