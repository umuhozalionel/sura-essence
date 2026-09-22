/**
 * Checks that messages/en.json and messages/fr.json stay in step.
 * Run it after editing either file:   node scripts/check-i18n.mjs
 *
 * It reports:
 *  - keys or list items that exist in one language but not the other
 *  - lists whose items are in a different order (compared by "id")
 *  - fields that must be identical in both files (ids, icons, links, images, prices…)
 *  - placeholders like {name} that don't match between the two languages
 *  - text that ICU can't parse (usually a stray { or } )
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { IntlMessageFormat } from "intl-messageformat";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (locale) => JSON.parse(readFileSync(join(root, "messages", `${locale}.json`), "utf8"));

// Fields that are data rather than words, so they must be identical in both files.
// (Numbers and true/false are always treated this way, whatever they are called.)
const SHARED_FIELDS = new Set(["id", "icon", "href", "image", "tone", "places", "district", "area", "guideHref"]);

const problems = [];
const report = (path, message) => problems.push(`${path}: ${message}`);

function compare(en, fr, path = "") {
  if (Array.isArray(en) || Array.isArray(fr)) {
    if (!Array.isArray(en) || !Array.isArray(fr)) return report(path, "is a list in one language but not the other");
    if (en.length !== fr.length) report(path, `has ${en.length} item(s) in en and ${fr.length} in fr`);
    for (let i = 0; i < Math.min(en.length, fr.length); i++) compare(en[i], fr[i], `${path}[${i}]`);
    return;
  }

  if (en && typeof en === "object") {
    if (!fr || typeof fr !== "object") return report(path, "is a group in en but not in fr");
    for (const key of Object.keys(en)) {
      if (!(key in fr)) report(`${path ? `${path}.` : ""}${key}`, "missing in fr.json");
    }
    for (const key of Object.keys(fr)) {
      if (!(key in en)) report(`${path ? `${path}.` : ""}${key}`, "missing in en.json");
    }
    for (const key of Object.keys(en)) {
      if (key in fr) compare(en[key], fr[key], `${path ? `${path}.` : ""}${key}`);
    }
    return;
  }

  const field = path.split(".").pop().replace(/\[\d+\]$/, "");
  const isData = SHARED_FIELDS.has(field) || typeof en !== "string" || typeof fr !== "string";
  if (isData && JSON.stringify(en) !== JSON.stringify(fr)) {
    report(path, `must be the same in both files (en: ${JSON.stringify(en)}, fr: ${JSON.stringify(fr)})`);
  }
  if (typeof en === "string" && typeof fr === "string") {
    const [enArgs, frArgs] = [placeholders(en, path, "en"), placeholders(fr, path, "fr")];
    const missing = [...enArgs].filter((a) => !frArgs.has(a));
    const extra = [...frArgs].filter((a) => !enArgs.has(a));
    if (missing.length) report(path, `fr.json is missing {${missing.join("}, {")}}`);
    if (extra.length) report(path, `fr.json has an unknown placeholder {${extra.join("}, {")}}`);
  }
}

function placeholders(message, path, locale) {
  const names = new Set();
  try {
    const walk = (parts) => {
      for (const part of parts) {
        if (part.value && part.type !== 0 && typeof part.value === "string") names.add(part.value);
        for (const option of Object.values(part.options ?? {})) walk(option.value ?? []);
      }
    };
    walk(new IntlMessageFormat(message, locale).getAst());
  } catch (error) {
    report(path, `${locale}.json text can't be read by ICU — ${error.message.split("\n")[0]}`);
  }
  return names;
}

compare(read("en"), read("fr"));

if (problems.length) {
  console.error(`✖ ${problems.length} problem(s) between messages/en.json and messages/fr.json:\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log("✓ en.json and fr.json match");
