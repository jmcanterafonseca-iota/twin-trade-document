// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Simulate the OCR pipeline's output for one sample document.
 *
 * Takes the transcription fixture written in step 6 of the trade-document-model
 * skill and emits, into a gitignored folder, what the pipeline would produce
 * for that PDF: the normalized instance, a flat path/value view of it, and the
 * real validation result against the generated JSON Schema.
 *
 * Nothing it writes is committed. The point is to look at the conversion before
 * trusting the model.
 *
 * Usage, from the repository root:
 *
 *   node .claude/skills/trade-document-model/scripts/ocr-preview.mjs \
 *     --fixture packages/trade-document-models/tests/fixtures/buyerPurchaseContract.ts \
 *     --export  BUYER_PURCHASE_CONTRACT \
 *     --type    PurchaseOrder \
 *     --pdf     ".context/Document Samples/02-Buyer Purchase Contract(s)/Buyer_s Purchase Contract.pdf"
 *
 * Output defaults to .ocr-preview/<kebab-cased export name>/ and can be
 * overridden with --out.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// The models import each other with a .js extension, as ESM requires, but the
// files on disk are .ts. Node's type stripping does not rewrite the specifier,
// so map it here. This is what vitest does for the test suite.
registerHooks({
	resolve(specifier, context, nextResolve) {
		try {
			return nextResolve(specifier, context);
		} catch (error) {
			if (specifier.endsWith('.js')) {
				return nextResolve(`${specifier.slice(0, -3)}.ts`, context);
			}
			throw error;
		}
	}
});

/**
 * Parse `--flag value` pairs.
 * @param argv The raw arguments.
 * @returns The parsed options.
 */
function parseArgs(argv) {
	const options = {};
	for (let i = 0; i < argv.length; i += 2) {
		if (argv[i]?.startsWith('--')) {
			options[argv[i].slice(2)] = argv[i + 1];
		}
	}
	return options;
}

const args = parseArgs(process.argv.slice(2));
for (const required of ['fixture', 'export', 'type']) {
	if (args[required] === undefined) {
		console.error(`Missing --${required}. See the header of this file for usage.`);
		process.exit(1);
	}
}

const repoRoot = process.cwd();
const fixturePath = path.resolve(repoRoot, args.fixture);
const packageRoot = fixturePath.slice(0, fixturePath.indexOf(`${path.sep}tests${path.sep}`));

const kebab = args.export
	.toLowerCase()
	.replaceAll('_', '-')
	.replace(/^-+|-+$/g, '');
const outDir = path.resolve(repoRoot, args.out ?? path.join('.ocr-preview', kebab));

const fixture = await import(pathToFileURL(fixturePath).href);
const instance = fixture[args.export];
if (instance === undefined) {
	console.error(`${args.fixture} does not export ${args.export}.`);
	process.exit(1);
}

const { DataTypeHelper } = await import(
	pathToFileURL(path.join(packageRoot, 'node_modules/@twin.org/data-core/dist/es/index.js')).href
);
const { JsonLdDataTypes } = await import(
	pathToFileURL(path.join(packageRoot, 'node_modules/@twin.org/data-json-ld/dist/es/index.js')).href
);
const { UneceDataTypes } = await import(
	pathToFileURL(path.join(packageRoot, 'node_modules/@twin.org/standards-unece/dist/es/index.js'))
		.href
);
const { TradeDocumentDataTypes } = await import(
	pathToFileURL(path.join(packageRoot, 'src/dataTypes/tradeDocumentDataTypes.ts')).href
);
const { TradeDocumentContexts } = await import(
	pathToFileURL(path.join(packageRoot, 'src/models/tradeDocumentContexts.ts')).href
);

JsonLdDataTypes.registerTypes();
UneceDataTypes.registerTypes();
TradeDocumentDataTypes.registerTypes();

const typeUrl = `${TradeDocumentContexts.Namespace}${args.type}`;
const failures = [];
const isValid = await DataTypeHelper.validate('', typeUrl, instance, failures);

/**
 * Flatten an object into JSON-path/value pairs, one row per leaf.
 * @param value The value to walk.
 * @param prefix The path accumulated so far.
 * @param rows The rows collected so far.
 * @returns The rows.
 */
function flatten(value, prefix, rows) {
	if (Array.isArray(value)) {
		for (const [index, item] of value.entries()) {
			flatten(item, `${prefix}[${index}]`, rows);
		}
	} else if (value !== null && typeof value === 'object') {
		for (const [key, child] of Object.entries(value)) {
			flatten(child, prefix === '' ? key : `${prefix}.${key}`, rows);
		}
	} else if (value !== undefined) {
		rows.push([prefix, value]);
	}
	return rows;
}

const leaves = flatten(instance, '', []);
// "@context" and "type" repeat on every nested object and say nothing about the
// document, so they are listed separately from the payload.
const structural = leaves.filter(([p]) => p.endsWith('@context') || p.endsWith('type'));
const payload = leaves.filter(([p]) => !p.endsWith('@context') && !p.endsWith('type'));

await mkdir(outDir, { recursive: true });

await writeFile(
	path.join(outDir, 'normalized.json'),
	`${JSON.stringify(instance, undefined, 2)}\n`
);

const sourceLine = args.pdf === undefined ? '' : `**Source PDF:** \`${args.pdf}\`\n\n`;
const validationLine = isValid
	? `**Validation:** PASSED against \`${typeUrl}\`\n`
	: `**Validation:** FAILED against \`${typeUrl}\` — ${failures.length} failure(s)\n`;

const mapping = `# OCR preview — ${args.export}

${sourceLine}**Model:** \`${args.type}\`
${validationLine}
This is what the pipeline would commit to TWIN Core for this document. Nothing here is
part of the repository; regenerate it with \`ocr-preview.mjs\`.

## Payload — ${payload.length} values

| # | path | value |
|---|---|---|
${payload.map(([p, v], i) => `| ${i + 1} | \`${p}\` | ${JSON.stringify(v)} |`).join('\n')}

## JSON-LD scaffolding — ${structural.length} values

Repeated on every nested object; carries no document content.

| path | value |
|---|---|
${structural.map(([p, v]) => `| \`${p}\` | ${JSON.stringify(v)} |`).join('\n')}

## Read this next

Check, against the PDF itself:

1. Every value above is on the page. Anything that is not is a derivation and must be removed.
2. Every fact on the page is above, or is deliberately absent and recorded as such in the
   model guide. Page furniture — logos, column captions, field labels, ruling, scan artefacts —
   does not count.
3. Nothing lands in a property that means something else. A near-miss is not a home.
`;

await writeFile(path.join(outDir, 'mapping.md'), mapping);

const validationReport =
	failures.length === 0
		? `PASSED — ${typeUrl}\n`
		: `FAILED — ${typeUrl}\n\n${JSON.stringify(failures, undefined, 2)}\n`;
await writeFile(path.join(outDir, 'validation.txt'), validationReport);

console.log(`OCR preview written to ${path.relative(repoRoot, outDir)}/`);
console.log(`  normalized.json  the instance, ${payload.length} payload values`);
console.log('  mapping.md       flat path/value view, for checking against the PDF');
console.log(`  validation.txt   ${isValid ? 'PASSED' : `FAILED, ${failures.length} failure(s)`}`);

if (!isValid) {
	process.exit(1);
}
