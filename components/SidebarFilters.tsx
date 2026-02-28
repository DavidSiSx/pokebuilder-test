'use client';
import React, { useState, useMemo } from 'react';

const FORMATOS = [
  { id: 'natdex_doubles_6v6', name: 'National Dex Doubles (6v6 - Cobblemon)' },
  { id: 'vgc_modern', name: 'VGC Oficial (Dobles 4v4)' },
  { id: 'natdex_singles', name: 'National Dex Singles (6v6)' },
  { id: '1v1_6choose3', name: 'Combate Libre (Trae 6, Elige 3)' }
];

const ALL_POKEMON_TYPES = [
  'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

const TERA_TYPES = [
  'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy', 'Stellar'
];

const TYPE_TRANSLATIONS_MAP: Record<string, string> = {
  Normal: 'Normal', Fire: 'Fuego', Water: 'Agua', Grass: 'Planta', Electric: 'Electrico',
  Ice: 'Hielo', Fighting: 'Lucha', Poison: 'Veneno', Ground: 'Tierra', Flying: 'Volador',
  Psychic: 'Psiquico', Bug: 'Bicho', Rock: 'Roca', Ghost: 'Fantasma', Dragon: 'Dragon',
  Dark: 'Siniestro', Steel: 'Acero', Fairy: 'Hada'
};

const WEATHER_OPTIONS = [
  { id: 'none', label: 'Sin clima' },
  { id: 'sun', label: 'Sol (Drought)' },
  { id: 'rain', label: 'Lluvia (Drizzle)' },
  { id: 'sand', label: 'Tormenta Arena (Sand Stream)' },
  { id: 'snow', label: 'Nieve (Snow Warning)' },
];

const TERRAIN_OPTIONS = [
  { id: 'none', label: 'Sin terreno' },
  { id: 'electric', label: 'Electrico' },
  { id: 'grassy', label: 'Herbal' },
  { id: 'psychic', label: 'Psiquico' },
  { id: 'misty', label: 'Brumoso' },
];

export default function SidebarFilters({ config, setConfig, leader }: any) {
  const updateConfig = (key: string, value: any) => setConfig({ ...config, [key]: value });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Derivar tipos permitidos para monotype basado en el lider
  const allowedMonoTypes = useMemo(() => {
    if (!leader) return ALL_POKEMON_TYPES; // sin lider, todos disponibles
    const leaderTypes: string[] = [leader.tipo1, leader.tipo2]
      .filter(Boolean)
      .map((t: string) => {
        // Normalizar: primer letra mayúscula, resto minúsculas
        return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
      });
    return leaderTypes; // solo los tipos del lider
  }, [leader]);

  // Si el tipo seleccionado ya no es valido (cambio de lider), resetear
  const currentMonoType = config.monoTypeSelected;
  const isCurrentMonoTypeValid = !currentMonoType || allowedMonoTypes.some(
    t => t.toLowerCase() === currentMonoType.toLowerCase()
  );

  return (
    <div className="space-y-5 overflow-y-auto pr-1 pb-10 custom-scrollbar flex-1">

      {/* ─── MODO DESDE CERO ─── */}
      <div>
        <label className="text-[9px] uppercase font-black text-violet-400 tracking-[0.2em] flex items-center gap-1.5 mb-2.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-violet-400">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          Modo de Generación
        </label>
        <div className="bg-secondary/50 p-1 rounded-xl flex border border-border">
          <button
            onClick={() => updateConfig('generationMode', 'leader')}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              config.generationMode !== 'scratch'
                ? 'bg-pokeball-red text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Con Lider
          </button>
          <button
            onClick={() => updateConfig('generationMode', 'scratch')}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              config.generationMode === 'scratch'
                ? 'bg-violet-600 text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Desde Cero
          </button>
        </div>

        {/* Descripcion contextual */}
        <p className="text-[9px] text-muted-foreground mt-2 px-1 leading-relaxed">
          {config.generationMode === 'scratch'
            ? '⚡ La IA arma el equipo completo según tu directiva táctica sin necesidad de elegir un líder.'
            : '🎯 Elige un Pokémon líder y la IA construye el equipo a su alrededor.'
          }
        </p>
      </div>

      {/* Separador */}
      <div className="pokeball-divider" />

      {/* Experience Level Toggle */}
      <div>
        <label className="text-[9px] uppercase font-black text-pokeball-red tracking-[0.2em] flex items-center gap-1.5 mb-2.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-pokeball-red">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
          Nivel de Entrenador
        </label>
        <div className="bg-secondary/50 p-1 rounded-xl flex border border-border">
          <button
            onClick={() => updateConfig('experienceLevel', 'novato')}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              config.experienceLevel === 'novato'
                ? 'bg-emerald-600 text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
            Novato
          </button>
          <button
            onClick={() => updateConfig('experienceLevel', 'experto')}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              config.experienceLevel === 'experto'
                ? 'bg-pokeball-red text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Experto
          </button>
        </div>
      </div>

      {/* Strategy Textarea */}
      <div>
        <label className="text-[9px] uppercase font-black text-pokeball-red tracking-[0.2em] flex items-center gap-1.5 mb-2.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-pokeball-red">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
          </svg>
          Directiva Tactica
          {config.generationMode === 'scratch' && (
            <span className="ml-1 text-violet-400 normal-case font-bold tracking-normal">(requerida)</span>
          )}
        </label>
        <textarea
          placeholder={
            config.generationMode === 'scratch'
              ? 'Ej: "Quiero un equipo de lluvia con Pelipper y atacantes rapidos..." o "Team de Trick Room ofensivo con tipos acero y hada..."'
              : config.experienceLevel === 'novato'
                ? 'Ej: "Quiero ganar atacando rapido y fuerte..."'
                : 'Ej: "Trick Room, Tailwind con apoyo de Fake Out..."'
          }
          value={config.customStrategy}
          onChange={(e) => updateConfig('customStrategy', e.target.value)}
          className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 resize-none h-24 placeholder:text-muted-foreground/50 transition-all ${
            config.generationMode === 'scratch'
              ? 'border-violet-500/30 focus:ring-violet-500/40 focus:border-violet-500/40'
              : 'border-pokeball-red/20 focus:ring-pokeball-red/40 focus:border-pokeball-red/40'
          }`}
        />
        {config.generationMode === 'scratch' && !config.customStrategy.trim() && (
          <p className="text-[9px] text-violet-400/70 mt-1.5 px-1 flex items-center gap-1">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
            Describe qué tipo de equipo quieres para mejores resultados
          </p>
        )}
      </div>

      {/* Format Select */}
      <div>
        <label className="text-[9px] uppercase font-black text-pokeball-red tracking-[0.2em] flex items-center gap-1.5 mb-2.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-pokeball-red">
            <circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/>
          </svg>
          Protocolo de Combate
        </label>
        <select
          value={config.format}
          onChange={(e) => updateConfig('format', e.target.value)}
          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/40 cursor-pointer appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23dc2626' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
        >
          {FORMATOS.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
        </select>
      </div>

      {/* Monotype Filter */}
      <div>
        <label className="text-[9px] uppercase font-black text-amber-400 tracking-[0.2em] flex items-center gap-1.5 mb-2.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-400">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
          </svg>
          Monotype
        </label>
        <div className="bg-secondary/30 p-3 rounded-xl border border-border">
          <ToggleItem
            label="Activar modo Monotype"
            checked={config.isMonotype || false}
            onChange={(v: boolean) => {
              setConfig({ ...config, isMonotype: v, monoTypeSelected: v ? config.monoTypeSelected : '' });
            }}
            color="amber"
          />
          {config.isMonotype && (
            <>
              <select
                value={isCurrentMonoTypeValid ? config.monoTypeSelected || '' : ''}
                onChange={(e) => updateConfig('monoTypeSelected', e.target.value)}
                className="w-full mt-2 bg-secondary/50 border border-amber-500/30 rounded-lg px-3 py-2.5 text-[10px] font-bold text-foreground outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23f59e0b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
              >
                <option value="">Selecciona un tipo...</option>
                {allowedMonoTypes.map(t => (
                  <option key={t} value={t.toLowerCase()}>
                    {TYPE_TRANSLATIONS_MAP[t] || t}
                  </option>
                ))}
              </select>

              {/* Hint si hay lider con tipos filtrados */}
              {leader && allowedMonoTypes.length < ALL_POKEMON_TYPES.length && (
                <p className="text-[9px] text-amber-400/70 mt-2 flex items-center gap-1.5">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                  </svg>
                  Solo tipos compatibles con{' '}
                  <span className="font-black text-amber-600 dark:text-amber-300 capitalize">{leader.nombre?.replace('-', ' ')}</span>
                </p>
              )}

              {/* Sin lider en modo scratch: todos los tipos */}
              {!leader && (
                <p className="text-[9px] text-amber-400/70 mt-2 flex items-center gap-1.5">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                  </svg>
                  Elige un líder para filtrar tipos disponibles
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Weather / Terrain Preference */}
      <div>
        <label className="text-[9px] uppercase font-black text-sky-400 tracking-[0.2em] flex items-center gap-1.5 mb-2.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-sky-400">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
          </svg>
          Clima y Terreno
        </label>
        <div className="bg-secondary/30 p-3 rounded-xl border border-border space-y-2">
          <select
            value={config.preferredWeather || 'none'}
            onChange={(e) => updateConfig('preferredWeather', e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-[10px] font-bold text-foreground outline-none focus:ring-2 focus:ring-sky-500/40 cursor-pointer appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
          >
            {WEATHER_OPTIONS.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
          </select>
          <select
            value={config.preferredTerrain || 'none'}
            onChange={(e) => updateConfig('preferredTerrain', e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-[10px] font-bold text-foreground outline-none focus:ring-2 focus:ring-sky-500/40 cursor-pointer appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
          >
            {TERRAIN_OPTIONS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* Extra Modifiers */}
      <div>
        <label className="text-[9px] uppercase font-black text-amber-400 tracking-[0.2em] flex items-center gap-1.5 mb-2.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-400">
            <path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>
          </svg>
          Modificadores Extra
        </label>
        <div className="space-y-1 bg-secondary/30 p-3.5 rounded-xl border border-border">
          <ToggleItem
            label="Little Cup (Solo crias Lvl 5)"
            checked={config.isLittleCup}
            onChange={(e: boolean) => updateConfig('isLittleCup', e)}
            color="amber"
          />
          <ToggleItem
            label="Randomizer (Equipos Caoticos)"
            checked={config.isRandomizer}
            onChange={(e: boolean) => updateConfig('isRandomizer', e)}
            color="sky"
          />
        </div>
      </div>

      {/* Special Mechanics */}
      <div>
        <label className="text-[9px] uppercase font-black text-cyan-400 tracking-[0.2em] flex items-center gap-1.5 mb-2.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-cyan-400">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
          </svg>
          Mecanicas Especiales
        </label>
        <div className="space-y-1 bg-secondary/30 p-3.5 rounded-xl border border-border">
          <ToggleItem label="Mega Evolution" checked={config.enableMega || false} onChange={(v: boolean) => updateConfig('enableMega', v)} color="violet" />
          <ToggleItem
            label="Gigantamax (Gmax)"
            checked={config.enableGmax || false}
            onChange={(v: boolean) => {
              setConfig({ ...config, enableGmax: v, ...(v ? { enableDynamax: true } : {}) });
            }}
            color="rose"
          />
          <ToggleItem
            label="Dynamax"
            checked={config.enableDynamax || false}
            onChange={(v: boolean) => {
              setConfig({ ...config, enableDynamax: v, ...(!v ? { enableGmax: false } : {}) });
            }}
            color="rose"
          />
          <ToggleItem label="Z-Moves" checked={config.enableZMoves || false} onChange={(v: boolean) => updateConfig('enableZMoves', v)} color="amber" />
          <div className="pt-1">
            <ToggleItem
              label="Teracristalizacion"
              checked={config.enableTera ?? true}
              onChange={(v: boolean) => {
                setConfig({ ...config, enableTera: v, preferredTeraType: v ? config.preferredTeraType : '' });
              }}
              color="cyan"
            />
            {config.enableTera && (
              <select
                value={config.preferredTeraType || ''}
                onChange={(e) => updateConfig('preferredTeraType', e.target.value)}
                className="w-full mt-2 bg-secondary/50 border border-cyan-500/30 rounded-lg px-3 py-2.5 text-[10px] font-bold text-foreground outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2322d3ee' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
              >
                <option value="">Tera Type libre (IA decide)</option>
                {TERA_TYPES.map(t => (
                  <option key={t} value={t.toLowerCase()}>{TYPE_TRANSLATIONS_MAP[t] || t}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full mt-6 flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-secondary/30 border border-border text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Filtros Avanzados
        </span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {showAdvanced && (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-2 pt-5">
          {/* Pokedex Filter */}
          <div>
            <label className="text-[9px] uppercase font-black text-pokeball-red tracking-[0.2em] flex items-center gap-1.5 mb-2.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-pokeball-red">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>
              </svg>
              Filtro de Pokedex
            </label>
            <div className="space-y-1 bg-secondary/30 p-3.5 rounded-xl border border-border">
              {[
                { id: 'allowLegendaries', label: 'Permitir Legendarios' },
                { id: 'allowMythicals', label: 'Permitir Singulares' },
                { id: 'allowParadox', label: 'Permitir Paradox' },
                { id: 'allowUB', label: 'Permitir Ultraentes' }
              ].map(filter => (
                <ToggleItem key={filter.id} label={filter.label} checked={config[filter.id]} onChange={(e: boolean) => updateConfig(filter.id, e)} color="red" />
              ))}
            </div>
          </div>

          {/* Speed Control */}
          <div>
            <label className="text-[9px] uppercase font-black text-emerald-400 tracking-[0.2em] flex items-center gap-1.5 mb-2.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
                <path d="m13 2-2 2.5h3L12 7"/><path d="M10 14v-3"/><path d="M14 14v-3"/><path d="M11 19c-1.7 0-3-1.3-3-3v-2h8v2c0 1.7-1.3 3-3 3h-2z"/>
              </svg>
              Control de Velocidad
            </label>
            <div className="space-y-1 bg-secondary/30 p-3.5 rounded-xl border border-border">
              <ToggleItem label="Priorizar Trick Room" checked={config.preferTrickRoom || false} onChange={(v: boolean) => updateConfig('preferTrickRoom', v)} color="amber" />
              <ToggleItem label="Priorizar Tailwind" checked={config.preferTailwind || false} onChange={(v: boolean) => updateConfig('preferTailwind', v)} color="sky" />
            </div>
          </div>

          {/* Team Archetype */}
          <div>
            <label className="text-[9px] uppercase font-black text-pokeball-red tracking-[0.2em] flex items-center gap-1.5 mb-2.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-pokeball-red">
                <path d="M2 12h6"/><path d="m6 8 4 4-4 4"/><path d="M22 12h-6"/><path d="m18 8-4 4 4 4"/>
              </svg>
              Arquetipo de Equipo
            </label>
            <div className="bg-secondary/30 p-1.5 rounded-xl border border-border grid grid-cols-3 gap-1">
              {[
                { id: 'offense', label: 'Ofensivo' },
                { id: 'balance', label: 'Balance' },
                { id: 'stall', label: 'Defensivo' },
              ].map(arch => (
                <button
                  key={arch.id}
                  onClick={() => updateConfig('teamArchetype', config.teamArchetype === arch.id ? '' : arch.id)}
                  className={`py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    config.teamArchetype === arch.id
                      ? 'bg-pokeball-red text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  {arch.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleItem({ label, checked, onChange, color = "red" }: { label: string; checked: boolean; onChange: (v: boolean) => void; color?: string }) {
  const colorClasses: Record<string, { bg: string; border: string; dot: string }> = {
    red: { bg: 'bg-pokeball-red', border: 'border-pokeball-red', dot: 'bg-primary-foreground' },
    amber: { bg: 'bg-amber-500', border: 'border-amber-500', dot: 'bg-primary-foreground' },
    sky: { bg: 'bg-sky-500', border: 'border-sky-500', dot: 'bg-primary-foreground' },
    emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500', dot: 'bg-primary-foreground' },
    violet: { bg: 'bg-violet-500', border: 'border-violet-500', dot: 'bg-primary-foreground' },
    rose: { bg: 'bg-rose-500', border: 'border-rose-500', dot: 'bg-primary-foreground' },
    cyan: { bg: 'bg-cyan-500', border: 'border-cyan-500', dot: 'bg-primary-foreground' },
  };
  const c = colorClasses[color] || colorClasses.red;

  return (
    <div onClick={() => onChange(!checked)} className="flex items-center justify-between cursor-pointer group py-1.5 w-full select-none">
      <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all border shrink-0 ${checked ? `${c.bg} ${c.border}` : 'bg-secondary border-border'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform shadow-sm ${checked ? `translate-x-[18px] ${c.dot}` : 'translate-x-[2px] bg-muted-foreground/40'}`} />
      </button>
    </div>
  );
}