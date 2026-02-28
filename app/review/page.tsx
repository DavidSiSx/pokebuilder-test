'use client';
import React, { useState } from 'react';
import TeamReviewCard from '@/components/TeamReviewCard';
import ReviewResult from '@/components/ReviewResult';
import { PokeballIcon, PokeballBgPattern } from '@/components/PokeballIcon';
import Link from 'next/link';

const EMPTY_POKEMON = () => ({
  name: '',
  item: '',
  ability: '',
  nature: '',
  teraType: '',
  moves: ['', '', '', ''],
  evs: '',
  mechanic: 'none',
});

const FORMATOS = [
  { id: 'natdex_doubles_6v6', name: 'National Dex Doubles (6v6 - Cobblemon)' },
  { id: 'vgc_modern', name: 'VGC Oficial (Dobles 4v4)' },
  { id: 'natdex_singles', name: 'National Dex Singles (6v6)' },
  { id: '1v1_6choose3', name: 'Combate Libre (Trae 6, Elige 3)' },
];

export default function ReviewPage() {
  const [team, setTeam] = useState(Array.from({ length: 6 }, () => EMPTY_POKEMON()));
  const [format, setFormat] = useState('National Dex Doubles (6v6 - Cobblemon)');
  const [mechanics, setMechanics] = useState({
    enableMega: false,
    enableGmax: false,
    enableTera: true,
    enableZMoves: false,
    enableDynamax: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const updatePokemon = (index: number, pokemon: any) => {
    const newTeam = [...team];
    newTeam[index] = pokemon;
    setTeam(newTeam);
  };

  const removePokemon = (index: number) => {
    const newTeam = [...team];
    newTeam[index] = EMPTY_POKEMON();
    setTeam(newTeam);
  };

  const filledSlots = team.filter(p => p.name).length;

  const handleSubmit = async () => {
    if (filledSlots === 0) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const filledTeam = team.filter(p => p.name);
      const res = await fetch('/api/pokemon/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: filledTeam, format, mechanics }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || 'Error al evaluar el equipo.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative selection:bg-pokeball-red/30">
      <PokeballBgPattern />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b-2 border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PokeballIcon size={32} />
            <div>
              <h1 className="text-lg font-black italic uppercase tracking-tight text-foreground leading-none">Team Reviewer</h1>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-pokeball-red">Evaluacion Tactica por IA</span>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
            Team Builder
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-8 relative z-10">
        <div className="space-y-8">

          {/* Config Bar */}
          <div className="bg-card border-2 border-border rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pokeball-red via-pokeball-red/40 to-transparent" />
            <div className="relative z-10">
              <h2 className="text-[9px] font-black text-pokeball-red uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-pokeball-red"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                Configuracion de Evaluacion
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1.5 block">Formato</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/40 cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23dc2626' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                  >
                    {FORMATOS.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1.5 block">Mecanicas Activas</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setMechanics(prev => ({ ...prev, enableTera: !prev.enableTera }))}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                        mechanics.enableTera
                          ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                          : 'bg-secondary/30 border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Tera
                    </button>
                    <button
                      onClick={() => setMechanics(prev => ({ ...prev, enableMega: !prev.enableMega }))}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                        mechanics.enableMega
                          ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                          : 'bg-secondary/30 border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Mega
                    </button>
                    <button
                      onClick={() => setMechanics(prev => ({ ...prev, enableGmax: !prev.enableGmax }))}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                        mechanics.enableGmax
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          : 'bg-secondary/30 border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Gmax
                    </button>
                    <button
                      onClick={() => setMechanics(prev => ({ ...prev, enableDynamax: !prev.enableDynamax }))}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                        mechanics.enableDynamax
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          : 'bg-secondary/30 border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Dmax
                    </button>
                    <button
                      onClick={() => setMechanics(prev => ({ ...prev, enableZMoves: !prev.enableZMoves }))}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                        mechanics.enableZMoves
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : 'bg-secondary/30 border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Z-Move
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Input Grid */}
          <div>
            <h2 className="text-[9px] font-black text-pokeball-red uppercase tracking-widest mb-4 flex items-center gap-2">
              <PokeballIcon size={14} />
              Tu Equipo ({filledSlots}/6)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {team.map((pokemon, i) => (
                <TeamReviewCard
                  key={i}
                  index={i}
                  pokemon={pokemon}
                  onChange={(p) => updatePokemon(i, p)}
                  onRemove={() => removePokemon(i)}
                  mechanics={mechanics}
                />
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleSubmit}
              disabled={isLoading || filledSlots === 0}
              className="px-10 py-4 bg-pokeball-red hover:bg-pokeball-dark disabled:bg-secondary disabled:text-muted-foreground text-primary-foreground text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all shadow-[0_4px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_30px_rgba(220,38,38,0.5)] disabled:shadow-none border border-pokeball-red/50 disabled:border-border flex items-center gap-3"
            >
              {isLoading ? (
                <>
                  <PokeballIcon size={16} className="animate-spin" />
                  <span>Evaluando Equipo...</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                  <span>Evaluar Equipo ({filledSlots} Pokemon)</span>
                </>
              )}
            </button>
            {filledSlots === 0 && (
              <p className="text-[10px] text-muted-foreground font-bold">Agrega al menos 1 Pokemon para evaluar</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-pokeball-red/10 border-2 border-pokeball-red/30 rounded-2xl p-6 flex items-center gap-4 animate-in fade-in">
              <div className="w-10 h-10 bg-pokeball-red/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pokeball-red"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              </div>
              <p className="text-sm text-pokeball-red font-bold">{error}</p>
            </div>
          )}

          {/* Review Result */}
          {result && (
            <div className="bg-card border-2 border-pokeball-red/30 rounded-2xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
              <PokeballBgPattern />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pokeball-red via-amber-500 to-emerald-500 opacity-60 rounded-t-2xl" />
              <div className="relative z-10">
                <h2 className="text-[11px] font-black text-pokeball-red uppercase tracking-[0.25em] mb-8 flex items-center gap-3">
                  <PokeballIcon size={18} />
                  Resultado de Evaluacion
                </h2>
                <ReviewResult data={result} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
