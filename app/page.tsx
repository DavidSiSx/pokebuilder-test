'use client';
import React, { useState, useEffect, useCallback } from 'react';
import PokemonCard from '@/components/PokemonCard';
import TeamAnalysis from '@/components/TeamAnalysis';
import SidebarFilters from '@/components/SidebarFilters';
import { PokeballIcon, PokeballBgPattern } from '@/components/PokeballIcon';
import { analyzeTeamDetailed, TeamMember, DetailedTypeAnalysis } from '@/utils/teamAnalysis';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TutorialGuide from '@/components/TutorialGuide';

function useTheme() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem('pokelab-theme');
    const prefersDark = saved ? saved === 'dark' : true;
    setIsDark(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
  }, []);
  const toggle = () => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('pokelab-theme', next ? 'dark' : 'light');
      return next;
    });
  };
  return { isDark, toggle };
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

interface BlacklistEntry {
  id: number;
  nombre: string;
  sprite_url?: string;
  tipo1?: string;
  tipo2?: string;
}

const MAX_FILL_RETRIES = 2;
const BLACKLIST_STORAGE_KEY = 'pokelab-blacklist';

export default function Home() {
  const [team, setTeam] = useState<(TeamMember | null)[]>(Array(6).fill(null));
  const [lockedSlots, setLockedSlots] = useState<boolean[]>(Array(6).fill(false));
  const [analysis, setAnalysis] = useState<DetailedTypeAnalysis | null>(null);
  const [aiReport, setAiReport] = useState<any>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysingLabel, setAnalysingLabel] = useState('Evaluando Meta...');
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [isDynamicMode, setIsDynamicMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [runTutorial, setRunTutorial] = useState(false);

  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [blacklistOpen, setBlacklistOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BLACKLIST_STORAGE_KEY);
      if (saved) setBlacklist(JSON.parse(saved));
    } catch { }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(BLACKLIST_STORAGE_KEY, JSON.stringify(blacklist));
    } catch { }
  }, [blacklist]);

  const addToBlacklist = useCallback((pokemon: BlacklistEntry) => {
    setBlacklist(prev => {
      if (prev.some(p => p.id === pokemon.id)) return prev;
      return [...prev, { id: pokemon.id, nombre: pokemon.nombre, sprite_url: pokemon.sprite_url, tipo1: pokemon.tipo1, tipo2: pokemon.tipo2 }];
    });
  }, []);

  const removeFromBlacklist = useCallback((id: number) => {
    setBlacklist(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearBlacklist = useCallback(() => setBlacklist([]), []);

  const router = useRouter();
  const { isDark, toggle: toggleTheme } = useTheme();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

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
    enableMega: false,
    enableGmax: false,
    enableTera: true,
    preferredTeraType: '',
    enableZMoves: false,
    enableDynamax: false,
    includeAlola: true,
    includeGalar: true,
    includeHisui: true,
    includePaldea: true,
    generationMode: 'leader',
  });

  const leader = config.generationMode === 'leader' ? (team[0] ?? null) : null;

  useEffect(() => {
    if (config.generationMode === 'leader') {
      const newLocks = [...lockedSlots];
      newLocks[0] = team[0] !== null;
      setLockedSlots(newLocks);
    }
    const active = team.filter((m): m is TeamMember => m !== null);
    setAnalysis(active.length > 0 ? analyzeTeamDetailed(active) : null);
  }, [team, config.generationMode]);

  const fetchSuggestion = useCallback(async (
    currentTeam: (TeamMember | null)[],
    currentLocks: boolean[],
    extraIgnoredIds: number[] = []
  ) => {
    const isScratch = config.generationMode === 'scratch';
    const leaderPoke = currentTeam[0];
    if (!isScratch && !leaderPoke) return null;

    const lockedIds = currentTeam
      .filter((p, i) => p !== null && currentLocks[i])
      .map(p => p!.id);

    const ignoredIds = [
      ...new Set([
        ...currentTeam.filter((p, i) => p !== null && !currentLocks[i]).map(p => p!.id),
        ...blacklist.map(b => b.id),
        ...extraIgnoredIds,
      ]),
    ];

    const body = isScratch
      ? { leaderId: null, config, lockedIds: [], ignoredIds, scratchMode: true }
      : { leaderId: (leaderPoke as any).id, config, lockedIds, ignoredIds, scratchMode: false };

    const res = await fetch(`/api/pokemon/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  }, [config, blacklist]);

  const mergeResponse = useCallback((
    currentTeam: (TeamMember | null)[],
    currentLocks: boolean[],
    data: any
  ): { newTeam: (TeamMember | null)[], newLocks: boolean[] } => {
    const isScratch = config.generationMode === 'scratch';
    const newTeam = [...currentTeam];
    const newLocks = [...currentLocks];

    if (isScratch) {
      for (let i = 0; i < 6; i++) {
        const p = data.team[i];
        newTeam[i] = p ? { ...p, tipos: [p.tipo1, p.tipo2].filter(Boolean), suggestedBuild: data.builds?.[p.id.toString()] || null } : null;
        newLocks[i] = false;
      }
    } else {
      let suggestedIndex = 0;
      for (let i = 0; i < 6; i++) {
        if (currentLocks[i] && newTeam[i]) {
          const pokeId = newTeam[i]!.id.toString();
          if (data.validLockedIds.includes(newTeam[i]!.id)) {
            if (data.builds?.[pokeId]) newTeam[i]!.suggestedBuild = data.builds[pokeId];
          } else {
            newTeam[i] = null;
            newLocks[i] = false;
          }
        } else if (!currentLocks[i]) {
          const p = data.team[suggestedIndex];
          newTeam[i] = p ? { ...p, tipos: [p.tipo1, p.tipo2].filter(Boolean), suggestedBuild: data.builds?.[p.id.toString()] || null } : null;
          suggestedIndex++;
        }
      }
    }
    return { newTeam, newLocks };
  }, [config.generationMode]);

  const handleSmartFill = async () => {
    const isScratch = config.generationMode === 'scratch';
    if (!isScratch && !team[0]) return;

    setIsAnalysing(true);
    setAnalysingLabel('Evaluando Meta...');
    setAiReport(null);
    setErrorModal(null);
    setIsDynamicMode(false);

    try {
      let workingTeam = [...team];
      let workingLocks = [...lockedSlots];
      let lastReport: any = null;
      let lastDynamic = false;
      const alreadyPlacedIds: number[] = [];

      for (let attempt = 0; attempt < MAX_FILL_RETRIES; attempt++) {
        if (attempt > 0) {
          const emptyCount = workingTeam.filter(p => p === null).length;
          setAnalysingLabel(`Completando equipo (${emptyCount} slots vacíos)...`);
        }

        const data = await fetchSuggestion(workingTeam, workingLocks, alreadyPlacedIds);
        if (!data) break;

        lastReport = data.aiReport;
        lastDynamic = data.isDynamicMode || false;

        const { newTeam, newLocks } = mergeResponse(workingTeam, workingLocks, data);
        workingTeam = newTeam;
        workingLocks = newLocks;

        newTeam.forEach(p => { if (p) alreadyPlacedIds.push(p.id); });
        if (workingTeam.filter(p => p === null).length === 0) break;
      }

      setAiReport(lastReport);
      setIsDynamicMode(lastDynamic);
      setTeam(workingTeam);
      setLockedSlots(workingLocks);

    } catch (err: any) {
      const msg = err?.message || err?.error || '';
      if (err?.status === 429 || msg.includes('DEMASIADAS') || msg.includes('CUOTA')) {
        setErrorModal('Has superado el límite de peticiones. Espera 1 minuto e inténtalo de nuevo.');
      } else if (err?.message) {
        setErrorModal(err.message);
      } else {
        setErrorModal('Cuota de Gemini excedida o error de red. Espera 60 segundos.');
      }
    } finally {
      setIsAnalysing(false);
      setAnalysingLabel('Evaluando Meta...');
    }
  };

  const handleBanAndRegenerate = useCallback(async (pokemon: any) => {
    const slotIndex = team.findIndex(p => p?.id === pokemon.id);
    if (slotIndex < 0) return;

    addToBlacklist(pokemon);

    const workingTeam = [...team];
    workingTeam[slotIndex] = null;

    const workingLocks = team.map((p, i) => {
      if (i === slotIndex) return false;
      return p !== null;
    });

    setTeam(workingTeam);
    setLockedSlots(workingLocks);
    setIsAnalysing(true);
    setAnalysingLabel(`Baneando ${pokemon.nombre}...`);

    try {
      const data = await fetchSuggestion(workingTeam, workingLocks, [pokemon.id]);
      if (!data) return;

      const { newTeam, newLocks } = mergeResponse(workingTeam, workingLocks, data);

      const finalLocks = lockedSlots.map((originalLock, i) => {
        if (i === slotIndex) return false;
        return originalLock;
      });

      setTeam(newTeam);
      setLockedSlots(finalLocks);
    } catch (err: any) {
      const msg = err?.message || err?.error || '';
      setErrorModal(
        err?.status === 429 || msg.includes('DEMASIADAS') || msg.includes('CUOTA')
          ? 'Límite de peticiones alcanzado. Espera 1 minuto.'
          : 'Error al regenerar. Inténtalo de nuevo.'
      );
      setTeam(team);
      setLockedSlots(lockedSlots);
    } finally {
      setIsAnalysing(false);
      setAnalysingLabel('Evaluando Meta...');
    }
  }, [team, lockedSlots, addToBlacklist, fetchSuggestion, mergeResponse]);

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
  const isScratchMode = config.generationMode === 'scratch';
  const canGenerate = isScratchMode ? true : team[0] !== null;

  return (
    <div className="flex h-[100dvh] bg-background text-foreground overflow-hidden relative selection:bg-pokeball-red/30">
      <TutorialGuide run={runTutorial} setRun={setRunTutorial} />

      {/* ERROR MODAL */}
      {errorModal && (
        <div className="absolute inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in" role="alertdialog">
          <div className="bg-card border-2 border-pokeball-red/50 rounded-t-3xl sm:rounded-2xl p-7 sm:p-8 w-full sm:max-w-md shadow-[0_0_60px_rgba(220,38,38,0.2)] flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-pokeball-red" />
            {/* Drag handle en mobile */}
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mb-6 sm:hidden" />
            <PokeballBgPattern />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-pokeball-red/10 rounded-full flex items-center justify-center mb-4 border-2 border-pokeball-red/30">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pokeball-red">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <path d="M12 9v4"/><path d="M12 17h.01"/>
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-black uppercase text-pokeball-red mb-2 tracking-wide">Error de Inferencia</h3>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed">{errorModal}</p>
              <button
                onClick={() => setErrorModal(null)}
                className="w-full py-4 bg-pokeball-red hover:bg-pokeball-dark text-primary-foreground text-sm sm:text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg border border-pokeball-red/50"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile sidebar backdrop */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-background/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/*
        SIDEBAR WRAPPER:
        En mobile → w-0 flex-shrink-0: el aside es fixed, no ocupa
        espacio en el flex, main recibe el 100% del ancho.
        En desktop → el wrapper hereda el ancho del aside.
      */}
      <div className={
        isMobile
          ? 'w-0 flex-shrink-0 overflow-visible'
          : `flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-[380px]' : 'w-[60px]'}`
      }>
      <aside className={`
        step-modo-generacion bg-card border-r-2 border-border flex flex-col z-30 shadow-2xl relative
        transition-all duration-300 overflow-hidden
        ${isMobile
          ? `fixed inset-y-0 left-0 w-[320px] h-[100dvh] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          : `h-full ${sidebarOpen ? 'w-[380px]' : 'w-[60px]'}`
        }
      `}>
        <PokeballBgPattern />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pokeball-red via-pokeball-red/60 to-transparent z-20" />

        <div className={`relative z-10 ${!sidebarOpen && !isMobile ? 'flex flex-col items-center px-3 pt-6 pb-4 gap-2' : 'px-5 pt-5 pb-3'}`}>
          {(sidebarOpen || isMobile) ? (
            /* ── Fila principal: icono + título + cerrar ── */
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <PokeballIcon size={36} />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-black italic tracking-tighter uppercase leading-none text-foreground">Pokelab</h1>
                  <span className="text-[8px] text-pokeball-red font-black uppercase tracking-[0.3em] mt-0.5 block">Tactical Engine</span>
                </div>
                {/* Cerrar — siempre a la derecha del título */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex-shrink-0"
                  aria-label="Cerrar sidebar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                </button>
              </div>

              {/* ── Fila secundaria: botón Tour ── */}
              <button
                onClick={() => setRunTutorial(true)}
                className="mt-2.5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-sky-400 hover:text-sky-300 bg-sky-400/10 hover:bg-sky-400/15 border border-sky-400/20 hover:border-sky-400/40 transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <path d="M12 17h.01"/>
                </svg>
                Ver Tour de la App
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center" aria-label="Abrir sidebar"><PokeballIcon size={32} /></button>
              <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                {isDark ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
              </button>
            </div>
          )}
        </div>

        {sidebarOpen && <div className="pokeball-divider mx-6 mb-4" />}

        {sidebarOpen && (
          <div className="px-6 mb-4 flex gap-2 relative z-10">
            <Link
              href="/review"
              className="step-reviewer flex-1 flex items-center justify-center gap-1.5 py-3 sm:py-2.5 bg-secondary/50 border border-border rounded-xl text-[11px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-pokeball-red/20 transition-all min-h-[48px] sm:min-h-0"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
              Reviewer
            </Link>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-12 sm:w-[42px] py-3 sm:py-2.5 bg-secondary/50 border border-border rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all min-h-[48px] sm:min-h-0"
              aria-label="Cambiar tema"
            >
              {isDark ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center justify-center gap-1.5 px-3 py-3 sm:py-2.5 bg-secondary/50 border border-border rounded-xl text-[11px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-pokeball-red hover:bg-pokeball-red/10 hover:border-pokeball-red/20 transition-all disabled:opacity-50 min-h-[48px] sm:min-h-0"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              {isLoggingOut ? '...' : 'Salir'}
            </button>
          </div>
        )}

        {sidebarOpen && (
          <div className="flex-1 overflow-hidden flex flex-col px-6 relative z-10">
            <SidebarFilters config={config} setConfig={setConfig} leader={leader} />
          </div>
        )}

        {sidebarOpen && canGenerate && (
          <div className="p-6 pt-3 relative z-10 bg-gradient-to-t from-card via-card to-transparent">
            <button
              onClick={handleSmartFill}
              disabled={isAnalysing}
              className="step-magia w-full py-4 sm:py-4 bg-pokeball-red hover:bg-pokeball-dark disabled:bg-secondary disabled:text-muted-foreground text-primary-foreground text-sm sm:text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all shadow-[0_4px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_30px_rgba(220,38,38,0.5)] disabled:shadow-none border border-pokeball-red/50 disabled:border-border flex items-center justify-center gap-2.5 min-h-[52px] active:scale-[0.98]"
            >
              {isAnalysing ? (
                <><PokeballIcon size={16} className="animate-spin" /><span className="truncate">{analysingLabel}</span></>
              ) : isScratchMode ? (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg><span>Generar Equipo Completo</span></>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m13 2-2 2.5h3L12 7"/><path d="M10 14v-3"/><path d="M14 14v-3"/><path d="M11 19c-1.7 0-3-1.3-3-3v-2h8v2c0 1.7-1.3 3-3 3h-2z"/></svg><span>{activeCount <= 1 ? 'Generar Squad' : 'Reconstruir Squad'}</span></>
              )}
            </button>
            {isScratchMode && !config.customStrategy.trim() && !isAnalysing && (
              <p className="text-[10px] sm:text-[9px] text-center text-muted-foreground/60 mt-2">Agrega una directiva táctica para mejores resultados</p>
            )}
          </div>
        )}

        {sidebarOpen && !canGenerate && !isScratchMode && (
          <div className="p-6 pt-3 relative z-10">
            <div className="w-full py-4 bg-secondary/30 border border-border rounded-xl text-center">
              <p className="text-xs sm:text-[10px] font-bold text-muted-foreground">Elige un <span className="text-pokeball-red font-black">Líder</span> en el Slot 1</p>
            </div>
          </div>
        )}
      </aside>
      </div>{/* /sidebar wrapper */}

      {/* MAIN CONTENT — en mobile ocupa siempre el 100% porque el sidebar es fixed */}
      <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar relative w-full" style={{ isolation: 'isolate' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}><PokeballBgPattern /></div>

        {/* ── TOP BAR en mobile / sidebar colapsado ── */}
        {(isMobile || !sidebarOpen) && (
          <div className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border px-4 py-0 flex items-center gap-3 min-h-[56px]">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-1"
              aria-label="Abrir sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              {!isMobile && <span className="text-[10px] font-black uppercase tracking-widest">Menu</span>}
            </button>
            <div className="pokeball-divider flex-1" />
            <div className="flex items-center gap-2"><PokeballIcon size={20} /><span className="text-xs font-black italic uppercase text-foreground">Pokelab</span></div>
            {isMobile && canGenerate && (
              <button
                onClick={handleSmartFill}
                disabled={isAnalysing}
                className="ml-2 flex items-center gap-2 px-4 py-2.5 bg-pokeball-red disabled:bg-secondary text-primary-foreground text-[11px] font-black uppercase tracking-wider rounded-lg transition-all border border-pokeball-red/50 disabled:border-border flex-shrink-0 min-h-[44px] active:scale-[0.97]"
              >
                {isAnalysing ? <PokeballIcon size={14} className="animate-spin" /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>}
                {isAnalysing ? 'IA...' : 'Generar'}
              </button>
            )}
          </div>
        )}

        <div className="p-4 sm:p-6 lg:p-12 relative z-10">
          <div className="max-w-7xl mx-auto space-y-5 sm:space-y-10">

            {isDynamicMode && (
              <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-amber-500/30">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
                <div>
                  <h3 className="text-[11px] sm:text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Analisis Heuristico Activado</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">El lider no tiene datos vectoriales. La IA esta improvisando. <strong className="text-amber-600 dark:text-amber-300">Sinergia puede ser suboptima.</strong></p>
                </div>
              </div>
            )}

            {isScratchMode && activeCount === 0 && (
              <div className="bg-violet-500/10 border-2 border-violet-500/20 rounded-2xl p-4 sm:p-6 flex items-start sm:items-center gap-4 animate-in fade-in">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-violet-500/30">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400"><path d="M12 5v14M5 12h14"/></svg>
                </div>
                <div>
                  <h3 className="text-[11px] sm:text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">Modo: Generar desde Cero</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">Escribe tu <strong className="text-violet-600 dark:text-violet-300">directiva táctica</strong> en el sidebar y presiona <strong className="text-violet-600 dark:text-violet-300">Generar Equipo Completo</strong>.</p>
                </div>
              </div>
            )}

            {/* ACTIVE FILTERS TAGS — scroll horizontal en mobile */}
            {(config.isMonotype || config.preferredWeather !== 'none' || config.preferredTerrain !== 'none' || config.preferTrickRoom || config.preferTailwind || config.teamArchetype || config.enableMega || config.enableGmax || config.enableTera || config.enableZMoves || config.enableDynamax) && (
              <div className="flex gap-2 animate-in fade-in overflow-x-auto pb-1 no-scrollbar">
                {config.enableMega && <span className="px-3 py-2 sm:py-1.5 bg-violet-500/15 border border-violet-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-violet-400 whitespace-nowrap flex-shrink-0">Mega Evolution</span>}
                {config.enableGmax && <span className="px-3 py-2 sm:py-1.5 bg-rose-500/15 border border-rose-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-rose-400 whitespace-nowrap flex-shrink-0">Gigantamax</span>}
                {config.enableTera && <span className="px-3 py-2 sm:py-1.5 bg-cyan-500/15 border border-cyan-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-cyan-400 whitespace-nowrap flex-shrink-0">Tera{config.preferredTeraType ? `: ${config.preferredTeraType}` : ''}</span>}
                {config.enableZMoves && <span className="px-3 py-2 sm:py-1.5 bg-yellow-500/15 border border-yellow-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-yellow-400 whitespace-nowrap flex-shrink-0">Z-Moves</span>}
                {config.enableDynamax && <span className="px-3 py-2 sm:py-1.5 bg-rose-500/15 border border-rose-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-rose-400 whitespace-nowrap flex-shrink-0">Dynamax</span>}
                {config.isMonotype && config.monoTypeSelected && <span className="px-3 py-2 sm:py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-amber-400 whitespace-nowrap flex-shrink-0">Monotype: {config.monoTypeSelected}</span>}
                {config.preferredWeather !== 'none' && <span className="px-3 py-2 sm:py-1.5 bg-sky-500/15 border border-sky-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-sky-400 whitespace-nowrap flex-shrink-0">Clima: {config.preferredWeather}</span>}
                {config.preferredTerrain !== 'none' && <span className="px-3 py-2 sm:py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-emerald-400 whitespace-nowrap flex-shrink-0">Terreno: {config.preferredTerrain}</span>}
                {config.preferTrickRoom && <span className="px-3 py-2 sm:py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-amber-400 whitespace-nowrap flex-shrink-0">Trick Room</span>}
                {config.preferTailwind && <span className="px-3 py-2 sm:py-1.5 bg-sky-500/15 border border-sky-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-sky-400 whitespace-nowrap flex-shrink-0">Tailwind</span>}
                {config.teamArchetype && <span className="px-3 py-2 sm:py-1.5 bg-pokeball-red/15 border border-pokeball-red/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-pokeball-red whitespace-nowrap flex-shrink-0">{config.teamArchetype}</span>}
              </div>
            )}

            {/* POKEMON GRID — 1 columna en mobile, 2 en sm, 3 en xl */}
            <section className="step-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {team.map((poke, i) => (
                <PokemonCard
                  key={i}
                  slotNumber={i + 1}
                  data={poke}
                  isLocked={lockedSlots[i]}
                  onToggleLock={() => toggleLock(i)}
                  onSelect={(p: any) => handleSelect(i, p)}
                  onBanAndRegenerate={handleBanAndRegenerate}
                />
              ))}
            </section>

            {/* ═══════ BLACKLIST ═══════ */}
            {blacklist.length > 0 && (
              <section className="bg-card rounded-2xl border-2 border-orange-500/20 shadow-xl relative overflow-hidden animate-in fade-in">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500/60 via-orange-500/30 to-transparent" />
                <PokeballBgPattern />

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-border/50">
                  <button
                    onClick={() => setBlacklistOpen(o => !o)}
                    className="flex items-center gap-3 text-left group min-h-[44px]"
                  >
                    <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-orange-500">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="m4.9 4.9 14.2 14.2"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-[12px] sm:text-[10px] font-black text-orange-500 uppercase tracking-widest leading-none">
                        Blacklist
                        <span className="ml-2 bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[9px]">{blacklist.length}</span>
                      </h3>
                      <p className="text-[10px] sm:text-[9px] text-muted-foreground mt-0.5">Pokémon baneados de la generación automática</p>
                    </div>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`ml-2 text-muted-foreground transition-transform duration-200 ${blacklistOpen ? 'rotate-180' : ''}`}
                    >
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>

                  <button
                    onClick={clearBlacklist}
                    className="min-h-[44px] px-3 text-[11px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5 rounded-lg hover:bg-destructive/10"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    Limpiar
                  </button>
                </div>

                {/* Lista colapsable */}
                {blacklistOpen && (
                  <div className="relative z-10 p-4 sm:p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* 3 columnas en mobile, más en pantallas grandes */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {blacklist.map(entry => (
                        <div
                          key={entry.id}
                          className="flex flex-col items-center gap-2 bg-secondary/30 rounded-xl p-3 border border-border hover:border-orange-500/30 transition-all group/ban relative"
                        >
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <img
                              src={entry.sprite_url || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${entry.id}.png`}
                              alt={entry.nombre}
                              className="w-full h-full object-contain grayscale opacity-50"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500/70">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="m4.9 4.9 14.2 14.2"/>
                              </svg>
                            </div>
                          </div>

                          <span className="text-[10px] sm:text-[9px] font-black uppercase text-muted-foreground text-center leading-tight line-clamp-1 w-full text-center">
                            {entry.nombre.replace('-', ' ')}
                          </span>

                          <button
                            onClick={() => removeFromBlacklist(entry.id)}
                            className="w-full flex items-center justify-center gap-1 py-2 sm:py-1 rounded-lg text-[10px] sm:text-[8px] font-black uppercase tracking-wider text-orange-500 hover:text-foreground bg-orange-500/10 hover:bg-emerald-500/15 border border-orange-500/20 hover:border-emerald-500/30 transition-all min-h-[36px] sm:min-h-0"
                            title="Quitar del ban"
                          >
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            Desban
                          </button>
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] sm:text-[9px] text-muted-foreground/50 text-center mt-4">
                      Estos Pokémon no serán sugeridos en futuras generaciones automáticas
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* TEAM ANALYSIS */}
            <section className="step-matriz bg-card rounded-2xl p-4 sm:p-6 lg:p-8 border-2 border-border shadow-xl relative overflow-visible" style={{ isolation: 'isolate' }}>
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none"><PokeballBgPattern /></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pokeball-red via-pokeball-red/40 to-transparent rounded-t-2xl" />
              <div className="relative z-10"><TeamAnalysis analysis={analysis as any} /></div>
            </section>

            {/* AI TACTICAL REPORT */}
            {aiReport && (
              <div className="bg-card border-2 border-pokeball-red/30 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl space-y-5 sm:space-y-8 animate-in fade-in slide-in-from-bottom-8 relative" style={{ isolation: 'isolate' }}>
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none"><PokeballBgPattern /></div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pokeball-red via-amber-500 to-emerald-500 opacity-60 rounded-t-2xl" />
                <div className="relative z-10 space-y-5 sm:space-y-8">
                  <h2 className="text-xs sm:text-[11px] font-black text-pokeball-red uppercase tracking-[0.25em] flex items-center gap-3">
                    <PokeballIcon size={18} />
                    Desglose Táctico del Motor
                    <span className="text-muted-foreground font-bold normal-case tracking-normal">({config.experienceLevel})</span>
                  </h2>
                  <div className="bg-pokeball-red/5 p-4 sm:p-6 rounded-xl border border-pokeball-red/15">
                    <h3 className="text-[11px] sm:text-[9px] font-black text-pokeball-red uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-pokeball-red" />Estrategia Operativa
                    </h3>
                    <div className="text-muted-foreground text-sm leading-relaxed">
                      {aiReport.estrategia.split('\n\n').map((p: string, idx: number) => (
                        <p key={idx} className="mb-4 last:mb-0">
                          {p.split('**').map((t: string, i: number) => i % 2 === 1 ? <span key={i} className="font-black text-foreground">{t}</span> : t)}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-4">
                      <h3 className="text-[11px] sm:text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" />Fortalezas Clave</h3>
                      <ul className="space-y-3">
                        {aiReport.ventajas?.map((v: string, i: number) => (
                          <li key={i} className="text-muted-foreground text-sm flex gap-3">
                            <span className="text-emerald-400 mt-0.5 flex-shrink-0"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg></span>
                            <span>{v.split('**').map((t: string, j: number) => j % 2 === 1 ? <strong key={j} className="text-foreground">{t}</strong> : t)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-[11px] sm:text-[9px] font-black text-pokeball-red uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-pokeball-red" />Amenazas y Debilidades</h3>
                      <ul className="space-y-3">
                        {aiReport.debilidades?.map((d: string, i: number) => (
                          <li key={i} className="text-muted-foreground text-sm flex gap-3">
                            <span className="text-pokeball-red mt-0.5 flex-shrink-0"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>
                            <span>{d.split('**').map((t: string, j: number) => j % 2 === 1 ? <strong key={j} className="text-foreground">{t}</strong> : t)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="space-y-4 pt-4 sm:pt-6 border-t border-border">
                    <h3 className="text-[11px] sm:text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400" />Protocolo de Leads (Apertura)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiReport.leads?.map((lead: any, i: number) => (
                        <div key={i} className="bg-secondary/30 p-4 sm:p-5 rounded-xl border border-border hover:border-pokeball-red/20 transition-colors relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500/40 to-transparent" />
                          <h4 className="font-black text-foreground uppercase italic text-base mb-3">{lead.pokemon}</h4>
                          <p className="text-xs sm:text-[10px] text-muted-foreground mb-2 leading-relaxed"><span className="text-amber-400 font-black">ENTRADA:</span> {lead.condicion_uso}</p>
                          <p className="text-xs sm:text-[10px] text-muted-foreground leading-relaxed"><span className="text-pokeball-red font-black">RETIRADA:</span> {lead.condicion_cambio}</p>
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