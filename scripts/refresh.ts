/// <reference types="node" />

/**
 * Refresh script for `src/data/kallprat.json`.
 *
 * For each dynamic category, ask the LLM (with web search) to produce a fresh
 * batch of Swedish conversation starters based on recent news/topics. Evergreen
 * categories are left untouched. If a category's response is invalid, the
 * existing entries for that category are kept (fail-safe).
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

// Categories whose entries are regenerated each run.
const DYNAMIC_CATEGORIES = ['nyheter', 'sport', 'teknik'] as const;
type DynamicCategory = (typeof DYNAMIC_CATEGORIES)[number];

const ID_PREFIX: Record<DynamicCategory, string> = {
  nyheter: 'n',
  sport: 's',
  teknik: 't',
};

const ENTRIES_PER_CATEGORY = 15;
const MODEL = process.env.KALLPRAT_MODEL ?? 'gpt-4o-mini';

// ---------- Types & schema ----------

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

const llmEntrySchema = z.object({
  text: z.string().min(8).max(280),
  followUp: z.array(z.string().min(3).max(160)).min(2).max(3),
});

const llmResponseSchema = z.object({
  entries: z.array(llmEntrySchema).min(5).max(ENTRIES_PER_CATEGORY + 2),
});
type LlmResponse = z.infer<typeof llmResponseSchema>;

// ---------- Prompts ----------

const CATEGORY_TOPIC: Record<DynamicCategory, string> = {
  nyheter:
    'aktuella nyheter och samhällshändelser från den senaste veckan (Sverige och världen).',
  sport:
    'aktuella sporthändelser, matcher, turneringar och idrottsnyheter från den senaste veckan.',
  teknik:
    'aktuell teknik, AI, prylar, mjukvarusläpp och tech-trender från den senaste veckan.',
};

function buildSystemPrompt(category: DynamicCategory): string {
  return [
    'Du är en redaktör som skriver lättsamma samtalsstartare ("kallprat") på svenska.',
    `Ämne: ${CATEGORY_TOPIC[category]}`,
    'Använd webbsökning för att hitta vad som faktiskt hänt den senaste veckan innan du skriver.',
    '',
    'Krav på varje kallprat:',
    `- Skriv ${ENTRIES_PER_CATEGORY} stycken samtalsstartare.`,
    '- Texten ska vara en öppen fråga eller observation, 1–2 meningar, på naturlig svenska.',
    '- Bifoga 2 följdfrågor per kallprat som hjälper samtalet vidare.',
    '- Neutral, vänlig och nyfiken ton. Undvik politiskt laddade vinklingar.',
    '- Nämn ALDRIG privatpersoners namn. Offentliga personer (politiker, idrottare, artister) får nämnas om de är centrala i en aktuell händelse.',
    '- Undvik pågående tragedier, krig, dödsfall, brott och annat som är olämpligt som småprat.',
    '- Variera ämnen inom kategorin — undvik att alla handlar om samma sak.',
    '- Inkludera inte länkar, källhänvisningar eller hashtags i texten.',
    '',
    'Returnera ENDAST giltig JSON enligt det angivna schemat.',
  ].join('\n');
}

// ---------- OpenAI call ----------

const responseTextFormat = zodTextFormat(llmResponseSchema, 'kallprat_batch');

function extractRefusalMessage(response: Awaited<ReturnType<OpenAI['responses']['parse']>>): string | null {
  const refusal = response.output
    .flatMap((item) => ('content' in item ? item.content : []))
    .find((content) => content.type === 'refusal');

  return refusal?.type === 'refusal' ? refusal.refusal : null;
}

async function generateForCategory(
  client: OpenAI,
  category: DynamicCategory,
): Promise<LlmResponse | null> {
  const systemPrompt = buildSystemPrompt(category);

  // Use the Responses API with the hosted web search tool so the model can
  // ground its answers in fresh content. Fall back gracefully on errors.
  try {
    const response = await client.responses.parse({
      model: MODEL,
      tools: [{ type: 'web_search_preview' }],
      input: [
        { role: 'developer', content: systemPrompt },
        {
          role: 'user',
          content: `Skriv ${ENTRIES_PER_CATEGORY} aktuella kallprat för kategorin "${category}".`,
        },
      ],
      text: { format: responseTextFormat },
    });

    if (!response.output_parsed) {
      const refusal = extractRefusalMessage(response);

      if (refusal) {
        console.error(`[${category}] model refused request: ${refusal}`);
      } else {
        console.error(`[${category}] no structured output returned by model`);
      }

      return null;
    }

    return response.output_parsed;
  } catch (err) {
    console.error(`[${category}] generation failed:`, err);
    return null;
  }
}

// ---------- File I/O ----------

function loadData(): KallpratFile {
  const raw = readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(raw) as KallpratFile;
}

function saveData(data: KallpratFile): void {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function todayStamp(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
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

  let anySuccess = false;
  const replaced: Kallprat[] = [];

  // Keep evergreen entries as-is.
  const evergreen = data.kallprat.filter(
    (k) => !DYNAMIC_CATEGORIES.includes(k.category as DynamicCategory),
  );

  for (const category of DYNAMIC_CATEGORIES) {
    const previous = data.kallprat.filter((k) => k.category === category);
    console.log(`[${category}] generating fresh entries...`);
    const result = await generateForCategory(client, category);

    if (!result) {
      console.warn(`[${category}] keeping ${previous.length} previous entries.`);
      replaced.push(...previous);
      continue;
    }

    const prefix = ID_PREFIX[category];
    const fresh: Kallprat[] = result.entries.slice(0, ENTRIES_PER_CATEGORY).map(
      (entry, idx) => ({
        id: `${prefix}-${stamp}-${idx + 1}`,
        category,
        text: entry.text.trim(),
        followUp: entry.followUp.map((q) => q.trim()),
      }),
    );

    console.log(`[${category}] generated ${fresh.length} new entries.`);
    replaced.push(...fresh);
    anySuccess = true;
  }

  if (!anySuccess) {
    console.error('All dynamic categories failed. Not writing file.');
    process.exit(2);
  }

  // Preserve original ordering: dynamic categories first (in defined order),
  // then evergreen in their original order.
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
