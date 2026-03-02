import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

// Cambiamos el nombre de la función exportada de 'middleware' a 'proxy'
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}