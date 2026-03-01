'use client';
import React from 'react';

interface CategoryData {
  score: number;
  label: string;
  desc: string;
}

interface ReviewData {
  score: number;
  grade: string;
  categories: Record<string, CategoryData>;
  analysis: string;
  weakPoints: string[];
  suggestions: string[];
  pokemonRatings: Record<string, { score: number; comment: string }>;
  metaVerdict: string;
}

// Color según score /100
function scoreColor(s: number): string {
  if (s >= 85) return '#22c55e';
  if (s >= 70) return '#84cc16';
  if (s >= 55) return '#eab308';
  if (s >= 40) return '#f97316';
  return '#ef4444';
}

function gradeColor(g: string): string {
  if (g.startsWith('A')) return '#22c55e';
  if (g.startsWith('B')) return '#84cc16';
  if (g.startsWith('C')) return '#eab308';
  if (g.startsWith('D')) return '#f97316';
  return '#ef4444';
}

// Arco SVG circular
function CircleScore({ score, size = 90 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = scoreColor(score);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      {/* Fill */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}
        strokeDashoffset={circ / 4}
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
      {/* Score text */}
      <text x={size / 2} y={size / 2 - 4} textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="900" fill={color} fontFamily="monospace">{score}</text>
      <text x={size / 2} y={size / 2 + 12} textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="700" fill="rgba(255,255,255,0.35)" fontFamily="monospace">/100</text>
    </svg>
  );
}

// Barra horizontal con animación
function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-2 bg-white/5 rounded-full overflow-hidden w-full">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${score}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}60` }}
      />
    </div>
  );
}

export default function ReviewResult({ data }: { data: ReviewData }) {
  if (!data) return null;

  const categories = Object.entries(data.categories || {});
  const pokemonRatings = Object.entries(data.pokemonRatings || {});

  return (
    <div className="space-y-8">

      {/* ── SCORE PRINCIPAL ── */}
      <div className="flex flex-col sm:flex-row items-center gap-6 bg-secondary/20 rounded-2xl p-6 border border-border">
        {/* Círculo grande */}
        <div className="relative flex-shrink-0">
          <CircleScore score={data.score ?? 0} size={120} />
        </div>

        <div className="flex-1 text-center sm:text-left">
          {/* Grade badge */}
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
            <span
              className="text-5xl font-black font-mono leading-none"
              style={{ color: gradeColor(data.grade ?? 'C'), textShadow: `0 0 30px ${gradeColor(data.grade ?? 'C')}60` }}
            >
              {data.grade ?? '?'}
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Calificación Final</p>
              <p className="text-sm font-bold text-foreground">{data.score ?? 0}/100 puntos</p>
            </div>
          </div>

          {/* Meta verdict */}
          {data.metaVerdict && (
            <div className="inline-flex items-center gap-2 mt-1 px-4 py-2 rounded-xl bg-pokeball-red/10 border border-pokeball-red/20">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-pokeball-red flex-shrink-0">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <p className="text-xs font-bold italic text-pokeball-red">{data.metaVerdict}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── CATEGORÍAS /100 ── */}
      {categories.length > 0 && (
        <div>
          <h3 className="text-[10px] font-black text-pokeball-red uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pokeball-red" />
            Desglose por Categoría
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map(([key, cat]) => {
              const color = scoreColor(cat.score);
              return (
                <div key={key} className="bg-secondary/20 rounded-xl p-4 border border-border/50 hover:border-border transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wider text-foreground truncate">{cat.label}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{cat.desc}</p>
                    </div>
                    <span className="text-xl font-black font-mono ml-3 flex-shrink-0" style={{ color }}>{cat.score}</span>
                  </div>
                  <ScoreBar score={cat.score} color={color} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ANÁLISIS ── */}
      {data.analysis && (
        <div className="bg-pokeball-red/5 rounded-xl border border-pokeball-red/15 p-5">
          <h3 className="text-[10px] font-black text-pokeball-red uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pokeball-red" />
            Análisis Táctico
          </h3>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            {data.analysis.split('\n\n').map((p, i) => (
              <p key={i}>{p.split('**').map((t, j) => j % 2 === 1 ? <strong key={j} className="text-foreground font-black">{t}</strong> : t)}</p>
            ))}
          </div>
        </div>
      )}

      {/* ── DEBILIDADES + SUGERENCIAS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.weakPoints?.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-pokeball-red uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pokeball-red" />
              Puntos Débiles
            </h3>
            <ul className="space-y-2">
              {data.weakPoints.map((w, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground bg-pokeball-red/5 rounded-lg px-4 py-3 border border-pokeball-red/10">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-pokeball-red flex-shrink-0 mt-0.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.suggestions?.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Sugerencias
            </h3>
            <ul className="space-y-2">
              {data.suggestions.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground bg-emerald-500/5 rounded-lg px-4 py-3 border border-emerald-500/10">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-400 flex-shrink-0 mt-0.5"><path d="m5 12 5 5L20 7"/></svg>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── RATINGS POR POKÉMON ── */}
      {pokemonRatings.length > 0 && (
        <div>
          <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Evaluación Individual
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {pokemonRatings.map(([name, rating]) => {
              const color = scoreColor(rating.score);
              return (
                <div key={name} className="bg-secondary/20 rounded-xl p-4 border border-border/50 hover:border-border transition-all relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <CircleScore score={rating.score} size={56} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black uppercase italic text-foreground truncate leading-tight">{name.replace(/-/g, ' ')}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{rating.comment}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}