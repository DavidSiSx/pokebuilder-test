'use client';
import React, { useState, useEffect } from 'react';
import PokemonCard from '@/components/PokemonCard';
import TeamAnalysis from '@/components/TeamAnalysis';
import SidebarFilters from '@/components/SidebarFilters';
import { PokeballIcon, PokeballBgPattern } from '@/components/PokeballIcon';
import { analyzeTeamDetailed, TeamMember, DetailedTypeAnalysis } from '@/utils/teamAnalysis';

export default function Home() {
  const [team, setTeam] = useState<(TeamMember | null)[]>(Array(6).fill(null));
  const [lockedSlots, setLockedSlots] = useState<boolean[]>(Array(6).fill(false));
  const [analysis, setAnalysis] = useState<DetailedTypeAnalysis | null>(null);
  const [aiReport, setAiReport] = useState<any>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [isDynamicMode, setIsDynamicMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [config, setConfig] = useState({
    format: 'National Dex Doubles (6v6 - Cobblemon)',
    customStrategy: '',
    experienceLevel: 'experto',
    clauses: ['Species Clause', 'Item Clause (VGC)'],
    allowLegendaries: true,
    allowMythicals: true,
    allowParadox: true,
    allowUB: true,
    isLittleCup: false,
    isRandomizer: false,
    isMonotype: false,
    monoTypeSelected: '',
    preferredWeather: 'none',
    preferredTerrain: 'none',
    preferTrickRoom: false,
    preferTailwind: false,
    teamArchetype: '',
  });

  useEffect(() => {
    const newLocks = [...lockedSlots];
    newLocks[0] = team[0] !== null;
    setLockedSlots(newLocks);
    const active = team.filter((m): m is TeamMember => m !== null);
    setAnalysis(active.length > 0 ? analyzeTeamDetailed(active) : null);
  }, [team]);

  const handleSmartFill = async () => {
    const leader = team[0];
    if (!leader) return;
    setIsAnalysing(true);
    setAiReport(null);
    setErrorModal(null);
    setIsDynamicMode(false);

    try {
      const lockedIds = team.filter((p, i) => p !== null && lockedSlots[i]).map(p => p!.id);
      const ignoredIds = team.filter((p, i) => p !== null && !lockedSlots[i] && i !== 0).map(p => p!.id);

      const res = await fetch(`/api/pokemon/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderId: (leader as any).id, config, lockedIds, ignoredIds })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorModal(data.message || data.error || "Error en el motor tactico.");
        setIsAnalysing(false);
        return; 
      }
      
      setAiReport(data.aiReport);
      setIsDynamicMode(data.isDynamicMode || false);

      const newTeam = [...team];
      let suggestedIndex = 0;
      for (let i = 0; i < 6; i++) {
        if (lockedSlots[i] && newTeam[i]) {
          const pokeId = newTeam[i]!.id.toString();
          if (data.validLockedIds.includes(newTeam[i]!.id)) {
            if (data.builds && data.builds[pokeId]) newTeam[i]!.suggestedBuild = data.builds[pokeId];
          } else {
            newTeam[i] = null;
            lockedSlots[i] = false;
          }
        } else {
          const newPoke = data.team[suggestedIndex];
          if (newPoke) {
            newTeam[i] = {
              ...newPoke,
              tipos: [newPoke.tipo1, newPoke.tipo2].filter(Boolean),
              suggestedBuild: data.builds[newPoke.id.toString()] || null
            };
            suggestedIndex++;
          }
        }
      }
      setTeam(newTeam);
    } catch {
      setErrorModal("Cuota de Gemini excedida o error de red. Espera 60 segundos.");
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleSelect = (i: number, p: any) => {
    const nt = [...team];
    nt[i] = p;
    setTeam(nt);
    if (!p) {
      const nl = [...lockedSlots];
      nl[i] = false;
      setLockedSlots(nl);
    }
  };

  const toggleLock = (i: number) => {
    const newLocks = [...lockedSlots];
    newLocks[i] = !newLocks[i];
    setLockedSlots(newLocks);
  };

  const activeCount = team.filter(p => p !== null).length;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden relative selection:bg-pokeball-red/30">
      
      {/* ERROR MODAL */}
      {errorModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md animate-in fade-in" role="alertdialog" aria-modal="true" aria-label="Error">
          <div className="bg-card border-2 border-pokeball-red/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_60px_rgba(220,38,38,0.2)] flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-pokeball-red" />
            <PokeballBgPattern />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-pokeball-red/10 rounded-full flex items-center justify-center mb-4 border-2 border-pokeball-red/30">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pokeball-red"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              </div>
              <h3 className="text-lg font-black uppercase text-pokeball-red mb-2 tracking-wide">Error de Inferencia</h3>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed">{errorModal}</p>
              <button onClick={() => setErrorModal(null)} className="w-full py-4 bg-pokeball-red hover:bg-pokeball-dark text-primary-foreground text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg border border-pokeball-red/50">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'w-[380px]' : 'w-[60px]'} bg-card border-r-2 border-border flex flex-col h-full z-10 shadow-2xl relative transition-all duration-300 overflow-hidden`}>
        {/* Pokeball BG accent */}
        <PokeballBgPattern />
        
        {/* Top red band accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pokeball-red via-pokeball-red/60 to-transparent z-20" />

        {/* Sidebar Header */}
        <div className={`flex items-center gap-3 relative z-10 px-6 pt-6 pb-4 ${!sidebarOpen ? 'justify-center px-3' : ''}`}>
          {sidebarOpen ? (
            <>
              <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
                <PokeballIcon size={40} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none text-foreground">Pokelab</h1>
                <span className="text-[8px] text-pokeball-red font-black uppercase tracking-[0.3em]">Tactical Engine</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors" aria-label="Cerrar sidebar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            </>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center" aria-label="Abrir sidebar">
              <PokeballIcon size={32} />
            </button>
          )}
        </div>

        {/* Pokeball divider under header */}
        {sidebarOpen && <div className="pokeball-divider mx-6 mb-4" />}

        {/* Sidebar Content */}
        {sidebarOpen && (
          <div className="flex-1 overflow-hidden flex flex-col px-6 relative z-10">
            <SidebarFilters config={config} setConfig={setConfig} />
          </div>
        )}

        {/* Generate button */}
        {sidebarOpen && team[0] !== null && (
          <div className="p-6 pt-3 relative z-10 bg-gradient-to-t from-card via-card to-transparent">
            <button 
              onClick={handleSmartFill} 
              disabled={isAnalysing} 
              className="w-full py-4 bg-pokeball-red hover:bg-pokeball-dark disabled:bg-secondary disabled:text-muted-foreground text-primary-foreground text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all shadow-[0_4px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_30px_rgba(220,38,38,0.5)] disabled:shadow-none border border-pokeball-red/50 disabled:border-border flex items-center justify-center gap-2.5"
            >
              {isAnalysing ? (
                <>
                  <PokeballIcon size={16} className="animate-spin" />
                  <span>Evaluando Meta...</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m13 2-2 2.5h3L12 7"/><path d="M10 14v-3"/><path d="M14 14v-3"/><path d="M11 19c-1.7 0-3-1.3-3-3v-2h8v2c0 1.7-1.3 3-3 3h-2z"/></svg>
                  <span>{activeCount <= 1 ? 'Generar Squad' : 'Reconstruir Squad'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative" style={{ isolation: 'isolate' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <PokeballBgPattern />
        </div>

        {/* Top bar for mobile toggle */}
        {!sidebarOpen && (
          <div className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-6 py-3 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Abrir sidebar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              <span className="text-[10px] font-black uppercase tracking-widest">Menu</span>
            </button>
            <div className="pokeball-divider flex-1" />
            <div className="flex items-center gap-2">
              <PokeballIcon size={20} />
              <span className="text-xs font-black italic uppercase text-foreground">Pokelab</span>
            </div>
          </div>
        )}

        <div className="p-8 lg:p-12 relative z-10">
          <div className="max-w-7xl mx-auto space-y-10">
            
            {/* HEURISTIC BANNER */}
            {isDynamicMode && (
              <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-5 flex items-center gap-5 animate-in fade-in slide-in-from-top-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-amber-500/30">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Analisis Heuristico Activado</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">El lider no tiene datos vectoriales. La IA esta improvisando basandose en su conocimiento general de la Pokedex. <strong className="text-amber-200 font-bold">La sinergia podria ser suboptima.</strong></p>
                </div>
              </div>
            )}

            {/* ACTIVE FILTERS TAGS */}
            {(config.isMonotype || config.preferredWeather !== 'none' || config.preferredTerrain !== 'none' || config.preferTrickRoom || config.preferTailwind || config.teamArchetype) && (
              <div className="flex flex-wrap gap-2 animate-in fade-in">
                {config.isMonotype && config.monoTypeSelected && (
                  <span className="px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                    Monotype: {config.monoTypeSelected}
                  </span>
                )}
                {config.preferredWeather !== 'none' && (
                  <span className="px-3 py-1.5 bg-sky-500/15 border border-sky-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
                    Clima: {config.preferredWeather}
                  </span>
                )}
                {config.preferredTerrain !== 'none' && (
                  <span className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M2 22 16 8l2 2L4 24"/><path d="m9 1 3 3-3 3"/></svg>
                    Terreno: {config.preferredTerrain}
                  </span>
                )}
                {config.preferTrickRoom && (
                  <span className="px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider text-amber-400">Trick Room</span>
                )}
                {config.preferTailwind && (
                  <span className="px-3 py-1.5 bg-sky-500/15 border border-sky-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider text-sky-400">Tailwind</span>
                )}
                {config.teamArchetype && (
                  <span className="px-3 py-1.5 bg-pokeball-red/15 border border-pokeball-red/30 rounded-lg text-[9px] font-black uppercase tracking-wider text-pokeball-red flex items-center gap-1.5">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M2 12h6M6 8l4 4-4 4M22 12h-6M18 8l-4 4 4 4"/></svg>
                    {config.teamArchetype}
                  </span>
                )}
              </div>
            )}

            {/* POKEMON GRID */}
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {team.map((poke, i) => (
                <PokemonCard 
                  key={i} 
                  slotNumber={i + 1} 
                  data={poke} 
                  isLocked={lockedSlots[i]} 
                  onToggleLock={() => toggleLock(i)} 
                  onSelect={(p: any) => handleSelect(i, p)} 
                />
              ))}
            </section>

            {/* TEAM ANALYSIS */}
            <section className="bg-card rounded-2xl p-6 lg:p-8 border-2 border-border shadow-xl relative overflow-visible" style={{ isolation: 'isolate' }}>
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <PokeballBgPattern />
              </div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pokeball-red via-pokeball-red/40 to-transparent rounded-t-2xl" />
              <div className="relative z-10">
                <TeamAnalysis analysis={analysis as any} />
              </div>
            </section>

            {/* AI TACTICAL REPORT */}
            {aiReport && (
              <div className="bg-card border-2 border-pokeball-red/30 rounded-2xl p-6 lg:p-8 shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-8 relative" style={{ isolation: 'isolate' }}>
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                  <PokeballBgPattern />
                </div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pokeball-red via-amber-500 to-emerald-500 opacity-60 rounded-t-2xl" />
                
                <div className="relative z-10 space-y-8">
                  <h2 className="text-[11px] font-black text-pokeball-red uppercase tracking-[0.25em] flex items-center gap-3">
                    <PokeballIcon size={18} />
                    Desglose Tactico del Motor
                    <span className="text-muted-foreground font-bold normal-case tracking-normal">({config.experienceLevel})</span>
                  </h2>
                  
                  <div className="bg-pokeball-red/5 p-6 rounded-xl border border-pokeball-red/15">
                    <h3 className="text-[9px] font-black text-pokeball-red uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-pokeball-red" />
                      Estrategia Operativa
                    </h3>
                    <div className="text-muted-foreground text-sm leading-relaxed">
                      {aiReport.estrategia.split('\n\n').map((paragraph: string, pIdx: number) => (
                        <p key={pIdx} className="mb-4 last:mb-0">
                          {paragraph.split('**').map((text: string, i: number) => 
                            i % 2 === 1 ? <span key={i} className="font-black text-foreground">{text}</span> : text
                          )}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Fortalezas Clave
                      </h3>
                      <ul className="space-y-2.5">
                        {aiReport.ventajas?.map((v: string, i: number) => (
                          <li key={i} className="text-muted-foreground text-sm flex gap-3">
                            <span className="text-emerald-400 mt-0.5 flex-shrink-0">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                            </span>
                            <span>
                              {v.split('**').map((text: string, j: number) => j % 2 === 1 ? <strong key={j} className="text-foreground">{text}</strong> : text)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-[9px] font-black text-pokeball-red uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pokeball-red" />
                        Amenazas y Debilidades
                      </h3>
                      <ul className="space-y-2.5">
                        {aiReport.debilidades?.map((d: string, i: number) => (
                          <li key={i} className="text-muted-foreground text-sm flex gap-3">
                            <span className="text-pokeball-red mt-0.5 flex-shrink-0">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </span>
                            <span>
                              {d.split('**').map((text: string, j: number) => j % 2 === 1 ? <strong key={j} className="text-foreground">{text}</strong> : text)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-border">
                    <h3 className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Protocolo de Leads (Apertura)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiReport.leads?.map((lead: any, i: number) => (
                        <div key={i} className="bg-secondary/30 p-5 rounded-xl border border-border hover:border-pokeball-red/20 transition-colors relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500/40 to-transparent" />
                          <h4 className="font-black text-foreground uppercase italic text-base mb-3">{lead.pokemon}</h4>
                          <p className="text-[10px] text-muted-foreground mb-2 leading-relaxed">
                            <span className="text-amber-400 font-black">ENTRADA:</span> {lead.condicion_uso}
                          </p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            <span className="text-pokeball-red font-black">RETIRADA:</span> {lead.condicion_cambio}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
