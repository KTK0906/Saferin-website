import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Supabase environment variables are missing. Add them to .env.local.')
}

const rememberMeKey = 'vuexy-auth-remember-me'
const isBrowser = typeof window !== 'undefined'

const authStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null
    return sessionStorage.getItem(key) ?? localStorage.getItem(key)
  },
  setItem: (key: string, value: string): void => {
    if (!isBrowser) return
    
    // 檢查是否勾選 Remember Me
    const isRemembered = localStorage.getItem(rememberMeKey) === 'true'
    const targetStorage = isRemembered ? localStorage : sessionStorage

    // Replace the session atomically; removing the active key first emits
    // misleading signed-out storage events to other open tabs.
    const otherStorage = isRemembered ? sessionStorage : localStorage
    otherStorage.removeItem(key)
    
    targetStorage.setItem(key, value)
  },
  removeItem: (key: string): void => {
    if (!isBrowser) return
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export const setRememberMe = (remember: boolean): void => {
  if (!isBrowser) return
  
  localStorage.removeItem(rememberMeKey)
  sessionStorage.removeItem(rememberMeKey)

  if (remember) {
    localStorage.setItem(rememberMeKey, 'true')
  } else {
    sessionStorage.setItem(rememberMeKey, 'false')
  }
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: authStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
