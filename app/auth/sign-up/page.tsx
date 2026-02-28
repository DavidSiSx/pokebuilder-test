'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Las contrasenas no coinciden')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/`,
        },
      })
      if (error) throw error
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Error al crear la cuenta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" aria-hidden="true">
          <circle cx="200" cy="200" r="150" stroke="currentColor" strokeWidth="2" className="text-foreground" />
          <line x1="50" y1="200" x2="350" y2="200" stroke="currentColor" strokeWidth="2" className="text-foreground" />
          <circle cx="200" cy="200" r="40" stroke="currentColor" strokeWidth="2" className="text-foreground" />
        </svg>
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col gap-6">
          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-xl relative">
            <div className="h-1.5 bg-gradient-to-r from-pokeball-red via-pokeball-red/60 to-transparent" />
            
            <div className="p-8">
              <div className="flex flex-col items-center gap-3 mb-8">
                <div className="w-14 h-14 rounded-full bg-pokeball-red/10 border-2 border-pokeball-red/30 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 100 100" fill="none" aria-hidden="true">
                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" className="text-pokeball-red" />
                    <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="6" className="text-pokeball-red" />
                    <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="6" fill="none" className="text-pokeball-red" />
                  </svg>
                </div>
                <div className="text-center">
                  <h1 className="text-xl font-black italic uppercase tracking-tight text-foreground">Registro</h1>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-pokeball-red">Crear Cuenta de Entrenador</p>
                </div>
              </div>

              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-5">
                  <div className="grid gap-2">
                    <label htmlFor="email" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Email</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="trainer@pokelab.gg"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-pokeball-red/40 focus:border-pokeball-red/40"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="password" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Password</label>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-pokeball-red/40 focus:border-pokeball-red/40"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="repeat-password" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Confirmar Password</label>
                    <input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-pokeball-red/40 focus:border-pokeball-red/40"
                    />
                  </div>
                  {error && (
                    <div className="bg-pokeball-red/10 border border-pokeball-red/30 rounded-xl px-4 py-3 text-xs font-bold text-pokeball-red">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-pokeball-red hover:bg-pokeball-dark text-primary-foreground text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all shadow-[0_4px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_30px_rgba(220,38,38,0.5)] disabled:opacity-50 border border-pokeball-red/50 cursor-pointer"
                  >
                    {isLoading ? 'Creando cuenta...' : 'Registrar'}
                  </button>
                </div>
                <div className="mt-6 text-center text-xs font-bold text-muted-foreground">
                  {'Ya tienes cuenta? '}
                  <Link
                    href="/auth/login"
                    className="text-pokeball-red hover:text-foreground transition-colors underline underline-offset-4"
                  >
                    Iniciar Sesion
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
