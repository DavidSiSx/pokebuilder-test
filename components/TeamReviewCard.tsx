'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { TYPE_COLORS, TYPE_TRANSLATIONS, NATURES, TERA_TYPES, COMPETITIVE_ITEMS } from '@/utils/pokemonConstants';

// ─── Tipos ────────────────────────────────────────────────────────
export interface ReviewPokemon {
  _id: number;
  name: string;
  item: string;
  ability: string;
  nature: string;
  teraType: string;
  moves: string[];
  evs: string;
  mechanic: string;
}

interface MoveData {
  nombre: string;
  tipo?: string;
  potencia?: number | null;
  precision?: number | null;
  categoria?: 'physical' | 'special' | 'status' | string;
}

interface TeamReviewCardProps {
  index: number;
  pokemon: ReviewPokemon;
  onChange: (pokemon: ReviewPokemon) => void;
  onRemove: () => void;
  mechanics: { enableMega: boolean; enableGmax: boolean; enableTera: boolean; enableZMoves: boolean; enableDynamax: boolean };
}

// ─── EV helpers ───────────────────────────────────────────────────
const EV_STATS = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'] as const;
type EvStat = typeof EV_STATS[number];
const EV_LABELS: Record<EvStat, string> = { HP: 'PS', Atk: 'At.', Def: 'Def.', SpA: 'At. esp.', SpD: 'Def. esp.', Spe: 'Vel.' };
const EV_COLORS: Record<EvStat, string> = { HP: '#ef4444', Atk: '#f97316', Def: '#eab308', SpA: '#3b82f6', SpD: '#8b5cf6', Spe: '#10b981' };
const HEX_ORDER: EvStat[] = ['HP', 'Atk', 'Def', 'Spe', 'SpD', 'SpA'];

function parseEvs(evs: string): Record<EvStat, number> {
  const r: Record<EvStat, number> = { HP: 0, Atk: 0, Def: 0, SpA: 0, SpD: 0, Spe: 0 };
  if (!evs) return r;
  for (const part of evs.split('/')) {
    const m = part.trim().match(/^(\d+)\s+(.+)$/);
    if (m) { const k = m[2].trim() as EvStat; if (k in r) r[k] = Math.min(252, Math.max(0, parseInt(m[1]))); }
  }
  return r;
}
function serializeEvs(m: Record<EvStat, number>) { return EV_STATS.filter(s => m[s] > 0).map(s => `${m[s]} ${s}`).join(' / '); }
function totalEvs(m: Record<EvStat, number>) { return Object.values(m).reduce((a, b) => a + b, 0); }

function getHexPoint(i: number, r: number, cx: number, cy: number) {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / 6;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

// ─── Hex Chart ────────────────────────────────────────────────────
function EvHexChart({ evMap, size = 150 }: { evMap: Record<EvStat, number>; size?: number }) {
  const CX = size / 2, CY = size / 2, MAX_R = size * 0.37;
  const dataPts = HEX_ORDER.map((s, i) => getHexPoint(i, Math.max((evMap[s] / 252) * MAX_R, 1.5), CX, CY));
  const dataPath = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + ' Z';
  const total = totalEvs(evMap);
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {[1, 0.75, 0.5, 0.25].map((lv, li) => {
          const pts = HEX_ORDER.map((_, i) => getHexPoint(i, MAX_R * lv, CX, CY));
          return <path key={li} d={pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + ' Z'} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />;
        })}
        {HEX_ORDER.map((_, i) => { const o = getHexPoint(i, MAX_R, CX, CY); return <line key={i} x1={CX} y1={CY} x2={o.x.toFixed(2)} y2={o.y.toFixed(2)} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />; })}
        <path d={dataPath} fill="rgba(220,38,38,0.18)" stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round" />
        {dataPts.map((p, i) => evMap[HEX_ORDER[i]] > 0 && <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={EV_COLORS[HEX_ORDER[i]]} />)}
        {HEX_ORDER.map((stat, i) => {
          const lp = getHexPoint(i, MAX_R + 13, CX, CY);
          return <text key={stat} x={lp.x} y={lp.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="7" fontWeight="900" fill={EV_COLORS[stat]} fontFamily="monospace">{EV_LABELS[stat]}</text>;
        })}
      </svg>
      <div className="w-full flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-pokeball-red transition-all" style={{ width: `${(total / 510) * 100}%` }} />
        </div>
        <span className="text-[9px] font-black text-pokeball-red whitespace-nowrap">{total}<span className="text-muted-foreground font-bold">/510</span></span>
      </div>
    </div>
  );
}

// ─── EV Modal ─────────────────────────────────────────────────────
const EV_PRESETS = [
  { label: 'Físico', evs: { HP: 4, Atk: 252, Def: 0, SpA: 0, SpD: 0, Spe: 252 } },
  { label: 'Especial', evs: { HP: 4, Atk: 0, Def: 0, SpA: 252, SpD: 0, Spe: 252 } },
  { label: 'Bulky Fís.', evs: { HP: 252, Atk: 4, Def: 252, SpA: 0, SpD: 0, Spe: 0 } },
  { label: 'Bulky Esp.', evs: { HP: 252, Atk: 0, Def: 0, SpA: 4, SpD: 252, Spe: 0 } },
  { label: 'Trick Room', evs: { HP: 252, Atk: 252, Def: 0, SpA: 0, SpD: 4, Spe: 0 } },
  { label: 'Reset', evs: { HP: 0, Atk: 0, Def: 0, SpA: 0, SpD: 0, Spe: 0 } },
];

function EvModal({ evs, onClose, onSave }: { evs: string; onClose: () => void; onSave: (evs: string) => void }) {
  const [evMap, setEvMap] = useState<Record<EvStat, number>>(() => parseEvs(evs));
  const total = totalEvs(evMap);
  const remaining = 510 - total;
  const update = (stat: EvStat, raw: number) => {
    const v = Math.min(252, Math.max(0, isNaN(raw) ? 0 : raw));
    if (total - evMap[stat] + v > 510) return;
    setEvMap(prev => ({ ...prev, [stat]: v }));
  };
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-200" style={{ zIndex: 99999 }} onClick={onClose}>
      <div className="bg-card border-2 border-pokeball-red/40 rounded-2xl p-6 w-full max-w-[520px] relative shadow-[0_0_60px_rgba(220,38,38,0.15)] animate-in zoom-in-95 duration-200 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pokeball-red via-pokeball-red/50 to-transparent" />
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-black uppercase italic text-foreground tracking-tight leading-none">Distribuidor de EVs</h3>
            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Máx. 252 por stat · 510 total</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-secondary hover:bg-destructive hover:text-destructive-foreground rounded-full text-muted-foreground transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="flex gap-5">
          <div className="flex flex-col gap-3 flex-shrink-0 w-[160px]">
            <EvHexChart evMap={evMap} size={160} />
            <div className="grid grid-cols-2 gap-1">
              {EV_PRESETS.map(p => (
                <button key={p.label} onClick={() => setEvMap(p.evs as Record<EvStat, number>)} className="px-2 py-1.5 bg-secondary/50 hover:bg-pokeball-red/15 border border-border hover:border-pokeball-red/30 rounded-lg text-[8px] font-black uppercase tracking-wider text-muted-foreground hover:text-pokeball-red transition-all text-center leading-none">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-3 min-w-0">
            {EV_STATS.map(stat => {
              const val = evMap[stat];
              const color = EV_COLORS[stat];
              return (
                <div key={stat} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{EV_LABELS[stat]}</label>
                    <div className="flex items-center gap-1">
                      <button onClick={() => update(stat, Math.max(0, val - 4))} className="w-5 h-5 rounded bg-secondary/70 hover:bg-secondary text-muted-foreground text-xs font-black transition-colors flex items-center justify-center">−</button>
                      <input type="number" min={0} max={252} value={val} onChange={e => update(stat, parseInt(e.target.value))} className="w-12 bg-secondary/50 border border-border rounded px-1 py-0.5 text-[10px] font-black text-center text-foreground outline-none" />
                      <button onClick={() => update(stat, Math.min(252, val + 4))} className="w-5 h-5 rounded bg-secondary/70 hover:bg-secondary text-muted-foreground text-xs font-black transition-colors flex items-center justify-center">+</button>
                    </div>
                  </div>
                  <div className="relative h-2.5 bg-secondary/50 rounded-full overflow-hidden cursor-pointer" onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); update(stat, Math.round((Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * 252) / 4) * 4); }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(val / 252) * 100}%`, backgroundColor: color, opacity: 0.8 }} />
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Restantes</span>
              <span className={`text-sm font-black tabular-nums ${remaining === 0 ? 'text-pokeball-red' : remaining < 60 ? 'text-amber-400' : 'text-emerald-400'}`}>{remaining}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5 pt-4 border-t border-border/60">
          <button onClick={onClose} className="flex-1 py-2.5 bg-secondary/50 hover:bg-secondary border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all">Cancelar</button>
          <button onClick={() => { onSave(serializeEvs(evMap)); onClose(); }} className="flex-1 py-2.5 bg-pokeball-red hover:bg-pokeball-dark border border-pokeball-red/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-[0_4px_14px_rgba(220,38,38,0.3)]">Confirmar EVs</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Helpers de Move ──────────────────────────────────────────────
const CATEGORIA_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  physical: { icon: '⚔', color: 'text-orange-400', label: 'Físico' },
  special:  { icon: '✦', color: 'text-blue-400',   label: 'Especial' },
  status:   { icon: '◎', color: 'text-gray-400',    label: 'Estado' },
};

function MoveTypeBadge({ tipo }: { tipo?: string }) {
  if (!tipo) return null;
  const cls = TYPE_COLORS[tipo.toLowerCase()] || 'bg-secondary text-foreground';
  return (
    <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase leading-none ${cls}`}>
      {TYPE_TRANSLATIONS[tipo.toLowerCase()] || tipo}
    </span>
  );
}

function MoveCatBadge({ categoria }: { categoria?: string }) {
  if (!categoria) return null;
  const c = CATEGORIA_ICONS[categoria] || { icon: '?', color: 'text-muted-foreground', label: categoria };
  return <span className={`text-[9px] font-black ${c.color}`} title={c.label}>{c.icon}</span>;
}

// ─── Move Picker Modal ────────────────────────────────────────────
function MovePicker({
  slot,
  value,
  legalMoves,
  onSelect,
  onClose,
}: {
  slot: number;
  value: string;
  legalMoves: MoveData[];
  onSelect: (move: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  const filtered = query.length >= 1
    ? legalMoves.filter(m => m.nombre.toLowerCase().includes(query.toLowerCase()))
    : legalMoves;

  // Agrupar por categoría para mejor UX
  const physical = filtered.filter(m => m.categoria === 'physical');
  const special   = filtered.filter(m => m.categoria === 'special');
  const status    = filtered.filter(m => m.categoria === 'status');
  const unknown   = filtered.filter(m => !m.categoria);

  const groups = [
    { label: '⚔ Físicos', color: 'text-orange-400', moves: physical },
    { label: '✦ Especiales', color: 'text-blue-400', moves: special },
    { label: '◎ Estado', color: 'text-gray-400', moves: status },
    ...(unknown.length > 0 ? [{ label: '? Otros', color: 'text-muted-foreground', moves: unknown }] : []),
  ].filter(g => g.moves.length > 0);

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-150"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        className="bg-card border-2 border-pokeball-red/40 rounded-2xl w-full max-w-md relative shadow-[0_0_60px_rgba(220,38,38,0.15)] animate-in zoom-in-95 duration-150 overflow-hidden flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pokeball-red via-pokeball-red/50 to-transparent" />

        {/* Header fijo */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-black uppercase italic text-foreground tracking-tight leading-none">
                Move {slot + 1}
              </h3>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                {legalMoves.length} movimientos disponibles
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-secondary hover:bg-destructive hover:text-destructive-foreground rounded-full text-muted-foreground transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          {/* Buscador */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Filtrar movimiento..."
              className="w-full bg-secondary/50 border border-pokeball-red/20 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/40 placeholder:text-muted-foreground/50"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-pokeball-red transition-colors">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </div>

          {/* Limpiar selección */}
          {value && (
            <button
              onClick={() => { onSelect(''); onClose(); }}
              className="mt-2 w-full py-1.5 bg-secondary/30 hover:bg-secondary/60 border border-border rounded-lg text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-pokeball-red transition-all"
            >
              ✕ Quitar movimiento seleccionado
            </button>
          )}
        </div>

        {/* Lista scrolleable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4">
          {groups.length === 0 && (
            <p className="text-center text-muted-foreground text-xs py-8 font-bold">Sin resultados</p>
          )}
          {groups.map(group => (
            <div key={group.label} className="mb-3">
              {/* Encabezado de grupo */}
              <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-1.5 ${group.color}`}>
                {group.label} ({group.moves.length})
              </div>
              <div className="space-y-0.5">
                {group.moves.map((move, mi) => {
                  const isSelected = move.nombre === value;
                  return (
                    <button
                      key={`${move.nombre}-${mi}`}
                      onClick={() => { onSelect(move.nombre); onClose(); }}
                      className={`w-full px-3 py-2 rounded-lg text-left transition-all flex items-center gap-2 group/mv
                        ${isSelected
                          ? 'bg-pokeball-red/15 border border-pokeball-red/30'
                          : 'hover:bg-secondary/60 border border-transparent hover:border-border/60'
                        }`}
                    >
                      {/* Nombre */}
                      <span className={`text-[10px] font-black uppercase flex-1 truncate ${isSelected ? 'text-pokeball-red' : 'text-foreground group-hover/mv:text-foreground'}`}>
                        {move.nombre}
                        {isSelected && <span className="ml-1 text-pokeball-red">✓</span>}
                      </span>

                      {/* Meta info */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Tipo */}
                        {move.tipo && <MoveTypeBadge tipo={move.tipo} />}

                        {/* Potencia */}
                        {move.potencia != null && (
                          <span className="text-[8px] font-black text-amber-400 tabular-nums w-7 text-right" title="Potencia">
                            {move.potencia}
                          </span>
                        )}
                        {move.potencia == null && move.categoria !== 'status' && (
                          <span className="text-[8px] font-black text-muted-foreground/40 w-7 text-right">—</span>
                        )}

                        {/* Precisión */}
                        {move.precision != null ? (
                          <span className="text-[8px] font-bold text-sky-400 tabular-nums w-8 text-right" title="Precisión">
                            {move.precision}%
                          </span>
                        ) : (
                          <span className="text-[8px] font-bold text-muted-foreground/40 w-8 text-right">—</span>
                        )}

                        {/* Categoría icono */}
                        <MoveCatBadge categoria={move.categoria} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Move Slot Button ──────────────────────────────────────────────
function MoveSlotButton({
  slot,
  value,
  legalMoves,
  onChange,
}: {
  slot: number;
  value: string;
  legalMoves: MoveData[];
  onChange: (move: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Buscar datos del move seleccionado para mostrar info
  const moveData = legalMoves.find(m => m.nombre === value);
  const isReady = legalMoves.length > 0;

  return (
    <>
      <button
        onClick={() => isReady && setPickerOpen(true)}
        disabled={!isReady}
        className={`w-full px-3 py-2 rounded-lg border text-left transition-all flex items-center gap-2 group/slot
          ${value
            ? 'bg-secondary/40 border-pokeball-red/20 hover:border-pokeball-red/40'
            : 'bg-secondary/30 border-border/60 hover:border-pokeball-red/20'
          }
          ${!isReady ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {value ? (
          <>
            {/* Nombre del move */}
            <span className="text-[10px] font-black uppercase text-foreground flex-1 truncate leading-none">
              {value}
            </span>
            {/* Info compacta */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {moveData?.tipo && <MoveTypeBadge tipo={moveData.tipo} />}
              {moveData?.potencia != null && (
                <span className="text-[8px] font-black text-amber-400 tabular-nums">{moveData.potencia}</span>
              )}
              <MoveCatBadge categoria={moveData?.categoria} />
            </div>
          </>
        ) : (
          <span className="text-[10px] font-bold text-muted-foreground/40 flex-1">
            {isReady ? `Move ${slot + 1}` : '···'}
          </span>
        )}

        {/* Chevron */}
        {isReady && (
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="flex-shrink-0 text-muted-foreground/40 group-hover/slot:text-pokeball-red transition-colors">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        )}
      </button>

      {pickerOpen && mounted && (
        <MovePicker
          slot={slot}
          value={value}
          legalMoves={legalMoves}
          onSelect={onChange}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}

// ─── Componente Principal ─────────────────────────────────────────
export default function TeamReviewCard({ index, pokemon, onChange, onRemove, mechanics }: TeamReviewCardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [legalAbilities, setLegalAbilities] = useState<string[]>([]);
  const [legalMoves, setLegalMoves] = useState<MoveData[]>([]);
  const [evModalOpen, setEvModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const loadedRef = useRef<string>('');
  const listIdItem = `item-list-${index}`;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (pokemon.name && pokemon.name !== loadedRef.current) {
      loadedRef.current = pokemon.name;
      loadData(pokemon.name, pokemon.ability);
    }
  }, [pokemon.name]);

  // La PokeAPI devuelve el mismo move por distintos métodos de aprendizaje → deduplicar por nombre
  const dedupMoves = (raw: MoveData[]): MoveData[] => {
    const seen = new Set<string>();
    return raw.filter(m => { if (seen.has(m.nombre)) return false; seen.add(m.nombre); return true; });
  };

  const loadData = async (name: string, currentAbility?: string) => {
    try {
      const res = await fetch(`/api/pokemon/moves?name=${name.toLowerCase()}`);
      const data = await res.json();
      if (data.moves) setLegalMoves(dedupMoves(data.moves));
      if (data.abilities?.length > 0) {
        setLegalAbilities(data.abilities);
        if (!currentAbility || !data.abilities.includes(currentAbility)) {
          onChange({ ...pokemon, name, ability: data.abilities[0] });
        }
      } else {
        setLegalAbilities([]);
      }
    } catch { /* silent */ }
  };

  const selectPokemon = async (p: any) => {
    setSearchTerm('');
    setSearchResults([]);
    loadedRef.current = p.nombre;
    setLegalMoves([]);
    setLegalAbilities([]);
    let firstAbility = '';
    try {
      const res = await fetch(`/api/pokemon/moves?name=${p.nombre.toLowerCase()}`);
      const data = await res.json();
      if (data.moves) setLegalMoves(dedupMoves(data.moves));
      if (data.abilities?.length > 0) { setLegalAbilities(data.abilities); firstAbility = data.abilities[0]; }
    } catch { /* silent */ }
    onChange({ ...pokemon, name: p.nombre, ability: firstAbility || pokemon.ability, moves: ['', '', '', ''] });
  };

  const updateField = useCallback((field: keyof ReviewPokemon, value: string) => {
    onChange({ ...pokemon, [field]: value });
  }, [pokemon, onChange]);

  const updateMove = useCallback((slot: number, move: string) => {
    const newMoves = [...pokemon.moves];
    newMoves[slot] = move;
    onChange({ ...pokemon, moves: newMoves });
  }, [pokemon, onChange]);

  const evMap = parseEvs(pokemon.evs);
  const totalEv = totalEvs(evMap);

  const mechanicOptions = [
    { id: 'none', label: 'Ninguna' },
    ...(mechanics.enableMega ? [{ id: 'mega', label: 'Mega Evolution' }] : []),
    ...(mechanics.enableGmax ? [{ id: 'gmax', label: 'Gigantamax' }] : []),
    ...(mechanics.enableDynamax ? [{ id: 'dynamax', label: 'Dynamax' }] : []),
    ...(mechanics.enableZMoves ? [{ id: 'zmove', label: 'Z-Move' }] : []),
    ...(mechanics.enableTera ? [{ id: 'tera', label: 'Teracristalizacion' }] : []),
  ];

  const selectStyle = { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23dc2626' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' };

  return (
    <>
      <div className="bg-card border-2 border-border rounded-2xl p-5 relative hover:border-pokeball-red/30 transition-all z-10 hover:z-20">
        <div className="absolute top-0 left-0 right-0 h-1.5 overflow-hidden rounded-t-2xl">
          <div className="w-full h-full bg-gradient-to-r from-pokeball-red/60 via-pokeball-red/30 to-transparent" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 mt-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-pokeball-red/10 flex items-center justify-center text-[10px] font-black text-pokeball-red border border-pokeball-red/20">{index + 1}</div>
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground truncate max-w-[150px]">{pokemon.name ? pokemon.name.replace(/-/g, ' ') : `Slot ${index + 1}`}</span>
          </div>
          <button onClick={onRemove} className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Buscador */}
        {!pokemon.name ? (
          <div className="relative mb-4">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <input type="text" value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); if (e.target.value.length > 2) fetch(`/api/pokemon/search?name=${e.target.value.toLowerCase()}`).then(r => r.json()).then(d => setSearchResults(Array.isArray(d) ? d : [])).catch(() => setSearchResults([])); else setSearchResults([]); }}
              placeholder="Buscar Pokemon..."
              className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/40 placeholder:text-muted-foreground/50"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto z-50">
                {searchResults.map((p: any) => (
                  <button key={p.id} onMouseDown={e => { e.preventDefault(); selectPokemon(p); }} className="w-full p-3 text-left hover:bg-pokeball-red/10 flex items-center justify-between border-b border-border/50 last:border-b-0 transition-colors">
                    <span className="text-[10px] font-black uppercase text-foreground truncate pr-2">{p.nombre.replace(/-/g, ' ')}</span>
                    <div className="flex gap-1 shrink-0">
                      {[p.tipo1, p.tipo2].filter(Boolean).map((t: string) => (
                        <span key={t} className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${TYPE_COLORS[t.toLowerCase()] || 'bg-secondary text-foreground'}`}>{TYPE_TRANSLATIONS[t.toLowerCase()] || t}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Nombre */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
              <h4 className="text-sm font-black uppercase italic text-foreground truncate">{pokemon.name.replace(/-/g, ' ')}</h4>
              <button onClick={() => { setLegalAbilities([]); setLegalMoves([]); loadedRef.current = ''; onChange({ ...pokemon, name: '', ability: '', moves: ['', '', '', ''] }); }} className="text-[8px] text-muted-foreground hover:text-pokeball-red font-bold uppercase transition-colors shrink-0">Cambiar</button>
            </div>

            {/* Item + Ability */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1 block">Objeto</label>
                <input type="text" list={listIdItem} value={pokemon.item} onChange={e => updateField('item', e.target.value)} placeholder="Ej: Leftovers"
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-[10px] font-bold text-foreground outline-none focus:ring-2 focus:ring-amber-500/40 placeholder:text-muted-foreground/40"
                />
                <datalist id={listIdItem}>{Object.keys(COMPETITIVE_ITEMS).map(n => <option key={n} value={n} />)}</datalist>
                {COMPETITIVE_ITEMS[pokemon.item] && <p className="text-[8px] text-amber-400 mt-1 leading-tight italic">{COMPETITIVE_ITEMS[pokemon.item]}</p>}
              </div>
              <div>
                <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1 block">Habilidad</label>
                {legalAbilities.length > 0 ? (
                  <select value={pokemon.ability} onChange={e => updateField('ability', e.target.value)} className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-[10px] font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/40 cursor-pointer appearance-none" style={selectStyle}>
                    {legalAbilities.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                ) : (
                  <input type="text" value={pokemon.ability} onChange={e => updateField('ability', e.target.value)} placeholder="Cargando..."
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-[10px] font-bold text-foreground outline-none placeholder:text-muted-foreground/40"
                  />
                )}
              </div>
            </div>

            {/* Nature + Tera */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1 block">Naturaleza</label>
                <select value={pokemon.nature} onChange={e => updateField('nature', e.target.value)} className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-[10px] font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/40 cursor-pointer appearance-none" style={selectStyle}>
                  <option value="">Seleccionar...</option>
                  {Object.entries(NATURES).map(([n, e]) => <option key={n} value={n}>{n} ({e})</option>)}
                </select>
              </div>
              <div>
                <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1 block">Tera Type</label>
                <select value={pokemon.teraType} onChange={e => updateField('teraType', e.target.value)} className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-[10px] font-bold text-foreground outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2322d3ee' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}>
                  <option value="">Sin Tera Type</option>
                  {TERA_TYPES.map(t => <option key={t} value={t}>{TYPE_TRANSLATIONS[t.toLowerCase()] || t}</option>)}
                </select>
              </div>
            </div>

            {/* EVs */}
            <div>
              <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>EVs</span>
                {totalEv > 0 && <span className="text-pokeball-red font-black">{totalEv}/510</span>}
              </label>
              <button onClick={() => setEvModalOpen(true)}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-all flex items-center justify-between gap-2 group/ev hover:border-pokeball-red/40 ${totalEv > 0 ? 'bg-pokeball-red/5 border-pokeball-red/20' : 'bg-secondary/50 border-border'}`}>
                <span className={`text-[10px] font-bold truncate flex-1 ${totalEv > 0 ? 'text-foreground' : 'text-muted-foreground/50'}`}>{pokemon.evs || 'Configurar EVs...'}</span>
                <svg width="26" height="26" viewBox="0 0 120 120" className="flex-shrink-0 opacity-60 group-hover/ev:opacity-90 transition-opacity">
                  {(() => {
                    const pts = HEX_ORDER.map((s, i) => getHexPoint(i, Math.max((evMap[s] / 252) * 46, 2), 60, 60));
                    const bgPts = HEX_ORDER.map((_, i) => getHexPoint(i, 46, 60, 60));
                    const bgPath = bgPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
                    const dataPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
                    return (<><path d={bgPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" /><path d={dataPath} fill="rgba(220,38,38,0.2)" stroke="#dc2626" strokeWidth="1.5" /></>);
                  })()}
                </svg>
              </button>
            </div>

            {/* Movimientos — solo picker modal */}
            <div>
              <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-2">
                <span>Movimientos</span>
                {legalMoves.length === 0 && pokemon.name && <span className="text-[7px] text-amber-400/60 font-bold normal-case animate-pulse">cargando...</span>}
                {legalMoves.length > 0 && <span className="text-[7px] text-emerald-400/60 font-bold normal-case">{legalMoves.length} legales</span>}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map(slot => (
                  <MoveSlotButton
                    key={slot}
                    slot={slot}
                    value={pokemon.moves[slot] || ''}
                    legalMoves={legalMoves}
                    onChange={move => updateMove(slot, move)}
                  />
                ))}
              </div>
            </div>

            {/* Mecánica */}
            {mechanicOptions.length > 1 && (
              <div>
                <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1 block">Mecanica</label>
                <select value={pokemon.mechanic} onChange={e => updateField('mechanic', e.target.value)} className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-[10px] font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/40 cursor-pointer appearance-none" style={selectStyle}>
                  {mechanicOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {evModalOpen && mounted && (
        <EvModal evs={pokemon.evs} onClose={() => setEvModalOpen(false)} onSave={val => updateField('evs', val)} />
      )}
    </>
  );
}