'use client';
import React, { useState } from 'react';
import { TYPE_COLORS, TYPE_TRANSLATIONS, NATURES, TERA_TYPES } from '@/utils/pokemonConstants';

interface ReviewPokemon {
  name: string;
  item: string;
  ability: string;
  nature: string;
  teraType: string;
  moves: string[];
  evs: string;
  mechanic: string;
}

interface TeamReviewCardProps {
  index: number;
  pokemon: ReviewPokemon;
  onChange: (pokemon: ReviewPokemon) => void;
  onRemove: () => void;
  mechanics: { enableMega: boolean; enableGmax: boolean; enableTera: boolean; enableZMoves: boolean; enableDynamax: boolean };
}

export default function TeamReviewCard({ index, pokemon, onChange, onRemove, mechanics }: TeamReviewCardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [moveSearches, setMoveSearches] = useState<string[]>(['', '', '', '']);
  const [moveResults, setMoveResults] = useState<any[]>([]);
  const [activeMoveSlot, setActiveMoveSlot] = useState<number | null>(null);

  const handlePokemonSearch = async (val: string) => {
    setSearchTerm(val);
    if (val.length > 2) {
      try {
        const res = await fetch(`/api/pokemon/search?name=${val.toLowerCase()}`);
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch { setSearchResults([]); }
    } else {
      setSearchResults([]);
    }
  };

  const selectPokemon = (p: any) => {
    onChange({ ...pokemon, name: p.nombre });
    setSearchTerm('');
    setSearchResults([]);
    // Fetch moves for this Pokemon
    fetchMoves(p.nombre);
  };

  const fetchMoves = async (name: string) => {
    try {
      const res = await fetch(`/api/pokemon/moves?name=${name.toLowerCase()}`);
      const data = await res.json();
      if (Array.isArray(data)) setMoveResults(data);
    } catch { /* silently fail */ }
  };

  const updateField = (field: keyof ReviewPokemon, value: string) => {
    onChange({ ...pokemon, [field]: value });
  };

  const updateMove = (slot: number, move: string) => {
    const newMoves = [...pokemon.moves];
    newMoves[slot] = move;
    onChange({ ...pokemon, moves: newMoves });
  };

  const mechanicOptions = [
    { id: 'none', label: 'Ninguna' },
    ...(mechanics.enableMega ? [{ id: 'mega', label: 'Mega Evolution' }] : []),
    ...(mechanics.enableGmax ? [{ id: 'gmax', label: 'Gigantamax' }] : []),
    ...(mechanics.enableDynamax ? [{ id: 'dynamax', label: 'Dynamax' }] : []),
    ...(mechanics.enableZMoves ? [{ id: 'zmove', label: 'Z-Move' }] : []),
    ...(mechanics.enableTera ? [{ id: 'tera', label: 'Teracristalizacion' }] : []),
  ];

  return (
    <div className="bg-card border-2 border-border rounded-2xl p-5 relative overflow-hidden hover:border-pokeball-red/30 transition-all group">
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pokeball-red/60 via-pokeball-red/30 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-pokeball-red/10 flex items-center justify-center text-[10px] font-black text-pokeball-red border border-pokeball-red/20">
            {index + 1}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            {pokemon.name || `Slot ${index + 1}`}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label="Remover Pokemon"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      {/* Pokemon Name Search */}
      {!pokemon.name ? (
        <div className="relative mb-4">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handlePokemonSearch(e.target.value)}
            placeholder="Buscar Pokemon..."
            className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/40 placeholder:text-muted-foreground/50"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl overflow-hidden shadow-2xl max-h-40 overflow-y-auto z-50 no-scrollbar">
              {searchResults.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => selectPokemon(p)}
                  className="w-full p-3 text-left hover:bg-pokeball-red/10 flex items-center justify-between border-b border-border last:border-b-0 transition-colors"
                >
                  <span className="text-[10px] font-black uppercase text-foreground">{p.nombre}</span>
                  <div className="flex gap-1">
                    {[p.tipo1, p.tipo2].filter(Boolean).map((t: string) => (
                      <span key={t} className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${TYPE_COLORS[t.toLowerCase()] || 'bg-secondary text-foreground'}`}>
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
        <div className="space-y-3">
          {/* Pokemon selected - show name */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
            <h4 className="text-sm font-black uppercase italic text-foreground">{pokemon.name}</h4>
            <button
              onClick={() => onChange({ ...pokemon, name: '' })}
              className="text-[8px] text-muted-foreground hover:text-pokeball-red font-bold uppercase transition-colors"
            >
              Cambiar
            </button>
          </div>

          {/* Item + Ability */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1 block">Objeto</label>
              <input
                type="text"
                value={pokemon.item}
                onChange={(e) => updateField('item', e.target.value)}
                placeholder="Life Orb, Choice Scarf..."
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-[10px] font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/40 placeholder:text-muted-foreground/40"
              />
            </div>
            <div>
              <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1 block">Habilidad</label>
              <input
                type="text"
                value={pokemon.ability}
                onChange={(e) => updateField('ability', e.target.value)}
                placeholder="Intimidate, Protean..."
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-[10px] font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/40 placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          {/* Nature + Tera Type */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1 block">Naturaleza</label>
              <select
                value={pokemon.nature}
                onChange={(e) => updateField('nature', e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-[10px] font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/40 cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23dc2626' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
              >
                <option value="">Seleccionar...</option>
                {Object.entries(NATURES).map(([name, effect]) => (
                  <option key={name} value={name}>{name} ({effect})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1 block">Tera Type</label>
              <select
                value={pokemon.teraType}
                onChange={(e) => updateField('teraType', e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-[10px] font-bold text-foreground outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2322d3ee' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
              >
                <option value="">Sin Tera Type</option>
                {TERA_TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_TRANSLATIONS[t.toLowerCase()] || t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* EVs */}
          <div>
            <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1 block">EVs</label>
            <input
              type="text"
              value={pokemon.evs}
              onChange={(e) => updateField('evs', e.target.value)}
              placeholder="252 Atk / 4 Def / 252 Spe"
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-[10px] font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/40 placeholder:text-muted-foreground/40"
            />
          </div>

          {/* Moves */}
          <div>
            <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1 block">Movimientos</label>
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map(slot => (
                <input
                  key={slot}
                  type="text"
                  value={pokemon.moves[slot] || ''}
                  onChange={(e) => updateMove(slot, e.target.value)}
                  placeholder={`Move ${slot + 1}`}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-[10px] font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/40 placeholder:text-muted-foreground/40"
                />
              ))}
            </div>
          </div>

          {/* Mechanic */}
          {mechanicOptions.length > 1 && (
            <div>
              <label className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1 block">Mecanica</label>
              <select
                value={pokemon.mechanic}
                onChange={(e) => updateField('mechanic', e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-[10px] font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/40 cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23dc2626' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
              >
                {mechanicOptions.map(o => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
