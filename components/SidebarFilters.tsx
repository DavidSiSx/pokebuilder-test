'use client';
import React from 'react';

const FORMATOS = [
  { id: 'natdex_doubles_6v6', name: 'National Dex Doubles (6v6 - Cobblemon)' },
  { id: 'vgc_modern', name: 'VGC Oficial (Dobles 4v4)' },
  { id: 'natdex_singles', name: 'National Dex Singles (6v6)' },
  { id: '1v1_6choose3', name: 'Combate Libre (Trae 6, Elige 3)' }
];

export default function SidebarFilters({ config, setConfig }: any) {
  const updateConfig = (key: string, value: any) => setConfig({ ...config, [key]: value });

  return (
    <div className="space-y-6 overflow-y-auto pr-1 pb-10 custom-scrollbar flex-1">
      
      {/* Experience Level Toggle */}
      <div>
        <label className="text-[9px] uppercase font-black text-pokeball-red tracking-[0.2em] flex items-center gap-1.5 mb-2.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-pokeball-red"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            Experto
          </button>
        </div>
      </div>

      {/* Strategy Textarea */}
      <div>
        <label className="text-[9px] uppercase font-black text-pokeball-red tracking-[0.2em] flex items-center gap-1.5 mb-2.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-pokeball-red"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          Directiva Tactica
        </label>
        <textarea
          placeholder={config.experienceLevel === 'novato' ? 'Ej: "Quiero ganar atacando rapido y fuerte..."' : 'Ej: "Trick Room, Tailwind con apoyo de Fake Out..."'}
          value={config.customStrategy}
          onChange={(e) => updateConfig('customStrategy', e.target.value)}
          className="w-full bg-secondary/50 border border-pokeball-red/20 rounded-xl px-4 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-pokeball-red/40 focus:border-pokeball-red/40 resize-none h-20 placeholder:text-muted-foreground/50 transition-all"
        />
      </div>

      {/* Format Select */}
      <div>
        <label className="text-[9px] uppercase font-black text-pokeball-red tracking-[0.2em] flex items-center gap-1.5 mb-2.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-pokeball-red"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>
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

      {/* Extra Modifiers */}
      <div>
        <label className="text-[9px] uppercase font-black text-amber-400 tracking-[0.2em] flex items-center gap-1.5 mb-2.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-400"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>
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

      {/* Pokedex Filter */}
      <div>
        <label className="text-[9px] uppercase font-black text-pokeball-red tracking-[0.2em] flex items-center gap-1.5 mb-2.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-pokeball-red"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></svg>
          Filtro de Pokedex
        </label>
        <div className="space-y-1 bg-secondary/30 p-3.5 rounded-xl border border-border">
          {[
            { id: 'allowLegendaries', label: 'Permitir Legendarios' },
            { id: 'allowMythicals', label: 'Permitir Singulares' },
            { id: 'allowParadox', label: 'Permitir Paradox' },
            { id: 'allowUB', label: 'Permitir Ultraentes' }
          ].map(filter => (
            <ToggleItem
              key={filter.id}
              label={filter.label}
              checked={config[filter.id]}
              onChange={(e: boolean) => updateConfig(filter.id, e)}
              color="red"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleItem({ label, checked, onChange, color = "red" }: { label: string; checked: boolean; onChange: (v: boolean) => void; color?: string }) {
  const colorClasses: Record<string, { bg: string; border: string; dot: string }> = {
    red: { bg: 'bg-pokeball-red', border: 'border-pokeball-red', dot: 'bg-primary-foreground' },
    amber: { bg: 'bg-amber-500', border: 'border-amber-500', dot: 'bg-primary-foreground' },
    sky: { bg: 'bg-sky-500', border: 'border-sky-500', dot: 'bg-primary-foreground' },
  };
  const c = colorClasses[color] || colorClasses.red;

  return (
    <label className="flex items-center justify-between cursor-pointer group py-1.5">
      <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-all border ${checked ? `${c.bg} ${c.border}` : 'bg-secondary border-border'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all shadow-sm ${checked ? `right-0.5 ${c.dot}` : 'left-0.5 bg-muted-foreground/40'}`} />
      </button>
    </label>
  );
}
