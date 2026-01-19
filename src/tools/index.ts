// Market tools
export { getMarketsTool } from "./get-markets.js";
export { getMarketDetailsTool } from "./get-market-details.js";
export { searchMarketsTool } from "./search-markets.js";

// Token tools
export { getOrderbookTool } from "./get-orderbook.js";
export { getPriceHistoryTool } from "./get-price-history.js";
export { getLatestPriceTool } from "./get-latest-price.js";

// User tools
export { getPositionsTool } from "./get-positions.js";
export { getTradeHistoryTool } from "./get-trade-history.js";

// Reference tools
export { getQuoteTokensTool } from "./get-quote-tokens.js";

// Export all tools as an array for easy registration
export const allTools = [
	// Market tools
	(await import("./get-markets.js")).getMarketsTool,
	(await import("./get-market-details.js")).getMarketDetailsTool,
	(await import("./search-markets.js")).searchMarketsTool,

	// Token tools
	(await import("./get-orderbook.js")).getOrderbookTool,
	(await import("./get-price-history.js")).getPriceHistoryTool,
	(await import("./get-latest-price.js")).getLatestPriceTool,

	// User tools
	(await import("./get-positions.js")).getPositionsTool,
	(await import("./get-trade-history.js")).getTradeHistoryTool,

	// Reference tools
	(await import("./get-quote-tokens.js")).getQuoteTokensTool,
];
