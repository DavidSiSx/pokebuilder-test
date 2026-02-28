'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import TeamReviewCard from '@/components/TeamReviewCard';
import ReviewResult from '@/components/ReviewResult';
import { PokeballIcon, PokeballBgPattern } from '@/components/PokeballIcon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
interface ReviewPokemon {
  _id: number;          // ID estable para key — NUNCA cambia
  name: string;
  item: string;
  ability: string;
  nature: string;
  teraType: string;
  moves: string[];
  evs: string;
  mechanic: string;
}

const createEmpty = (id: number): ReviewPokemon => ({
  _id: id,
  name: '',
  item: '',
  ability: '',
  nature: '',
  teraType: '',
  moves: ['', '', '', ''],
  evs: '',
  mechanic: 'none',
});

// ─────────────────────────────────────────────
// Mecánicas (config local de la página review)
// ─────────────────────────────────────────────
const DEFAULT_MECHANICS = {
  enableMega: false,
  enableGmax: false,
  enableTera: true,
  enableZMoves: false,
  enableDynamax: false,
};

export default function ReviewPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Estado del equipo con IDs estables
  const [team, setTeam] = useState<ReviewPokemon[]>(() =>
    Array.from({ length: 6 }, (_, i) => createEmpty(i))
  );

  // Config mecánicas
  const [mechanics, setMechanics] = useState(DEFAULT_MECHANICS);

  // Config formato
  const [format, setFormat] = useState('National Dex Doubles (6v6 - Cobblemon)');

  // Estado del análisis
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  // ─── Handlers estables con useCallback ───────────────────────────
  // Sin dependencias externas: usan solo el setter funcional
  const handleChange = useCallback((index: number, updated: ReviewPokemon) => {
    setTeam(prev => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }, []); // ← sin deps: nunca se recrea

  const handleRemove = useCallback((index: number) => {
    setTeam(prev => {
      const next = [...prev];
      next[index] = createEmpty(prev[index]._id); // preserva el mismo _id
      return next;
    });
  }, []);

  const toggleMechanic = useCallback((key: keyof typeof DEFAULT_MECHANICS) => {
    setMechanics(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ─── Review submit ────────────────────────────────────────────────
  const handleReview = async () => {
    const filled = team.filter(p => p.name.trim() !== '');
    if (filled.length < 1) {
      setErrorMsg('Agrega al menos 1 Pokémon para analizar el equipo.');
      return;
    }

    setIsReviewing(true);
    setReviewResult(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/pokemon/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: filled, format, mechanics }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || data.error || 'Error al analizar el equipo.');
        return;
      }
      setReviewResult(data);
      // Scroll suave hacia el resultado
      setTimeout(() => {
        document.getElementById('review-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch {
      setErrorMsg('Error de red. Intenta de nuevo.');
    } finally {
      setIsReviewing(false);
    }
  };

  const filledCount = team.filter(p => p.name.trim() !== '').length;

  // ─── Error portal ─────────────────────────────────────────────────
  const errorPortal = errorMsg && mounted && createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-6 bg-background/80 backdrop-blur-md animate-in fade-in"
      style={{ zIndex: 99999 }}
      onClick={() => setErrorMsg(null)}
    >
      <div
        className="bg-card border-2 border-pokeball-red/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_60px_rgba(220,38,38,0.2)] flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-pokeball-red" />
        <div className="w-14 h-14 bg-pokeball-red/10 rounded-full flex items-center justify-center mb-4 border-2 border-pokeball-red/30">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pokeball-red">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <path d="M12 9v4"/><path d="M12 17h.01"/>
          </svg>
        </div>
        <h3 className="text-lg font-black uppercase text-pokeball-red mb-2 tracking-wide">Aviso</h3>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{errorMsg}</p>
        <button
          onClick={() => setErrorMsg(null)}
          className="w-full py-3 bg-pokeball-red hover:bg-pokeball-dark text-primary-foreground text-[11px] font-black uppercase tracking-widest rounded-xl transition-all"
        >
          Entendido
        </button>
      </div>
    </div>,
    document.body
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden relative selection:bg-pokeball-red/30">
      {errorPortal}

      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <aside className={`${sidebarOpen ? 'w-[300px]' : 'w-[60px]'} bg-card border-r-2 border-border flex flex-col h-full z-10 shadow-2xl relative transition-all duration-300 overflow-hidden flex-shrink-0`}>
        <PokeballBgPattern />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pokeball-red via-pokeball-red/60 to-transparent z-20" />

        {/* Header */}
        <div className={`flex items-center gap-3 relative z-10 px-5 pt-6 pb-4 ${!sidebarOpen ? 'justify-center px-3' : ''}`}>
          {sidebarOpen ? (
            <>
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                <PokeballIcon size={36} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-black italic tracking-tighter uppercase leading-none text-foreground">Team Reviewer</h1>
                <span className="text-[8px] text-pokeball-red font-black uppercase tracking-[0.3em]">Análisis Táctico</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            </>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center">
              <PokeballIcon size={32} />
            </button>
          )}
        </div>

        {sidebarOpen && <div className="pokeball-divider mx-5 mb-4" />}

        {/* Nav */}
        {sidebarOpen && (
          <div className="px-5 mb-4 flex gap-2 relative z-10">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-secondary/50 border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-pokeball-red/20 transition-all"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Builder
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-secondary/50 border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-pokeball-red hover:bg-pokeball-red/10 hover:border-pokeball-red/20 transition-all disabled:opacity-50"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              {isLoggingOut ? '...' : 'Salir'}
            </button>
          </div>
        )}

        {/* Sidebar config */}
        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto px-5 pb-4 relative z-10 space-y-5 custom-scrollbar">

            {/* Formato */}
            <div>
              <label className="text-[9px] uppercase font-black text-pokeball-red tracking-[0.2em] flex items-center gap-1.5 mb-2">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-pokeball-red"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>
                Protocolo de Combate
              </label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-[10px] font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/40 cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23dc2626' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
              >
                <option>National Dex Doubles (6v6 - Cobblemon)</option>
                <option>VGC Oficial (Dobles 4v4)</option>
                <option>National Dex Singles (6v6)</option>
                <option>Combate Libre (Trae 6, Elige 3)</option>
              </select>
            </div>

            {/* Mecánicas */}
            <div>
              <label className="text-[9px] uppercase font-black text-cyan-400 tracking-[0.2em] flex items-center gap-1.5 mb-2">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-cyan-400"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>
                Mecánicas Activas
              </label>
              <div className="bg-secondary/30 p-3 rounded-xl border border-border space-y-1">
                {(Object.keys(mechanics) as Array<keyof typeof mechanics>).map(key => (
                  <MechanicToggle
                    key={key}
                    label={key === 'enableMega' ? 'Mega Evolution' : key === 'enableGmax' ? 'Gigantamax' : key === 'enableTera' ? 'Teracristalizacion' : key === 'enableZMoves' ? 'Z-Moves' : 'Dynamax'}
                    checked={mechanics[key]}
                    onChange={() => toggleMechanic(key)}
                  />
                ))}
              </div>
            </div>

            {/* Resumen del equipo */}
            <div>
              <label className="text-[9px] uppercase font-black text-emerald-400 tracking-[0.2em] flex items-center gap-1.5 mb-2">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Equipo Actual
              </label>
              <div className="bg-secondary/30 p-3 rounded-xl border border-border space-y-1.5">
                {team.map((p, i) => (
                  <div key={p._id} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-pokeball-red/10 flex items-center justify-center text-[7px] text-pokeball-red font-black flex-shrink-0">{i + 1}</span>
                    <span className={`text-[10px] font-bold truncate ${p.name ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                      {p.name ? p.name.replace(/-/g, ' ') : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Botón analizar */}
        {sidebarOpen && (
          <div className="p-5 pt-3 relative z-10 bg-gradient-to-t from-card via-card to-transparent">
            <button
              onClick={handleReview}
              disabled={isReviewing || filledCount === 0}
              className="w-full py-4 bg-pokeball-red hover:bg-pokeball-dark disabled:bg-secondary disabled:text-muted-foreground text-primary-foreground text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all shadow-[0_4px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_30px_rgba(220,38,38,0.5)] disabled:shadow-none border border-pokeball-red/50 disabled:border-border flex items-center justify-center gap-2.5"
            >
              {isReviewing ? (
                <>
                  <PokeballIcon size={14} className="animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                  Analizar Equipo {filledCount > 0 && `(${filledCount})`}
                </>
              )}
            </button>
          </div>
        )}
      </aside>

      {/* ── MAIN ──────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <PokeballBgPattern />
        </div>

        {/* Mobile topbar */}
        {!sidebarOpen && (
          <div className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-6 py-3 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              <span className="text-[10px] font-black uppercase tracking-widest">Menu</span>
            </button>
            <div className="pokeball-divider flex-1" />
            <span className="text-xs font-black italic uppercase text-foreground">Team Reviewer</span>
          </div>
        )}

        <div className="p-8 lg:p-10 relative z-10">
          <div className="max-w-6xl mx-auto space-y-10">

            {/* Título de sección */}
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground leading-none">Ingresa tu Equipo</h2>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                  Completa los datos de cada Pokémon para recibir el análisis táctico
                </p>
              </div>
            </div>

            {/* ── GRID DE CARDS ── */}
            {/* 
              KEY CRÍTICO: usamos pokemon._id (estable) NO el index.
              Esto evita que React destruya y recree los componentes al re-renderizar.
            */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {team.map((pokemon, i) => (
                <TeamReviewCard
                  key={pokemon._id}                           // ← ID estable
                  index={i}
                  pokemon={pokemon}
                  onChange={(updated) => handleChange(i, updated)}  // ← usa handleChange con useCallback
                  onRemove={() => handleRemove(i)}
                  mechanics={mechanics}
                />
              ))}
            </div>

            {/* ── RESULTADO ── */}
            {reviewResult && (
              <section
                id="review-result"
                className="bg-card border-2 border-pokeball-red/30 rounded-2xl p-6 lg:p-8 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8"
              >
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                  <PokeballBgPattern />
                </div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pokeball-red via-amber-500 to-emerald-500 opacity-60 rounded-t-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[11px] font-black text-pokeball-red uppercase tracking-[0.25em] flex items-center gap-3">
                      <PokeballIcon size={16} />
                      Informe Táctico
                    </h2>
                    <button
                      onClick={() => setReviewResult(null)}
                      className="text-[9px] font-black text-muted-foreground hover:text-pokeball-red uppercase tracking-widest transition-colors flex items-center gap-1"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      Cerrar
                    </button>
                  </div>
                  <ReviewResult data={reviewResult} />
                </div>
              </section>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Toggle simple para mecánicas ───────────────────────────────────
function MechanicToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} className="flex items-center justify-between cursor-pointer group py-1.5 w-full select-none">
      <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all border shrink-0 ${checked ? 'bg-cyan-500 border-cyan-500' : 'bg-secondary border-border'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform shadow-sm ${checked ? 'translate-x-[18px] bg-primary-foreground' : 'translate-x-[2px] bg-muted-foreground/40'}`} />
      </button>
    </div>
  );
}