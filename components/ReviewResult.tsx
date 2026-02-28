'use client';
import React, { useState } from 'react';

interface ReviewResult {
  data: any;
}

export default function ReviewResult({ data }: ReviewResult) {
  const [expandedPokemon, setExpandedPokemon] = useState<number | null>(null);

  if (!data) return null;

  // La API puede devolver el resultado en distintos formatos — manejamos ambos
  const report = data.report || data;
  const overallScore = report.overallScore ?? report.puntuacion ?? null;
  const summary = report.summary || report.resumen || report.analisis || '';
  const pokemonAnalysis: any[] = report.pokemonAnalysis || report.pokemon || report.analisis_pokemon || [];
  const synergies: string[] = report.synergies || report.sinergias || [];
  const weaknesses: string[] = report.weaknesses || report.debilidades || [];
  const suggestions: string[] = report.suggestions || report.sugerencias || [];
  const rawText = typeof data === 'string' ? data : (data.rawText || data.text || null);

  // Si la respuesta es texto libre (sin estructura)
  if (rawText && !summary && pokemonAnalysis.length === 0) {
    return (
      <div className="prose prose-sm max-w-none">
        <div className="bg-secondary/30 border border-border rounded-xl p-6 text-sm text-foreground leading-relaxed whitespace-pre-wrap font-mono">
          {rawText}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Score global */}
      {overallScore !== null && overallScore !== undefined && (
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary/40" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                strokeWidth="2.5" strokeLinecap="round"
                stroke={overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#ef4444'}
                strokeDasharray={`${overallScore} 100`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-foreground leading-none">{overallScore}</span>
              <span className="text-[8px] text-muted-foreground font-bold uppercase">/100</span>
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Puntuación Global</p>
            <p className={`text-xl font-black uppercase italic ${overallScore >= 80 ? 'text-emerald-500' : overallScore >= 60 ? 'text-amber-500' : 'text-pokeball-red'}`}>
              {overallScore >= 80 ? 'Equipo Sólido' : overallScore >= 60 ? 'Equipo Competente' : 'Necesita Mejoras'}
            </p>
          </div>
        </div>
      )}

      {/* Resumen */}
      {summary && (
        <div>
          <h3 className="text-[9px] font-black text-pokeball-red uppercase tracking-widest mb-3 flex items-center gap-2">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Análisis General
          </h3>
          <div className="bg-secondary/30 border border-border rounded-xl p-5 text-sm text-foreground leading-relaxed">
            {summary}
          </div>
        </div>
      )}

      {/* Análisis por Pokémon */}
      {pokemonAnalysis.length > 0 && (
        <div>
          <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Análisis Individual
          </h3>
          <div className="space-y-2">
            {pokemonAnalysis.map((p: any, i: number) => {
              const name = p.name || p.nombre || `Pokémon ${i + 1}`;
              const role = p.role || p.rol || '';
              const score = p.score ?? p.puntuacion ?? null;
              const notes = p.notes || p.notas || p.analysis || p.analisis || '';
              const isOpen = expandedPokemon === i;

              return (
                <div key={i} className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedPokemon(isOpen ? null : i)}
                    className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-pokeball-red/10 flex items-center justify-center text-[9px] text-pokeball-red font-black flex-shrink-0">{i + 1}</span>
                      <div className="text-left">
                        <span className="text-[11px] font-black uppercase text-foreground">{name.replace(/-/g, ' ')}</span>
                        {role && <span className="ml-2 text-[9px] font-bold text-muted-foreground">· {role}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {score !== null && (
                        <span className={`text-xs font-black tabular-nums ${score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-pokeball-red'}`}>
                          {score}/100
                        </span>
                      )}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                        className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </button>
                  {isOpen && notes && (
                    <div className="px-5 pb-4 pt-1 border-t border-border/60 bg-secondary/10">
                      <p className="text-xs text-foreground leading-relaxed">{notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sinergias + Debilidades en grid */}
      {(synergies.length > 0 || weaknesses.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {synergies.length > 0 && (
            <div>
              <h3 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                Sinergias
              </h3>
              <ul className="space-y-2">
                {synergies.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {weaknesses.length > 0 && (
            <div>
              <h3 className="text-[9px] font-black text-pokeball-red uppercase tracking-widest mb-3 flex items-center gap-2">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/></svg>
                Debilidades
              </h3>
              <ul className="space-y-2">
                {weaknesses.map((w: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-pokeball-red mt-1.5 flex-shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Sugerencias */}
      {suggestions.length > 0 && (
        <div>
          <h3 className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            Sugerencias de Mejora
          </h3>
          <ul className="space-y-2">
            {suggestions.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-3 bg-sky-500/5 border border-sky-500/20 rounded-xl px-4 py-3">
                <span className="w-5 h-5 rounded-full bg-sky-500/15 flex items-center justify-center text-[8px] text-sky-500 dark:text-sky-400 font-black flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-xs text-foreground leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fallback: si la API devuelve algo inesperado, mostrar todo en raw */}
      {!summary && pokemonAnalysis.length === 0 && synergies.length === 0 && weaknesses.length === 0 && suggestions.length === 0 && (
        <div className="bg-secondary/30 border border-border rounded-xl p-6">
          <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

    </div>
  );
}