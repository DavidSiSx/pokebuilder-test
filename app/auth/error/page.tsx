export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-xl">
          <div className="h-1.5 bg-gradient-to-r from-pokeball-red via-pokeball-red/60 to-transparent" />
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pokeball-red/10 border-2 border-pokeball-red/30 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pokeball-red">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <h1 className="text-xl font-black italic uppercase text-pokeball-red mb-2">Error</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {params?.error
                ? `Codigo de error: ${params.error}`
                : 'Ocurrio un error inesperado.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
