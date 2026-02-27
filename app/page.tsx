'use client';
import React, { useState, useEffect } from 'react';
import PokemonCard from '@/components/PokemonCard';
import TeamAnalysis from '@/components/TeamAnalysis';
import SidebarFilters from '@/components/SidebarFilters';
import { analyzeTeamDetailed, TeamMember, DetailedTypeAnalysis } from '@/utils/teamAnalysis';

export default function Home() {
  const [team, setTeam] = useState<(TeamMember | null)[]>(Array(6).fill(null));
  const [lockedSlots, setLockedSlots] = useState<boolean[]>(Array(6).fill(false));
  const [analysis, setAnalysis] = useState<DetailedTypeAnalysis | null>(null);
  const [aiReport, setAiReport] = useState<any>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [isDynamicMode, setIsDynamicMode] = useState(false);
  
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
    isRandomizer: false
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
        setErrorModal(data.message || data.error || "Error en el motor táctico.");
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
    } catch (e: any) {
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
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden relative selection:bg-blue-500/30">
      
      {/* MODAL DE ERROR */}
      {errorModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0a0a0a] border border-red-500/50 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 text-2xl">⚠️</div>
             <h3 className="text-xl font-black uppercase text-red-500 mb-2">Error de Inferencia</h3>
             <p className="text-zinc-400 text-sm mb-8 leading-relaxed">{errorModal}</p>
             <button onClick={() => setErrorModal(null)} className="w-full py-4 bg-red-600 hover:bg-red-500 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg">Entendido</button>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-[380px] bg-[#0a0a0a] border-r border-white/5 p-8 flex flex-col gap-8 h-full z-10 shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center font-black text-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)] border border-blue-400/20">PL</div>
          <div><h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Pokelab</h1><span className="text-[9px] text-blue-400 font-bold uppercase tracking-[0.3em]">Tactical Engine</span></div>
        </div>
        <SidebarFilters config={config} setConfig={setConfig} />
        {team[0] !== null && (
          <div className="mt-auto pt-4 relative z-10 bg-[#0a0a0a]">
            <button onClick={handleSmartFill} disabled={isAnalysing} className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-zinc-800 disabled:to-zinc-900 disabled:text-zinc-600 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl border border-blue-400/20 disabled:border-white/5">
              {isAnalysing ? "Evaluando Meta..." : (activeCount <= 1 ? "⚡ GENERAR SQUAD" : "⚡ RECONSTRUIR SQUAD")}
            </button>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-[#050505] to-[#050505]">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* BANNER HEURÍSTICO */}
          {isDynamicMode && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 flex items-center gap-6 animate-in fade-in slide-in-from-top-4">
              <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 border border-amber-500/30 text-2xl">⚠️</div>
              <div>
                <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-widest mb-1.5">Análisis Heurístico Activado</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">El líder no tiene datos vectoriales. La IA está improvisando basándose en su conocimiento general de la Pokedex. <strong className="text-amber-100 font-bold">La sinergia podría ser subóptima.</strong></p>
              </div>
            </div>
          )}

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {team.map((poke, i) => <PokemonCard key={i} slotNumber={i + 1} data={poke} isLocked={lockedSlots[i]} onToggleLock={() => toggleLock(i)} onSelect={(p: any) => handleSelect(i, p)} />)}
          </section>

          <section className="bg-[#0a0a0a] rounded-[3.5rem] p-12 border border-white/5 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl" />
             <div className="relative z-10"><TeamAnalysis analysis={analysis as any} /></div>
          </section>

          {aiReport && (
            <div className="bg-[#0a0a0a] border border-blue-500/20 rounded-[3.5rem] p-12 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500 opacity-50" />
              <h2 className="text-[12px] font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Desglose Táctico del Motor <span className="text-zinc-600">({config.experienceLevel})</span>
              </h2>
              
              <div className="bg-blue-900/10 p-6 rounded-2xl border border-blue-500/10">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Estrategia Operativa</h3>
                
                {/* RENDERIZADO CORREGIDO: Traduce \n\n a párrafos y ** a negritas */}
                <div className="text-zinc-300 text-sm leading-relaxed">
                  {aiReport.estrategia.split('\n\n').map((paragraph: string, pIdx: number) => (
                    <p key={pIdx} className="mb-4 last:mb-0">
                      {paragraph.split('**').map((text: string, i: number) => 
                        i % 2 === 1 ? <span key={i} className="font-black text-white">{text}</span> : text
                      )}
                    </p>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Fortalezas Clave</h3>
                  <ul className="space-y-2">
                    {aiReport.ventajas?.map((v: string, i: number) => (
                      <li key={i} className="text-zinc-300 text-sm flex gap-3">
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        <span>
                          {v.split('**').map((text, j) => j % 2 === 1 ? <strong key={j} className="text-white">{text}</strong> : text)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest">Amenazas y Debilidades</h3>
                  <ul className="space-y-2">
                    {aiReport.debilidades?.map((d: string, i: number) => (
                      <li key={i} className="text-zinc-300 text-sm flex gap-3">
                        <span className="text-red-500 mt-0.5">✗</span>
                        <span>
                          {d.split('**').map((text, j) => j % 2 === 1 ? <strong key={j} className="text-white">{text}</strong> : text)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Protocolo de Leads (Apertura)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiReport.leads?.map((lead: any, i: number) => (
                    <div key={i} className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5">
                      <h4 className="font-black text-white uppercase italic text-lg mb-3">{lead.pokemon}</h4>
                      <p className="text-xs text-zinc-300 mb-2 leading-relaxed"><span className="text-amber-500 font-black">ENTRADA:</span> {lead.condicion_uso}</p>
                      <p className="text-xs text-zinc-300 leading-relaxed"><span className="text-red-400 font-black">RETIRADA:</span> {lead.condicion_cambio}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}