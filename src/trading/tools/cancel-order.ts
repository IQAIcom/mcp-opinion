import dedent from "dedent";
import { z } from "zod";
import { ClobService } from "../services/clob-service.js";

const cancelOrderParams = z.object({
	orderId: z.string().min(1).describe("The order ID to cancel"),
});

type CancelOrderParams = z.infer<typeof cancelOrderParams>;

export const cancelOrderTool = {
	name: "CANCEL_ORDER",
	description:
		"Cancel a single order by order ID. Requires OPINION_PRIVATE_KEY to be set.",
	parameters: cancelOrderParams,
	execute: async (params: CancelOrderParams) => {
		try {
			const clobService = new ClobService();
			const result = await clobService.cancelOrder(params);

			if (!result.success) {
				return dedent`
          Failed to cancel order:
          Order ID: ${params.orderId}
          Error Code: ${result.errno}
          Error Message: ${result.errmsg}
          ${result.error ? `Details: ${result.error}` : ""}
        `;
			}

			return dedent`
        Order cancelled successfully!
        
        Order ID: ${params.orderId}
        
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
				return `Error cancelling order: ${error.message}`;
			}
			return "An unknown error occurred while cancelling the order";
		}
	},
} as const;
