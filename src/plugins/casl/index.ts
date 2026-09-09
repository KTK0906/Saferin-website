import type { App } from 'vue'
import { abilitiesPlugin } from '@casl/vue'
import { ability } from './ability'

export default function (app: App) {
  // Restore rules from localStorage if they exist (e.g., after login or page refresh)
  const savedRules = localStorage.getItem('userAbilityRules')
  if (savedRules) {
    try {
      const rules = JSON.parse(savedRules)
      ability.update(rules)
    } catch (e) {
      console.error('Failed to parse saved CASL rules:', e)
    }
  }

  app.use(abilitiesPlugin, ability, {
    useGlobalProperties: true,
  })
}