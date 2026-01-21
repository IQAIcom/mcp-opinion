import dedent from "dedent";
import { z } from "zod";
import { ClobService } from "../services/clob-service.js";

const getOpenOrdersParams = z.object({
	marketId: z
		.number()
		.int()
		.positive()
		.optional()
		.describe("Filter by market ID (optional)"),
	status: z.string().optional().describe("Filter by order status (optional)"),
	page: z
		.number()
		.int()
		.positive()
		.optional()
		.describe("Page number for pagination (optional)"),
	limit: z
		.number()
		.int()
		.positive()
		.max(100)
		.optional()
		.describe("Maximum number of orders to return (optional, max 100)"),
});

type GetOpenOrdersParams = z.infer<typeof getOpenOrdersParams>;

export const getOpenOrdersTool = {
	name: "GET_OPEN_ORDERS",
	description:
		"Get your open orders with optional filters. Requires OPINION_PRIVATE_KEY to be set.",
	parameters: getOpenOrdersParams,
	execute: async (params: GetOpenOrdersParams) => {
		try {
			const clobService = new ClobService();
			const result = await clobService.getMyOrders(params);

			if (!result.success) {
				return dedent`
          Failed to fetch orders:
          Error Code: ${result.errno}
          Error Message: ${result.errmsg}
          ${result.error ? `Details: ${result.error}` : ""}
        `;
			}

			const orders = result.data as
				| { list?: unknown[]; total?: number }
				| unknown[]
				| null
				| undefined;

			if (!orders || (Array.isArray(orders) && orders.length === 0)) {
				const filters = [];
				if (params.marketId) filters.push(`Market ID: ${params.marketId}`);
				if (params.status) filters.push(`Status: ${params.status}`);

				return dedent`
          No open orders found.
          ${filters.length > 0 ? `Filters: ${filters.join(", ")}` : ""}
        `;
			}

			const orderList = Array.isArray(orders)
				? orders
				: (orders as { list?: unknown[] })?.list || [];
			const total = Array.isArray(orders)
				? undefined
				: (orders as { total?: number })?.total;

			return dedent`
        Open Orders:
        Total: ${orderList.length}${total ? ` (of ${total})` : ""}
        
        ${params.marketId ? `Filtered by Market ID: ${params.marketId}` : ""}
        ${params.status ? `Filtered by Status: ${params.status}` : ""}
        
        Orders:
        ${JSON.stringify(orderList, null, 2)}
      `;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("OPINION_PRIVATE_KEY")) {
					return "Error: OPINION_PRIVATE_KEY environment variable is required for trading operations.";
				}
				if (error.message.includes("Python")) {
					return `Error: ${error.message}. Make sure Python 3 and opinion-clob-sdk are installed (pip install opinion-clob-sdk).`;
				}
				return `Error fetching orders: ${error.message}`;
			}
			return "An unknown error occurred while fetching orders";
		}
	},
} as const;
