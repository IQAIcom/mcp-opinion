I will implement the requested improvements to the tool generation script and clean up the README.

### Plan
1.  **Optimize Tool Loading**: Update `loadTools` in `generate-tools.mjs` to use `Promise.all` for parallel module loading, as suggested.
2.  **Improve Schema Rendering**: Replace `renderSchema` with the provided robust implementation that handles Zod unwrapping, defaults, and optional types correctly.
3.  **Clean up README**: Remove the manually maintained "MCP Tools" section from `README.md` and rely solely on the auto-generated section to avoid duplication.
4.  **Execute & Verify**: Run the updated script to regenerate the README and verify that the output is correct and the manual section is gone.
