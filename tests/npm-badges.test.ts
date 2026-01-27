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

interface PackageJson {
	name: string;
	bin?: Record<string, string>;
	repository?: {
		url?: string;
	};
	homepage?: string;
	bugs?: {
		url?: string;
	};
}

function extractNpmBadgePackage(readme: string): string | null {
	const badgeRegex =
		/shields\.io\/npm\/v\/(@[^/]+\/[^).]+)(?:\.svg)?[^)]*\)\([^)]*npmjs\.com\/package\/(@[^/]+\/[^)]+)\)/;
	const match = readme.match(badgeRegex);
	if (match) {
		return match[2];
	}

	const simpleBadgeRegex = /npmjs\.com\/package\/(@[^/]+\/[^)]+)\)/;
	const simpleMatch = readme.match(simpleBadgeRegex);
	return simpleMatch ? simpleMatch[1] : null;
}

describe("npm badges validation", () => {
	for (const mcpDir of MCP_DIRECTORIES) {
		const mcpPath = path.join(MCPS_ROOT, mcpDir);

		describe(`${mcpDir}`, () => {
			it("should have package.json", () => {
				const packageJsonPath = path.join(mcpPath, "package.json");
				expect(fs.existsSync(packageJsonPath)).toBe(true);
			});

			it("should have README.md", () => {
				const readmePath = path.join(mcpPath, "README.md");
				expect(fs.existsSync(readmePath)).toBe(true);
			});

			it("npm badge should point to correct package", () => {
				const packageJsonPath = path.join(mcpPath, "package.json");
				const readmePath = path.join(mcpPath, "README.md");

				if (!fs.existsSync(packageJsonPath) || !fs.existsSync(readmePath)) {
					return;
				}

				const packageJson: PackageJson = JSON.parse(
					fs.readFileSync(packageJsonPath, "utf8"),
				);
				const readme = fs.readFileSync(readmePath, "utf8");

				const packageName = packageJson.name;
				const badgePackage = extractNpmBadgePackage(readme);

				expect(badgePackage).not.toBeNull();
				expect(badgePackage).toBe(packageName);
			});

			it("bin name should be related to package name", () => {
				const packageJsonPath = path.join(mcpPath, "package.json");
				if (!fs.existsSync(packageJsonPath)) {
					return;
				}

				const packageJson: PackageJson = JSON.parse(
					fs.readFileSync(packageJsonPath, "utf8"),
				);

				if (packageJson.bin) {
					const binKeys = Object.keys(packageJson.bin);
					const baseName = packageJson.name.replace("@iqai/", "");
					// Bin name should start with the base package name
					const hasMatchingBin = binKeys.some((key) =>
						key.startsWith(baseName),
					);
					expect(hasMatchingBin).toBe(true);
				}
			});

			it("repository URL should match directory name", () => {
				const packageJsonPath = path.join(mcpPath, "package.json");
				if (!fs.existsSync(packageJsonPath)) {
					return;
				}

				const packageJson: PackageJson = JSON.parse(
					fs.readFileSync(packageJsonPath, "utf8"),
				);

				if (packageJson.repository?.url) {
					const repoUrl = packageJson.repository.url;
					expect(repoUrl).toContain(mcpDir);
				}
			});
		});
	}
});

describe("npm badge format", () => {
	for (const mcpDir of MCP_DIRECTORIES) {
		const mcpPath = path.join(MCPS_ROOT, mcpDir);

		it(`${mcpDir} should have properly formatted npm badge`, () => {
			const readmePath = path.join(mcpPath, "README.md");
			if (!fs.existsSync(readmePath)) {
				return;
			}

			const readme = fs.readFileSync(readmePath, "utf8");
			expect(readme).toMatch(
				/\[!\[npm version\]\(https:\/\/img\.shields\.io\/npm\/v\/@iqai\/[^)]+\.svg\)\]\(https:\/\/www\.npmjs\.com\/package\/@iqai\/[^)]+\)/,
			);
		});
	}
});
