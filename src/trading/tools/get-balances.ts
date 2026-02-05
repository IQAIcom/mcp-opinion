import dedent from "dedent";
import { z } from "zod";
import { ClobService } from "../services/clob-service.js";
import { handleClobError } from "../utils/error-handler.js";

export const getBalancesTool = {
	name: "GET_BALANCES",
	description:
		"Get your token balances on Opinion.trade. Requires OPINION_PRIVATE_KEY to be set.",
	parameters: z.object({}),
	execute: async () => {
		try {
			const clobService = new ClobService();
			const result = await clobService.getMyBalances();

			if (!result.success) {
				return dedent`
          Failed to fetch balances:
          Error Code: ${result.errno}
          Error Message: ${result.errmsg}
          ${result.error ? `Details: ${result.error}` : ""}
        `;
			}

			const balances = result.data as
				| { balances?: unknown[]; data?: { balances?: unknown[] } }
				| unknown[]
				| null
				| undefined;

			if (!balances) {
				return "No balance data available.";
			}

			const balanceList = Array.isArray(balances)
				? balances
				: (balances as { balances?: unknown[] })?.balances ||
					(balances as { data?: { balances?: unknown[] } })?.data?.balances ||
					[];

			if (balanceList.length === 0) {
				return "No token balances found.";
			}

			return dedent`
        Token Balances:
        
        ${JSON.stringify(balanceList, null, 2)}
      `;
		} catch (error) {
			return handleClobError(error, "fetching balances");
		}
	},
} as const;
