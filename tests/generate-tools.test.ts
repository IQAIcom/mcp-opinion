import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");
const README_PATH = path.join(ROOT, "README.md");
const TOOLS_DIR = path.join(ROOT, "src", "tools");

const START = "<!-- AUTO-GENERATED TOOLS START -->";
const END = "<!-- AUTO-GENERATED TOOLS END -->";

describe("generate-tools script", () => {
	let originalReadme: string;

	beforeEach(() => {
		originalReadme = fs.readFileSync(README_PATH, "utf8");
	});

	afterEach(() => {
		// Restore original README
		fs.writeFileSync(README_PATH, originalReadme);
	});

	describe("README markers", () => {
		it("should have AUTO-GENERATED TOOLS START marker", () => {
			expect(originalReadme).toContain(START);
		});

		it("should have AUTO-GENERATED TOOLS END marker", () => {
			expect(originalReadme).toContain(END);
		});

		it("should have START marker before END marker", () => {
			const startIndex = originalReadme.indexOf(START);
			const endIndex = originalReadme.indexOf(END);
			expect(startIndex).toBeLessThan(endIndex);
		});
	});

	describe("tools directory", () => {
		it("should have tools directory", () => {
			expect(fs.existsSync(TOOLS_DIR)).toBe(true);
		});

		it("should have TypeScript tool files", () => {
			const files = fs.readdirSync(TOOLS_DIR);
			const tsFiles = files.filter(
				(f) => f.endsWith(".ts") && f !== "index.ts",
			);
			expect(tsFiles.length).toBeGreaterThan(0);
		});

		it("should have index.ts file", () => {
			const indexPath = path.join(TOOLS_DIR, "index.ts");
			expect(fs.existsSync(indexPath)).toBe(true);
		});
	});

	describe("tool file structure", () => {
		it("should export tools with required properties", async () => {
			const files = fs.readdirSync(TOOLS_DIR);
			const toolFiles = files.filter(
				(f) => f.endsWith(".ts") && f !== "index.ts",
			);

			for (const file of toolFiles) {
				const mod = await import(path.join(TOOLS_DIR, file));
				const exports = Object.values(mod);

				// Find exports that look like MCP tools
				const toolExports = exports.filter(
					(exp) =>
						exp &&
						typeof exp === "object" &&
						typeof (exp as { name?: unknown }).name === "string" &&
						typeof (exp as { description?: unknown }).description === "string",
				);

				// Each tool file should have at least one valid tool export
				expect(toolExports.length).toBeGreaterThanOrEqual(1);

				for (const tool of toolExports) {
					const t = tool as {
						name: string;
						description: string;
						parameters?: unknown;
						schema?: unknown;
					};
					// Tool should have name as uppercase string with underscores
					expect(t.name).toMatch(/^[A-Z][A-Z0-9_]*$/);

					// Tool should have description
					expect(typeof t.description).toBe("string");
					expect(t.description.length).toBeGreaterThan(0);

					// Tool should have either parameters (Zod schema) or schema (JSON schema)
					const hasParams = t.parameters || t.schema;
					expect(hasParams).toBeTruthy();
				}
			}
		});
	});

	describe("README structure", () => {
		it("should have all required sections", () => {
			const requiredSections = [
				"Overview",
				"Features",
				"Installation",
				"Running with",
				"Configuration",
				"Usage Examples",
				"MCP Tools",
				"Development",
				"Resources",
				"License",
			];

			for (const section of requiredSections) {
				expect(originalReadme).toMatch(new RegExp(`##.*${section}`, "i"));
			}
		});

		it("should have npm badge", () => {
			expect(originalReadme).toContain("npmjs.com/package/@iqai/mcp-opinion");
		});

		it("should have license badge", () => {
			expect(originalReadme).toContain("License");
		});
	});
});

describe("tool definitions", () => {
	it("should have GET_MARKETS tool", async () => {
		const mod = await import(path.join(TOOLS_DIR, "get-markets.ts"));
		expect(mod.getMarketsTool).toBeDefined();
		expect(mod.getMarketsTool.name).toBe("GET_MARKETS");
	});

	it("should have GET_MARKET_DETAILS tool", async () => {
		const mod = await import(path.join(TOOLS_DIR, "get-market-details.ts"));
		expect(mod.getMarketDetailsTool).toBeDefined();
		expect(mod.getMarketDetailsTool.name).toBe("GET_MARKET_DETAILS");
	});

	it("should have SEARCH_MARKETS tool", async () => {
		const mod = await import(path.join(TOOLS_DIR, "search-markets.ts"));
		expect(mod.searchMarketsTool).toBeDefined();
		expect(mod.searchMarketsTool.name).toBe("SEARCH_MARKETS");
	});

	it("should have GET_ORDERBOOK tool", async () => {
		const mod = await import(path.join(TOOLS_DIR, "get-orderbook.ts"));
		expect(mod.getOrderbookTool).toBeDefined();
		expect(mod.getOrderbookTool.name).toBe("GET_ORDERBOOK");
	});

	it("should have GET_PRICE_HISTORY tool", async () => {
		const mod = await import(path.join(TOOLS_DIR, "get-price-history.ts"));
		expect(mod.getPriceHistoryTool).toBeDefined();
		expect(mod.getPriceHistoryTool.name).toBe("GET_PRICE_HISTORY");
	});

	it("should have GET_LATEST_PRICE tool", async () => {
		const mod = await import(path.join(TOOLS_DIR, "get-latest-price.ts"));
		expect(mod.getLatestPriceTool).toBeDefined();
		expect(mod.getLatestPriceTool.name).toBe("GET_LATEST_PRICE");
	});

	it("should have GET_POSITIONS tool", async () => {
		const mod = await import(path.join(TOOLS_DIR, "get-positions.ts"));
		expect(mod.getPositionsTool).toBeDefined();
		expect(mod.getPositionsTool.name).toBe("GET_POSITIONS");
	});

	it("should have GET_TRADE_HISTORY tool", async () => {
		const mod = await import(path.join(TOOLS_DIR, "get-trade-history.ts"));
		expect(mod.getTradeHistoryTool).toBeDefined();
		expect(mod.getTradeHistoryTool.name).toBe("GET_TRADE_HISTORY");
	});

	it("should have GET_QUOTE_TOKENS tool", async () => {
		const mod = await import(path.join(TOOLS_DIR, "get-quote-tokens.ts"));
		expect(mod.getQuoteTokensTool).toBeDefined();
		expect(mod.getQuoteTokensTool.name).toBe("GET_QUOTE_TOKENS");
	});
});
