import dedent from "dedent";
import { z } from "zod";
import { OpinionAPIService } from "../services/opinion-api.js";

const getQuoteTokensParams = z.object({});

type GetQuoteTokensParams = z.infer<typeof getQuoteTokensParams>;

export const getQuoteTokensTool = {
	name: "GET_QUOTE_TOKENS",
	description:
		"Get the list of available quote tokens (currencies) that can be used for trading on Opinion.trade",
	parameters: getQuoteTokensParams,
	execute: async (_params: GetQuoteTokensParams) => {
		const apiService = new OpinionAPIService();

		try {
			const quoteTokens = await apiService.getQuoteTokens();

			if (!quoteTokens || quoteTokens.length === 0) {
				return "No quote tokens available.";
			}

			const tokenSummaries = quoteTokens.map((token) => {
				return dedent`
          Symbol: ${token.symbol}
          ${token.name ? `Name: ${token.name}` : ""}
          Address: ${token.address}
          Decimals: ${token.decimals}
        `;
			});

			return dedent`
        Available Quote Tokens on Opinion.trade:

        ${tokenSummaries.join("\n\n---\n\n")}

        Note: Quote tokens are the currencies used to buy and sell prediction market tokens.
        Most commonly, USDC or similar stablecoins are used as quote tokens.
      `;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("API key")) {
					return "Error: Opinion API key is not configured. Please set the OPINION_API_KEY environment variable.";
				}
				return `Error fetching quote tokens: ${error.message}`;
			}
			return "An unknown error occurred while fetching quote tokens";
		}
	},
} as const;
