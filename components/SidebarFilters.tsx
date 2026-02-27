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
  
  const toggleClause = (clause: string) => {
    const newClauses = config.clauses.includes(clause) 
      ? config.clauses.filter((c: string) => c !== clause)
      : [...config.clauses, clause];
    updateConfig('clauses', newClauses);
  };

  return (
    <div className="space-y-8 overflow-y-auto pr-2 pb-10 custom-scrollbar">
      
      {/* SELECTOR DE EXPERIENCIA (NUEVO) */}
      <div className="bg-zinc-900/50 p-1.5 rounded-2xl flex border border-white/5">
        <button 
          onClick={() => updateConfig('experienceLevel', 'novato')}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${config.experienceLevel === 'novato' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
        >
          🎓 Novato
        </button>
        <button 
          onClick={() => updateConfig('experienceLevel', 'experto')}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${config.experienceLevel === 'experto' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
        >
          ⚔️ Experto
        </button>
      </div>

      <div className="space-y-3">
        <label className="text-[9px] uppercase font-black text-blue-500 tracking-[0.2em]">Directiva Táctica</label>
        <textarea 
          placeholder={config.experienceLevel === 'novato' ? 'Ej: "Quiero ganar atacando rápido y fuerte..."' : 'Ej: "Trick Room, Tailwind con apoyo de Fake Out..."'}
          value={config.customStrategy}
          onChange={(e) => updateConfig('customStrategy', e.target.value)}
          className="w-full bg-zinc-900/80 border border-blue-500/30 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-600 resize-none h-20 shadow-[0_0_15px_rgba(37,99,235,0.1)]"
        />
      </div>

      <div className="space-y-3">
        <label className="text-[9px] uppercase font-black text-blue-500 tracking-[0.2em]">Protocolo de Combate</label>
        <select 
          value={config.format}
          onChange={(e) => updateConfig('format', e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
        >
          {FORMATOS.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        <label className="text-[9px] uppercase font-black text-amber-500 tracking-[0.2em]">Modificadores Extra</label>
        <div className="space-y-2 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-[10px] font-bold text-zinc-400 group-hover:text-amber-400 transition-colors">Little Cup (Solo crías Lvl 5)</span>
            <input type="checkbox" checked={config.isLittleCup} onChange={(e) => updateConfig('isLittleCup', e.target.checked)} className="w-4 h-4 accent-amber-500 rounded" />
          </label>
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-[10px] font-bold text-zinc-400 group-hover:text-purple-400 transition-colors">Randomizer (Equipos Caóticos)</span>
            <input type="checkbox" checked={config.isRandomizer} onChange={(e) => updateConfig('isRandomizer', e.target.checked)} className="w-4 h-4 accent-purple-500 rounded" />
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[9px] uppercase font-black text-blue-500 tracking-[0.2em]">Filtro de Pokedex</label>
        <div className="space-y-2 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
          {[
            { id: 'allowLegendaries', label: 'Permitir Legendarios (Mewtwo, Ogerpon)' },
            { id: 'allowMythicals', label: 'Permitir Singulares (Mew, Marshadow)' },
            { id: 'allowParadox', label: 'Permitir Paradox (Flutter Mane)' },
            { id: 'allowUB', label: 'Permitir Ultraentes (Kartana)' }
          ].map(filter => (
            <label key={filter.id} className="flex items-center justify-between cursor-pointer group">
              <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white transition-colors">{filter.label}</span>
              <input type="checkbox" checked={config[filter.id]} onChange={(e) => updateConfig(filter.id, e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}