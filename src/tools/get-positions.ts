import dedent from "dedent";
import { z } from "zod";
import { OpinionAPIService } from "../services/opinion-api.js";

const getPositionsParams = z.object({
	walletAddress: z
		.string()
		.min(1)
		.describe("The wallet address to get positions for"),
	limit: z
		.number()
		.min(1)
		.max(50)
		.default(20)
		.describe("Maximum number of positions to return"),
	page: z.number().min(1).optional().describe("Page number for pagination"),
});

type GetPositionsParams = z.infer<typeof getPositionsParams>;

export const getPositionsTool = {
	name: "GET_POSITIONS",
	description:
		"Get the current prediction market positions held by a wallet address",
	parameters: getPositionsParams,
	execute: async (params: GetPositionsParams) => {
		const apiService = new OpinionAPIService();

		try {
			const positions = await apiService.getUserPositions(
				params.walletAddress,
				{
					limit: params.limit,
					page: params.page,
				},
			);

			if (!positions.list || positions.list.length === 0) {
				return `No positions found for wallet ${params.walletAddress}.`;
			}

		const positionSummaries = positions.list.map((position) => {
			const pnlDisplay = position.unrealizedPnl
				? `Unrealized PnL: ${Number.parseFloat(position.unrealizedPnl) >= 0 ? "+" : ""}${position.unrealizedPnl}${position.unrealizedPnlPercent ? ` (${Number.parseFloat(position.unrealizedPnlPercent) >= 0 ? "+" : ""}${position.unrealizedPnlPercent}%)` : ""}`
				: "";

			return dedent`
          Market ID: ${position.marketId}
          ${position.marketTitle ? `Title: ${position.marketTitle}` : ""}
          ${position.rootMarketTitle ? `Root Market: ${position.rootMarketTitle}` : ""}
          ${position.marketStatusEnum ? `Status: ${position.marketStatusEnum}` : ""}
          Token: ${position.tokenId}
          ${position.outcome ? `Outcome: ${position.outcome}` : ""}
          Shares Owned: ${position.sharesOwned}
          ${position.sharesFrozen ? `Shares Frozen: ${position.sharesFrozen}` : ""}
          ${position.avgEntryPrice ? `Avg Entry Price: ${position.avgEntryPrice}` : ""}
          ${position.currentValueInQuoteToken ? `Current Value: ${position.currentValueInQuoteToken}` : ""}
          ${pnlDisplay}
        `;
		});

		// Calculate portfolio summary if we have PnL data
		const totalPnl = positions.list
			.filter((p) => p.unrealizedPnl)
			.reduce((sum, p) => sum + Number.parseFloat(p.unrealizedPnl || "0"), 0);

			return dedent`
        Positions for Wallet: ${params.walletAddress}
        Total Positions: ${positions.list.length}${positions.total ? ` (of ${positions.total})` : ""}
        ${totalPnl !== 0 ? `Total PnL: ${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(4)}` : ""}

        ---

        ${positionSummaries.join("\n\n---\n\n")}
      `;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("API key")) {
					return "Error: Opinion API key is not configured. Please set the OPINION_API_KEY environment variable.";
				}
				return `Error fetching positions: ${error.message}`;
			}
			return "An unknown error occurred while fetching positions";
		}
	},
} as const;
