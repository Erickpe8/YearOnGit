/**
 * One-time script to generate static locale files from English source.
 * Run: node --import tsx scripts/generate-static-locales.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { en } from "../src/lib/i18n/locales/en.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "../src/lib/i18n/locales");

const TARGETS = {
  fr: "fr",
  de: "de",
  pt: "pt-BR",
  it: "it",
  ja: "ja",
  zh: "zh-CN",
  ko: "ko",
  ar: "ar",
};

const CONCURRENCY = 1;
const REQUEST_DELAY_MS = 350;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateText(text, target) {
  const params = new URLSearchParams({
    q: text,
    langpair: `en|${target}`,
  });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?${params.toString()}`,
    );

    if (response.status === 429) {
      await sleep(1500 * (attempt + 1));
      continue;
    }

    if (!response.ok) {
      throw new Error(`MyMemory ${response.status}`);
    }

    const data = await response.json();
    if (data.responseStatus !== 200) {
      await sleep(1000 * (attempt + 1));
      continue;
    }

    await sleep(REQUEST_DELAY_MS);
    return data.responseData?.translatedText?.trim() || text;
  }

  return text;
}

async function runWithConcurrency(items, worker) {
  let index = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (index < items.length) {
        const currentIndex = index++;
        items[currentIndex] = await worker(items[currentIndex], currentIndex);
      }
    }),
  );
}

function escapeString(value) {
  return JSON.stringify(value);
}

function writeLocaleFile(code, strings) {
  const lines = Object.entries(strings).map(
    ([key, value]) => `  ${key}: ${escapeString(value)},`,
  );

  const content = `export const ${code} = {\n${lines.join("\n")}\n} as const;\n`;
  fs.writeFileSync(path.join(localesDir, `${code}.ts`), content, "utf8");
}

async function generateLocale(code, target) {
  const entries = Object.entries(en);
  console.log(`Generating ${code} (${entries.length} keys)...`);

  const translated = new Array(entries.length);
  const jobs = entries.map(([key, value], index) => ({ key, value, index }));

  await runWithConcurrency(jobs, async ({ value, index }) => {
    translated[index] = await translateText(value, target);
  });

  const strings = Object.fromEntries(
    entries.map(([key], index) => [key, translated[index] ?? en[key]]),
  );

  writeLocaleFile(code, strings);
}

fs.mkdirSync(localesDir, { recursive: true });

const enPath = path.join(localesDir, "en.ts");
const enSize = fs.statSync(enPath).size;

for (const [code, target] of Object.entries(TARGETS)) {
  const filePath = path.join(localesDir, `${code}.ts`);
  if (fs.existsSync(filePath) && fs.statSync(filePath).size !== enSize) {
    console.log(`Skipping ${code}, already translated.`);
    continue;
  }

  await generateLocale(code, target);
}

console.log("Done.");
