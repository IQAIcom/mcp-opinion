import dedent from "dedent";
import { z } from "zod";
import { OpinionAPIService } from "../services/opinion-api.js";

const getLatestPriceParams = z.object({
	tokenId: z
		.string()
		.min(1)
		.describe("The token ID to get the latest price for"),
});

type GetLatestPriceParams = z.infer<typeof getLatestPriceParams>;

export const getLatestPriceTool = {
	name: "GET_LATEST_PRICE",
	description:
		"Get the current/latest trade price for a prediction market token",
	parameters: getLatestPriceParams,
	execute: async (params: GetLatestPriceParams) => {
		const apiService = new OpinionAPIService();

		try {
			const priceData = await apiService.getLatestPrice(params.tokenId);

			if (!priceData) {
				return `No price data available for token ${params.tokenId}. The token may not exist or have no trades yet.`;
			}

			// Convert price to percentage for prediction markets (prices are 0-1)
			const priceNum = Number.parseFloat(priceData.price);
			const impliedProbability = (priceNum * 100).toFixed(1);

			const timestamp = priceData.timestamp
				? new Date(priceData.timestamp * 1000).toISOString()
				: "";

			return dedent`
        Latest Price for Token: ${priceData.tokenId}

        Price: ${priceData.price}
        Implied Probability: ${impliedProbability}%
        ${timestamp ? `Last Updated: ${timestamp}` : ""}

        Note: In prediction markets, the price represents the market's implied probability 
        that the outcome will occur. A price of 0.65 means the market estimates a 65% chance.
      `;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("API key")) {
					return "Error: Opinion API key is not configured. Please set the OPINION_API_KEY environment variable.";
				}
				return `Error fetching latest price: ${error.message}`;
			}
			return "An unknown error occurred while fetching the latest price";
		}
	},
} as const;
