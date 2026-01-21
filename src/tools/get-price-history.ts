import dedent from "dedent";
import { z } from "zod";
import { OpinionAPIService } from "../services/opinion-api.js";

const getPriceHistoryParams = z.object({
	tokenId: z.string().min(1).describe("The token ID to get price history for"),
	interval: z
		.enum(["1m", "5m", "1h", "1d"])
		.default("1h")
		.describe(
			"Time interval: 1m (1 minute), 5m (5 minutes), 1h (1 hour), 1d (1 day)",
		),
});

type GetPriceHistoryParams = z.infer<typeof getPriceHistoryParams>;

export const getPriceHistoryTool = {
	name: "GET_PRICE_HISTORY",
	description: "Get historical price data for a prediction market token",
	parameters: getPriceHistoryParams,
	execute: async (params: GetPriceHistoryParams) => {
		const apiService = new OpinionAPIService();

		try {
			const priceHistory = await apiService.getPriceHistory(
				params.tokenId,
				params.interval,
			);

			if (
				!priceHistory ||
				!priceHistory.history ||
				priceHistory.history.length === 0
			) {
				return `No price history available for token ${params.tokenId} at ${params.interval} interval.`;
			}

			const historyData = priceHistory.history;

			// Show the most recent entries (up to 10)
			const recentHistory = historyData.slice(0, 10);

			const historyLines = recentHistory.map((entry) => {
				const timestamp = new Date(entry.t * 1000).toISOString();
				return `${timestamp}: ${entry.p}`;
			});

			// Calculate summary statistics
			const prices = historyData.map((e) => Number.parseFloat(e.p));
			const latestPrice = prices[0]; // Most recent first
			const earliestPrice = prices[prices.length - 1];
			const priceChange = latestPrice - earliestPrice;
			const priceChangePercent = earliestPrice !== 0
				? ((priceChange / earliestPrice) * 100).toFixed(2)
				: "0.00";

			return dedent`
        Price History for Token: ${params.tokenId}
        Interval: ${params.interval}
        Total Data Points: ${historyData.length}

        Summary:
        - Current Price: ${latestPrice.toFixed(4)}
        - Earliest Price: ${earliestPrice.toFixed(4)}
        - Change: ${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(4)} (${priceChange >= 0 ? "+" : ""}${priceChangePercent}%)
        - High: ${Math.max(...prices).toFixed(4)}
        - Low: ${Math.min(...prices).toFixed(4)}

        Recent Prices (most recent first):
        ${historyLines.join("\n        ")}
      `;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("API key")) {
					return "Error: Opinion API key is not configured. Please set the OPINION_API_KEY environment variable.";
				}
				return `Error fetching price history: ${error.message}`;
			}
			return "An unknown error occurred while fetching price history";
		}
	},
} as const;
