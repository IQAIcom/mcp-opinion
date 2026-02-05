import dedent from "dedent";
import { z } from "zod";
import { ClobService } from "../services/clob-service.js";
import { handleClobError } from "../utils/error-handler.js";

const placeOrderParams = z.object({
	marketId: z.number().int().positive().describe("The market ID to trade on"),
	tokenId: z
		.string()
		.min(1)
		.describe("The token ID to trade (e.g., 'token_yes' or token address)"),
	side: z
		.enum(["BUY", "SELL"])
		.describe("Order side: BUY to buy tokens, SELL to sell tokens"),
	orderType: z
		.enum(["LIMIT", "MARKET"])
		.describe("Order type: LIMIT for limit orders, MARKET for market orders"),
	price: z
		.string()
		.describe(
			"Price as string. For limit orders, specify the price. For market orders, use '0'.",
		),
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

type PlaceOrderParams = z.infer<typeof placeOrderParams>;

export const placeOrderTool = {
	name: "PLACE_ORDER",
	description:
		"Place a limit or market order on Opinion.trade. Requires OPINION_PRIVATE_KEY to be set.",
	parameters: placeOrderParams,
	execute: async (params: PlaceOrderParams) => {
		try {
			// Validate that at least one amount is provided
			if (!params.makerAmountInQuoteToken && !params.makerAmountInBaseToken) {
				return "Error: Either makerAmountInQuoteToken or makerAmountInBaseToken must be provided.";
			}

			if (params.makerAmountInQuoteToken && params.makerAmountInBaseToken) {
				return "Error: Only one of makerAmountInQuoteToken or makerAmountInBaseToken should be provided, not both.";
			}

			// Validate price for limit orders
			if (params.orderType === "LIMIT" && params.price === "0") {
				return "Error: Limit orders require a non-zero price.";
			}

			if (params.orderType === "MARKET" && params.price !== "0") {
				return "Error: Market orders must have price set to '0'.";
			}

			const clobService = new ClobService();
			const result = await clobService.placeOrder(params);

			if (!result.success) {
				return dedent`
          Failed to place order:
          Error Code: ${result.errno}
          Error Message: ${result.errmsg}
          ${result.error ? `Details: ${result.error}` : ""}
        `;
			}

			return dedent`
        Order placed successfully!
        
        Order Details:
        - Market ID: ${params.marketId}
        - Token ID: ${params.tokenId}
        - Side: ${params.side}
        - Type: ${params.orderType}
        - Price: ${params.price}
        ${params.makerAmountInQuoteToken ? `- Amount (Quote): ${params.makerAmountInQuoteToken}` : ""}
        ${params.makerAmountInBaseToken ? `- Amount (Base): ${params.makerAmountInBaseToken}` : ""}
        
        ${result.data ? `Response: ${JSON.stringify(result.data, null, 2)}` : ""}
      `;
		} catch (error) {
			return handleClobError(error, "placing order");
		}
	},
} as const;
