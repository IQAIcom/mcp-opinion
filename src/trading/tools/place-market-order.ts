import dedent from "dedent";
import { z } from "zod";
import { ClobService } from "../services/clob-service.js";

const placeMarketOrderParams = z.object({
	marketId: z.number().int().positive().describe("The market ID to trade on"),
	tokenId: z
		.string()
		.min(1)
		.describe("The token ID to trade (e.g., 'token_yes' or token address)"),
	side: z
		.enum(["BUY", "SELL"])
		.describe("Order side: BUY to buy tokens, SELL to sell tokens"),
	makerAmountInQuoteToken: z
		.string()
		.optional()
		.describe(
			"Amount in quote token (e.g., USDT). Typically used for BUY orders. Either this or makerAmountInBaseToken must be provided.",
		),
	makerAmountInBaseToken: z
		.string()
		.optional()
		.describe(
			"Amount in base token (outcome tokens). Typically used for SELL orders. Either this or makerAmountInQuoteToken must be provided.",
		),
	checkApproval: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			"If true, automatically checks and approves quote token if needed",
		),
});

type PlaceMarketOrderParams = z.infer<typeof placeMarketOrderParams>;

export const placeMarketOrderTool = {
	name: "PLACE_MARKET_ORDER",
	description:
		"Place a market order on Opinion.trade (executes immediately at current market price). Requires OPINION_PRIVATE_KEY to be set.",
	parameters: placeMarketOrderParams,
	execute: async (params: PlaceMarketOrderParams) => {
		try {
			// Validate that at least one amount is provided
			if (!params.makerAmountInQuoteToken && !params.makerAmountInBaseToken) {
				return "Error: Either makerAmountInQuoteToken or makerAmountInBaseToken must be provided.";
			}

			if (params.makerAmountInQuoteToken && params.makerAmountInBaseToken) {
				return "Error: Only one of makerAmountInQuoteToken or makerAmountInBaseToken should be provided, not both.";
			}

			const clobService = new ClobService();
			const result = await clobService.placeOrder({
				...params,
				orderType: "MARKET",
				price: "0",
			});

			if (!result.success) {
				return dedent`
          Failed to place market order:
          Error Code: ${result.errno}
          Error Message: ${result.errmsg}
          ${result.error ? `Details: ${result.error}` : ""}
        `;
			}

			return dedent`
        Market order placed successfully!
        
        Order Details:
        - Market ID: ${params.marketId}
        - Token ID: ${params.tokenId}
        - Side: ${params.side}
        - Type: MARKET (executes at current market price)
        ${params.makerAmountInQuoteToken ? `- Amount (Quote): ${params.makerAmountInQuoteToken}` : ""}
        ${params.makerAmountInBaseToken ? `- Amount (Base): ${params.makerAmountInBaseToken}` : ""}
        
        ${result.data ? `Response: ${JSON.stringify(result.data, null, 2)}` : ""}
      `;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("OPINION_PRIVATE_KEY")) {
					return "Error: OPINION_PRIVATE_KEY environment variable is required for trading operations.";
				}
				if (error.message.includes("Python")) {
					return `Error: ${error.message}. Make sure Python 3 and opinion-clob-sdk are installed (pip install opinion-clob-sdk).`;
				}
				return `Error placing market order: ${error.message}`;
			}
			return "An unknown error occurred while placing the market order";
		}
	},
} as const;
