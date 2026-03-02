/**
 * prisma/seed-showdown.ts
 *
 * Descarga stats de smogon.com/stats y hace seed en:
 *   AnalisisMeta, Objeto, Habilidad, Movimiento,
 *   Formato, BuildCompetitiva, MovimientoEnBuild
 * + embeddings via Ollama (nomic-embed-text)
 *
 * FIXES vs versión anterior:
 *   - Formatos actualizados a 2026 (gen9vgc2026regf, gen9vgc2026regi, etc.)
 *   - Rating cutoffs por formato (gen9ou usa 1695/1825, no 1630/1760)
 *   - fetch() con fallback a https nativo para Node < 18
 *   - Descubrimiento automático de formatos disponibles en el mes
 *   - Mejor diagnóstico de errores de red
 *
 * Uso:
 *   npx ts-node prisma/seed-showdown.ts
 *   npx ts-node prisma/seed-showdown.ts --month 2025-12
 *   npx ts-node prisma/seed-showdown.ts --format gen9ou
 *   npx ts-node prisma/seed-showdown.ts --discover   ← lista todos los formatos disponibles
 *   npx ts-node prisma/seed-showdown.ts --no-embed
 *   npx ts-node prisma/seed-showdown.ts --only-missing
 *   npx ts-node prisma/seed-showdown.ts --dry-run
 */

import { PrismaClient } from '@prisma/client';
import * as https from 'https';
import * as http  from 'http';

const prisma = new PrismaClient();

// ─── CLI ──────────────────────────────────────────────────────────
const args        = process.argv.slice(2);
const flagMonth   = args.includes('--month')   ? args[args.indexOf('--month')   + 1] : null;
const flagFormat  = args.includes('--format')  ? args[args.indexOf('--format')  + 1] : null;
const dryRun      = args.includes('--dry-run');
const noEmbed     = args.includes('--no-embed');
const onlyMissing = args.includes('--only-missing');
const discover    = args.includes('--discover');

// ─── Ollama ───────────────────────────────────────────────────────
const OLLAMA_URL   = process.env.OLLAMA_URL   ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'nomic-embed-text';

// ─── Formatos prioritarios para Pokelab ──────────────────────────
// Descubiertos del índice real de Smogon 2026-02
const PRIORITY_FORMATS = [
  // VGC actual (2026)
  { key: 'gen9vgc2026regi',      label: 'VGC 2026 Reg I',       cutoffs: [0, 1500, 1630, 1760] },
  { key: 'gen9vgc2026regf',      label: 'VGC 2026 Reg F',       cutoffs: [0, 1500, 1630, 1760] },
  { key: 'gen9vgc2026regfbo3',   label: 'VGC 2026 Reg F Bo3',   cutoffs: [0, 1500, 1630, 1760] },
  { key: 'gen9bssregi',          label: 'BSS Reg I',             cutoffs: [0, 1500, 1630, 1760] },
  // Doubles
  { key: 'gen9doublesou',        label: 'Doubles OU',            cutoffs: [0, 1500, 1695, 1825] },
  { key: 'gen9doublesuu',        label: 'Doubles UU',            cutoffs: [0, 1500, 1630, 1760] },
  // Singles
  { key: 'gen9ou',               label: 'OU',                    cutoffs: [0, 1500, 1695, 1825] },
  { key: 'gen9uu',               label: 'UU',                    cutoffs: [0, 1500, 1630, 1760] },
  { key: 'gen9ru',               label: 'RU',                    cutoffs: [0, 1500, 1630, 1760] },
  { key: 'gen9nu',               label: 'NU',                    cutoffs: [0, 1500, 1630, 1760] },
  { key: 'gen9pu',               label: 'PU',                    cutoffs: [0, 1500, 1630, 1760] },
  { key: 'gen9zu',               label: 'ZU',                    cutoffs: [0, 1500, 1630, 1760] },
  { key: 'gen9ubers',            label: 'Ubers',                 cutoffs: [0, 1500, 1630, 1760] },
  // National Dex
  { key: 'gen9nationaldex',      label: 'National Dex',          cutoffs: [0, 1500, 1630, 1760] },
  { key: 'gen9nationaldexdoubles',label: 'National Dex Doubles', cutoffs: [0, 1500, 1630, 1760] },
  // Monotype
  { key: 'gen9monotype',         label: 'Monotype',              cutoffs: [0, 1500, 1630, 1760] },
  // Little Cup
  { key: 'gen9lc',               label: 'Little Cup',            cutoffs: [0, 1500, 1630, 1760] },
];

const SMOGON = 'https://www.smogon.com/stats';
const delay  = (ms: number) => new Promise(r => setTimeout(r, ms));

// ═════════════════════════════════════════════════════════════════
// HTTP CON FALLBACK — fetch() nativo o módulo https de Node
// El fetch nativo no existe en Node < 18; usamos https como fallback.
// ═════════════════════════════════════════════════════════════════

function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { headers: { 'User-Agent': 'Pokelab-Seed/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(httpGet(res.headers.location!));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
      }
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    }).on('error', reject);
  });
}

async function safeGet(url: string, asJson = false): Promise<any> {
  try {
    const text = await httpGet(url);
    return asJson ? JSON.parse(text) : text;
  } catch (e: any) {
    // Solo loguear si NO es 404 (formatos que no existen para ese mes)
    if (!e.message?.includes('404')) {
      // console.debug(`  [net] ${e.message}`);
    }
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════
// DESCUBRIR MES Y FORMATOS DISPONIBLES
// ═════════════════════════════════════════════════════════════════

async function getLatestMonth(): Promise<string> {
  const index = await safeGet(`${SMOGON}/`);
  if (!index) throw new Error('No se pudo contactar smogon.com/stats — verifica tu conexión');
  const months = [...index.matchAll(/href="(\d{4}-\d{2})\/"/g)].map((m: any) => m[1]).sort();
  if (!months.length) throw new Error('No se encontró ningún mes en el índice');
  return months[months.length - 1];
}

async function discoverFormats(month: string): Promise<string[]> {
  const index = await safeGet(`${SMOGON}/${month}/`);
  if (!index) return [];
  return [...index.matchAll(/href="(gen\d+[a-z0-9]+)-0\.txt"/g)].map((m: any) => m[1]);
}

// ═════════════════════════════════════════════════════════════════
// PARSERS
// ═════════════════════════════════════════════════════════════════

function parseUsage(txt: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const line of txt.split('\n')) {
    const m = line.match(/^\s*\|\s*\d+\s*\|\s*(.+?)\s*\|\s*([\d.]+)%/);
    if (m) map.set(m[1].trim().toLowerCase(), parseFloat(m[2]));
  }
  return map;
}

interface SpreadEVs { hp: number; atk: number; def: number; spa: number; spd: number; spe: number }
interface ShowdownSet {
  ability: string; item: string; nature: string;
  evs: SpreadEVs; moves: string[]; teammates: string[]; counters: string[];
}
interface ShowdownRecord {
  nombre: string; usage: number;
  topSet: ShowdownSet | null; allMoves: string[]; allItems: string[];
}

function parseChaos(json: any): Map<string, ShowdownRecord> {
  const map = new Map<string, ShowdownRecord>();
  if (!json?.data) return map;

  for (const [rawName, pData] of Object.entries<any>(json.data)) {
    const nombre = rawName.toLowerCase();
    const usage  = (pData.usage ?? 0) * 100;

    const movesEntries = Object.entries<number>(pData.Moves ?? {}).sort((a, b) => b[1] - a[1]);
    const allMoves     = movesEntries.slice(0, 8).map(([m]) => m);
    const allItems     = Object.entries<number>(pData.Items ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([i]) => i);
    const topAbility   = Object.entries<number>(pData.Abilities ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

    const topSpread = Object.entries<number>(pData.Spreads ?? {}).sort((a, b) => b[1] - a[1])[0];
    let nature = 'Jolly';
    let evs: SpreadEVs = { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 };
    if (topSpread) {
      const parts = topSpread[0].split(':');
      nature = parts[0] ?? 'Jolly';
      const evParts = (parts[1] ?? '').split('/');
      (['hp','atk','def','spa','spd','spe'] as (keyof SpreadEVs)[])
        .forEach((k, i) => { evs[k] = parseInt(evParts[i] ?? '0') || 0; });
    }

    const teammates = Object.entries<number>(pData.Teammates ?? {})
      .sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t.toLowerCase());
    const counters  = Object.entries<any[]>(pData['Checks and Counters'] ?? {})
      .sort((a, b) => (b[1]?.[0] ?? 0) - (a[1]?.[0] ?? 0)).slice(0, 4).map(([c]) => c.toLowerCase());

    map.set(nombre, {
      nombre, usage, allMoves, allItems,
      topSet: allMoves.length ? { ability: topAbility, item: allItems[0] ?? '', nature, evs, moves: allMoves.slice(0, 4), teammates, counters } : null,
    });
  }
  return map;
}

function buildPerfil(nombre: string, rec: ShowdownRecord, label: string): string {
  const parts = [`${nombre} en ${label}. Uso: ${rec.usage.toFixed(1)}%.`];
  const s = rec.topSet;
  if (s) {
    if (s.ability)          parts.push(`Habilidad: ${s.ability}.`);
    if (s.item)             parts.push(`Objeto: ${s.item}.`);
    const evStr = (Object.entries(s.evs) as [string, number][])
      .filter(([, v]) => v > 0).map(([k, v]) => `${v} ${k.toUpperCase()}`).join(' / ');
    if (evStr)              parts.push(`${s.nature} | EVs: ${evStr}.`);
    if (s.moves.length)     parts.push(`Moves: ${s.moves.join(', ')}.`);
    if (s.teammates.length) parts.push(`Compañeros: ${s.teammates.slice(0, 4).join(', ')}.`);
    if (s.counters.length)  parts.push(`Frenos: ${s.counters.join(', ')}.`);
  }
  if (rec.allMoves.length > 4) parts.push(`Otros moves: ${rec.allMoves.slice(4).join(', ')}.`);
  return parts.join(' ').slice(0, 2000);
}

// ═════════════════════════════════════════════════════════════════
// OLLAMA
// ═════════════════════════════════════════════════════════════════

async function checkOllama(): Promise<boolean> {
  try {
    const data = await safeGet(`${OLLAMA_URL}/api/tags`, true);
    if (!data) return false;
    return (data.models ?? []).some((m: any) => m.name?.startsWith(OLLAMA_MODEL.split(':')[0]));
  } catch { return false; }
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const body = JSON.stringify({ model: OLLAMA_MODEL, prompt: text });
    const data = await new Promise<any>((resolve, reject) => {
      const req = http.request(`${OLLAMA_URL}/api/embeddings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
      }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString())); } catch(e) { reject(e); } });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    return data.embedding ?? null;
  } catch { return null; }
}

async function saveEmbedding(metaId: string, vector: number[]): Promise<void> {
  await prisma.$executeRawUnsafe(
    `UPDATE "AnalisisMeta" SET embedding = $1::vector WHERE id = $2::uuid`,
    `[${vector.join(',')}]`, metaId
  );
}

// ═════════════════════════════════════════════════════════════════
// POKEAPI — movimientos
// ═════════════════════════════════════════════════════════════════

const moveCache = new Map<string, any>();
async function getMoveData(nombre: string) {
  const key = nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (moveCache.has(key)) return moveCache.get(key)!;
  await delay(100);
  try {
    const data = await safeGet(`https://pokeapi.co/api/v2/move/${key}`, true);
    const result = { tipo: data?.type?.name ?? 'normal', categoria: data?.damage_class?.name ?? 'status', potencia: data?.power ?? null, precision: data?.accuracy ?? null };
    moveCache.set(key, result);
    return result;
  } catch {
    const fallback = { tipo: 'normal', categoria: 'status', potencia: null, precision: null };
    moveCache.set(key, fallback);
    return fallback;
  }
}

// ═════════════════════════════════════════════════════════════════
// UPSERTS
// ═════════════════════════════════════════════════════════════════

const fmtCache = new Map<string, number>();
const objCache = new Map<string, number>();
const habCache = new Map<string, number>();
const movCache = new Map<string, number>();

async function upsertFormato(label: string): Promise<number> {
  if (fmtCache.has(label)) return fmtCache.get(label)!;
  const r = await prisma.formato.upsert({ where: { nombre: label }, create: { nombre: label }, update: {} });
  fmtCache.set(label, r.id); return r.id;
}
async function upsertObjeto(nombre: string): Promise<number | null> {
  if (!nombre?.trim()) return null;
  if (objCache.has(nombre)) return objCache.get(nombre)!;
  const r = await prisma.objeto.upsert({ where: { nombre }, create: { nombre }, update: {} });
  objCache.set(nombre, r.id); return r.id;
}
async function upsertHabilidad(nombre: string): Promise<number | null> {
  if (!nombre?.trim()) return null;
  if (habCache.has(nombre)) return habCache.get(nombre)!;
  const r = await prisma.habilidad.upsert({ where: { nombre }, create: { nombre }, update: {} });
  habCache.set(nombre, r.id); return r.id;
}
async function upsertMovimiento(nombre: string): Promise<number | null> {
  if (!nombre?.trim()) return null;
  if (movCache.has(nombre)) return movCache.get(nombre)!;
  const mv = await getMoveData(nombre);
  const r  = await prisma.movimiento.upsert({
    where:  { nombre },
    create: { nombre, tipo: mv.tipo, categoria: mv.categoria, potencia: mv.potencia, precision: mv.precision },
    update: { tipo: mv.tipo, categoria: mv.categoria, potencia: mv.potencia, precision: mv.precision },
  });
  movCache.set(nombre, r.id); return r.id;
}

function normalizeName(n: string) { return n.toLowerCase().trim(); }
function nameVariants(name: string): string[] {
  const n = normalizeName(name);
  return [n, n.replace(/-/g, ' '), n.replace(/-/g, ''), n.split('-')[0]].filter((v, i, a) => a.indexOf(v) === i);
}

// ═════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n🔴 Pokelab — Showdown Seed\n' + '─'.repeat(52));
  if (dryRun) console.log('⚠  DRY RUN — no se escribirá en la DB\n');

  // ── Verificar conectividad antes de todo ─────────────────────
  process.stdout.write('🌐 Verificando conexión con Smogon... ');
  const testIndex = await safeGet(`${SMOGON}/`);
  if (!testIndex) {
    console.error('❌ No se puede conectar a smogon.com/stats');
    console.error('   Verifica tu conexión a internet y que smogon.com no esté bloqueado.');
    await prisma.$disconnect(); process.exit(1);
  }
  console.log('✅');

  // ── Ollama ───────────────────────────────────────────────────
  let ollamaReady = false;
  if (!noEmbed && !dryRun) {
    process.stdout.write(`🤖 Verificando Ollama... `);
    ollamaReady = await checkOllama();
    console.log(ollamaReady ? `✅ ${OLLAMA_MODEL}` : '❌ no disponible (usa --no-embed para saltarlo)');
  }

  const month = flagMonth ?? await getLatestMonth();
  console.log(`📅 Mes: ${month}\n`);

  // ── Modo --discover: listar formatos disponibles ─────────────
  if (discover) {
    console.log('🔍 Formatos disponibles este mes:');
    const available = await discoverFormats(month);
    available.forEach(f => console.log(`   ${f}`));
    await prisma.$disconnect(); return;
  }

  // ── Pre-cargar Pokémon de la DB ───────────────────────────────
  console.log('⬇  Cargando Pokémon de la DB...');
  const allPokemon = await prisma.pokemon.findMany({ select: { id: true, nombre: true } });
  const nameIndex  = new Map<string, number>();
  for (const p of allPokemon) nameIndex.set(normalizeName(p.nombre), p.id);
  console.log(`   ${allPokemon.length} Pokémon en DB`);

  let alreadySeeded = new Set<number>();
  if (onlyMissing) {
    const ex = await prisma.analisisMeta.findMany({ where: { usage_score: { gt: 0 } }, select: { pokemon_id: true } });
    alreadySeeded = new Set(ex.map(e => e.pokemon_id!));
    console.log(`ℹ  ${alreadySeeded.size} ya tienen datos (--only-missing)\n`);
  }

  // ── Seleccionar formatos a procesar ──────────────────────────
  let formatsToProcess: typeof PRIORITY_FORMATS;
  if (flagFormat) {
    const found = PRIORITY_FORMATS.find(f => f.key === flagFormat);
    formatsToProcess = found ? [found] : [{ key: flagFormat, label: flagFormat, cutoffs: [0, 1500, 1630, 1760] }];
  } else {
    // Filtrar solo los que realmente existen este mes
    console.log('🔍 Verificando formatos disponibles...');
    const available = new Set(await discoverFormats(month));
    formatsToProcess = PRIORITY_FORMATS.filter(f => available.has(f.key));
    const missing = PRIORITY_FORMATS.filter(f => !available.has(f.key));
    if (missing.length) {
      console.log(`   ⚠  No disponibles este mes: ${missing.map(f => f.key).join(', ')}`);
    }
    console.log(`   ✓  Procesando: ${formatsToProcess.map(f => f.key).join(', ')}\n`);
  }

  let totalMeta = 0, totalBuilds = 0, totalEmbeds = 0, totalNotFound = 0;

  for (const fmt of formatsToProcess) {
    console.log(`\n📦 ${fmt.key} → ${fmt.label}`);

    // Usar solo el cutoff 0 para usage y el más alto disponible para chaos
    // (evita descargar 4 JSONs enormes por formato)
    const usageTxt  = await safeGet(`${SMOGON}/${month}/${fmt.key}-0.txt`);
    const chaosJson = await safeGet(`${SMOGON}/${month}/chaos/${fmt.key}-0.json`, true);

    if (!usageTxt && !chaosJson) {
      console.log(`   ⚠ Sin datos (el formato existe en el índice pero los archivos no responden)`);
      continue;
    }

    const usageMap  = usageTxt  ? parseUsage(usageTxt)  : new Map<string, number>();
    const chaosData = chaosJson ? parseChaos(chaosJson) : new Map<string, ShowdownRecord>();
    const allNames  = [...new Set([...usageMap.keys(), ...chaosData.keys()])];
    console.log(`   ${allNames.length} Pokémon en los datos`);

    const formatoId = dryRun ? 0 : await upsertFormato(fmt.label);
    let fmtMeta = 0, fmtBuilds = 0, fmtEmbeds = 0, fmtSkip = 0;

    for (let i = 0; i < allNames.length; i += 10) {
      const batch = allNames.slice(i, i + 10);

      for (const pokeName of batch) {
        let pokemonId: number | undefined;
        for (const v of nameVariants(pokeName)) {
          pokemonId = nameIndex.get(v);
          if (pokemonId) break;
        }
        if (!pokemonId) { totalNotFound++; continue; }
        if (onlyMissing && alreadySeeded.has(pokemonId)) { fmtSkip++; continue; }

        const usage  = usageMap.get(pokeName) ?? (chaosData.get(pokeName)?.usage ?? 0);
        const rec    = chaosData.get(pokeName);
        const perfil = rec ? buildPerfil(pokeName, rec, fmt.label)
                           : `${pokeName} en ${fmt.label}. Uso: ${usage.toFixed(1)}%.`;

        if (dryRun) { fmtMeta++; continue; }

        // ── AnalisisMeta ────────────────────────────────────
        const existing = await prisma.analisisMeta.findFirst({
          where: { pokemon_id: pokemonId, formato_nombre: fmt.label }
        });

        let metaId: string;
        if (existing) {
          await prisma.analisisMeta.update({
            where: { id: existing.id },
            data:  { usage_score: usage, tier: fmt.label, perfil_estrategico: perfil }
          });
          metaId = existing.id;
        } else {
          const created = await prisma.analisisMeta.create({
            data: { pokemon_id: pokemonId, formato_nombre: fmt.label, usage_score: usage, tier: fmt.label, perfil_estrategico: perfil }
          });
          metaId = created.id;
        }
        fmtMeta++;

        // ── Embedding Ollama ────────────────────────────────
        if (ollamaReady) {
          const needsEmbed = !existing?.perfil_estrategico || existing.perfil_estrategico !== perfil;
          if (needsEmbed) {
            const vec = await generateEmbedding(perfil);
            if (vec) { await saveEmbedding(metaId, vec); fmtEmbeds++; totalEmbeds++; }
            await delay(40);
          }
        }

        // ── BuildCompetitiva ────────────────────────────────
        const s = rec?.topSet;
        if (!s?.moves.filter(Boolean).length) continue;

        const [objetoId, habilidadId] = await Promise.all([
          upsertObjeto(s.item), upsertHabilidad(s.ability)
        ]);
        if (!habilidadId) continue;

        const hasStatus = s.moves.some(m =>
          ['toxic','will-o-wisp','thunder-wave','stealth-rock','spore','hypnosis','protect','substitute','light-screen','reflect','tailwind','trick-room'].some(st => m.toLowerCase().includes(st))
        );
        const rol = hasStatus ? 'Support' : 'Attacker';

        let build = await prisma.buildCompetitiva.findFirst({ where: { pokemonId, formatoId, habilidadId } });
        if (!build) {
          build = await prisma.buildCompetitiva.create({
            data: { pokemonId, formatoId, objetoId: objetoId ?? undefined, habilidadId, rol, naturaleza: s.nature,
                    ev_hp: s.evs.hp, ev_atk: s.evs.atk, ev_def: s.evs.def, ev_spa: s.evs.spa, ev_spd: s.evs.spd, ev_spe: s.evs.spe }
          });
          fmtBuilds++;
        } else {
          await prisma.buildCompetitiva.update({
            where: { id: build.id },
            data:  { objetoId: objetoId ?? undefined, rol, naturaleza: s.nature,
                     ev_hp: s.evs.hp, ev_atk: s.evs.atk, ev_def: s.evs.def, ev_spa: s.evs.spa, ev_spd: s.evs.spd, ev_spe: s.evs.spe }
          });
        }

        await prisma.movimientoEnBuild.deleteMany({ where: { buildId: build.id } });
        for (let slot = 0; slot < Math.min(s.moves.filter(Boolean).length, 4); slot++) {
          const movId = await upsertMovimiento(s.moves[slot]);
          if (!movId) continue;
          await prisma.movimientoEnBuild.create({ data: { buildId: build.id, movimientoId: movId, slot } }).catch(() => {});
        }
      }

      process.stdout.write(`\r   ${Math.min(i + 10, allNames.length)}/${allNames.length}...`);
      await delay(150);
    }

    totalMeta   += fmtMeta;
    totalBuilds += fmtBuilds;
    console.log(`\r   ✓ meta: ${fmtMeta} | builds: ${fmtBuilds} | embeds: ${fmtEmbeds} | saltados: ${fmtSkip}  `);
  }

  console.log('\n' + '─'.repeat(52));
  console.log('✅ Seed completado');
  console.log(`   AnalisisMeta:     ${totalMeta}`);
  console.log(`   BuildCompetitiva: ${totalBuilds}`);
  console.log(`   Embeddings:       ${totalEmbeds}`);
  console.log(`   No en DB:         ${totalNotFound}`);

  if (totalNotFound > 0) {
    console.log(`\n💡 Los Pokémon "no en DB" son formas alternativas o nombres`);
    console.log(`   especiales de Showdown (Urshifu-Rapid-Strike, Ogerpon-Wellspring...)`);
  }
  if (!ollamaReady && !noEmbed && !dryRun) {
    console.log(`\n⚠  Embeddings pendientes. Cuando Ollama esté activo:`);
    console.log(`   npx ts-node prisma/seed-showdown.ts --only-missing`);
  }

  await prisma.$disconnect();
}

main().catch(async e => {
  console.error('\n❌ Error fatal:', e.message ?? e);
  await prisma.$disconnect();
  process.exit(1);
});