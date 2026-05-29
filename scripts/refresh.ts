/// <reference types="node" />

/**
 * Refresh script for `src/data/kallprat.json`.
 *
 * Two-pass pipeline per dynamic category:
 *   1. DISCOVERY  – LLM + hosted web search returns a wide list of *distinct*
 *      trending topics across multiple sub-areas (so we don't end up with 10
 *      starters all about the same headline).
 *   2. WRITING    – LLM (no web tool) rewrites each picked topic into ONE
 *      casual conversation starter aimed at 20–35-year-olds, plus follow-ups.
 *
 * A programmatic Jaccard de-dup pass drops near-duplicates before writing.
 *
 * Run locally:
 *   $env:OPENAI_API_KEY="sk-..."; npm run refresh
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, '..', 'src', 'data', 'kallprat.json');

const DYNAMIC_CATEGORIES = ['nyheter', 'sport', 'teknik'] as const;
type DynamicCategory = (typeof DYNAMIC_CATEGORIES)[number];

const ID_PREFIX: Record<DynamicCategory, string> = {
  nyheter: 'n',
  sport: 's',
  teknik: 't',
};

const ENTRIES_PER_CATEGORY = 15;
// Ask for more topics than we need so we have headroom after de-dup / filtering.
const TOPIC_OVERSHOOT = 8;
const MODEL = process.env.KALLPRAT_MODEL ?? 'gpt-4o-mini';

// ---------- Types & schemas ----------

interface Category {
  id: string;
  name: string;
  emoji: string;
}

interface Kallprat {
  id: string;
  category: string;
  text: string;
  followUp?: string[];
}

interface KallpratFile {
  categories: Category[];
  kallprat: Kallprat[];
}

const topicSchema = z.object({
  topic_key: z.string().min(2).max(60),
  sub_area: z.string().min(2).max(40),
  summary: z.string().min(10).max(280),
});
const discoverySchema = z.object({
  topics: z
    .array(topicSchema)
    .min(ENTRIES_PER_CATEGORY)
    .max(ENTRIES_PER_CATEGORY + TOPIC_OVERSHOOT + 5),
});
type DiscoveryResponse = z.infer<typeof discoverySchema>;
type Topic = z.infer<typeof topicSchema>;

const starterSchema = z.object({
  topic_key: z.string().min(2).max(60),
  text: z.string().min(8).max(240),
  followUp: z.array(z.string().min(3).max(160)).min(2).max(3),
});
const writingSchema = z.object({
  entries: z.array(starterSchema).min(1).max(ENTRIES_PER_CATEGORY + TOPIC_OVERSHOOT + 5),
});
type WritingResponse = z.infer<typeof writingSchema>;

// ---------- Category framing ----------

// Sub-areas force the discovery pass to spread across genuinely different
// angles instead of clustering on the one mega-story of the week.
const SUB_AREAS: Record<DynamicCategory, string[]> = {
  nyheter: [
    'popkultur & kändisar',
    'viralt på TikTok / sociala medier',
    'livsstil & trender bland unga vuxna',
    'musik, film, serier & streaming',
    'mat, dryck, restauranger',
    'resor & städer',
    'miljö & klimat på vardagsnivå',
    'ekonomi som faktiskt påverkar 20–35-åringar (bostad, ränta, lön)',
    'kultur & evenemang i Sverige',
    'kuriosa & weird news',
  ],
  sport: [
    'fotboll (allsvenskan, landslag, utländska ligor)',
    'ishockey (SHL, NHL, landslag)',
    'innebandy / handboll / basket',
    'individuell sport (friidrott, simning, tennis, golf)',
    'motorsport (F1, rally)',
    'vintersport',
    'e-sport & gaming-turneringar',
    'udda eller roliga sporthändelser',
    'svenska idrottare i utlandet',
    'kommande matcher / evenemang man kan kolla på',
  ],
  teknik: [
    'AI i vardagen (nya appar, funktioner, ChatGPT-grejer)',
    'mobiler & gadgets',
    'gaming & nya spelsläpp',
    'streaming-tjänster & nya features',
    'sociala medier-plattformar & trender',
    'självkörande bilar / EV / mobilitet',
    'rymd & SpaceX-aktigt',
    'cybersäkerhet / dataläckor som påverkar vanligt folk',
    'wearables, smart home, prylar',
    'tech-företag i nyheterna (Apple, Google, Meta, OpenAI, svenska startups)',
  ],
};

const CATEGORY_LABEL: Record<DynamicCategory, string> = {
  nyheter: 'nyheter / aktuellt / det folk pratar om',
  sport: 'sport & idrott',
  teknik: 'teknik, AI, gaming och prylar',
};

// ---------- Prompts ----------

const TONE_SPEC = [
  'TON & STIL (viktigt):',
  '- Målgrupp: 20–35 år. Det här ska låta som något man säger till en kompis på AW, fika eller i lunchrummet.',
  '- Avslappnad, vardaglig svenska. Du-tilltal. Lite humor/personlighet är välkommet.',
  '- Förbjudna fraser: "Visste du att…", "Har du hört att…", "Det ryktas om att…", "Vad tycker du om…",',
  '  "Hur påverkar detta…", "Vilka konsekvenser…". Inga byråkratiska eller nyhetsuppläsar-formuleringar.',
  '- Skriv hellre som: "Såg du att…", "Va, har du fattat att…", "Hörde du grejen med…",',
  '  "Jag fastnade på en clip där…", "Kollade du på…?", "Hur sjukt är det inte att…",',
  '  eller bara en rak observation: "X är helt galet just nu." Variera öppningarna — undvik att två starter börjar likadant.',
  '- Får gärna referera till streaming, TikTok, memes, popkultur, vardagsgrejer.',
  '- Inga emojis i texten. Inga hashtags. Inga länkar. Inga källhänvisningar.',
  '- Undvik politiskt laddade vinklingar, pågående krig/tragedier/dödsfall/brott — det är inte trevligt småprat.',
  '- Nämn inte privatpersoner. Offentliga personer (artister, idrottare, kändisar, politiker) får nämnas',
  '  om de är centrala i en aktuell händelse.',
].join('\n');

function buildDiscoveryPrompt(category: DynamicCategory): string {
  const subAreas = SUB_AREAS[category].map((s) => `  • ${s}`).join('\n');
  const need = ENTRIES_PER_CATEGORY + TOPIC_OVERSHOOT;
  return [
    `Du är en redaktör som scoutar färska, snackvänliga ämnen inom kategorin "${CATEGORY_LABEL[category]}" för en svensk app.`,
    '',
    'Använd webbsökning AKTIVT. Gör flera sökningar med olika vinklar för att hitta ett brett urval.',
    'Fokusera på det som hänt eller trendar de senaste ~7 dagarna. Sverige primärt, men internationellt är OK.',
    '',
    `Returnera ${need} st DISTINKTA ämnen. Sprid dem över följande sub-områden (minst 5 olika sub-områden representerade):`,
    subAreas,
    '',
    'Hårda regler:',
    '- Inga två ämnen får handla om samma händelse, person eller story. Tänk: skulle en läsare säga "det här har du ju redan sagt"? Då är det dubblett.',
    '- Undvik politiskt heta konflikter, krig, dödsfall, brott, tragedier.',
    '- Undvik ämnen som kräver djup förkunskap. Ska funka som småprat.',
    '- Inga privatpersoner. Offentliga personer OK om de är centrala.',
    '',
    'Fält per ämne:',
    '- topic_key: kort unik identifierare i kebab-case, t.ex. "taylor-swift-ny-singel".',
    '- sub_area: vilket sub-område från listan ovan ämnet hör till.',
    '- summary: 1–2 meningar som beskriver vad som faktiskt hänt/trendar (fakta, neutralt språk här — tonen kommer i nästa steg).',
    '',
    'Returnera ENDAST JSON enligt schemat.',
  ].join('\n');
}

function buildWritingPrompt(category: DynamicCategory, topics: Topic[]): string {
  const topicList = topics
    .map((t, i) => `${i + 1}. [${t.topic_key}] (${t.sub_area}) — ${t.summary}`)
    .join('\n');
  return [
    `Du skriver casual samtalsstartare ("kallprat") för kategorin "${CATEGORY_LABEL[category]}".`,
    '',
    TONE_SPEC,
    '',
    'FORMAT per starter:',
    '- text: 1–2 meningar. En öppen observation eller fråga som bjuder in till snack. Ska kunna kastas ut helt utan kontext.',
    '- followUp: 2 följdfrågor som faktiskt funkar i ett samtal (inte "vad tycker du om X?"). Mer som: "har du testat?",',
    '  "skulle du våga?", "vilken är din favvo?", "kollade du finalen?", "blir det hype eller floppar det?".',
    '- topic_key: kopiera EXAKT från ämneslistan nedan. Skriv en starter per ämne.',
    '',
    'ÄMNEN att skriva om (en starter per ämne, i samma ordning):',
    topicList,
    '',
    'Variera öppningsord/meningsbyggnad mellan startarna. Returnera ENDAST JSON enligt schemat.',
  ].join('\n');
}

// ---------- OpenAI calls ----------

const discoveryFormat = zodTextFormat(discoverySchema, 'topic_discovery');
const writingFormat = zodTextFormat(writingSchema, 'starter_batch');

function extractRefusalMessage(
  response: Awaited<ReturnType<OpenAI['responses']['parse']>>,
): string | null {
  const refusal = response.output
    .flatMap((item) => ('content' in item ? item.content : []))
    .find((content) => content.type === 'refusal');
  return refusal?.type === 'refusal' ? refusal.refusal : null;
}

async function discoverTopics(
  client: OpenAI,
  category: DynamicCategory,
): Promise<DiscoveryResponse | null> {
  try {
    const response = await client.responses.parse({
      model: MODEL,
      tools: [
        {
          type: 'web_search_preview',
          search_context_size: 'high',
        } as never,
      ],
      input: [
        { role: 'developer', content: buildDiscoveryPrompt(category) },
        {
          role: 'user',
          content: `Scouta ${ENTRIES_PER_CATEGORY + TOPIC_OVERSHOOT} distinkta färska ämnen för kategorin "${category}". Sprid över sub-områdena.`,
        },
      ],
      text: { format: discoveryFormat },
    });

    if (!response.output_parsed) {
      const refusal = extractRefusalMessage(response);
      console.error(
        `[${category}] discovery: ${refusal ?? 'no structured output returned'}`,
      );
      return null;
    }
    return response.output_parsed;
  } catch (err) {
    console.error(`[${category}] discovery failed:`, err);
    return null;
  }
}

async function writeStarters(
  client: OpenAI,
  category: DynamicCategory,
  topics: Topic[],
): Promise<WritingResponse | null> {
  try {
    const response = await client.responses.parse({
      model: MODEL,
      // No web tool here — pure rewriting from the topic briefs.
      input: [
        { role: 'developer', content: buildWritingPrompt(category, topics) },
        {
          role: 'user',
          content: `Skriv en casual starter per ämne (${topics.length} st totalt).`,
        },
      ],
      text: { format: writingFormat },
    });

    if (!response.output_parsed) {
      const refusal = extractRefusalMessage(response);
      console.error(
        `[${category}] writing: ${refusal ?? 'no structured output returned'}`,
      );
      return null;
    }
    return response.output_parsed;
  } catch (err) {
    console.error(`[${category}] writing failed:`, err);
    return null;
  }
}

// ---------- De-dup ----------

const STOPWORDS = new Set([
  'och', 'att', 'det', 'som', 'en', 'ett', 'är', 'på', 'i', 'av', 'för', 'med',
  'den', 'de', 'till', 'har', 'om', 'inte', 'man', 'kan', 'jag', 'du', 'vi',
  'sig', 'så', 'men', 'då', 'när', 'eller', 'från', 'vad', 'vem', 'hur',
  'nu', 'just', 'helt', 'lite', 'mer', 'väl', 'ju', 'bara', 'också', 'ska',
  'var', 'blir', 'blev', 'sin', 'sitt', 'sina', 'this', 'the',
]);

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

interface ScoredEntry {
  text: string;
  followUp: string[];
  tokenSet: Set<string>;
}

function dedupe(entries: ScoredEntry[], threshold = 0.45): ScoredEntry[] {
  const kept: ScoredEntry[] = [];
  for (const entry of entries) {
    const dupe = kept.find((k) => jaccard(k.tokenSet, entry.tokenSet) >= threshold);
    if (dupe) {
      console.warn(
        `  • dropped near-duplicate: "${entry.text.slice(0, 60)}…" (overlaps "${dupe.text.slice(0, 60)}…")`,
      );
      continue;
    }
    kept.push(entry);
  }
  return kept;
}

// ---------- File I/O ----------

function loadData(): KallpratFile {
  return JSON.parse(readFileSync(DATA_PATH, 'utf8')) as KallpratFile;
}

function saveData(data: KallpratFile): void {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function todayStamp(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

// ---------- Per-category pipeline ----------

async function generateForCategory(
  client: OpenAI,
  category: DynamicCategory,
  stamp: string,
): Promise<Kallprat[] | null> {
  console.log(`[${category}] discovering topics via web search...`);
  const discovery = await discoverTopics(client, category);
  if (!discovery || discovery.topics.length === 0) return null;

  // Dedupe topics by topic_key + summary tokens (cheap guard before the rewrite call).
  const seenKeys = new Set<string>();
  const uniqueTopics: Topic[] = [];
  const topicTokenSets: ScoredEntry[] = [];
  for (const t of discovery.topics) {
    const key = t.topic_key.toLowerCase().trim();
    if (seenKeys.has(key)) continue;
    const tokenSet = tokens(`${t.topic_key} ${t.summary}`);
    const dupe = topicTokenSets.find((e) => jaccard(e.tokenSet, tokenSet) >= 0.5);
    if (dupe) continue;
    seenKeys.add(key);
    uniqueTopics.push(t);
    topicTokenSets.push({ text: t.summary, followUp: [], tokenSet });
  }
  console.log(
    `[${category}] ${discovery.topics.length} topics returned, ${uniqueTopics.length} after topic-dedup.`,
  );

  // Cap before sending into the writer to keep latency/tokens sane.
  const briefForWriter = uniqueTopics.slice(0, ENTRIES_PER_CATEGORY + TOPIC_OVERSHOOT);

  console.log(`[${category}] writing starters for ${briefForWriter.length} topics...`);
  const written = await writeStarters(client, category, briefForWriter);
  if (!written || written.entries.length === 0) return null;

  // Match writer output back to topics by topic_key (writer should echo it).
  const validKeys = new Set(briefForWriter.map((t) => t.topic_key));
  const candidates: ScoredEntry[] = [];
  for (const entry of written.entries) {
    if (!validKeys.has(entry.topic_key)) {
      // Still accept it — the writer may have lightly renamed the key.
    }
    candidates.push({
      text: entry.text.trim(),
      followUp: entry.followUp.map((q) => q.trim()),
      tokenSet: tokens(entry.text),
    });
  }

  const deduped = dedupe(candidates);
  const finalEntries = deduped.slice(0, ENTRIES_PER_CATEGORY);
  console.log(
    `[${category}] ${candidates.length} written → ${deduped.length} after dedup → ${finalEntries.length} kept.`,
  );

  if (finalEntries.length === 0) return null;

  const prefix = ID_PREFIX[category];
  return finalEntries.map((e, idx) => ({
    id: `${prefix}-${stamp}-${idx + 1}`,
    category,
    text: e.text,
    followUp: e.followUp,
  }));
}

// ---------- Main ----------

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set.');
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });
  const data = loadData();
  const stamp = todayStamp();

  const evergreen = data.kallprat.filter(
    (k) => !DYNAMIC_CATEGORIES.includes(k.category as DynamicCategory),
  );

  let anySuccess = false;
  const replaced: Kallprat[] = [];

  for (const category of DYNAMIC_CATEGORIES) {
    const previous = data.kallprat.filter((k) => k.category === category);
    const fresh = await generateForCategory(client, category, stamp);

    if (!fresh || fresh.length === 0) {
      console.warn(`[${category}] keeping ${previous.length} previous entries.`);
      replaced.push(...previous);
      continue;
    }

    replaced.push(...fresh);
    anySuccess = true;
  }

  if (!anySuccess) {
    console.error('All dynamic categories failed. Not writing file.');
    process.exit(2);
  }

  const ordered: Kallprat[] = [];
  for (const category of DYNAMIC_CATEGORIES) {
    ordered.push(...replaced.filter((k) => k.category === category));
  }
  ordered.push(...evergreen);

  saveData({ categories: data.categories, kallprat: ordered });
  console.log(`Wrote ${ordered.length} entries to ${DATA_PATH}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
