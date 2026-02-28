'use client';
import React from 'react';

interface ReviewResultData {
  score: number;
  categories: {
    sinergia: number;
    cobertura: number;
    speedControl: number;
    matchupSpread: number;
    consistencia: number;
  };
  analysis: string;
  weakPoints: string[];
  suggestions: string[];
  pokemonRatings: Record<string, { score: number; comment: string }>;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  sinergia: { label: 'Sinergia', color: 'text-violet-400' },
  cobertura: { label: 'Cobertura', color: 'text-sky-400' },
  speedControl: { label: 'Speed Control', color: 'text-amber-400' },
  matchupSpread: { label: 'Matchup Spread', color: 'text-emerald-400' },
  consistencia: { label: 'Consistencia', color: 'text-pokeball-red' },
};

function getScoreColor(score: number) {
  if (score >= 8) return 'text-emerald-400';
  if (score >= 6) return 'text-amber-400';
  if (score >= 4) return 'text-orange-400';
  return 'text-pokeball-red';
}

function getScoreBg(score: number) {
  if (score >= 8) return 'bg-emerald-500/10 border-emerald-500/30';
  if (score >= 6) return 'bg-amber-500/10 border-amber-500/30';
  if (score >= 4) return 'bg-orange-500/10 border-orange-500/30';
  return 'bg-pokeball-red/10 border-pokeball-red/30';
}

export default function ReviewResult({ data }: { data: ReviewResultData }) {
  if (!data) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8">
      {/* Main Score */}
      <div className="flex flex-col items-center gap-4 py-6">
        <div className={`w-28 h-28 rounded-full border-4 ${getScoreBg(data.score)} flex items-center justify-center relative`}>
          <span className={`text-4xl font-black ${getScoreColor(data.score)}`}>{data.score}</span>
          <span className="absolute bottom-2 text-[8px] font-black text-muted-foreground uppercase tracking-widest">/10</span>
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Evaluacion General</p>
      </div>

      {/* Category Bars */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {Object.entries(data.categories || {}).map(([key, value]) => {
          const cat = CATEGORY_LABELS[key];
          if (!cat) return null;
          return (
            <div key={key} className="bg-secondary/30 rounded-xl p-4 border border-border flex flex-col items-center gap-2">
              <span className={`text-2xl font-black ${getScoreColor(value)}`}>{value}</span>
              <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${value >= 8 ? 'bg-emerald-500' : value >= 6 ? 'bg-amber-500' : value >= 4 ? 'bg-orange-500' : 'bg-pokeball-red'}`}
                  style={{ width: `${(value / 10) * 100}%` }}
                />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest ${cat.color}`}>{cat.label}</span>
            </div>
          );
        })}
      </div>

      {/* Analysis */}
      <div className="bg-pokeball-red/5 p-6 rounded-xl border border-pokeball-red/15">
        <h3 className="text-[9px] font-black text-pokeball-red uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pokeball-red" />
          Analisis Detallado
        </h3>
        <div className="text-muted-foreground text-sm leading-relaxed">
          {(data.analysis || '').split('\n\n').map((paragraph: string, pIdx: number) => (
            <p key={pIdx} className="mb-4 last:mb-0">
              {paragraph.split('**').map((text: string, i: number) =>
                i % 2 === 1 ? <span key={i} className="font-black text-foreground">{text}</span> : text
              )}
            </p>
          ))}
        </div>
      </div>

      {/* Weaknesses + Suggestions side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-[9px] font-black text-pokeball-red uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pokeball-red" />
            Puntos Debiles
          </h3>
          <ul className="space-y-2.5">
            {(data.weakPoints || []).map((point, i) => (
              <li key={i} className="text-muted-foreground text-sm flex gap-3">
                <span className="text-pokeball-red mt-0.5 flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <h3 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Sugerencias de Mejora
          </h3>
          <ul className="space-y-2.5">
            {(data.suggestions || []).map((suggestion, i) => (
              <li key={i} className="text-muted-foreground text-sm flex gap-3">
                <span className="text-emerald-400 mt-0.5 flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                </span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Individual Pokemon Ratings */}
      {data.pokemonRatings && Object.keys(data.pokemonRatings).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Evaluacion Individual
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(data.pokemonRatings).map(([name, rating]) => (
              <div key={name} className="bg-secondary/30 p-4 rounded-xl border border-border hover:border-pokeball-red/20 transition-colors relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500/40 to-transparent" />
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-black text-foreground uppercase italic text-xs">{name}</h4>
                  <span className={`text-lg font-black ${getScoreColor(rating.score)}`}>{rating.score}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{rating.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
