#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { APP_NAME, APP_VERSION } from "./constants.js";

import { getLatestPriceTool } from "./tools/get-latest-price.js";
import { getMarketDetailsTool } from "./tools/get-market-details.js";
// Import all tools
import { getMarketsTool } from "./tools/get-markets.js";
import { getOrderbookTool } from "./tools/get-orderbook.js";
import { getPositionsTool } from "./tools/get-positions.js";
import { getPriceHistoryTool } from "./tools/get-price-history.js";
import { getQuoteTokensTool } from "./tools/get-quote-tokens.js";
import { getTradeHistoryTool } from "./tools/get-trade-history.js";
import { searchMarketsTool } from "./tools/search-markets.js";

async function main() {
	console.log(`Initializing ${APP_NAME}...`);

	const server = new FastMCP({
		name: APP_NAME,
		version: APP_VERSION,
	});

	// Register market tools
	server.addTool(getMarketsTool);
	server.addTool(getMarketDetailsTool);
	server.addTool(searchMarketsTool);

	// Register token tools
	server.addTool(getOrderbookTool);
	server.addTool(getPriceHistoryTool);
	server.addTool(getLatestPriceTool);

	// Register user tools
	server.addTool(getPositionsTool);
	server.addTool(getTradeHistoryTool);

	// Register reference tools
	server.addTool(getQuoteTokensTool);

	try {
		await server.start({
			transportType: "stdio",
		});
		console.log(`✅ ${APP_NAME} started successfully over stdio.`);
		console.log("   You can now connect to it using an MCP client.");
		console.log("");
		console.log("   Available tools:");
		console.log("   - GET_MARKETS: List prediction markets");
		console.log("   - GET_MARKET_DETAILS: Get market details by ID");
		console.log("   - SEARCH_MARKETS: Search markets by keyword");
		console.log("   - GET_ORDERBOOK: View order book for a token");
		console.log("   - GET_PRICE_HISTORY: Get historical price data");
		console.log("   - GET_LATEST_PRICE: Get current token price");
		console.log("   - GET_POSITIONS: Get user positions by wallet");
		console.log("   - GET_TRADE_HISTORY: Get user trade history");
		console.log("   - GET_QUOTE_TOKENS: List available quote currencies");
	} catch (error) {
		console.error(`❌ Failed to start ${APP_NAME}:`, error);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error(`❌ An unexpected error occurred in ${APP_NAME}:`, error);
	process.exit(1);
});
