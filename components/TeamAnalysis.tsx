'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DetailedTypeAnalysis } from '@/utils/teamAnalysis';
import { TYPE_COLORS, TYPE_TRANSLATIONS } from '@/utils/pokemonConstants';

export default function TeamAnalysis({ analysis }: { analysis: DetailedTypeAnalysis }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen]);

  if (!analysis) return null;

  const types = Object.entries(analysis).filter(([_, data]) =>
    data.x4.length > 0 || data.x2.length > 0 || data.x05.length > 0 || data.x025.length > 0 || data.x0.length > 0
  );

  const majorWeaknesses = types.filter(([_, data]) => data.score >= 3).sort((a, b) => b[1].score - a[1].score);
  const majorResistances = types.filter(([_, data]) => data.score <= -3).sort((a, b) => a[1].score - b[1].score);

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 md:p-8 bg-background/95 backdrop-blur-xl animate-in fade-in duration-300"
      style={{ zIndex: 99999 }}
      role="dialog"
      aria-modal="true"
      onClick={() => setIsModalOpen(false)}
    >
      <div
        className="bg-card border-2 border-border rounded-3xl p-6 md:p-10 max-w-7xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-4xl relative pokeball-bg animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-border pb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-pokeball-red/10 flex items-center justify-center border border-pokeball-red/20 pokeball-pulse">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-pokeball-red">
                <path d="M3 3h18v18H3z"/><path d="M21 9H3"/><path d="M21 15H3"/><path d="M9 3v18"/><path d="M15 3v18"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter italic">Matriz de Debilidades</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Análisis Táctico de Tipos y Resistencias</p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-6 right-6 w-12 h-12 bg-secondary/50 text-muted-foreground rounded-full flex items-center justify-center hover:bg-destructive hover:text-white transition-all group"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:rotate-90 transition-transform">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Grid de Tipos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {types.sort((a, b) => b[1].score - a[1].score).map(([typeName, data]) => (
            <div key={typeName} className="bg-secondary/20 border border-border/50 rounded-2xl p-5 shadow-sm hover:border-pokeball-red/30 transition-all flex flex-col group relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 ${data.score > 0 ? 'bg-pokeball-red' : data.score < 0 ? 'bg-emerald-500' : 'bg-muted'}`} />

              <div className="flex justify-between items-center mb-5">
                <div className={`text-[10px] uppercase font-black px-4 py-1.5 rounded-full tracking-widest shadow-sm`}
                  style={{ backgroundColor: TYPE_COLORS[typeName], color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                  {TYPE_TRANSLATIONS[typeName] || typeName}
                </div>
                <span className={`text-xs font-black font-mono ${data.score > 0 ? 'text-pokeball-red' : data.score < 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  {data.score > 0 ? `+${data.score}` : data.score}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {data.x4.length > 0 && <TypeBadge factor="x4" list={data.x4} color="text-pokeball-red bg-pokeball-red/10" />}
                {data.x2.length > 0 && <TypeBadge factor="x2" list={data.x2} color="text-amber-500 bg-amber-500/10" />}
                {data.x05.length > 0 && <TypeBadge factor="x½" list={data.x05} color="text-emerald-500 bg-emerald-500/10" />}
                {data.x025.length > 0 && <TypeBadge factor="x¼" list={data.x025} color="text-teal-500 bg-teal-500/10" />}
                {data.x0.length > 0 && <TypeBadge factor="x0" list={data.x0} color="text-sky-500 bg-sky-500/10" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Vista Compacta integrada en el Dashboard */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        <div className="flex-1 space-y-3 w-full">
          <h3 className="text-[10px] font-black text-pokeball-red uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pokeball-red animate-pulse" />
            Alertas Críticas (Debilidades)
          </h3>
          <div className="flex flex-wrap gap-2">
            {majorWeaknesses.length > 0
              ? majorWeaknesses.map(([t]) => (
                <span key={t} className="px-3 py-1.5 text-[9px] uppercase rounded-lg shadow-sm font-black"
                  style={{ backgroundColor: TYPE_COLORS[t], color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                  {TYPE_TRANSLATIONS[t] || t}
                </span>
              ))
              : (
                <span className="text-muted-foreground text-[10px] uppercase font-bold px-4 py-2 bg-secondary/30 rounded-xl border border-border flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500"><path d="M20 6L9 17l-5-5"/></svg>
                  Cobertura Defensiva Sólida
                </span>
              )}
          </div>
        </div>

        <div className="flex-1 space-y-3 w-full">
          <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 sparkle" />
            Muros Infranqueables (Resistencias)
          </h3>
          <div className="flex flex-wrap gap-2">
            {majorResistances.length > 0
              ? majorResistances.map(([t]) => (
                <span key={t} className="px-3 py-1.5 text-[9px] uppercase rounded-lg shadow-sm font-black"
                  style={{ backgroundColor: TYPE_COLORS[t], color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                  {TYPE_TRANSLATIONS[t] || t}
                </span>
              ))
              : (
                <span className="text-muted-foreground text-[10px] uppercase font-bold px-4 py-2 bg-secondary/30 rounded-xl border border-border">
                  Sin Resistencias Core
                </span>
              )}
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-6 py-4 bg-pokeball-red hover:bg-pokeball-dark text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_14px_rgba(220,38,38,0.3)] border border-pokeball-red/50 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 flex-shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>
          </svg>
          Abrir Matriz de Batalla
        </button>
      </div>

      {/* Portal: renderiza el modal directamente en document.body para escapar todos los stacking contexts */}
      {isModalOpen && mounted && createPortal(modal, document.body)}
    </>
  );
}

function TypeBadge({ factor, list, color }: { factor: string, list: string[], color: string }) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-border/40 pb-2 last:border-0">
      <div className="flex items-center justify-between">
        <span className={`text-[9px] font-black px-2 py-0.5 rounded ${color}`}>{factor}</span>
        <span className="text-[10px] font-black text-foreground uppercase">Pokémon</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {list.map(p => (
          <span key={p} className="text-[9px] font-bold text-foreground/70 dark:text-muted-foreground bg-secondary/60 dark:bg-secondary/40 px-2 py-0.5 rounded capitalize border border-border/60">
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}