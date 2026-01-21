// src/types.ts
import { z } from "zod";

// Generic API response wrapper (Opinion uses errno/errmsg)
export const ApiResponseSchema = <T extends z.ZodTypeAny>(resultSchema: T) =>
	z.object({
		errno: z.number(),
		errmsg: z.string(),
		result: resultSchema,
	});

// Nullable version for endpoints that may return null
export const NullableApiResponseSchema = <T extends z.ZodTypeAny>(
	resultSchema: T,
) =>
	z.object({
		errno: z.number(),
		errmsg: z.string(),
		result: resultSchema.nullable(),
	});

// Market status enum (numeric)
export const MarketStatusEnum = {
	CREATED: 1,
	ACTIVATED: 2,
	RESOLVING: 3,
	RESOLVED: 4,
} as const;

// Market schema matching actual Opinion API
export const MarketSchema = z.object({
	marketId: z.number(),
	marketTitle: z.string(),
	status: z.number(), // 1=CREATED, 2=ACTIVATED, 3=RESOLVING, 4=RESOLVED
	marketType: z.number(), // 0=Binary, 1=Categorical
	conditionId: z.string().optional(),
	quoteToken: z.string().optional(),
	chainId: z.string().optional(),
	volume: z.string().optional(),
	yesTokenId: z.string().optional(),
	noTokenId: z.string().optional(),
	resultTokenId: z.string().nullable().optional(),
	yesLabel: z.string().optional(),
	noLabel: z.string().optional(),
	rules: z.string().optional(),
	cutoffAt: z.number().nullable().optional(),
	resolvedAt: z.number().nullable().optional(),
	// Additional fields that may be present
	description: z.string().optional(),
	imageUrl: z.string().optional(),
	tags: z.array(z.string()).optional(),
});

export type Market = z.infer<typeof MarketSchema>;

// Markets list response
export const MarketsListSchema = z.object({
	list: z.array(MarketSchema),
	total: z.number().optional(),
});

export type MarketsList = z.infer<typeof MarketsListSchema>;

// Market detail response (single market wrapped in data)
export const MarketDetailSchema = z.object({
	data: MarketSchema,
});

export type MarketDetail = z.infer<typeof MarketDetailSchema>;

// Categorical market option
export const CategoricalOptionSchema = z.object({
	optionId: z.string().optional(),
	label: z.string(),
	tokenId: z.string(),
	volume: z.string().optional(),
});

// Categorical market schema (extended)
export const CategoricalMarketSchema = MarketSchema.extend({
	options: z.array(CategoricalOptionSchema).optional(),
});

export type CategoricalMarket = z.infer<typeof CategoricalMarketSchema>;

// Categorical market detail response
export const CategoricalMarketDetailSchema = z.object({
	data: CategoricalMarketSchema,
});

// Order book entry
export const OrderBookEntrySchema = z.object({
	price: z.string(),
	size: z.string(),
});

export type OrderBookEntry = z.infer<typeof OrderBookEntrySchema>;

// Order book schema
export const OrderBookSchema = z.object({
	bids: z.array(OrderBookEntrySchema),
	asks: z.array(OrderBookEntrySchema),
	tokenId: z.string().optional(),
	timestamp: z.number().optional(),
});

export type OrderBook = z.infer<typeof OrderBookSchema>;

// Latest price schema
export const LatestPriceSchema = z.object({
	tokenId: z.string(),
	price: z.string(),
	timestamp: z.number().optional(),
});

export type LatestPrice = z.infer<typeof LatestPriceSchema>;

// Price history entry - API returns simple time/price points (t, p)
export const PriceHistoryEntrySchema = z.object({
	t: z.number(), // timestamp
	p: z.string(), // price
});

export type PriceHistoryEntry = z.infer<typeof PriceHistoryEntrySchema>;

// Price history response - API returns {history: [{t, p}, ...]}
export const PriceHistoryRawSchema = z.object({
	history: z.array(PriceHistoryEntrySchema),
});

export type PriceHistory = z.infer<typeof PriceHistoryRawSchema>;

// User position schema
export const PositionSchema = z.object({
	marketId: z.number(),
	tokenId: z.string(),
	outcome: z.string().optional(),
	size: z.string(),
	avgPrice: z.string().optional(),
	currentPrice: z.string().optional(),
	pnl: z.string().optional(),
	marketTitle: z.string().optional(),
});

export type Position = z.infer<typeof PositionSchema>;

// Positions list response
export const PositionsListSchema = z.object({
	list: z.array(PositionSchema),
	total: z.number().optional(),
});

export type PositionsList = z.infer<typeof PositionsListSchema>;

// Trade schema
export const TradeSchema = z.object({
	tradeId: z.string().optional(),
	marketId: z.number(),
	tokenId: z.string(),
	side: z.string(), // BUY or SELL
	price: z.string(),
	size: z.string(),
	timestamp: z.number(),
	outcome: z.string().optional(),
	marketTitle: z.string().optional(),
});

export type Trade = z.infer<typeof TradeSchema>;

// Trades list response
export const TradesListSchema = z.object({
	list: z.array(TradeSchema),
	total: z.number().optional(),
});

export type TradesList = z.infer<typeof TradesListSchema>;

// Quote token schema
export const QuoteTokenSchema = z.object({
	symbol: z.string(),
	address: z.string(),
	decimals: z.number(),
	name: z.string().optional(),
});

export type QuoteToken = z.infer<typeof QuoteTokenSchema>;

// Quote tokens list response
export const QuoteTokensListSchema = z.array(QuoteTokenSchema);

export type QuoteTokensList = z.infer<typeof QuoteTokensListSchema>;

// Helper to get status label from number
export function getStatusLabel(status: number): string {
	switch (status) {
		case MarketStatusEnum.CREATED:
			return "Created";
		case MarketStatusEnum.ACTIVATED:
			return "Active";
		case MarketStatusEnum.RESOLVING:
			return "Resolving";
		case MarketStatusEnum.RESOLVED:
			return "Resolved";
		default:
			return `Unknown (${status})`;
	}
}
