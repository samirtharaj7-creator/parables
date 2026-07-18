import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const failures = [];

const stateIds = new Set([...html.matchAll(/\bid\s*:\s*["']([^"']+)["']/gu)].map(match => match[1]));
if (stateIds.size !== 61) failures.push(`Expected 61 unique interaction IDs; found ${stateIds.size}.`);
if (!html.includes('title:"The Laborers in the Vineyard"')) failures.push("American-English Laborers title is missing.");
if (/\bLabourers\b/u.test(html)) failures.push("British Labourers spelling remains in interface copy.");

for (const [label, pattern] of [
  ["announced selected-parable status", /id=["']selectedParableLabel["'][^>]*role=["']status["'][^>]*aria-live=["']polite["']/u],
  ["focusable article heading", /<h2 id=["']\$\{p\.id\}-title["'] tabindex=["']-1["']>/u],
  ["article heading focus transfer", /target\.querySelector\(["']h2["']\)\?\.focus\(\{ preventScroll:true \}\)/u],
  ["hash focus request", /syncPageToHash\(\{ scroll:true, focus:true \}\)/u],
  ["selected search-result state", /aria-current=[\\"']true[\\"']/u],
  ["profile-link keyboard focus parity", /\.profile-link:hover,\s*\n\s*\.profile-link:focus-visible/u],
  ["search-result keyboard focus parity", /\.search-result:hover,\.search-result:focus-visible/u],
  ["related-link keyboard focus parity", /\.related-link:hover,\s*\n\s*\.related-link:focus-visible/u],
  ["mobile brand target size", /\.nav-brand\s*\{[\s\S]*?display:\s*inline-flex;\s*min-height:\s*24px;/u],
]) {
  if (!pattern.test(html)) failures.push(`${label} is missing.`);
}

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/giu)]
  .map(match => match[1])
  .filter(source => source.trim());
inlineScripts.forEach((source, index) => {
  try {
    new Function(source);
  } catch (error) {
    failures.push(`Inline script ${index + 1} has a syntax error: ${error.message}`);
  }
});

if (failures.length) {
  console.error("Parables interaction validation failed:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Parables interaction validation passed: 61 states remain inventoried, selected articles are announced and focused, and keyboard focus styling matches hover styling.");
