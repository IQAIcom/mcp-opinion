export const config = {
	opinion: {
		baseUrl: "https://proxy.opinion.trade:8443/openapi",
		apiKey: process.env.OPINION_API_KEY || "",
		chainId: Number.parseInt(process.env.OPINION_CHAIN_ID || "56"),
		// Reserved for future trading support
		privateKey: process.env.OPINION_PRIVATE_KEY,
	},
};
