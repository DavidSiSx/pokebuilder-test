'use client';
import React, { useState } from 'react';
import { DetailedTypeAnalysis } from '@/utils/teamAnalysis';
import { TYPE_COLORS, TYPE_TRANSLATIONS } from '@/utils/pokemonConstants';

export default function TeamAnalysis({ analysis }: { analysis: DetailedTypeAnalysis }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  if (!analysis) return null;

  // Solo mostramos tipos donde haya debilidades reales o inmunidades
  const types = Object.entries(analysis).filter(([_, data]) => 
    data.x4.length > 0 || data.x2.length > 0 || data.x05.length > 0 || data.x025.length > 0 || data.x0.length > 0
  );

  const majorWeaknesses = types.filter(([_, data]) => data.score >= 3).sort((a, b) => b[1].score - a[1].score);
  const majorResistances = types.filter(([_, data]) => data.score <= -3).sort((a, b) => a[1].score - b[1].score);

  return (
    <>
      {/* VISTA COMPACTA (En la pantalla principal) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 space-y-4">
          <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest">⚠️ Alertas Críticas (Debilidades)</h3>
          <div className="flex flex-wrap gap-2">
            {majorWeaknesses.length > 0 
              ? majorWeaknesses.map(([t]) => <span key={t} className={`px-3 py-1.5 text-[9px] uppercase rounded-lg shadow-md ${TYPE_COLORS[t] || 'bg-zinc-800 text-white'}`}>{TYPE_TRANSLATIONS[t] || t}</span>)
              : <span className="text-zinc-500 text-[10px] uppercase font-bold px-4 py-2 bg-zinc-900 rounded-xl">🛡️ Cobertura Defensiva Sólida</span>}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">🛡️ Muros Infranqueables (Resistencias)</h3>
          <div className="flex flex-wrap gap-2">
            {majorResistances.length > 0 
              ? majorResistances.map(([t]) => <span key={t} className={`px-3 py-1.5 text-[9px] uppercase rounded-lg shadow-md ${TYPE_COLORS[t] || 'bg-zinc-800 text-white'}`}>{TYPE_TRANSLATIONS[t] || t}</span>)
              : <span className="text-zinc-500 text-[10px] uppercase font-bold px-4 py-2 bg-zinc-900 rounded-xl">Sin Resistencias Core</span>}
          </div>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
          Desglose Completo
        </button>
      </div>

      {/* MODAL MATRIZ DETALLADA (Fondo arreglado y legible) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-md animate-in fade-in">
          {/* Contenedor sólido sin fugas */}
          <div className="bg-[#050505] border border-white/10 rounded-[3rem] p-10 max-w-6xl w-full max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl relative">
            
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 w-10 h-10 bg-white/5 text-zinc-400 rounded-full flex items-center justify-center font-bold hover:bg-red-500 hover:text-white transition-colors z-50">X</button>
            
            <h2 className="text-2xl font-black text-blue-500 uppercase tracking-widest mb-10 text-center">Matriz de Debilidades</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {types.sort((a, b) => b[1].score - a[1].score).map(([typeName, data]) => (
                <div key={typeName} className="bg-[#0d0d0d] border border-zinc-800/80 rounded-[1.5rem] p-5 shadow-lg flex flex-col relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                  
                  {/* Etiqueta del tipo traducida */}
                  <div className={`text-[11px] uppercase font-black px-3 py-2 rounded-xl text-center mb-5 tracking-widest shadow-inner ${TYPE_COLORS[typeName] || 'bg-zinc-800 text-white'}`}>
                    {TYPE_TRANSLATIONS[typeName] || typeName}
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    {data.x4.length > 0 && <div className="text-[10px] flex items-start justify-between border-b border-white/5 pb-2"><span className="text-red-500 font-black px-2 py-0.5 bg-red-500/10 rounded mr-2">x4</span><span className="text-zinc-300 text-right font-medium capitalize">{data.x4.join(', ')}</span></div>}
                    {data.x2.length > 0 && <div className="text-[10px] flex items-start justify-between border-b border-white/5 pb-2"><span className="text-orange-400 font-black px-2 py-0.5 bg-orange-500/10 rounded mr-2">x2</span><span className="text-zinc-400 text-right capitalize">{data.x2.join(', ')}</span></div>}
                    {data.x05.length > 0 && <div className="text-[10px] flex items-start justify-between border-b border-white/5 pb-2"><span className="text-emerald-400 font-black px-2 py-0.5 bg-emerald-500/10 rounded mr-2">x½</span><span className="text-zinc-500 text-right capitalize">{data.x05.join(', ')}</span></div>}
                    {data.x025.length > 0 && <div className="text-[10px] flex items-start justify-between border-b border-white/5 pb-2"><span className="text-teal-400 font-black px-2 py-0.5 bg-teal-500/10 rounded mr-2">x¼</span><span className="text-zinc-500 text-right capitalize">{data.x025.join(', ')}</span></div>}
                    {data.x0.length > 0 && <div className="text-[10px] flex items-start justify-between"><span className="text-purple-400 font-black px-2 py-0.5 bg-purple-500/10 rounded mr-2">x0</span><span className="text-zinc-500 text-right capitalize">{data.x0.join(', ')}</span></div>}
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}