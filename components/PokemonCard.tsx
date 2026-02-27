'use client';
import React, { useState, useEffect } from 'react';
import { NATURES, TYPE_COLORS, TYPE_TRANSLATIONS } from '@/utils/pokemonConstants';

export default function PokemonCard({ slotNumber, data, isLocked, onToggleLock, onSelect }: any) {
  const [pokemon, setPokemon] = useState<any>(data || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { setPokemon(data); setIsModalOpen(false); }, [data]);

  const handleSearch = async (val: string) => {
    setSearchTerm(val);
    if (val.length > 2) {
      const res = await fetch(`/api/pokemon/search?name=${val.toLowerCase()}`);
      setResults(await res.json());
    }
  };

  const natureInfo = pokemon?.suggestedBuild?.nature 
    ? `${pokemon.suggestedBuild.nature} (${NATURES[pokemon.suggestedBuild.nature] || 'Neutral'})` : "---";

  // Lógica de seguridad para garantizar que siempre haya tipos listos para mostrar
  const activeTipos = pokemon?.tipos || [pokemon?.tipo1, pokemon?.tipo2].filter(Boolean);

  return (
    <div className="relative min-h-[580px] group flex flex-col">
      <div className={`flex-1 bg-[#0d0d0d] border ${isLocked ? 'border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'border-white/5 hover:border-blue-500/30'} rounded-[2.5rem] p-6 flex flex-col transition-all`}>
        
        <div className="absolute top-4 right-6 flex items-center gap-3 z-10">
          {pokemon && slotNumber !== 1 && (
            <button onClick={(e) => { e.stopPropagation(); onToggleLock(); }} className={`text-[10px] font-bold ${isLocked ? 'text-blue-500' : 'text-zinc-600 hover:text-white'}`}>
              {isLocked ? '🔒 FIJADO' : '🔓 FIJAR'}
            </button>
          )}
          <span className="text-[9px] font-black text-zinc-800 uppercase tracking-widest">Slot-0{slotNumber}</span>
        </div>

        {!pokemon ? (
          <div className="flex-1 flex flex-col justify-center gap-5 mt-8">
            <input type="text" value={searchTerm} onChange={(e) => handleSearch(e.target.value)} placeholder="BUSCAR POKÉMON..." className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-blue-600" />
            
            {results.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto no-scrollbar">
                {results.map((p: any) => (
                  <button key={p.id} onClick={() => { setPokemon(p); onSelect(p); setSearchTerm(''); setResults([]); }} className="w-full p-4 text-left hover:bg-zinc-800 flex items-center justify-between border-b border-white/5 transition-colors">
                    <span className="text-[11px] font-black uppercase text-white">{p.nombre}</span>
                    <div className="flex gap-1.5">
                      {[p.tipo1, p.tipo2].filter(Boolean).map(t => (
                        <span key={t} className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${TYPE_COLORS[t.toLowerCase()] || 'bg-blue-600/10 text-blue-500'}`}>
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
          <div className="flex-1 flex flex-col mt-4">
            <div className="flex items-center gap-5 mb-8">
              <img src={pokemon.sprite_url} alt={pokemon.nombre} className="w-20 h-20 object-contain bg-zinc-900 rounded-2xl p-2 border border-white/5 shadow-inner" />
              <div>
                <h3 className="text-xl font-black uppercase italic text-white leading-tight">{pokemon.nombre}</h3>
                {/* TIPOS VISIBLES SIEMPRE AQUÍ */}
                <div className="flex gap-1.5 mt-2">
                  {activeTipos.map((t: string) => (
                    <span key={t} className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${TYPE_COLORS[t.toLowerCase()] || 'bg-blue-600/10 text-blue-500'}`}>
                      {TYPE_TRANSLATIONS[t.toLowerCase()] || t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="space-y-1.5"><label className="text-[8px] font-black text-zinc-600 uppercase">Objeto</label><div className="bg-black/40 border border-white/5 p-2.5 rounded-xl text-[10px] font-bold text-zinc-300 truncate">{pokemon.suggestedBuild?.item || "---"}</div></div>
              <div className="space-y-1.5"><label className="text-[8px] font-black text-zinc-600 uppercase">Habilidad</label><div className="bg-black/40 border border-white/5 p-2.5 rounded-xl text-[10px] font-bold text-blue-400 truncate">{pokemon.suggestedBuild?.ability || "---"}</div></div>
            </div>

            <div className="space-y-1.5 mb-8 flex-1">
              <label className="text-[8px] font-black text-zinc-600 uppercase">Movimientos</label>
              <div className="grid grid-cols-1 gap-1.5">
                {(pokemon.suggestedBuild?.moves || Array(4).fill("---")).map((m: string, i: number) => (
                  <div key={i} className="px-4 py-2.5 bg-zinc-900 border border-white/5 rounded-xl text-[10px] font-bold uppercase text-zinc-400">{m}</div>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-auto border-t border-white/5 pt-4">
               <button onClick={(e) => { e.stopPropagation(); onSelect(null); }} className="text-[9px] font-black text-zinc-600 hover:text-red-500 uppercase tracking-widest relative z-20 transition-colors">Remover</button>
               {pokemon.suggestedBuild && (
                 <button onClick={() => setIsModalOpen(true)} className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-colors ml-auto bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/20">
                   🧬 Genética
                 </button>
               )}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && pokemon && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0a0a0a] border border-blue-500/50 rounded-[2.5rem] p-8 max-w-md w-full relative shadow-[0_0_50px_rgba(37,99,235,0.15)]">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-red-500 hover:text-white rounded-full text-zinc-500 transition-colors font-bold text-xs">X</button>
            <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-6">
              <img src={pokemon.sprite_url} alt={pokemon.nombre} className="w-16 h-16 object-contain drop-shadow-lg" />
              <div>
                <h3 className="text-2xl font-black uppercase text-blue-500 italic leading-none">{pokemon.nombre}</h3>
                <div className="flex gap-1.5 mt-2">
                  {activeTipos.map((t: string) => (
                     <span key={t} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${TYPE_COLORS[t.toLowerCase()] || 'bg-blue-600/10 text-blue-500'}`}>{TYPE_TRANSLATIONS[t.toLowerCase()] || t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div><label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Naturaleza Recomendada</label><div className="mt-1 text-xs font-bold text-emerald-100 bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-500/20">{natureInfo}</div></div>
              <div><label className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Distribución de EVs (Puntos de Esfuerzo)</label><div className="mt-1 text-xs font-bold text-amber-100 bg-amber-500/10 px-4 py-3 rounded-xl border border-amber-500/20">{pokemon.suggestedBuild?.evs || "---"}</div></div>
              <div><label className="text-[9px] font-black text-purple-500 uppercase tracking-widest">Esquema Exacto de IVs (Genes)</label><div className="mt-1 text-[10px] font-bold text-purple-100 bg-purple-500/10 px-4 py-4 rounded-xl border border-purple-500/20 tracking-wide">{pokemon.suggestedBuild?.ivs || "31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe"}</div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}