import Link from 'next/link'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-xl">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-500/60 to-transparent" />
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="m9 11 3 3L22 4" />
              </svg>
            </div>
            <h1 className="text-xl font-black italic uppercase text-foreground mb-2">Registro Exitoso</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-6">Cuenta Creada</p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Revisa tu email para confirmar tu cuenta. Una vez confirmado, podras iniciar sesion.
            </p>
            <Link
              href="/auth/login"
              className="inline-block w-full py-4 bg-pokeball-red hover:bg-pokeball-dark text-primary-foreground text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all text-center border border-pokeball-red/50"
            >
              Ir al Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
