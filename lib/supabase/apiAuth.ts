import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Reusable auth guard for API routes.
 * Returns the authenticated user or a 401 response.
 */
export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Sesion no valida. Inicia sesion.' },
        { status: 401 }
      ),
    }
  }

  return { user, error: null }
}
