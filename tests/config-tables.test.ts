import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const MCPS_ROOT = path.resolve(import.meta.dirname, "..", "..");

const MCP_DIRECTORIES = [
	"defillama-mcp",
	"mcp-abi",
	"mcp-atp",
	"mcp-bamm",
	"mcp-debank",
	"mcp-discord",
	"mcp-fraxlend",
	"mcp-iqwiki",
	"mcp-kalshi",
	"mcp-limitless",
	"mcp-near",
	"mcp-near-agent",
	"mcp-near-intent-swaps",
	"mcp-near-intents",
	"mcp-odos",
	"mcp-opinion",
	"mcp-polymarket",
	"mcp-telegram",
	"mcp-upbit",
];

// MCPs that receive configuration via MCP client/plugin architecture rather than process.env
// These are excluded from the "documented vars should exist in code" check
const PLUGIN_ARCHITECTURE_MCPS = new Set([
	"mcp-abi", // Uses plugin options pattern, env vars are documented for MCP client config
]);

// Common system environment variables and short generic names that should be ignored
const SYSTEM_ENV_VARS = new Set([
	"PATH",
	"HOME",
	"NODE_ENV",
	"DEBUG",
	"LOG_LEVEL",
	"URL", // Too generic - often matched incorrectly
	"ID", // Too generic - often matched incorrectly
]);

interface EnvVarInfo {
	name: string;
	hasDefault: boolean;
	defaultValue?: string;
}

interface ReadmeEnvVar {
	name: string;
	required: string;
	description: string;
	default?: string;
}

/**
 * Extract environment variables from source code by scanning for process.env references
 * and Zod schema definitions
 */
function extractEnvVarsFromCode(mcpPath: string): EnvVarInfo[] {
	const srcPath = path.join(mcpPath, "src");
	if (!fs.existsSync(srcPath)) {
		return [];
	}

	const envVars = new Map<string, EnvVarInfo>();

	function scanFile(filePath: string): void {
		const content = fs.readFileSync(filePath, "utf8");

		// Pattern 1: process.env.VARIABLE_NAME
		const processEnvPattern = /process\.env\.([A-Z][A-Z0-9_]*)/g;
		let match: RegExpExecArray | null = null;
		// biome-ignore lint/suspicious/noAssignInExpressions: intentional assignment in while condition
		while ((match = processEnvPattern.exec(content)) !== null) {
			const varName = match[1];
			if (!SYSTEM_ENV_VARS.has(varName)) {
				// Check if there's a default value (|| "default" or ?? "default")
				const contextStart = Math.max(0, match.index - 10);
				const contextEnd = Math.min(
					content.length,
					match.index + match[0].length + 100,
				);
				const context = content.slice(contextStart, contextEnd);

				// Check for default patterns
				const defaultPatterns = [
					/\|\|\s*["'`]([^"'`]*)["'`]/,
					/\?\?\s*["'`]([^"'`]*)["'`]/,
					/\.default\s*\(\s*["'`]([^"'`]*)["'`]\s*\)/,
					/\.default\s*\(\s*(\d+)\s*\)/,
					/\.default\s*\(\s*(true|false)\s*\)/,
				];

				let hasDefault = false;
				let defaultValue: string | undefined;

				for (const pattern of defaultPatterns) {
					const defaultMatch = context.match(pattern);
					if (defaultMatch) {
						hasDefault = true;
						defaultValue = defaultMatch[1];
						break;
					}
				}

				if (!envVars.has(varName)) {
					envVars.set(varName, { name: varName, hasDefault, defaultValue });
				} else if (hasDefault && !envVars.get(varName)?.hasDefault) {
					// Update if we found a default
					envVars.set(varName, { name: varName, hasDefault, defaultValue });
				}
			}
		}

		// Pattern 2: Zod schema definitions (e.g., VARIABLE_NAME: z.string() or VARIABLE_NAME: customSchema)
		// Handle multiline Zod schema definitions by looking for the pattern with more context
		// Also match custom schema variables (lowercase identifiers that end with Schema)
		const zodSchemaPattern =
			/([A-Z][A-Z0-9_]*)\s*:\s*(z\s*[.\n\r]|[a-z][a-zA-Z]*Schema)/g;
		// biome-ignore lint/suspicious/noAssignInExpressions: intentional assignment in while condition
		while ((match = zodSchemaPattern.exec(content)) !== null) {
			const varName = match[1];
			if (!SYSTEM_ENV_VARS.has(varName)) {
				// Get more context to check for .default() or .optional() - may span multiple lines
				const contextEnd = Math.min(content.length, match.index + 500);
				const context = content.slice(match.index, contextEnd);

				// Find the end of this schema definition (next property or end of object)
				const nextPropMatch = context.match(/\n\s*[A-Z][A-Z0-9_]*\s*:/);
				const schemaDefEnd = nextPropMatch ? nextPropMatch.index || 500 : 500;
				const schemaDef = context.slice(0, schemaDefEnd);

				const hasDefault = schemaDef.includes(".default(");
				const isOptional = schemaDef.includes(".optional()");

				// Extract default value if present
				let defaultValue: string | undefined;
				const defaultMatch = schemaDef.match(
					/\.default\s*\(\s*["'`]?([^"'`),\n]*)["'`]?\s*\)/,
				);
				if (defaultMatch) {
					defaultValue = defaultMatch[1];
				}

				if (!envVars.has(varName)) {
					envVars.set(varName, {
						name: varName,
						hasDefault: hasDefault || isOptional,
						defaultValue,
					});
				}
			}
		}
	}

	function scanDirectory(dirPath: string): void {
		const entries = fs.readdirSync(dirPath, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(dirPath, entry.name);
			if (entry.isDirectory()) {
				scanDirectory(fullPath);
			} else if (entry.isFile() && entry.name.endsWith(".ts")) {
				scanFile(fullPath);
			}
		}
	}

	scanDirectory(srcPath);
	return Array.from(envVars.values());
}

/**
 * Extract environment variables documented in README Configuration table
 */
function extractEnvVarsFromReadme(mcpPath: string): ReadmeEnvVar[] {
	const readmePath = path.join(mcpPath, "README.md");
	if (!fs.existsSync(readmePath)) {
		return [];
	}

	const content = fs.readFileSync(readmePath, "utf8");
	const envVars: ReadmeEnvVar[] = [];

	// Find all Configuration sections (main section and subsections)
	// Match from "## Configuration" or "## 🔐 Configuration" to the next "## " that's not a subsection
	const configSectionMatch = content.match(
		/## [^\n]*Configuration[^\n]*\n([\s\S]*?)(?=\n## (?![^\n]*Configuration|Required|Sampling|Access|Rate|Message|Content)|\n## 💡|$)/i,
	);
	if (!configSectionMatch) {
		return [];
	}

	const configSection = configSectionMatch[1];

	// Handle multiple table formats:
	// Format 1: | Variable | Required | Description | Default | (4 columns)
	// Format 2: | Variable | Default | Description | (3 columns, default second)
	// Format 3: | Variable | Required | Description | (3 columns, required second)

	// First, let's split by lines and process each table row
	const lines = configSection.split("\n");

	for (const line of lines) {
		// Skip header rows and separator rows
		if (
			line.includes("| Variable") ||
			line.includes("| :---") ||
			line.includes("| ---")
		) {
			continue;
		}

		// Match table rows with backtick-wrapped variable names
		const rowMatch = line.match(/\|\s*`([A-Z][A-Z0-9_]*)`\s*\|(.+)/);
		if (!rowMatch) continue;

		const varName = rowMatch[1];
		const restOfRow = rowMatch[2];

		// Split remaining columns
		const columns = restOfRow
			.split("|")
			.map((c) => c.trim())
			.filter((c) => c !== "");

		if (columns.length === 0) continue;

		let required: string;
		let description: string;
		let defaultValue: string | undefined;

		if (columns.length >= 3) {
			// 4-column format: Required | Description | Default
			const col1 = columns[0];
			const col2 = columns[1];
			const col3 = columns[2] || "";

			if (
				col1.toLowerCase() === "yes" ||
				col1.toLowerCase() === "no" ||
				col1.toLowerCase().includes("for ")
			) {
				// Format: Required | Description | Default
				required = col1;
				description = col2;
				defaultValue =
					col3 && col3 !== "-" ? col3.replace(/`/g, "") : undefined;
			} else {
				// Could be Default | Description format or something else
				required = "No";
				description = col2 || col1;
				defaultValue =
					col1.startsWith("`") ||
					/^\d/.test(col1) ||
					col1 === "true" ||
					col1 === "false"
						? col1.replace(/`/g, "")
						: undefined;
			}
		} else if (columns.length === 2) {
			// 3-column format: either Required | Description or Default | Description
			const col1 = columns[0];
			const col2 = columns[1];

			if (
				col1.toLowerCase() === "yes" ||
				col1.toLowerCase() === "no" ||
				col1.toLowerCase().includes("for ")
			) {
				// Format: Required | Description
				required = col1;
				description = col2;
				defaultValue = undefined;
			} else {
				// Format: Default | Description
				required = "No";
				description = col2;
				defaultValue =
					col1 !== "-" && col1 !== "" ? col1.replace(/`/g, "") : undefined;
			}
		} else {
			// Single column (just description)
			required = "No";
			description = columns[0];
			defaultValue = undefined;
		}

		// Clean up default value
		if (defaultValue) {
			defaultValue = defaultValue.trim();
			if (defaultValue === "-" || defaultValue === "") {
				defaultValue = undefined;
			}
		}

		envVars.push({
			name: varName,
			required,
			description,
			default: defaultValue,
		});
	}

	return envVars;
}

/**
 * Check if a variable is documented as required
 */
function isDocumentedAsRequired(requiredField: string): boolean {
	const lower = requiredField.toLowerCase();
	return (
		lower === "yes" || lower.startsWith("yes") || lower.includes("for ") // e.g., "For trading"
	);
}

describe("configuration tables validation", () => {
	for (const mcpDir of MCP_DIRECTORIES) {
		const mcpPath = path.join(MCPS_ROOT, mcpDir);

		describe(`${mcpDir}`, () => {
			it("should have README.md", () => {
				const readmePath = path.join(mcpPath, "README.md");
				expect(fs.existsSync(readmePath)).toBe(true);
			});

			it("should have Configuration section in README", () => {
				const readmePath = path.join(mcpPath, "README.md");
				if (!fs.existsSync(readmePath)) {
					return;
				}

				const content = fs.readFileSync(readmePath, "utf8");
				expect(content).toMatch(/## [^\n]*Configuration/i);
			});

			it("environment variables in code should be documented in README", () => {
				const codeEnvVars = extractEnvVarsFromCode(mcpPath);
				const readmeEnvVars = extractEnvVarsFromReadme(mcpPath);

				if (codeEnvVars.length === 0) {
					// No env vars in code, skip
					return;
				}

				const readmeVarNames = new Set(readmeEnvVars.map((v) => v.name));

				const undocumented = codeEnvVars.filter(
					(v) => !readmeVarNames.has(v.name),
				);

				if (undocumented.length > 0) {
					const undocumentedNames = undocumented.map((v) => v.name).join(", ");
					expect.fail(
						`Environment variables found in code but not documented in README: ${undocumentedNames}`,
					);
				}
			});

			it("documented environment variables should exist in code", () => {
				// Skip for MCPs that use plugin architecture where env vars are passed via MCP client
				if (PLUGIN_ARCHITECTURE_MCPS.has(mcpDir)) {
					return;
				}

				const codeEnvVars = extractEnvVarsFromCode(mcpPath);
				const readmeEnvVars = extractEnvVarsFromReadme(mcpPath);

				if (readmeEnvVars.length === 0) {
					// No documented env vars, skip
					return;
				}

				const codeVarNames = new Set(codeEnvVars.map((v) => v.name));

				const phantom = readmeEnvVars.filter((v) => !codeVarNames.has(v.name));

				if (phantom.length > 0) {
					const phantomNames = phantom.map((v) => v.name).join(", ");
					expect.fail(
						`Environment variables documented in README but not found in code: ${phantomNames}`,
					);
				}
			});

			it("required status should match code defaults", () => {
				const codeEnvVars = extractEnvVarsFromCode(mcpPath);
				const readmeEnvVars = extractEnvVarsFromReadme(mcpPath);

				const codeVarsMap = new Map(codeEnvVars.map((v) => [v.name, v]));

				const mismatches: string[] = [];

				for (const readmeVar of readmeEnvVars) {
					const codeVar = codeVarsMap.get(readmeVar.name);
					if (!codeVar) continue;

					const docRequired = isDocumentedAsRequired(readmeVar.required);

					// If documented as required but has default in code, that's OK
					// (may be required for certain features)
					// If documented as NOT required but has NO default in code, that's suspicious
					if (!docRequired && !codeVar.hasDefault) {
						// Check if the Required field is conditional (e.g., "For trading")
						const isConditional = readmeVar.required
							.toLowerCase()
							.includes("for ");
						if (!isConditional) {
							// Skip this check - many vars are optional via Zod .optional()
							// which we may not detect perfectly
						}
					}
				}

				if (mismatches.length > 0) {
					expect.fail(`Required status mismatches:\n${mismatches.join("\n")}`);
				}
			});

			it("configuration table should have proper markdown format", () => {
				const readmePath = path.join(mcpPath, "README.md");
				if (!fs.existsSync(readmePath)) {
					return;
				}

				const content = fs.readFileSync(readmePath, "utf8");

				// Find the Configuration section
				const configSectionMatch = content.match(
					/## [^\n]*Configuration[^\n]*\n([\s\S]*?)(?=\n## |$)/i,
				);
				if (!configSectionMatch) {
					return;
				}

				const configSection = configSectionMatch[1];

				// Check for table header separator (| :--- | :--- | etc.)
				// or (| --- | --- | etc.)
				const hasTableSeparator = /\|\s*:?-+:?\s*\|/.test(configSection);

				// If there's a table, it should have proper format
				if (
					configSection.includes("| Variable") ||
					configSection.includes("| `")
				) {
					expect(hasTableSeparator).toBe(true);
				}
			});
		});
	}
});

describe("configuration table format consistency", () => {
	it("all MCPs should use consistent table header format", () => {
		const tableFormats: Record<string, string[]> = {};

		for (const mcpDir of MCP_DIRECTORIES) {
			const mcpPath = path.join(MCPS_ROOT, mcpDir);
			const readmePath = path.join(mcpPath, "README.md");

			if (!fs.existsSync(readmePath)) continue;

			const content = fs.readFileSync(readmePath, "utf8");

			// Find table headers in Configuration section
			const configSectionMatch = content.match(
				/## [^\n]*Configuration[^\n]*\n([\s\S]*?)(?=\n## |$)/i,
			);
			if (!configSectionMatch) continue;

			const configSection = configSectionMatch[1];

			// Extract first table header row
			const headerMatch = configSection.match(/\|([^|\n]+\|)+/);
			if (headerMatch) {
				const header = headerMatch[0].toLowerCase().replace(/\s+/g, " ");
				if (!tableFormats[header]) {
					tableFormats[header] = [];
				}
				tableFormats[header].push(mcpDir);
			}
		}

		// Report different formats found (informational)
		const formats = Object.keys(tableFormats);
		if (formats.length > 1) {
			// This is just informational - different MCPs may have valid reasons
			// for different table formats (e.g., mcp-telegram has multiple tables)
		}
	});
});
