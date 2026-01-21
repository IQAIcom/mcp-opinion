import dedent from "dedent";
import { z } from "zod";
import { ClobService } from "../services/clob-service.js";

export const approveAllowancesTool = {
	name: "APPROVE_ALLOWANCES",
	description:
		"Approve quote tokens for trading on Opinion.trade. This is required once before placing orders. Requires OPINION_PRIVATE_KEY to be set.",
	parameters: z.object({}),
	execute: async () => {
		try {
			const clobService = new ClobService();
			const result = await clobService.enableTrading();

			if (!result.success) {
				return dedent`
          Failed to approve allowances:
          Error Code: ${result.errno}
          Error Message: ${result.errmsg}
          ${result.error ? `Details: ${result.error}` : ""}
          
          Note: This operation requires BNB for gas fees.
        `;
			}

			return dedent`
        Trading enabled successfully!
        
        Quote tokens have been approved for trading. You can now place orders.
        
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
				return `Error approving allowances: ${error.message}`;
			}
			return "An unknown error occurred while approving allowances";
		}
	},
} as const;
