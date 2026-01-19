import dedent from "dedent";
import { z } from "zod";
import { OpinionAPIService } from "../services/opinion-api.js";

const searchMarketsParams = z.object({
	query: z
		.string()
		.min(1)
		.describe("Search keyword to find in market questions"),
	limit: z
		.number()
		.min(1)
		.max(20)
		.default(10)
		.describe("Maximum number of results to return"),
	status: z
		.enum(["activated", "resolved"])
		.optional()
		.describe("Filter by market status"),
});

type SearchMarketsParams = z.infer<typeof searchMarketsParams>;

export const searchMarketsTool = {
	name: "SEARCH_MARKETS",
	description:
		"Search for prediction markets by keyword in the market question",
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
						market.question.toLowerCase().includes(queryLower) ||
						market.description?.toLowerCase().includes(queryLower) ||
						market.tags?.some((tag) => tag.toLowerCase().includes(queryLower)),
				)
				.slice(0, params.limit);

			if (matchingMarkets.length === 0) {
				return `No markets found matching "${params.query}".`;
			}

			const marketSummaries = matchingMarkets.map((market) => {
				const tokens =
					market.tokens?.map((t) => `${t.outcome}: ${t.token_id}`).join(", ") ||
					"N/A";

				return dedent`
          Market ID: ${market.market_id}
          Question: ${market.question}
          Type: ${market.market_type === 0 ? "Binary" : "Categorical"}
          Status: ${market.status}
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
