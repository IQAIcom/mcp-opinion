import dedent from "dedent";
import { z } from "zod";
import { OpinionAPIService } from "../services/opinion-api.js";
import { getStatusLabel } from "../types.js";

const searchMarketsParams = z.object({
	query: z.string().min(1).describe("Search keyword to find in market titles"),
	limit: z
		.number()
		.min(1)
		.max(20)
		.default(10)
		.describe("Maximum number of results to return"),
	status: z
		.number()
		.min(1)
		.max(4)
		.optional()
		.describe("Filter by status: 1=Created, 2=Active, 3=Resolving, 4=Resolved"),
});

type SearchMarketsParams = z.infer<typeof searchMarketsParams>;

export const searchMarketsTool = {
	name: "SEARCH_MARKETS",
	description: "Search for prediction markets by keyword in the market title",
	parameters: searchMarketsParams,
	execute: async (params: SearchMarketsParams) => {
		const apiService = new OpinionAPIService();

		try {
			// Fetch markets and filter by query (client-side search since API may not support search)
			const result = await apiService.getMarkets({
				limit: 100, // Fetch more to search through
				status: params.status,
			});

			if (!result.list || result.list.length === 0) {
				return "No markets found.";
			}

			// Filter markets by query (case-insensitive)
			const queryLower = params.query.toLowerCase();
			const matchingMarkets = result.list
				.filter(
					(market) =>
						market.marketTitle.toLowerCase().includes(queryLower) ||
						market.rules?.toLowerCase().includes(queryLower),
				)
				.slice(0, params.limit);

			if (matchingMarkets.length === 0) {
				return `No markets found matching "${params.query}".`;
			}

			const marketSummaries = matchingMarkets.map((market) => {
				const tokens =
					market.marketType === 0
						? `Yes: ${market.yesTokenId || "N/A"}, No: ${market.noTokenId || "N/A"}`
						: "Categorical";

				return dedent`
          Market ID: ${market.marketId}
          Title: ${market.marketTitle}
          Type: ${market.marketType === 0 ? "Binary" : "Categorical"}
          Status: ${getStatusLabel(market.status)}
          Volume: ${market.volume || "N/A"}
          Tokens: ${tokens}
        `;
			});

			return dedent`
        Found ${matchingMarkets.length} markets matching "${params.query}":

        ${marketSummaries.join("\n\n---\n\n")}
      `;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("API key")) {
					return "Error: Opinion API key is not configured. Please set the OPINION_API_KEY environment variable.";
				}
				return `Error searching markets: ${error.message}`;
			}
			return "An unknown error occurred while searching markets";
		}
	},
} as const;
