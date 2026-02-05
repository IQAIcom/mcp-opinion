import dedent from "dedent";
import { z } from "zod";
import { ClobService } from "../services/clob-service.js";
import { handleClobError } from "../utils/error-handler.js";

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
			return handleClobError(error, "cancelling order");
		}
	},
} as const;
