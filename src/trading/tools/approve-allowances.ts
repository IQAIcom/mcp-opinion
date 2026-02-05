import dedent from "dedent";
import { z } from "zod";
import { ClobService } from "../services/clob-service.js";
import { handleClobError } from "../utils/error-handler.js";

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
			return handleClobError(error, "approving allowances");
		}
	},
} as const;
