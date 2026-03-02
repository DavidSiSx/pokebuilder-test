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

// ═════════════════════════════════════════════════════════════════
// SHOWDOWN HELPERS
// ═════════════════════════════════════════════════════════════════

function toShowdown(team: (TeamMember | null)[]): string {
  return team
    .filter((p): p is TeamMember => p !== null)
    .map(p => {
      const b = (p as any).suggestedBuild;
      const lines: string[] = [];
      const displayName = p.nombre
        .split('-')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('-');
      lines.push(`${displayName}${b?.objeto ? ` @ ${b.objeto}` : ''}`);
      if (b?.habilidad)     lines.push(`Ability: ${b.habilidad}`);
      lines.push('Level: 50');
      if (b?.evs)           lines.push(`EVs: ${b.evs}`);
      if (b?.naturaleza)    lines.push(`${b.naturaleza} Nature`);
      if (b?.moves?.length) b.moves.filter(Boolean).forEach((m: string) => lines.push(`- ${m}`));
      return lines.join('\n');
    })
    .join('\n\n');
}

async function resolveShowdownName(rawName: string): Promise<TeamMember | null> {
  const normalized = rawName.toLowerCase().trim().replace(/\s+/g, '-');
  const candidates = [normalized, normalized.split('-')[0]];
  for (const query of candidates) {
    try {
      const res = await fetch(`/api/pokemon/search?q=${encodeURIComponent(query)}&limit=5`);
      if (!res.ok) continue;
      const data = await res.json();
      const results: any[] = data.results ?? data ?? [];
      if (!results.length) continue;
      const exact = results.find((r: any) => r.nombre?.toLowerCase() === normalized);
      const match = exact ?? results[0];
      if (match) {
        return {
          ...match,
          tipos: [match.tipo1, match.tipo2].filter(Boolean),
          suggestedBuild: null,
        } as TeamMember;
      }
    } catch { /* continuar */ }
  }
  return null;
}

function parseShowdownNames(text: string): string[] {
  const blocks = text.trim().split(/\n\s*\n/).filter(b => b.trim());
  return blocks
    .map(block => {
      const firstLine = block.trim().split('\n')[0].trim();
      const atIdx = firstLine.indexOf(' @ ');
      const raw = atIdx !== -1 ? firstLine.slice(0, atIdx) : firstLine;
      return raw.replace(/\s*\(.*?\)\s*$/, '').trim();
    })
    .filter(Boolean)
    .slice(0, 6);
}

// ═════════════════════════════════════════════════════════════════
// SHOWDOWN MODAL
// ═════════════════════════════════════════════════════════════════

function ShowdownModal({
  mode,
  exportText,
  onImport,
  onClose,
}: {
  mode: 'import' | 'export';
  exportText?: string;
  onImport?: (text: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = React.useState(exportText ?? '');
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center sm:p-6 bg-background/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card border-2 border-pokeball-red/40 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-xl relative shadow-[0_0_60px_rgba(220,38,38,0.15)] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pokeball-red via-pokeball-red/50 to-transparent" />
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        <div className="px-6 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black uppercase italic text-foreground leading-none">
                {mode === 'export' ? 'Exportar a Showdown' : 'Importar de Showdown'}
              </h3>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                {mode === 'export'
                  ? 'Copia el texto y pégalo en Pokémon Showdown'
                  : 'Pega tu equipo — se buscarán en la DB automáticamente'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <textarea
            value={text}
            onChange={e => mode === 'import' && setText(e.target.value)}
            readOnly={mode === 'export'}
            placeholder={
              mode === 'import'
                ? 'Pega aquí el texto de Showdown...\n\nEj:\nGarchomp @ Choice Scarf\nAbility: Rough Skin\nEVs: 252 Atk / 4 SpD / 252 Spe\nJolly Nature\n- Earthquake\n- Dragon Claw\n- Poison Jab\n- Rock Slide\n\nRillaboom @ Assault Vest\n...'
                : ''
            }
            className="w-full h-64 bg-secondary/50 border border-border rounded-xl px-4 py-3 text-xs font-mono text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/40 resize-none placeholder:text-muted-foreground/40"
          />

          <div className="flex gap-3 mt-4">
            {mode === 'export' ? (
              <button
                onClick={handleCopy}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                  copied
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-pokeball-red hover:bg-pokeball-dark text-white border-pokeball-red/50 shadow-[0_4px_14px_rgba(220,38,38,0.3)]'
                }`}
              >
                {copied ? (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 5 5L20 7"/></svg>Copiado!</>
                ) : (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>Copiar al portapapeles</>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 py-3.5 bg-secondary/50 hover:bg-secondary border border-border rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { onImport?.(text); onClose(); }}
                  disabled={!text.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-pokeball-red hover:bg-pokeball-dark disabled:bg-secondary disabled:text-muted-foreground text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-pokeball-red/50 disabled:border-border shadow-[0_4px_14px_rgba(220,38,38,0.3)]"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Importar Equipo
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════

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

  // ── Showdown ──────────────────────────────────────────────────
  const [showdownMode, setShowdownMode] = useState<'import' | 'export' | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // ── Blacklist ─────────────────────────────────────────────────
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

    // FIX DUPLICATES: final frontend guard — remove duplicate Pokemon by ID
    const seenIds = new Set<number>();
    for (let i = 0; i < newTeam.length; i++) {
      const p = newTeam[i];
      if (p) {
        if (seenIds.has(p.id)) {
          newTeam[i] = null;
          newLocks[i] = false;
        } else {
          seenIds.add(p.id);
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

        lastReport  = data.aiReport;
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

  // ── Showdown Import ───────────────────────────────────────────
  const handleShowdownImport = useCallback(async (text: string) => {
    const names = parseShowdownNames(text);
    if (!names.length) return;

    setIsImporting(true);
    setAnalysingLabel('Importando equipo...');
    setIsAnalysing(true);

    try {
      const resolved = await Promise.all(names.map(resolveShowdownName));

      const newTeam: (TeamMember | null)[] = Array(6).fill(null);
      const newLocks: boolean[] = Array(6).fill(false);

      resolved.forEach((poke, i) => {
        if (poke && i < 6) {
          newTeam[i]  = poke;
          newLocks[i] = true; // bloqueados para que la IA complete los vacíos
        }
      });

      setTeam(newTeam);
      setLockedSlots(newLocks);

      const found   = resolved.filter(Boolean).length;
      const missing = names.length - found;
      if (missing > 0) {
        setErrorModal(
          `${found}/${names.length} Pokémon encontrados en la DB. ` +
          `${missing} no se encontraron (pueden ser nombres de Showdown no mapeados). ` +
          `Los slots vacíos puedes completarlos con la IA.`
        );
      }
    } catch {
      setErrorModal('Error al importar el equipo. Verifica el formato del texto.');
    } finally {
      setIsImporting(false);
      setIsAnalysing(false);
      setAnalysingLabel('Evaluando Meta...');
    }
  }, []);

  const handleBanAndRegenerate = useCallback(async (pokemon: any) => {
    const slotIndex = team.findIndex(p => p?.id === pokemon.id);
    if (slotIndex < 0) return;

    addToBlacklist(pokemon);

    const workingTeam  = [...team];
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

  const activeCount  = team.filter(p => p !== null).length;
  const isScratchMode = config.generationMode === 'scratch';
  const canGenerate   = isScratchMode ? true : team[0] !== null;

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[100dvh] bg-background text-foreground overflow-hidden relative selection:bg-pokeball-red/30">
      <TutorialGuide run={runTutorial} setRun={setRunTutorial} />

      {/* ── ERROR MODAL ─────────────────────────────────────────── */}
      {errorModal && (
        <div className="absolute inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in" role="alertdialog">
          <div className="bg-card border-2 border-pokeball-red/50 rounded-t-3xl sm:rounded-2xl p-7 sm:p-8 w-full sm:max-w-md shadow-[0_0_60px_rgba(220,38,38,0.2)] flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-pokeball-red" />
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

      {/* ── SHOWDOWN MODAL ──────────────────────────────────────── */}
      {showdownMode && (
        <ShowdownModal
          mode={showdownMode}
          exportText={showdownMode === 'export' ? toShowdown(team) : undefined}
          onImport={handleShowdownImport}
          onClose={() => setShowdownMode(null)}
        />
      )}

      {/* Mobile sidebar backdrop */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-background/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* ── SIDEBAR WRAPPER ─────────────────────────────────────── */}
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

          {/* Header sidebar */}
          <div className={`relative z-10 ${!sidebarOpen && !isMobile ? 'flex flex-col items-center px-3 pt-6 pb-4 gap-2' : 'px-5 pt-5 pb-3'}`}>
            {(sidebarOpen || isMobile) ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <PokeballIcon size={36} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-black italic tracking-tighter uppercase leading-none text-foreground">Pokelab</h1>
                    <span className="text-[8px] text-pokeball-red font-black uppercase tracking-[0.3em] mt-0.5 block">Tactical Engine</span>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex-shrink-0"
                    aria-label="Cerrar sidebar"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                </div>
                <button
                  onClick={() => setRunTutorial(true)}
                  className="mt-2.5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-sky-400 hover:text-sky-300 bg-sky-400/10 hover:bg-sky-400/15 border border-sky-400/20 hover:border-sky-400/40 transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
                  </svg>
                  Ver Tour de la App
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center" aria-label="Abrir sidebar">
                  <PokeballIcon size={32} />
                </button>
                <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                  {isDark
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
                </button>
              </div>
            )}
          </div>

          {sidebarOpen && <div className="pokeball-divider mx-6 mb-4" />}

          {/* Barra de acciones rápidas (Removidos Import/Export de aquí) */}
          {sidebarOpen && (
            <div className="px-6 mb-4 flex gap-2 relative z-10">
              {/* Reviewer */}
              <Link
                href="/review"
                className="step-reviewer flex-1 flex items-center justify-center gap-1.5 py-3 sm:py-2.5 bg-secondary/50 border border-border rounded-xl text-[11px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-pokeball-red/20 transition-all min-h-[48px] sm:min-h-0"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                Reviewer
              </Link>

              {/* Tema */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-12 sm:w-[42px] py-3 sm:py-2.5 bg-secondary/50 border border-border rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all min-h-[48px] sm:min-h-0"
                aria-label="Cambiar tema"
              >
                {isDark
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2.5 bg-secondary/50 border border-border rounded-xl text-[11px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-pokeball-red hover:bg-pokeball-red/10 hover:border-pokeball-red/20 transition-all disabled:opacity-50 min-h-[48px] sm:min-h-0"
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
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar relative w-full" style={{ isolation: 'isolate' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}><PokeballBgPattern /></div>

        {/* ── HEADER PRINCIPAL DE MAIN (Top Bar) ────────────────── */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between min-h-[56px]">
          
          {/* Lado Izquierdo: Logo y Hamburguesa (Sólo si sidebar está oculto o es móvil) */}
          <div className="flex items-center gap-3">
            {(isMobile || !sidebarOpen) && (
              <>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-1"
                  aria-label="Abrir sidebar"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
                  {!isMobile && <span className="text-[10px] font-black uppercase tracking-widest">Menu</span>}
                </button>
                <div className="w-px h-5 bg-border hidden sm:block mx-1" />
                <div className="flex items-center gap-2">
                  <PokeballIcon size={20} />
                  <span className="text-xs font-black italic uppercase text-foreground">Pokelab</span>
                </div>
              </>
            )}
          </div>

          {/* Lado Derecho: Utilidades (Importar, Exportar y Botón Generar para móviles) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowdownMode('import')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 bg-secondary/50 border border-border rounded-xl text-[10px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all min-h-[40px] sm:min-h-0"
              title="Importar desde Showdown"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span className="hidden sm:inline">Importar</span>
            </button>
            
            <button
              onClick={() => setShowdownMode('export')}
              disabled={activeCount === 0}
              className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 bg-secondary/50 border border-border rounded-xl text-[10px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[40px] sm:min-h-0"
              title="Exportar a Showdown"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span className="hidden sm:inline">Exportar</span>
            </button>

            {isMobile && canGenerate && (
              <button
                onClick={handleSmartFill}
                disabled={isAnalysing}
                className="ml-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-pokeball-red disabled:bg-secondary text-primary-foreground text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border border-pokeball-red/50 disabled:border-border min-h-[40px] active:scale-[0.97]"
              >
                {isAnalysing ? <PokeballIcon size={14} className="animate-spin" /> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>}
                {isAnalysing ? 'IA...' : 'Generar'}
              </button>
            )}
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-12 relative z-10">
          <div className="max-w-7xl mx-auto space-y-5 sm:space-y-10">

            {isDynamicMode && (
              <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-amber-500/30">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
                <div>
                  <h3 className="text-[11px] sm:text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Análisis Heurístico Activado</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">El líder no tiene datos vectoriales. La IA está improvisando. <strong className="text-amber-600 dark:text-amber-300">Sinergia puede ser subóptima.</strong></p>
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

            {/* Active filter tags */}
            {(config.isMonotype || config.preferredWeather !== 'none' || config.preferredTerrain !== 'none' || config.preferTrickRoom || config.preferTailwind || config.teamArchetype || config.enableMega || config.enableGmax || config.enableTera || config.enableZMoves || config.enableDynamax) && (
              <div className="flex gap-2 animate-in fade-in overflow-x-auto pb-1 no-scrollbar">
                {config.enableMega     && <span className="px-3 py-2 sm:py-1.5 bg-violet-500/15 border border-violet-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-violet-400 whitespace-nowrap flex-shrink-0">Mega Evolution</span>}
                {config.enableGmax     && <span className="px-3 py-2 sm:py-1.5 bg-rose-500/15 border border-rose-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-rose-400 whitespace-nowrap flex-shrink-0">Gigantamax</span>}
                {config.enableTera     && <span className="px-3 py-2 sm:py-1.5 bg-cyan-500/15 border border-cyan-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-cyan-400 whitespace-nowrap flex-shrink-0">Tera{config.preferredTeraType ? `: ${config.preferredTeraType}` : ''}</span>}
                {config.enableZMoves   && <span className="px-3 py-2 sm:py-1.5 bg-yellow-500/15 border border-yellow-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-yellow-400 whitespace-nowrap flex-shrink-0">Z-Moves</span>}
                {config.enableDynamax  && <span className="px-3 py-2 sm:py-1.5 bg-rose-500/15 border border-rose-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-rose-400 whitespace-nowrap flex-shrink-0">Dynamax</span>}
                {config.isMonotype && config.monoTypeSelected && <span className="px-3 py-2 sm:py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-amber-400 whitespace-nowrap flex-shrink-0">Monotype: {config.monoTypeSelected}</span>}
                {config.preferredWeather !== 'none' && <span className="px-3 py-2 sm:py-1.5 bg-sky-500/15 border border-sky-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-sky-400 whitespace-nowrap flex-shrink-0">Clima: {config.preferredWeather}</span>}
                {config.preferredTerrain !== 'none' && <span className="px-3 py-2 sm:py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-emerald-400 whitespace-nowrap flex-shrink-0">Terreno: {config.preferredTerrain}</span>}
                {config.preferTrickRoom && <span className="px-3 py-2 sm:py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-amber-400 whitespace-nowrap flex-shrink-0">Trick Room</span>}
                {config.preferTailwind && <span className="px-3 py-2 sm:py-1.5 bg-sky-500/15 border border-sky-500/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-sky-400 whitespace-nowrap flex-shrink-0">Tailwind</span>}
                {config.teamArchetype  && <span className="px-3 py-2 sm:py-1.5 bg-pokeball-red/15 border border-pokeball-red/30 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-pokeball-red whitespace-nowrap flex-shrink-0">{config.teamArchetype}</span>}
              </div>
            )}

            {/* Pokemon grid */}
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

            {/* Blacklist */}
            {blacklist.length > 0 && (
              <section className="bg-card rounded-2xl border-2 border-orange-500/20 shadow-xl relative overflow-hidden animate-in fade-in">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500/60 via-orange-500/30 to-transparent" />
                <PokeballBgPattern />
                <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-border/50">
                  <button onClick={() => setBlacklistOpen(o => !o)} className="flex items-center gap-3 text-left group min-h-[44px]">
                    <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-orange-500"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
                    </div>
                    <div>
                      <h3 className="text-[12px] sm:text-[10px] font-black text-orange-500 uppercase tracking-widest leading-none">
                        Blacklist
                        <span className="ml-2 bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[9px]">{blacklist.length}</span>
                      </h3>
                      <p className="text-[10px] sm:text-[9px] text-muted-foreground mt-0.5">Pokémon baneados de la generación automática</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`ml-2 text-muted-foreground transition-transform duration-200 ${blacklistOpen ? 'rotate-180' : ''}`}>
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>
                  <button onClick={clearBlacklist} className="min-h-[44px] px-3 text-[11px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5 rounded-lg hover:bg-destructive/10">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    Limpiar
                  </button>
                </div>
                {blacklistOpen && (
                  <div className="relative z-10 p-4 sm:p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {blacklist.map(entry => (
                        <div key={entry.id} className="flex flex-col items-center gap-2 bg-secondary/30 rounded-xl p-3 border border-border hover:border-orange-500/30 transition-all relative">
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <img src={entry.sprite_url || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${entry.id}.png`} alt={entry.nombre} className="w-full h-full object-contain grayscale opacity-50" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500/70"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
                            </div>
                          </div>
                          <span className="text-[10px] sm:text-[9px] font-black uppercase text-muted-foreground text-center leading-tight line-clamp-1 w-full">{entry.nombre.replace('-', ' ')}</span>
                          <button onClick={() => removeFromBlacklist(entry.id)} className="w-full flex items-center justify-center gap-1 py-2 sm:py-1 rounded-lg text-[10px] sm:text-[8px] font-black uppercase tracking-wider text-orange-500 hover:text-foreground bg-orange-500/10 hover:bg-emerald-500/15 border border-orange-500/20 hover:border-emerald-500/30 transition-all min-h-[36px] sm:min-h-0">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            Desban
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] sm:text-[9px] text-muted-foreground/50 text-center mt-4">Estos Pokémon no serán sugeridos en futuras generaciones automáticas</p>
                  </div>
                )}
              </section>
            )}

            {/* Team Analysis */}
            <section className="step-matriz bg-card rounded-2xl p-4 sm:p-6 lg:p-8 border-2 border-border shadow-xl relative overflow-visible" style={{ isolation: 'isolate' }}>
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none"><PokeballBgPattern /></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pokeball-red via-pokeball-red/40 to-transparent rounded-t-2xl" />
              <div className="relative z-10"><TeamAnalysis analysis={analysis as any} /></div>
            </section>

            {/* AI Tactical Report */}
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
