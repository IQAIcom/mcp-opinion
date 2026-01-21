#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { APP_NAME, APP_VERSION } from "./constants.js";
import { config } from "./lib/config.js";

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

// Conditionally import trading tools
import {
	approveAllowancesTool,
	cancelOrderTool,
	getBalancesTool,
	getOpenOrdersTool,
	placeMarketOrderTool,
	placeOrderTool,
} from "./trading/tools/index.js";

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

	// Conditionally register trading tools if private key is available
	const hasPrivateKey = !!config.opinion.privateKey;
	if (hasPrivateKey) {
		console.log("   Trading tools enabled (OPINION_PRIVATE_KEY detected)");
		server.addTool(placeOrderTool);
		server.addTool(placeMarketOrderTool);
		server.addTool(cancelOrderTool);
		server.addTool(getOpenOrdersTool);
		server.addTool(getBalancesTool);
		server.addTool(approveAllowancesTool);
	} else {
		console.log("   Trading tools disabled (OPINION_PRIVATE_KEY not set)");
	}

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
		if (hasPrivateKey) {
			console.log("");
			console.log("   Trading tools (requires OPINION_PRIVATE_KEY):");
			console.log("   - PLACE_ORDER: Place a limit or market order");
			console.log("   - PLACE_MARKET_ORDER: Place a market order");
			console.log("   - CANCEL_ORDER: Cancel an order by ID");
			console.log("   - GET_OPEN_ORDERS: Get your open orders");
			console.log("   - GET_BALANCES: Get your token balances");
			console.log("   - APPROVE_ALLOWANCES: Approve tokens for trading");
		}
	} catch (error) {
		console.error(`❌ Failed to start ${APP_NAME}:`, error);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error(`❌ An unexpected error occurred in ${APP_NAME}:`, error);
	process.exit(1);
});
