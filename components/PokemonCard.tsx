'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NATURES, TYPE_COLORS, TYPE_TRANSLATIONS } from '@/utils/pokemonConstants';

function PokeballSlotIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="80" height="80" viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <path d="M50 5C25.15 5 5 25.15 5 50h90C95 25.15 74.85 5 50 5Z" fill="currentColor" opacity="0.15" />
      <path d="M5 50c0 24.85 20.15 45 45 45s45-20.15 45-45H5Z" fill="currentColor" opacity="0.08" />
      <rect x="5" y="46" width="90" height="8" fill="currentColor" opacity="0.12" />
      <circle cx="50" cy="50" r="16" fill="currentColor" opacity="0.12" />
      <circle cx="50" cy="50" r="10" fill="currentColor" opacity="0.06" />
      <circle cx="50" cy="50" r="45" stroke="currentColor" opacity="0.1" strokeWidth="3" fill="none" />
    </svg>
  );
}

export default function PokemonCard({
  slotNumber,
  data,
  isLocked,
  onToggleLock,
  onSelect,
  onBanAndRegenerate,
}: any) {
  const [pokemon, setPokemon] = useState<any>(data || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBanning, setIsBanning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setPokemon(data); setIsModalOpen(false); }, [data]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen]);

  const handleSearch = async (val: string) => {
    setSearchTerm(val);
    if (val.length > 2) {
      try {
        const res = await fetch(`/api/pokemon/search?name=${val.toLowerCase()}`);
        const data = await res.json();
        setResults(data);
      } catch (error) {
        console.error("Error searching:", error);
      }
    } else {
      setResults([]);
    }
  };

  const handleBan = async () => {
    if (!pokemon || !onBanAndRegenerate || isBanning) return;
    setIsBanning(true);
    try {
      await onBanAndRegenerate(pokemon);
    } finally {
      setIsBanning(false);
    }
  };

  const natureInfo = pokemon?.suggestedBuild?.nature
    ? `${pokemon.suggestedBuild.nature} (${NATURES[pokemon.suggestedBuild.nature as keyof typeof NATURES] || 'Neutral'})` : "---";

  const activeTipos = pokemon?.tipos || [pokemon?.tipo1, pokemon?.tipo2].filter(Boolean);
  const isLeader = slotNumber === 1;
  const canBan = pokemon && !isLeader && !isLocked && !!onBanAndRegenerate;

  const geneticsModal = pokemon && (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
      style={{ zIndex: 99999 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalles geneticos de ${pokemon.nombre}`}
      onClick={() => setIsModalOpen(false)}
    >
      <div
        /* En mobile: full-width con bordes arriba redondeados. En desktop: card centrada */
        className="bg-card border-2 border-pokeball-red/40 rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 w-full sm:max-w-md relative shadow-[0_0_60px_rgba(220,38,38,0.15)] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle visible en mobile */}
        <div className="flex justify-center mb-4 sm:hidden">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pokeball-red via-pokeball-red/60 to-transparent" />
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center bg-secondary hover:bg-destructive hover:text-destructive-foreground rounded-full text-muted-foreground transition-colors font-bold text-xs"
          aria-label="Cerrar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>

        <div className="flex items-center gap-4 border-b border-border pb-4 mb-5">
          <div className="w-16 h-16 rounded-xl bg-secondary/30 border border-border p-1.5 flex items-center justify-center flex-shrink-0">
            <img
              src={pokemon.sprite_url || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
              alt={pokemon.nombre}
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black uppercase text-pokeball-red italic leading-none">{pokemon.nombre.replace('-', ' ')}</h3>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {activeTipos.map((t: string) => (
                <span key={t} className={`px-2 py-1 rounded text-[10px] sm:text-[8px] font-black uppercase ${TYPE_COLORS[t.toLowerCase()] || 'bg-secondary text-foreground'}`}>
                  {TYPE_TRANSLATIONS[t.toLowerCase()] || t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] sm:text-[9px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              Naturaleza Recomendada
            </label>
            <div className="text-sm sm:text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-500/20">
              {natureInfo}
            </div>
          </div>
          <div>
            <label className="text-[11px] sm:text-[9px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />
              Distribucion de EVs
            </label>
            <div className="text-sm sm:text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-4 py-3 rounded-xl border border-amber-500/20">
              {pokemon.suggestedBuild?.evs || "---"}
            </div>
          </div>
          <div>
            <label className="text-[11px] sm:text-[9px] font-black text-sky-500 dark:text-sky-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400" />
              Esquema de IVs (Genes)
            </label>
            <div className="text-xs sm:text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-500/10 px-4 py-4 rounded-xl border border-sky-500/20 tracking-wide leading-relaxed">
              {pokemon.suggestedBuild?.ivs || "31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe"}
            </div>
          </div>
          {pokemon.suggestedBuild?.teraType && (
            <div>
              <label className="text-[11px] sm:text-[9px] font-black text-cyan-500 dark:text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                Tera Type
              </label>
              <div className="text-sm sm:text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 px-4 py-3 rounded-xl border border-cyan-500/20 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-500 dark:text-cyan-400">
                  <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
                </svg>
                {TYPE_TRANSLATIONS[pokemon.suggestedBuild.teraType.toLowerCase()] || pokemon.suggestedBuild.teraType}
              </div>
            </div>
          )}
          {pokemon.suggestedBuild?.moves?.length > 0 && (
            <div>
              <label className="text-[11px] sm:text-[9px] font-black text-violet-500 dark:text-violet-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-500 dark:bg-violet-400" />
                Movimientos Sugeridos
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {pokemon.suggestedBuild.moves.map((m: string, i: number) => (
                  <div key={i} className="text-xs sm:text-[10px] font-bold text-violet-700 dark:text-violet-300 bg-violet-500/10 px-3 py-2.5 sm:py-2 rounded-lg border border-violet-500/20 flex items-center gap-2">
                    <span className="w-4 h-4 sm:w-3.5 sm:h-3.5 rounded-full bg-violet-500/20 flex items-center justify-center text-[8px] sm:text-[7px] text-violet-500 dark:text-violet-400 font-black flex-shrink-0">{i + 1}</span>
                    <span className="truncate">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Botón cerrar bottom en mobile */}
        <button
          onClick={() => setIsModalOpen(false)}
          className="mt-6 w-full py-4 bg-secondary rounded-xl text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors sm:hidden"
        >
          Cerrar
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-[560px] sm:min-h-[580px] group flex flex-col z-10 hover:z-20">
      <div className={`
        flex-1 relative bg-card border-2
        ${isLocked
          ? 'border-pokeball-red shadow-[0_0_25px_rgba(220,38,38,0.25)]'
          : 'border-border hover:border-pokeball-red/40'}
        rounded-2xl flex flex-col transition-all duration-300
      `}>
        <div className="absolute top-0 left-0 right-0 h-1.5 overflow-hidden rounded-t-2xl">
          <div className={`h-full ${isLocked ? 'bg-pokeball-red' : 'bg-gradient-to-r from-pokeball-red/60 via-pokeball-red/30 to-transparent'}`} />
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none">
          <PokeballSlotIcon className="text-foreground w-48 h-48" />
        </div>

        {/* Header bar */}
        <div className="relative z-10 flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-2">
          <div className="flex items-center gap-2">
            <div className={`
              w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-[10px] font-black
              ${isLeader ? 'bg-pokeball-red text-primary-foreground pokeball-pulse' : 'bg-secondary text-secondary-foreground'}
            `}>
              {isLeader ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ) : (
                <span>{slotNumber}</span>
              )}
            </div>
            <span className={`text-[11px] sm:text-[9px] font-black uppercase tracking-[0.15em] ${isLeader ? 'text-pokeball-red' : 'text-muted-foreground'}`}>
              {isLeader ? 'LIDER' : `SLOT-0${slotNumber}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {pokemon && !isLeader && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
                /* min-h-[44px] garantiza touch target suficiente en mobile */
                className={`
                  flex items-center gap-1.5 px-3 py-2.5 sm:py-1 min-h-[44px] sm:min-h-0 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider transition-all
                  ${isLocked
                    ? 'bg-pokeball-red/15 text-pokeball-red border border-pokeball-red/30'
                    : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent'}
                `}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  {isLocked ? (
                    <><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>
                  ) : (
                    <><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></>
                  )}
                </svg>
                {isLocked ? 'FIJADO' : 'FIJAR'}
              </button>
            )}
          </div>
        </div>

        <div className="pokeball-divider mx-4 sm:mx-5 my-1" />

        {!pokemon ? (
          /* EMPTY STATE */
          <div className="flex-1 flex flex-col justify-center gap-4 px-4 sm:px-5 pb-5 relative z-10">
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center border border-border">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
              </div>
              <p className="text-xs sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                {isLeader ? 'Elige a tu lider' : 'Buscar Pokemon'}
              </p>
            </div>

            <div className="relative w-full">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Nombre o forma (Ej: Ninetales-Alola)..."
                /* py-4 en mobile = 48px de alto, buen touch target */
                className="w-full bg-secondary/50 border border-border rounded-xl pl-11 pr-4 py-4 sm:py-3.5 text-sm sm:text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/50 focus:border-pokeball-red/50 placeholder:text-muted-foreground/60 transition-all"
              />
              {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border-2 border-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] max-h-64 overflow-y-auto custom-scrollbar z-[60]">
                  {results.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => { setPokemon(p); onSelect(p); setSearchTerm(''); setResults([]); }}
                      /* min-h de 48px para tap targets cómodos */
                      className="w-full min-h-[48px] sm:min-h-0 p-3.5 sm:p-3 text-left hover:bg-pokeball-red/15 flex items-center justify-between border-b border-border/50 last:border-b-0 transition-colors group/item"
                    >
                      <span className="text-xs sm:text-[11px] font-black uppercase text-foreground group-hover/item:text-pokeball-red transition-colors truncate pr-2">
                        {p.nombre.replace('-', ' ')}
                      </span>
                      <div className="flex gap-1.5 shrink-0">
                        {[p.tipo1, p.tipo2].filter(Boolean).map((t: string) => (
                          <span key={t} className={`px-2 py-1 sm:px-1.5 sm:py-0.5 rounded text-[9px] sm:text-[7px] font-black uppercase shadow-sm ${TYPE_COLORS[t.toLowerCase()] || 'bg-secondary text-foreground'}`}>
                            {TYPE_TRANSLATIONS[t.toLowerCase()] || t}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* FILLED STATE */
          <div className="flex-1 flex flex-col px-4 sm:px-5 pb-4 sm:pb-5 relative z-10">
            {/* Pokemon Header */}
            <div className="flex items-center gap-4 my-3 sm:my-4">
              <div className="relative flex-shrink-0">
                <div className={`w-20 h-20 rounded-xl p-1.5 border-2 ${isLocked ? 'border-pokeball-red/40 bg-pokeball-red/5' : 'border-border bg-secondary/30'} transition-all flex items-center justify-center`}>
                  <img
                    src={pokemon.sprite_url || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
                    alt={pokemon.nombre}
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                </div>
                {isLocked && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-4 sm:h-4 bg-pokeball-red rounded-full flex items-center justify-center sparkle">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" className="text-primary-foreground">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black uppercase italic text-foreground leading-tight truncate">
                  {pokemon.nombre.replace('-', ' ')}
                </h3>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {activeTipos.map((t: string) => (
                    <span key={t} className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[8px] font-black uppercase ${TYPE_COLORS[t.toLowerCase()] || 'bg-secondary text-foreground'}`}>
                      {TYPE_TRANSLATIONS[t.toLowerCase()] || t}
                    </span>
                  ))}
                  {pokemon.suggestedBuild?.teraType && (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[8px] font-black uppercase bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>
                      Tera: {TYPE_TRANSLATIONS[pokemon.suggestedBuild.teraType.toLowerCase()] || pokemon.suggestedBuild.teraType}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Build Details */}
            <div className="grid grid-cols-2 gap-2.5 mb-3 sm:mb-4">
              <div className="space-y-1">
                <label className="text-[10px] sm:text-[8px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-400"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>
                  Objeto
                </label>
                <div className="bg-secondary/40 border border-border px-3 py-2.5 sm:py-2 rounded-lg text-xs sm:text-[10px] font-bold text-foreground/80 truncate" title={pokemon.suggestedBuild?.item}>
                  {pokemon.suggestedBuild?.item || "---"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] sm:text-[8px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-pokeball-red"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  Habilidad
                </label>
                <div className="bg-pokeball-red/5 border border-pokeball-red/20 px-3 py-2.5 sm:py-2 rounded-lg text-xs sm:text-[10px] font-bold text-pokeball-red truncate" title={pokemon.suggestedBuild?.ability}>
                  {pokemon.suggestedBuild?.ability || "---"}
                </div>
              </div>
            </div>

            {/* Moves */}
            <div className="space-y-1.5 mb-3 sm:mb-4 flex-1">
              <label className="text-[10px] sm:text-[8px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-foreground/50"><path d="M14.5 4h-5L7 7H2v13h20V7h-5l-2.5-3z"/><circle cx="12" cy="14" r="4"/></svg>
                Movimientos
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {(pokemon.suggestedBuild?.moves || Array(4).fill("---")).map((m: string, i: number) => (
                  <div key={i} className="px-3.5 py-2.5 sm:py-2 bg-secondary/30 border border-border rounded-lg text-xs sm:text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <span className="w-5 h-5 sm:w-4 sm:h-4 rounded-full bg-pokeball-red/10 flex items-center justify-center text-[8px] sm:text-[7px] text-pokeball-red font-black flex-shrink-0">{i + 1}</span>
                    <span className="truncate">{m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions footer */}
            <div className="mt-auto border-t border-border pt-3">
              {/* Fila 1: Remover + Genetica — botones con min-h para touch */}
              <div className="flex justify-between items-center mb-2 gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(null); }}
                  className="min-h-[44px] sm:min-h-0 px-3 sm:px-0 flex items-center gap-1.5 text-[11px] sm:text-[9px] font-black text-muted-foreground hover:text-destructive uppercase tracking-widest transition-colors rounded-lg sm:rounded-none sm:bg-transparent bg-secondary/40 border border-transparent sm:border-none"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  Remover
                </button>
                {pokemon.suggestedBuild && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="min-h-[44px] sm:min-h-0 flex items-center gap-1.5 text-[11px] sm:text-[9px] font-black text-pokeball-red uppercase tracking-widest hover:text-foreground transition-colors bg-pokeball-red/10 hover:bg-pokeball-red/20 px-3 py-2.5 sm:py-1.5 rounded-lg border border-pokeball-red/20"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    Genetica
                  </button>
                )}
              </div>

              {/* Fila 2: Botón BAN */}
              {canBan && (
                <button
                  onClick={handleBan}
                  disabled={isBanning}
                  /* py-3.5 en mobile = ~52px, fácil de pulsar con el pulgar */
                  className="
                    w-full flex items-center justify-center gap-2 py-3.5 sm:py-2.5 rounded-xl sm:rounded-lg
                    text-xs sm:text-[9px] font-black uppercase tracking-widest transition-all
                    bg-orange-500/10 border border-orange-500/25 text-orange-500
                    hover:bg-orange-500/20 hover:border-orange-500/50 hover:text-orange-400
                    disabled:opacity-50 disabled:cursor-not-allowed
                    active:scale-[0.98]
                  "
                >
                  {isBanning ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Baneando...
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="m4.9 4.9 14.2 14.2"/>
                      </svg>
                      Banear y Regenerar
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && mounted && createPortal(geneticsModal, document.body)}
    </div>
  );
}