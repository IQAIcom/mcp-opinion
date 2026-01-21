import dedent from "dedent";
import { z } from "zod";
import { OpinionAPIService } from "../services/opinion-api.js";

const getTradeHistoryParams = z.object({
	walletAddress: z
		.string()
		.min(1)
		.describe("The wallet address to get trade history for"),
	limit: z
		.number()
		.min(1)
		.max(50)
		.default(20)
		.describe("Maximum number of trades to return"),
	page: z.number().min(1).optional().describe("Page number for pagination"),
});

type GetTradeHistoryParams = z.infer<typeof getTradeHistoryParams>;

export const getTradeHistoryTool = {
	name: "GET_TRADE_HISTORY",
	description: "Get the trade history for a wallet address on Opinion.trade",
	parameters: getTradeHistoryParams,
	execute: async (params: GetTradeHistoryParams) => {
		const apiService = new OpinionAPIService();

		try {
			const trades = await apiService.getUserTrades(params.walletAddress, {
				limit: params.limit,
				page: params.page,
			});

			if (!trades.list || trades.list.length === 0) {
				return `No trade history found for wallet ${params.walletAddress}.`;
			}

		const tradeSummaries = trades.list.map((trade) => {
			const sideEmoji = trade.side.toUpperCase() === "BUY" ? "📈" : "📉";

			return dedent`
          ${sideEmoji} ${trade.side.toUpperCase()}
          TX: ${trade.txHash}
          Market ID: ${trade.marketId}
          ${trade.marketTitle ? `Title: ${trade.marketTitle}` : ""}
          ${trade.rootMarketTitle ? `Root Market: ${trade.rootMarketTitle}` : ""}
          ${trade.outcome ? `Outcome: ${trade.outcome}` : ""}
          Price: ${trade.price}
          Shares: ${trade.shares}
          Amount: ${trade.amount}
          ${trade.fee ? `Fee: ${trade.fee}` : ""}
          ${trade.statusEnum ? `Status: ${trade.statusEnum}` : ""}
          Time: ${new Date(trade.createdAt * 1000).toISOString()}
        `;
		});

		// Calculate summary statistics
		const buyTrades = trades.list.filter(
			(t) => t.side.toUpperCase() === "BUY",
		);
		const sellTrades = trades.list.filter(
			(t) => t.side.toUpperCase() === "SELL",
		);

		const totalBuyVolume = buyTrades.reduce(
			(sum, t) => sum + Number.parseFloat(t.amount),
			0,
		);
		const totalSellVolume = sellTrades.reduce(
			(sum, t) => sum + Number.parseFloat(t.amount),
			0,
		);

			return dedent`
        Trade History for Wallet: ${params.walletAddress}
        Total Trades: ${trades.list.length}${trades.total ? ` (of ${trades.total})` : ""}

        Summary:
        - Buy Trades: ${buyTrades.length} (Volume: ${totalBuyVolume.toFixed(4)})
        - Sell Trades: ${sellTrades.length} (Volume: ${totalSellVolume.toFixed(4)})

        ---

        ${tradeSummaries.join("\n\n---\n\n")}
      `;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("API key")) {
					return "Error: Opinion API key is not configured. Please set the OPINION_API_KEY environment variable.";
				}
				return `Error fetching trade history: ${error.message}`;
			}
			return "An unknown error occurred while fetching trade history";
		}
	},
} as const;
