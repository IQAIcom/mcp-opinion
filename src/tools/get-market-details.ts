import dedent from "dedent";
import { z } from "zod";
import { OpinionAPIService } from "../services/opinion-api.js";
import { getStatusLabel } from "../types.js";

const getMarketDetailsParams = z.object({
	marketId: z.number().describe("The unique identifier of the market"),
});

type GetMarketDetailsParams = z.infer<typeof getMarketDetailsParams>;

export const getMarketDetailsTool = {
	name: "GET_MARKET_DETAILS",
	description:
		"Get detailed information about a specific prediction market by its ID",
	parameters: getMarketDetailsParams,
	execute: async (params: GetMarketDetailsParams) => {
		const apiService = new OpinionAPIService();

		try {
			const market = await apiService.getMarketDetails(params.marketId);

			// Format tokens based on market type
			let tokensInfo: string;
			if (market.marketType === 0) {
				// Binary market
				tokensInfo = dedent`
          ${market.yesLabel || "Yes"}: ${market.yesTokenId || "N/A"}
          ${market.noLabel || "No"}: ${market.noTokenId || "N/A"}
        `;
			} else {
				// Categorical - try to get from categorical endpoint
				tokensInfo = "Use categorical endpoint for options";
			}

			const formatTimestamp = (ts: number | null | undefined) => {
				if (!ts) return "N/A";
				return new Date(ts * 1000).toISOString();
			};

			return dedent`
        Market Details:

        ID: ${market.marketId}
        Title: ${market.marketTitle}
        Type: ${market.marketType === 0 ? "Binary" : "Categorical"}
        Status: ${getStatusLabel(market.status)}
        
        Volume: ${market.volume || "N/A"}
        Chain ID: ${market.chainId || "N/A"}
        Quote Token: ${market.quoteToken || "N/A"}
        
        Cutoff: ${formatTimestamp(market.cutoffAt)}
        Resolved: ${formatTimestamp(market.resolvedAt)}
        
        Rules: ${market.rules || "N/A"}
        
        Tokens:
        ${tokensInfo}
        
        ${market.resultTokenId ? `Winner Token: ${market.resultTokenId}` : ""}
        ${market.conditionId ? `Condition ID: ${market.conditionId}` : ""}
      `;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("API key")) {
					return "Error: Opinion API key is not configured. Please set the OPINION_API_KEY environment variable.";
				}
				return `Error fetching market details: ${error.message}`;
			}
			return "An unknown error occurred while fetching market details";
		}
	},
} as const;
