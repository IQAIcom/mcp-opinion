import dedent from "dedent";
import { z } from "zod";
import { OpinionAPIService } from "../services/opinion-api.js";

const getMarketsParams = z.object({
	limit: z
		.number()
		.min(1)
		.max(20)
		.default(10)
		.describe("Number of markets to return (max 20)"),
	status: z
		.enum(["activated", "resolved"])
		.optional()
		.describe("Filter by market status"),
	marketType: z
		.number()
		.min(0)
		.max(2)
		.optional()
		.describe("Market type: 0=Binary, 1=Categorical, 2=All"),
	page: z.number().min(1).optional().describe("Page number for pagination"),
});

type GetMarketsParams = z.infer<typeof getMarketsParams>;

export const getMarketsTool = {
	name: "GET_MARKETS",
	description:
		"Get a list of prediction markets from Opinion.trade with optional filters for status and market type",
	parameters: getMarketsParams,
	execute: async (params: GetMarketsParams) => {
		const apiService = new OpinionAPIService();

		try {
			const result = await apiService.getMarkets({
				limit: params.limit,
				status: params.status,
				marketType: params.marketType as 0 | 1 | 2 | undefined,
				page: params.page,
			});

			if (!result.list || result.list.length === 0) {
				return "No markets found matching the specified criteria.";
			}

			const marketSummaries = result.list.map((market) => {
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
          Tags: ${market.tags?.join(", ") || "N/A"}
        `;
			});

			return dedent`
        Found ${result.list.length} markets${result.total ? ` (Total: ${result.total})` : ""}:

        ${marketSummaries.join("\n\n---\n\n")}
      `;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("API key")) {
					return "Error: Opinion API key is not configured. Please set the OPINION_API_KEY environment variable.";
				}
				return `Error fetching markets: ${error.message}`;
			}
			return "An unknown error occurred while fetching markets";
		}
	},
} as const;
