import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const README_PATH = path.join(ROOT, "README.md");
const TOOLS_DIR = path.join(ROOT, "src", "tools");

const START = "<!-- AUTO-GENERATED TOOLS START -->";
const END = "<!-- AUTO-GENERATED TOOLS END -->";

/**
 * Parse a Zod schema definition from source code to extract parameter info
 */
function parseZodSchemaFromSource(source, schemaName) {
	const params = [];

	// Find the schema definition - handle z.object({ or z\n.object({
	const schemaStartRegex = new RegExp(
		`(?:const|let|var)\\s+${schemaName}\\s*=\\s*z\\s*\\.\\s*object\\s*\\(\\s*\\{`,
		"ms",
	);
	const startMatch = source.match(schemaStartRegex);
	if (!startMatch) return params;

	// Find the matching closing brace
	const startIndex = startMatch.index + startMatch[0].length;
	let braceCount = 1;
	let endIndex = startIndex;

	for (let i = startIndex; i < source.length && braceCount > 0; i++) {
		if (source[i] === "{") braceCount++;
		if (source[i] === "}") braceCount--;
		endIndex = i;
	}

	const schemaBody = source.substring(startIndex, endIndex);

	// Parse parameters line by line
	const lines = schemaBody.split("\n");
	let currentParam = null;
	let currentContent = "";

	for (const line of lines) {
		const paramStart = line.match(/^\s*(\w+)\s*:\s*z\.?/);
		if (paramStart) {
			if (currentParam && currentContent) {
				const parsed = parseParamContent(currentParam, currentContent);
				if (parsed && !parsed.name.startsWith("_")) {
					params.push(parsed);
				}
			}
			currentParam = paramStart[1];
			currentContent = line;
		} else if (currentParam) {
			currentContent += `\n${line}`;
		}
	}

	if (currentParam && currentContent) {
		const parsed = parseParamContent(currentParam, currentContent);
		if (parsed && !parsed.name.startsWith("_")) {
			params.push(parsed);
		}
	}

	return params;
}

/**
 * Parse a single parameter's content to extract type, description, etc.
 */
function parseParamContent(name, content) {
	// Extract description from .describe("...")
	const descStartMatch = content.match(/\.describe\s*\(\s*/);
	if (!descStartMatch) return null;

	const descStartIndex = descStartMatch.index + descStartMatch[0].length;
	const afterDescribe = content.substring(descStartIndex);

	const quoteChar = afterDescribe[0];
	if (!["'", '"', "`"].includes(quoteChar)) return null;

	let description = "";
	let i = 1;
	while (i < afterDescribe.length) {
		if (afterDescribe[i] === "\\") {
			description += afterDescribe[i] + (afterDescribe[i + 1] || "");
			i += 2;
		} else if (afterDescribe[i] === quoteChar) {
			break;
		} else {
			description += afterDescribe[i];
			i++;
		}
	}

	description = description.replace(/\s+/g, " ").trim();

	// Extract type
	const typeMatch = content.match(/z\.\s*\n?\s*\.?(\w+)\s*\(/);
	let baseType = typeMatch ? typeMatch[1] : "unknown";

	if (!["string", "number", "boolean", "array", "object", "enum", "union", "literal"].includes(baseType)) {
		const altMatch = content.match(/\.\s*(string|number|boolean|array|object|enum|union)\s*\(/);
		if (altMatch) baseType = altMatch[1];
	}

	const isOptional = content.includes(".optional()");
	const hasDefault = content.includes(".default(");
	let defaultValue;
	if (hasDefault) {
		const defaultMatch = content.match(/\.default\(\s*(.+?)\s*\)/);
		if (defaultMatch) {
			let val = defaultMatch[1].trim();
			if (val.startsWith('"') || val.startsWith("'") || val.startsWith("`")) {
				val = val.slice(1, -1);
			}
			defaultValue = val;
		}
	}

	return {
		name,
		type: baseType,
		description,
		required: !isOptional && !hasDefault,
		default: defaultValue,
	};
}

/**
 * Extract tool description from source
 */
function extractDescription(source, startIndex, endIndex) {
	const searchArea = source.substring(startIndex, endIndex);
	const descMatch = searchArea.match(/description\s*:\s*["'`]/);
	if (!descMatch) return null;

	const descStartIndex = descMatch.index + descMatch[0].length - 1;
	const quoteChar = searchArea[descStartIndex];
	const afterQuote = searchArea.substring(descStartIndex + 1);

	let description = "";
	let i = 0;
	while (i < afterQuote.length) {
		if (afterQuote[i] === "\\") {
			description += afterQuote[i + 1] || "";
			i += 2;
		} else if (afterQuote[i] === quoteChar) {
			break;
		} else {
			description += afterQuote[i];
			i++;
		}
	}

	return description.trim();
}

/**
 * Parse tool definition from source code
 */
function parseToolFromSource(source, filePath) {
	const tools = [];

	const nameMatches = [...source.matchAll(/name\s*:\s*["'`]([a-zA-Z][a-zA-Z0-9_]+)["'`]/g)];

	for (const nameMatch of nameMatches) {
		const name = nameMatch[1];
		const nameIndex = nameMatch.index;

		const description = extractDescription(
			source,
			Math.max(0, nameIndex - 200),
			nameIndex + 800,
		);

		if (!description) continue;

		const searchArea = source.substring(Math.max(0, nameIndex - 200), nameIndex + 500);
		const paramsMatch = searchArea.match(/parameters\s*:\s*(\w+)/);
		const params = paramsMatch ? parseZodSchemaFromSource(source, paramsMatch[1]) : [];

		if (!tools.some((t) => t.name === name)) {
			tools.push({ name, description, params });
		}
	}

	return tools;
}

/**
 * Load MCP tools using source-only parsing
 */
function loadTools() {
	const tools = [];
	const files = fs
		.readdirSync(TOOLS_DIR)
		.filter((f) => f.endsWith(".ts") && f !== "index.ts");

	for (const file of files) {
		const filePath = path.join(TOOLS_DIR, file);
		const source = fs.readFileSync(filePath, "utf8");
		const parsedTools = parseToolFromSource(source, file);

		for (const tool of parsedTools) {
			const properties = {};
			const required = [];

			for (const param of tool.params) {
				properties[param.name] = {
					type: param.type,
					description: param.description,
				};
				if (param.default !== undefined) {
					properties[param.name].default = param.default;
				}
				if (param.required) {
					required.push(param.name);
				}
			}

			tools.push({
				name: tool.name,
				description: tool.description,
				jsonSchema: { properties, required },
			});
		}

		if (parsedTools.length > 0) {
			console.log(`Parsed ${parsedTools.length} tool(s) from ${file}`);
		}
	}

	return tools.sort((a, b) => a.name.localeCompare(b.name));
}

function renderSchema(jsonSchema) {
	const properties = jsonSchema?.properties ?? {};
	const required = new Set(jsonSchema?.required ?? []);

	const publicProps = Object.entries(properties).filter(([key]) => !key.startsWith("_"));
	if (publicProps.length === 0) return "_No parameters_";

	const hasDefaults = publicProps.some(([, prop]) => prop.default !== undefined);

	let table = hasDefaults
		? "| Parameter | Type | Required | Default | Description |\n|-----------|------|----------|---------|-------------|\n"
		: "| Parameter | Type | Required | Description |\n|-----------|------|----------|-------------|\n";

	for (const [key, prop] of publicProps) {
		const type = prop.type ?? "unknown";
		const reqStr = required.has(key) ? "✅" : "";
		const desc = prop.description ?? "";
		const def = prop.default !== undefined ? String(prop.default) : "";

		table += hasDefaults
			? `| \`${key}\` | ${type} | ${reqStr} | ${def} | ${desc} |\n`
			: `| \`${key}\` | ${type} | ${reqStr} | ${desc} |\n`;
	}

	return table.trim();
}

function renderMarkdown(tools) {
	let md = "";
	for (const tool of tools) {
		md += `### \`${tool.name}\`\n`;
		md += `${tool.description}\n\n`;
		md += `${renderSchema(tool.jsonSchema)}\n\n`;
	}
	return md.trim();
}

function updateReadme({ readme, toolsMd }) {
	if (!readme.includes(START) || !readme.includes(END)) {
		throw new Error("README missing AUTO-GENERATED TOOLS markers");
	}
	return readme.replace(
		new RegExp(`${START}[\\s\\S]*?${END}`, "m"),
		`${START}\n\n${toolsMd}\n\n${END}`,
	);
}

function main() {
	try {
		const readme = fs.readFileSync(README_PATH, "utf8");
		const tools = loadTools();

		if (tools.length === 0) {
			console.warn("Warning: No tools found!");
		}

		const toolsMd = renderMarkdown(tools);
		const updated = updateReadme({ readme, toolsMd });

		fs.writeFileSync(README_PATH, updated);
		console.log(`Synced ${tools.length} MCP tools to README.md`);
	} catch (error) {
		console.error("Error updating README:", error);
		process.exit(1);
	}
}

main();
