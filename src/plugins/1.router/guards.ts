import type { RouteNamedMap, _RouterTyped } from 'unplugin-vue-router'
import { ability } from '@/plugins/casl/ability'
import { getCurrentSession, loadCurrentUserRole, requiredPermissionForPath } from '@/utils/permissions'

export const setupGuards = (router: _RouterTyped<RouteNamedMap & { [key: string]: any }>) => {
  // 👉 router.beforeEach
  // Docs: https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
  router.beforeEach(async to => {
    /*
     * If it's a public route, continue navigation. This kind of pages are allowed to visited by login & non-login users. Basically, without any restrictions.
     * Examples of public routes are, 404, under maintenance, etc.
     */
    if (to.meta.public)
      return

    let session
    try { session = await getCurrentSession() }
    catch { return { name: 'login', query: { error: 'session', to: to.fullPath } } }
    const isLoggedIn = !!session

    /*
      If user is logged in and is trying to access login like page, redirect to home
      else allow visiting the page
      (WARN: Don't allow executing further by return statement because next code will check for permissions)
     */
    if (to.meta.unauthenticatedOnly) {
      if (isLoggedIn)
        return { name: 'home' }
      else
        return undefined
    }

    if (!isLoggedIn && to.matched.length) {
      return {
        name: 'login',
        query: {
          ...to.query,
          to: to.fullPath !== '/' ? to.path : undefined,
        },
      }
    }

    if (isLoggedIn) {
      try {
        const role = await loadCurrentUserRole(false, session!)
        if (!role) return { name: 'login' }
      }
      catch {
        return { name: 'login', query: { error: 'permissions', to: to.fullPath } }
      }

      const requiredPermission = requiredPermissionForPath(to.path)

      // This also protects a page when a user manually enters its URL.
      if (requiredPermission && !ability.can('read', requiredPermission))
        return { name: 'not-authorized' }
    }
  })
}
