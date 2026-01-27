import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const README_PATH = path.join(ROOT, "README.md");
const TOOLS_DIR = path.join(ROOT, "src", "tools");

const START = "<!-- AUTO-GENERATED TOOLS START -->";
const END = "<!-- AUTO-GENERATED TOOLS END -->";

/**
 * Load MCP tools
 * Scans for any export that looks like an MCP tool:
 * {
 *   name: string,
 *   description: string,
 *   parameters: ZodSchema
 * }
 */
async function loadTools() {
  const files = fs.readdirSync(TOOLS_DIR).filter(f => f.endsWith(".ts") && f !== "index.ts");

  const toolPromises = files.map(async (file) => {
    const mod = await import(path.join(TOOLS_DIR, file));
    // Find any export that looks like a tool
    const tool = Object.values(mod).find(exp =>
      exp &&
      typeof exp === 'object' &&
      typeof exp.name === 'string' &&
      typeof exp.description === 'string' &&
      (exp.parameters || exp.schema) // Handle both naming conventions if they exist
    );
    return tool;
  });

  const loadedTools = await Promise.all(toolPromises);
  const tools = loadedTools.filter(Boolean);

  return tools.sort((a, b) => a.name.localeCompare(b.name));
}

function renderSchema(schema) {
  if (!schema?.shape || Object.keys(schema.shape).length === 0) return "_No parameters_";

  return Object.entries(schema.shape)
    .map(([key, val]) => {
      let current = val;
      let isOptional = false;
      let hasDefault = false;
      let defaultValue;

      // Unwrap optional and default wrappers to get the base type
      while (current._def.innerType) {
        if (current._def.typeName === "ZodOptional") {
          isOptional = true;
        }
        if (current._def.typeName === "ZodDefault") {
          hasDefault = true;
          defaultValue = current._def.defaultValue;
        }
        current = current._def.innerType;
      }

      const finalOptional = isOptional || hasDefault;
      const optionalStr = finalOptional ? "optional" : "required";

      const type = current._def.typeName?.replace("Zod", "").toLowerCase() || "unknown";

      const description = val.description ? `: ${val.description}` : "";

      let defaultInfo = '';
      if (hasDefault) {
        const value = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
        defaultInfo = ` (default: ${JSON.stringify(value)})`;
      }

      return `  - \`${key}\` (${type}, ${optionalStr})${description}${defaultInfo}`;
    })
    .join("\n");
}

function renderMarkdown(tools) {
  let md = "";

  for (const tool of tools) {
    // Support both 'parameters' (Zod) and 'schema' (JSON Schema) fields
    const schema = tool.parameters || tool.schema;

    md += `**\`${tool.name}\`**: ${tool.description}\n`;
    md += `- Parameters:\n`;
    md += `${renderSchema(schema)}\n\n`;
  }

  return md.trim();
}

function updateReadme(content) {
  if (!content.readme.includes(START) || !content.readme.includes(END)) {
    throw new Error("README missing AUTO-GENERATED TOOLS markers");
  }

  const toolsMd = renderMarkdown(content.tools);

  return content.readme.replace(
    new RegExp(`${START}[\\s\\S]*?${END}`, "m"),
    `${START}\n\n${toolsMd}\n\n${END}`
  );
}

async function main() {
  try {
    const readme = fs.readFileSync(README_PATH, "utf8");
    const tools = await loadTools();

    if (tools.length === 0) {
      console.warn("Warning: No tools found!");
    }

    const updated = updateReadme({ readme, tools });

    fs.writeFileSync(README_PATH, updated);
    console.log(`Synced ${tools.length} MCP tools to README.md`);
  } catch (error) {
    console.error("Error updating README:", error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
