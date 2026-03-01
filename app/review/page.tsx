'use client';
import React, { useState, useCallback } from 'react';
import TeamReviewCard, { type ReviewPokemon } from '@/components/TeamReviewCard';
import ReviewResult from '@/components/ReviewResult';
import { PokeballIcon, PokeballBgPattern } from '@/components/PokeballIcon';
import Link from 'next/link';

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

const FORMATOS = [
  { id: 'natdex_doubles_6v6', name: 'National Dex Doubles (6v6 - Cobblemon)' },
  { id: 'vgc_modern', name: 'VGC Oficial (Dobles 4v4)' },
  { id: 'natdex_singles', name: 'National Dex Singles (6v6)' },
  { id: '1v1_6choose3', name: 'Combate Libre (Trae 6, Elige 3)' },
];

// ─── Showdown helpers ────────────────────────────────────────────

function toShowdown(team: ReviewPokemon[]): string {
  return team
    .filter(p => p.name)
    .map(p => {
      const lines: string[] = [];
      lines.push(`${p.name}${p.item ? ` @ ${p.item}` : ''}`);
      if (p.ability) lines.push(`Ability: ${p.ability}`);
      lines.push('Level: 50');
      if (p.evs) lines.push(`EVs: ${p.evs}`);
      if (p.nature) lines.push(`${p.nature} Nature`);
      if (p.teraType) lines.push(`Tera Type: ${p.teraType}`);
      p.moves.filter(Boolean).forEach(m => lines.push(`- ${m}`));
      return lines.join('\n');
    })
    .join('\n\n');
}

function fromShowdown(text: string, startId: number): ReviewPokemon[] {
  const blocks = text.trim().split(/\n\s*\n/).filter(b => b.trim());
  const result: ReviewPokemon[] = [];

  blocks.forEach((block, idx) => {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;

    const poke: ReviewPokemon = { ...createEmpty(startId + idx) };

    // Línea 1: Nombre @ Objeto
    const firstLine = lines[0];
    // Showdown puede tener el nombre con género etc., ignorar paréntesis
    const atIdx = firstLine.indexOf(' @ ');
    if (atIdx !== -1) {
      poke.name = firstLine.slice(0, atIdx).trim().replace(/\s*\(.*?\)\s*$/, '').trim();
      poke.item = firstLine.slice(atIdx + 3).trim();
    } else {
      poke.name = firstLine.replace(/\s*\(.*?\)\s*$/, '').trim();
    }

    const moves: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('Ability:'))        poke.ability  = line.replace('Ability:', '').trim();
      else if (line.startsWith('EVs:'))       poke.evs      = line.replace('EVs:', '').trim();
      else if (line.endsWith(' Nature'))      poke.nature   = line.replace(' Nature', '').trim();
      else if (line.startsWith('Tera Type:')) poke.teraType = line.replace('Tera Type:', '').trim();
      else if (line.startsWith('- '))         moves.push(line.replace(/^-\s*/, '').trim());
      // ignorar Level, IVs, Happiness
    }

    poke.moves = [...moves, '', '', '', ''].slice(0, 4);
    if (poke.name) result.push(poke);
  });

  return result;
}

// ─── Modal Showdown ──────────────────────────────────────────────
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
  const [text, setText] = useState(exportText ?? '');
  const [copied, setCopied] = useState(false);

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
        {/* Drag handle mobile */}
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
                {mode === 'export' ? 'Copia el texto y pégalo en Pokémon Showdown' : 'Pega el texto del teambuilder de Showdown'}
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
            placeholder={mode === 'import' ? 'Pega aquí el texto de Showdown...\n\nEj:\nGarchomp @ Choice Scarf\nAbility: Rough Skin\nEVs: 252 Atk / 4 SpD / 252 Spe\nJolly Nature\n- Earthquake\n- Dragon Claw\n- Poison Jab\n- Rock Slide' : ''}
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

// ─── Página Principal ─────────────────────────────────────────────
export default function ReviewPage() {
  const [team, setTeam] = useState<ReviewPokemon[]>(() =>
    Array.from({ length: 6 }, (_, i) => createEmpty(i))
  );
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

  // Showdown modal
  const [showdownMode, setShowdownMode] = useState<'import' | 'export' | null>(null);

  const updatePokemon = useCallback((index: number, pokemon: ReviewPokemon) => {
    setTeam(prev => { const next = [...prev]; next[index] = pokemon; return next; });
  }, []);

  const removePokemon = useCallback((index: number) => {
    setTeam(prev => { const next = [...prev]; next[index] = createEmpty(prev[index]._id); return next; });
  }, []);

  const handleImport = useCallback((text: string) => {
    const parsed = fromShowdown(text, 0);
    if (!parsed.length) return;
    // Rellenar equipo: parsed primero, resto vacíos
    const newTeam = [...parsed];
    while (newTeam.length < 6) newTeam.push(createEmpty(newTeam.length));
    setTeam(newTeam.slice(0, 6));
  }, []);

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
      if (!res.ok) setError(data.message || data.error || 'Error al evaluar el equipo.');
      else setResult(data);
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative selection:bg-pokeball-red/30">
      <PokeballBgPattern />

      {/* Showdown Modal */}
      {showdownMode && (
        <ShowdownModal
          mode={showdownMode}
          exportText={showdownMode === 'export' ? toShowdown(team) : undefined}
          onImport={handleImport}
          onClose={() => setShowdownMode(null)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b-2 border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <PokeballIcon size={28} className="flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black italic uppercase tracking-tight text-foreground leading-none truncate">Team Reviewer</h1>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-pokeball-red hidden sm:block">Evaluacion Tactica por IA</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Import Showdown */}
            <button
              onClick={() => setShowdownMode('import')}
              className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] bg-secondary/50 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-violet-500/30 transition-all"
              title="Importar desde Showdown"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span className="hidden sm:inline">Importar</span>
            </button>
            {/* Export Showdown */}
            <button
              onClick={() => setShowdownMode('export')}
              disabled={filledSlots === 0}
              className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] bg-secondary/50 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Exportar a Showdown"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span className="hidden sm:inline">Exportar</span>
            </button>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] bg-secondary/50 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
              <span className="hidden sm:inline">Builder</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 relative z-10">
        <div className="space-y-6 sm:space-y-8">

          {/* Config Bar */}
          <div className="bg-card border-2 border-border rounded-2xl p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pokeball-red via-pokeball-red/40 to-transparent" />
            <div className="relative z-10">
              <h2 className="text-[10px] sm:text-[9px] font-black text-pokeball-red uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-pokeball-red"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                Configuracion
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] sm:text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1.5 block">Formato</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-xs sm:text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/40 cursor-pointer appearance-none min-h-[48px] sm:min-h-0"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23dc2626' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                  >
                    {FORMATOS.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] sm:text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1.5 block">Mecanicas Activas</label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { key: 'enableTera',    label: 'Tera',   on: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' },
                      { key: 'enableMega',    label: 'Mega',   on: 'bg-violet-500/15 border-violet-500/30 text-violet-400' },
                      { key: 'enableGmax',    label: 'Gmax',   on: 'bg-rose-500/15 border-rose-500/30 text-rose-400' },
                      { key: 'enableDynamax', label: 'Dmax',   on: 'bg-rose-500/15 border-rose-500/30 text-rose-400' },
                      { key: 'enableZMoves',  label: 'Z-Move', on: 'bg-amber-500/15 border-amber-500/30 text-amber-400' },
                    ] as const).map(({ key, label, on }) => (
                      <button
                        key={key}
                        onClick={() => setMechanics(prev => ({ ...prev, [key]: !prev[key] }))}
                        className={`px-3 py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-0 rounded-lg text-[11px] sm:text-[9px] font-black uppercase tracking-wider transition-all border ${
                          mechanics[key] ? on : 'bg-secondary/30 border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] sm:text-[9px] font-black text-pokeball-red uppercase tracking-widest flex items-center gap-2">
                <PokeballIcon size={14} />
                Tu Equipo ({filledSlots}/6)
              </h2>
              {/* Botones Showdown en móvil también visibles aquí */}
              <div className="flex gap-2 sm:hidden">
                <button onClick={() => setShowdownMode('import')} className="flex items-center gap-1 px-3 py-2 min-h-[40px] bg-secondary/50 border border-border rounded-lg text-[10px] font-black uppercase text-muted-foreground hover:text-foreground transition-all">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Import
                </button>
                {filledSlots > 0 && (
                  <button onClick={() => setShowdownMode('export')} className="flex items-center gap-1 px-3 py-2 min-h-[40px] bg-secondary/50 border border-border rounded-lg text-[10px] font-black uppercase text-muted-foreground hover:text-foreground transition-all">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Export
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {team.map((pokemon, i) => (
                <TeamReviewCard
                  key={pokemon._id}
                  index={i}
                  pokemon={pokemon}
                  onChange={(p) => updatePokemon(i, p)}
                  onRemove={() => removePokemon(i)}
                  mechanics={mechanics}
                />
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={isLoading || filledSlots === 0}
              className="w-full sm:w-auto px-10 py-4 min-h-[52px] bg-pokeball-red hover:bg-pokeball-dark disabled:bg-secondary disabled:text-muted-foreground text-primary-foreground text-xs sm:text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all shadow-[0_4px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_30px_rgba(220,38,38,0.5)] disabled:shadow-none border border-pokeball-red/50 disabled:border-border flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {isLoading ? (
                <><PokeballIcon size={16} className="animate-spin" /><span>Evaluando Equipo...</span></>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg><span>Evaluar Equipo ({filledSlots} Pokémon)</span></>
              )}
            </button>
            {filledSlots === 0 && <p className="text-xs text-muted-foreground font-bold">Agrega al menos 1 Pokémon para evaluar</p>}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-pokeball-red/10 border-2 border-pokeball-red/30 rounded-2xl p-5 flex items-center gap-4 animate-in fade-in">
              <div className="w-10 h-10 bg-pokeball-red/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pokeball-red"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              </div>
              <p className="text-sm text-pokeball-red font-bold">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-card border-2 border-pokeball-red/30 rounded-2xl p-5 sm:p-6 lg:p-8 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <PokeballBgPattern />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pokeball-red via-amber-500 to-emerald-500 opacity-60 rounded-t-2xl" />
              <div className="relative z-10">
                <h2 className="text-[11px] font-black text-pokeball-red uppercase tracking-[0.25em] mb-6 flex items-center gap-3">
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