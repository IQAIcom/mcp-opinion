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
	description:
		"Get historical price data (OHLCV) for a prediction market token",
	parameters: getPriceHistoryParams,
	execute: async (params: GetPriceHistoryParams) => {
		const apiService = new OpinionAPIService();

		try {
			const priceHistory = await apiService.getPriceHistory(
				params.tokenId,
				params.interval,
			);

			if (!priceHistory.history || priceHistory.history.length === 0) {
				return `No price history available for token ${params.tokenId} at ${params.interval} interval.`;
			}

			// Show the most recent entries (up to 10)
			const recentHistory = priceHistory.history.slice(-10);

			const historyLines = recentHistory.map((entry) => {
				return dedent`
          Time: ${entry.timestamp}
          Open: ${entry.open} | High: ${entry.high} | Low: ${entry.low} | Close: ${entry.close}
          ${entry.volume ? `Volume: ${entry.volume}` : ""}
        `;
			});

			// Calculate summary statistics
			const closes = priceHistory.history.map((e) =>
				Number.parseFloat(e.close),
			);
			const latestPrice = closes[closes.length - 1];
			const earliestPrice = closes[0];
			const priceChange = latestPrice - earliestPrice;
			const priceChangePercent = ((priceChange / earliestPrice) * 100).toFixed(
				2,
			);

			return dedent`
        Price History for Token: ${params.tokenId}
        Interval: ${params.interval}
        Total Data Points: ${priceHistory.history.length}

        Summary:
        - Current Price: ${latestPrice.toFixed(4)}
        - Period Start Price: ${earliestPrice.toFixed(4)}
        - Change: ${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(4)} (${priceChange >= 0 ? "+" : ""}${priceChangePercent}%)
        - High: ${Math.max(...priceHistory.history.map((e) => Number.parseFloat(e.high))).toFixed(4)}
        - Low: ${Math.min(...priceHistory.history.map((e) => Number.parseFloat(e.low))).toFixed(4)}

        Recent Price Data (last ${recentHistory.length} entries):

        ${historyLines.join("\n\n---\n\n")}
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
