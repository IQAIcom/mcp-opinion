import dedent from "dedent";
import { z } from "zod";
import { OpinionAPIService } from "../services/opinion-api.js";

const getOrderbookParams = z.object({
	tokenId: z.string().min(1).describe("The token ID to get the order book for"),
});

type GetOrderbookParams = z.infer<typeof getOrderbookParams>;

export const getOrderbookTool = {
	name: "GET_ORDERBOOK",
	description:
		"Get the order book (bids and asks) for a specific prediction market token",
	parameters: getOrderbookParams,
	execute: async (params: GetOrderbookParams) => {
		const apiService = new OpinionAPIService();

		try {
			const orderbook = await apiService.getOrderbook(params.tokenId);

			const formatOrders = (
				orders: Array<{ price: string; size: string }>,
				type: string,
			) => {
				if (!orders || orders.length === 0) {
					return `  No ${type.toLowerCase()} available`;
				}
				return orders
					.map((order) => `  Price: ${order.price} | Size: ${order.size}`)
					.join("\n");
			};

			const bestBid =
				orderbook.bids && orderbook.bids.length > 0
					? orderbook.bids[0].price
					: "N/A";
			const bestAsk =
				orderbook.asks && orderbook.asks.length > 0
					? orderbook.asks[0].price
					: "N/A";

			return dedent`
        Order Book for Token: ${params.tokenId}
        ${orderbook.timestamp ? `Timestamp: ${orderbook.timestamp}` : ""}

        Best Bid: ${bestBid}
        Best Ask: ${bestAsk}
        Spread: ${bestBid !== "N/A" && bestAsk !== "N/A" ? (Number.parseFloat(bestAsk) - Number.parseFloat(bestBid)).toFixed(4) : "N/A"}

        BIDS (Buy Orders):
        ${formatOrders(orderbook.bids, "Bids")}

        ASKS (Sell Orders):
        ${formatOrders(orderbook.asks, "Asks")}
      `;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("API key")) {
					return "Error: Opinion API key is not configured. Please set the OPINION_API_KEY environment variable.";
				}
				return `Error fetching order book: ${error.message}`;
			}
			return "An unknown error occurred while fetching the order book";
		}
	},
} as const;
