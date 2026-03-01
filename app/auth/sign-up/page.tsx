'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'SIGN_UP' | 'VERIFY_OTP'>('SIGN_UP')
  
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  useEffect(() => { setIsMounted(true) }, [])

  // --- SEGURIDAD: VALIDACIÓN Y SANEAMIENTO ---
  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  
  const validatePassword = (p: string) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,}$/.test(p)

  const sanitizeOtp = (value: string) => {
    // BLOQUEO: Solo números y máximo 8 (según tu correo)
    return value.replace(/\D/g, '').slice(0, 8)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    const cleanEmail = email.trim().toLowerCase()

    if (!validateEmail(cleanEmail)) {
      setError('El formato del email no es válido.')
      setIsLoading(false)
      return
    }

    if (password !== repeatPassword) {
      setError('Las contraseñas no coinciden.')
      setIsLoading(false)
      return
    }

    if (!validatePassword(password)) {
      setError('La contraseña debe tener al menos 8 caracteres, una letra y un número.')
      setIsLoading(false)
      return
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      })
      
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Este email ya está registrado. Intenta iniciar sesión o pide un nuevo código.');
        } else {
          throw signUpError;
        }
        setIsLoading(false);
        return;
      }
      
      setStep('VERIFY_OTP')
    } catch (err: any) {
      setError(err.message || 'Error al procesar el registro.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    // Validación de longitud estricta
    if (otp.length !== 8) {
      setError('El código debe tener exactamente 8 dígitos.')
      setIsLoading(false)
      return
    }

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp,
        type: 'signup',
      })

      if (verifyError) {
        throw new Error(verifyError.message.includes('expired') 
          ? 'El código ha expirado. Solicita uno nuevo.' 
          : 'Código inválido.');
      }

      if (data.session) {
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    const supabase = createClient()
    setIsResending(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      })
      if (resendError) throw resendError
      setSuccessMsg('¡Nuevo código de 8 dígitos enviado!')
    } catch (err: any) {
      setError(err.status === 429 ? 'Espera un minuto para reintentar.' : err.message)
    } finally {
      setIsResending(false)
    }
  }

  if (!isMounted) return null

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Background Pokeball Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none">
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
              {/* Header con ícono de Pokebola */}
              <div className="flex flex-col items-center gap-3 mb-8">
                <div className="w-14 h-14 rounded-full bg-pokeball-red/10 border-2 border-pokeball-red/30 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" className="text-pokeball-red" />
                    <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="6" className="text-pokeball-red" />
                    <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="6" fill="none" className="text-pokeball-red" />
                  </svg>
                </div>
                <div className="text-center">
                  <h1 className="text-xl font-black italic uppercase tracking-tight text-foreground">
                    {step === 'SIGN_UP' ? 'Registro Pokelab' : 'Verifica tu Cuenta'}
                  </h1>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-pokeball-red">
                    {step === 'SIGN_UP' ? 'Crear Cuenta de Entrenador' : 'Código de Seguridad'}
                  </p>
                </div>
              </div>

              {/* Manejo de Alertas */}
              {error && (
                <div className="bg-pokeball-red/10 border border-pokeball-red/30 rounded-xl px-4 py-3 mb-5 text-xs font-bold text-pokeball-red text-center animate-in fade-in">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 mb-5 text-xs font-bold text-emerald-500 text-center animate-in fade-in">
                  {successMsg}
                </div>
              )}

              {/* PASO 1: FORMULARIO DE REGISTRO */}
              {step === 'SIGN_UP' ? (
                <form onSubmit={handleSignUp} className="flex flex-col gap-5">
                  <div className="grid gap-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Email</Label>
                    <Input
                      type="email"
                      placeholder="trainer@pokelab.gg"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-secondary/50 border-border rounded-xl text-sm font-bold focus:ring-pokeball-red/40 focus:border-pokeball-red/40"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-secondary/50 border-border rounded-xl text-sm font-bold focus:ring-pokeball-red/40 focus:border-pokeball-red/40"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Confirmar Password</Label>
                    <Input
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      className="bg-secondary/50 border-border rounded-xl text-sm font-bold focus:ring-pokeball-red/40 focus:border-pokeball-red/40"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-5 mt-2 bg-pokeball-red hover:bg-pokeball-dark text-primary-foreground text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all shadow-[0_4px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_30px_rgba(220,38,38,0.5)] disabled:opacity-50 border border-pokeball-red/50"
                  >
                    {isLoading ? 'Registrando...' : 'Registrar'}
                  </Button>
                  <div className="mt-4 text-center text-xs font-bold text-muted-foreground">
                    ¿Ya tienes cuenta?{' '}
                    <Link href="/auth/login" className="text-pokeball-red hover:text-foreground transition-colors underline underline-offset-4">
                      Iniciar Sesión
                    </Link>
                  </div>
                </form>
              ) : (
                /* PASO 2: VERIFICACIÓN OTP DE 8 DÍGITOS */
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5 text-center">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hemos enviado un código de <strong>8 dígitos</strong> a <br/>
                    <span className="text-foreground font-black">{email}</span>
                  </p>
                  
                  <div className="grid gap-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      placeholder="00000000"
                      required
                      value={otp}
                      onChange={(e) => setOtp(sanitizeOtp(e.target.value))}
                      className="bg-secondary/50 border-2 border-border rounded-xl text-2xl tracking-[0.4em] font-black text-center h-16 focus:ring-pokeball-red/40 focus:border-pokeball-red/40 uppercase"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isLoading || otp.length < 8}
                    className="w-full py-5 mt-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Comprobando...' : 'Confirmar Código'}
                  </Button>
                  
                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border/50">
                    <button 
                      type="button" 
                      onClick={handleResendOtp}
                      disabled={isResending || isLoading}
                      className="text-[10px] font-black uppercase tracking-widest text-pokeball-red hover:text-pokeball-dark transition-colors disabled:opacity-50"
                    >
                      {isResending ? 'Enviando...' : 'Reenviar Código'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setStep('SIGN_UP')}
                      className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Regresar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}