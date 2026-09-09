import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const response = (body: string, status = 200) => new Response(body, {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

Deno.serve(async req => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return response(JSON.stringify({ error: 'Unauthorized' }), 401)
    const body = await req.json()
    if (!body.staff_id || typeof body.password !== 'string' || body.password.length < 8)
      return response(JSON.stringify({ error: 'Invalid request' }), 400)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await caller.auth.getUser()
    if (!user) return response(JSON.stringify({ error: 'Unauthorized' }), 401)
    const { data: callerAppUser } = await admin.from('app_users').select('role, is_active').eq('id', user.id).maybeSingle()
    if (!callerAppUser?.is_active || !['admin', 'principal'].includes(String(callerAppUser.role).trim().toLowerCase())) return response(JSON.stringify({ error: 'Only administrators can reset passwords' }), 403)
    const { data: target } = await admin.from('staff').select('user_id').eq('id', body.staff_id).maybeSingle()
    if (!target?.user_id) return response(JSON.stringify({ error: 'This staff member has no linked login account' }), 400)
    const { error } = await admin.auth.admin.updateUserById(target.user_id, { password: body.password })
    if (error) return response(JSON.stringify({ error: error.message }), 400)
    return response(JSON.stringify({ success: true }))
  } catch (error) { return response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected error' }), 500) }
})
