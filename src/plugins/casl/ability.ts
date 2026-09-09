import { createMongoAbility } from '@casl/ability'

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage'

// ex: Post, Comment, User, etc. We haven't used any of these in our demo though.
export type Subjects =
  | 'dashboard'
  | 'elderly_list'
  | 'family_visits'
  | 'staff_assignment_history'
  | 'alert_history'
  | 'historical_sensor_data'
  | 'reports'
  | 'sensor_management'
  | 'staff_task_management'
  | 'staff_shift_management'
  | 'user_management'
  | 'device_management'
  | 'zone_management'
  | 'house_management'
  | 'system_settings'
  | 'system_logs'
  | 'personal_settings'
  | 'all'

export interface Rule { action: Actions; subject: Subjects }

export const ability = createMongoAbility<[Actions, Subjects]>()
