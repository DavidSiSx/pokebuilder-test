'use client';
import React, { useState } from 'react';
import { DetailedTypeAnalysis } from '@/utils/teamAnalysis';
import { TYPE_COLORS, TYPE_TRANSLATIONS } from '@/utils/pokemonConstants';

export default function TeamAnalysis({ analysis }: { analysis: DetailedTypeAnalysis }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  if (!analysis) return null;

  const types = Object.entries(analysis).filter(([_, data]) =>
    data.x4.length > 0 || data.x2.length > 0 || data.x05.length > 0 || data.x025.length > 0 || data.x0.length > 0
  );

  const majorWeaknesses = types.filter(([_, data]) => data.score >= 3).sort((a, b) => b[1].score - a[1].score);
  const majorResistances = types.filter(([_, data]) => data.score <= -3).sort((a, b) => a[1].score - b[1].score);

  return (
    <>
      {/* Compact View */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex-1 space-y-3">
          <h3 className="text-[10px] font-black text-pokeball-red uppercase tracking-widest flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-pokeball-red"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            Alertas Criticas (Debilidades)
          </h3>
          <div className="flex flex-wrap gap-2">
            {majorWeaknesses.length > 0
              ? majorWeaknesses.map(([t]) => (
                <span key={t} className={`px-3 py-1.5 text-[9px] uppercase rounded-lg shadow-md font-black ${TYPE_COLORS[t] || 'bg-secondary text-foreground'}`}>
                  {TYPE_TRANSLATIONS[t] || t}
                </span>
              ))
              : (
                <span className="text-muted-foreground text-[10px] uppercase font-bold px-4 py-2 bg-secondary/50 rounded-xl border border-border flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  Cobertura Defensiva Solida
                </span>
              )}
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
            Muros Infranqueables (Resistencias)
          </h3>
          <div className="flex flex-wrap gap-2">
            {majorResistances.length > 0
              ? majorResistances.map(([t]) => (
                <span key={t} className={`px-3 py-1.5 text-[9px] uppercase rounded-lg shadow-md font-black ${TYPE_COLORS[t] || 'bg-secondary text-foreground'}`}>
                  {TYPE_TRANSLATIONS[t] || t}
                </span>
              ))
              : (
                <span className="text-muted-foreground text-[10px] uppercase font-bold px-4 py-2 bg-secondary/50 rounded-xl border border-border">
                  Sin Resistencias Core
                </span>
              )}
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3.5 bg-pokeball-red hover:bg-pokeball-dark text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg border border-pokeball-red/50 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center gap-2 flex-shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
          Desglose Completo
        </button>
      </div>

      {/* Full Matrix Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-background/90 backdrop-blur-md animate-in fade-in" role="dialog" aria-modal="true" aria-label="Matriz de Debilidades">
          <div className="bg-card border-2 border-pokeball-red/30 rounded-2xl p-8 max-w-6xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar shadow-[0_0_80px_rgba(220,38,38,0.1)] relative">
            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pokeball-red via-pokeball-red/60 to-transparent rounded-t-2xl" />

            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 bg-secondary text-muted-foreground rounded-full flex items-center justify-center font-bold hover:bg-destructive hover:text-destructive-foreground transition-colors z-50"
              aria-label="Cerrar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-pokeball-red/15 flex items-center justify-center border border-pokeball-red/30">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pokeball-red"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
              </div>
              <h2 className="text-xl font-black text-pokeball-red uppercase tracking-widest">Matriz de Debilidades</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {types.sort((a, b) => b[1].score - a[1].score).map(([typeName, data]) => (
                <div key={typeName} className="bg-secondary/30 border border-border rounded-xl p-4 shadow-sm flex flex-col relative overflow-hidden group hover:border-pokeball-red/30 transition-colors">
                  {/* Score indicator */}
                  <div className={`absolute top-0 left-0 w-full h-0.5 ${data.score > 0 ? 'bg-pokeball-red/50' : data.score < 0 ? 'bg-emerald-500/50' : 'bg-border'}`} />

                  <div className={`text-[10px] uppercase font-black px-3 py-2 rounded-lg text-center mb-4 tracking-widest ${TYPE_COLORS[typeName] || 'bg-secondary text-foreground'}`}>
                    {TYPE_TRANSLATIONS[typeName] || typeName}
                  </div>

                  <div className="space-y-2.5 flex-1">
                    {data.x4.length > 0 && (
                      <div className="text-[10px] flex items-start justify-between border-b border-border pb-2">
                        <span className="text-pokeball-red font-black px-2 py-0.5 bg-pokeball-red/10 rounded mr-2 flex-shrink-0">x4</span>
                        <span className="text-foreground/80 text-right font-medium capitalize">{data.x4.join(', ')}</span>
                      </div>
                    )}
                    {data.x2.length > 0 && (
                      <div className="text-[10px] flex items-start justify-between border-b border-border pb-2">
                        <span className="text-amber-400 font-black px-2 py-0.5 bg-amber-500/10 rounded mr-2 flex-shrink-0">x2</span>
                        <span className="text-muted-foreground text-right capitalize">{data.x2.join(', ')}</span>
                      </div>
                    )}
                    {data.x05.length > 0 && (
                      <div className="text-[10px] flex items-start justify-between border-b border-border pb-2">
                        <span className="text-emerald-400 font-black px-2 py-0.5 bg-emerald-500/10 rounded mr-2 flex-shrink-0">{'x\u00BD'}</span>
                        <span className="text-muted-foreground/80 text-right capitalize">{data.x05.join(', ')}</span>
                      </div>
                    )}
                    {data.x025.length > 0 && (
                      <div className="text-[10px] flex items-start justify-between border-b border-border pb-2">
                        <span className="text-teal-400 font-black px-2 py-0.5 bg-teal-500/10 rounded mr-2 flex-shrink-0">{'x\u00BC'}</span>
                        <span className="text-muted-foreground/80 text-right capitalize">{data.x025.join(', ')}</span>
                      </div>
                    )}
                    {data.x0.length > 0 && (
                      <div className="text-[10px] flex items-start justify-between">
                        <span className="text-sky-400 font-black px-2 py-0.5 bg-sky-500/10 rounded mr-2 flex-shrink-0">x0</span>
                        <span className="text-muted-foreground/80 text-right capitalize">{data.x0.join(', ')}</span>
                      </div>
                    )}
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
