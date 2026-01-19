import dedent from "dedent";
import { z } from "zod";
import { OpinionAPIService } from "../services/opinion-api.js";

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

			const tokens =
				market.tokens
					?.map(
						(t) =>
							`  - ${t.outcome}: ${t.token_id}${t.winner ? " (Winner)" : ""}`,
					)
					.join("\n") || "  No tokens available";

			return dedent`
        Market Details:

        ID: ${market.market_id}
        Question: ${market.question}
        Description: ${market.description || "N/A"}
        Type: ${market.market_type === 0 ? "Binary" : "Categorical"}
        Status: ${market.status}
        
        Volume: ${market.volume || "N/A"}
        Liquidity: ${market.liquidity || "N/A"}
        
        End Date: ${market.end_date || "N/A"}
        Created: ${market.created_at || "N/A"}
        Updated: ${market.updated_at || "N/A"}
        
        Resolution Source: ${market.resolution_source || "N/A"}
        Tags: ${market.tags?.join(", ") || "N/A"}
        
        Tokens:
        ${tokens}
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
