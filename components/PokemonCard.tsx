'use client';
import React, { useState, useEffect } from 'react';
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

export default function PokemonCard({ slotNumber, data, isLocked, onToggleLock, onSelect }: any) {
  const [pokemon, setPokemon] = useState<any>(data || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { setPokemon(data); setIsModalOpen(false); }, [data]);

  const handleSearch = async (val: string) => {
    setSearchTerm(val);
    if (val.length > 2) {
      const res = await fetch(`/api/pokemon/search?name=${val.toLowerCase()}`);
      setResults(await res.json());
    }
  };

  const natureInfo = pokemon?.suggestedBuild?.nature
    ? `${pokemon.suggestedBuild.nature} (${NATURES[pokemon.suggestedBuild.nature] || 'Neutral'})` : "---";

  const activeTipos = pokemon?.tipos || [pokemon?.tipo1, pokemon?.tipo2].filter(Boolean);

  const isLeader = slotNumber === 1;

  return (
    <div className="relative min-h-[580px] group flex flex-col">
      <div className={`
        flex-1 relative overflow-hidden
        bg-card border-2
        ${isLocked
          ? 'border-pokeball-red shadow-[0_0_25px_rgba(220,38,38,0.25)]'
          : 'border-border hover:border-pokeball-red/40'}
        rounded-2xl flex flex-col transition-all duration-300
      `}>
        {/* Card top accent - Pokeball inspired red/white split */}
        <div className="absolute top-0 left-0 right-0 h-1.5 overflow-hidden rounded-t-2xl">
          <div className={`h-full ${isLocked ? 'bg-pokeball-red' : 'bg-gradient-to-r from-pokeball-red/60 via-pokeball-red/30 to-transparent'}`} />
        </div>

        {/* Pokeball watermark in background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none">
          <PokeballSlotIcon className="text-foreground w-48 h-48" />
        </div>

        {/* Header bar */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black
              ${isLeader
                ? 'bg-pokeball-red text-primary-foreground pokeball-pulse'
                : 'bg-secondary text-secondary-foreground'}
            `}>
              {isLeader ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              ) : (
                <span>{slotNumber}</span>
              )}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${isLeader ? 'text-pokeball-red' : 'text-muted-foreground'}`}>
              {isLeader ? 'LIDER' : `SLOT-0${slotNumber}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {pokemon && !isLeader && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all
                  ${isLocked
                    ? 'bg-pokeball-red/15 text-pokeball-red border border-pokeball-red/30'
                    : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent'}
                `}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {isLocked ? (
                    <>
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </>
                  ) : (
                    <>
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                    </>
                  )}
                </svg>
                {isLocked ? 'FIJADO' : 'FIJAR'}
              </button>
            )}
          </div>
        </div>

        {/* Pokeball divider */}
        <div className="pokeball-divider mx-5 my-1" />

        {!pokemon ? (
          /* EMPTY STATE - Search */
          <div className="flex-1 flex flex-col justify-center gap-4 px-5 pb-5 relative z-10">
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center border border-border">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
              </div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                {isLeader ? 'Elige a tu lider' : 'Buscar Pokemon'}
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Nombre o tipo..."
                className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-3.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/50 focus:border-pokeball-red/50 placeholder:text-muted-foreground/60 transition-all"
              />
            </div>

            {results.length > 0 && (
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto no-scrollbar">
                {results.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => { setPokemon(p); onSelect(p); setSearchTerm(''); setResults([]); }}
                    className="w-full p-3.5 text-left hover:bg-pokeball-red/10 flex items-center justify-between border-b border-border last:border-b-0 transition-colors group/item"
                  >
                    <span className="text-[11px] font-black uppercase text-foreground group-hover/item:text-pokeball-red transition-colors">{p.nombre}</span>
                    <div className="flex gap-1.5">
                      {[p.tipo1, p.tipo2].filter(Boolean).map((t: string) => (
                        <span key={t} className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${TYPE_COLORS[t.toLowerCase()] || 'bg-secondary text-foreground'}`}>
                          {TYPE_TRANSLATIONS[t.toLowerCase()] || t}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* FILLED STATE - Pokemon Data */
          <div className="flex-1 flex flex-col px-5 pb-5 relative z-10">
            {/* Pokemon Header */}
            <div className="flex items-center gap-4 my-4">
              <div className="relative">
                <div className={`w-20 h-20 rounded-xl p-1.5 border-2 ${isLocked ? 'border-pokeball-red/40 bg-pokeball-red/5' : 'border-border bg-secondary/30'} transition-all`}>
                  <img src={pokemon.sprite_url} alt={pokemon.nombre} className="w-full h-full object-contain drop-shadow-lg" />
                </div>
                {isLocked && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-pokeball-red rounded-full flex items-center justify-center sparkle">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="text-primary-foreground"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black uppercase italic text-foreground leading-tight truncate">{pokemon.nombre}</h3>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {activeTipos.map((t: string) => (
                    <span key={t} className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase ${TYPE_COLORS[t.toLowerCase()] || 'bg-secondary text-foreground'}`}>
                      {TYPE_TRANSLATIONS[t.toLowerCase()] || t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Build Details */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-400"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>
                  Objeto
                </label>
                <div className="bg-secondary/40 border border-border px-3 py-2 rounded-lg text-[10px] font-bold text-foreground/80 truncate">{pokemon.suggestedBuild?.item || "---"}</div>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-pokeball-red"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  Habilidad
                </label>
                <div className="bg-pokeball-red/5 border border-pokeball-red/20 px-3 py-2 rounded-lg text-[10px] font-bold text-pokeball-red truncate">{pokemon.suggestedBuild?.ability || "---"}</div>
              </div>
            </div>

            {/* Moves */}
            <div className="space-y-1.5 mb-4 flex-1">
              <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-foreground/50"><path d="M14.5 4h-5L7 7H2v13h20V7h-5l-2.5-3z"/><circle cx="12" cy="14" r="4"/></svg>
                Movimientos
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {(pokemon.suggestedBuild?.moves || Array(4).fill("---")).map((m: string, i: number) => (
                  <div key={i} className="px-3.5 py-2 bg-secondary/30 border border-border rounded-lg text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-pokeball-red/10 flex items-center justify-center text-[7px] text-pokeball-red font-black flex-shrink-0">{i + 1}</span>
                    <span className="truncate">{m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between mt-auto border-t border-border pt-3">
              <button
                onClick={(e) => { e.stopPropagation(); onSelect(null); }}
                className="text-[9px] font-black text-muted-foreground hover:text-destructive uppercase tracking-widest relative z-20 transition-colors flex items-center gap-1.5"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                Remover
              </button>
              {pokemon.suggestedBuild && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-[9px] font-black text-pokeball-red uppercase tracking-widest hover:text-foreground transition-colors ml-auto bg-pokeball-red/10 hover:bg-pokeball-red/20 px-3 py-1.5 rounded-lg border border-pokeball-red/20 flex items-center gap-1.5"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  Genetica
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Genetics Modal */}
      {isModalOpen && pokemon && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md" style={{ isolation: 'isolate' }} role="dialog" aria-modal="true" aria-label={`Detalles geneticos de ${pokemon.nombre}`} onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="bg-card border-2 border-pokeball-red/40 rounded-2xl p-8 max-w-md w-full relative shadow-[0_0_60px_rgba(220,38,38,0.15)] overflow-hidden">
            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pokeball-red via-pokeball-red/60 to-transparent" />

            <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-secondary hover:bg-destructive hover:text-destructive-foreground rounded-full text-muted-foreground transition-colors font-bold text-xs" aria-label="Cerrar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            <div className="flex items-center gap-4 border-b border-border pb-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-secondary/30 border border-border p-1.5">
                <img src={pokemon.sprite_url} alt={pokemon.nombre} className="w-full h-full object-contain drop-shadow-lg" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase text-pokeball-red italic leading-none">{pokemon.nombre}</h3>
                <div className="flex gap-1.5 mt-2">
                  {activeTipos.map((t: string) => (
                    <span key={t} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${TYPE_COLORS[t.toLowerCase()] || 'bg-secondary text-foreground'}`}>{TYPE_TRANSLATIONS[t.toLowerCase()] || t}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Naturaleza Recomendada
                </label>
                <div className="mt-1.5 text-xs font-bold text-emerald-100 bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-500/20">{natureInfo}</div>
              </div>
              <div>
                <label className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Distribucion de EVs
                </label>
                <div className="mt-1.5 text-xs font-bold text-amber-100 bg-amber-500/10 px-4 py-3 rounded-xl border border-amber-500/20">{pokemon.suggestedBuild?.evs || "---"}</div>
              </div>
              <div>
                <label className="text-[9px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  Esquema de IVs (Genes)
                </label>
                <div className="mt-1.5 text-[10px] font-bold text-sky-100 bg-sky-500/10 px-4 py-4 rounded-xl border border-sky-500/20 tracking-wide">{pokemon.suggestedBuild?.ivs || "31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe"}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
