// src/types.ts
import { z } from "zod";

// Generic API response wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(resultSchema: T) =>
	z.object({
		code: z.number(),
		msg: z.string(),
		result: resultSchema,
	});

// Token schema
export const TokenSchema = z.object({
	token_id: z.string(),
	outcome: z.string(),
	market_id: z.number(),
	winner: z.boolean().optional(),
});

export type Token = z.infer<typeof TokenSchema>;

// Market schema
export const MarketSchema = z.object({
	market_id: z.number(),
	question: z.string(),
	description: z.string().optional(),
	market_type: z.number(), // 0=Binary, 1=Categorical
	status: z.string(), // activated, resolved
	end_date: z.string().optional(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
	volume: z.string().optional(),
	liquidity: z.string().optional(),
	tokens: z.array(TokenSchema).optional(),
	tags: z.array(z.string()).optional(),
	image_url: z.string().optional(),
	resolution_source: z.string().optional(),
});

export type Market = z.infer<typeof MarketSchema>;

// Markets list response
export const MarketsListSchema = z.object({
	list: z.array(MarketSchema),
	total: z.number().optional(),
	page: z.number().optional(),
	limit: z.number().optional(),
});

export type MarketsList = z.infer<typeof MarketsListSchema>;

// Categorical market schema (extended)
export const CategoricalMarketSchema = MarketSchema.extend({
	outcomes: z.array(z.string()).optional(),
});

export type CategoricalMarket = z.infer<typeof CategoricalMarketSchema>;

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
	token_id: z.string().optional(),
	timestamp: z.string().optional(),
});

export type OrderBook = z.infer<typeof OrderBookSchema>;

// Latest price schema
export const LatestPriceSchema = z.object({
	token_id: z.string(),
	price: z.string(),
	timestamp: z.string().optional(),
});

export type LatestPrice = z.infer<typeof LatestPriceSchema>;

// Price history entry (OHLCV)
export const PriceHistoryEntrySchema = z.object({
	timestamp: z.string(),
	open: z.string(),
	high: z.string(),
	low: z.string(),
	close: z.string(),
	volume: z.string().optional(),
});

export type PriceHistoryEntry = z.infer<typeof PriceHistoryEntrySchema>;

// Price history response
export const PriceHistorySchema = z.object({
	token_id: z.string().optional(),
	interval: z.string().optional(),
	history: z.array(PriceHistoryEntrySchema),
});

export type PriceHistory = z.infer<typeof PriceHistorySchema>;

// User position schema
export const PositionSchema = z.object({
	market_id: z.number(),
	token_id: z.string(),
	outcome: z.string(),
	size: z.string(),
	avg_price: z.string().optional(),
	current_price: z.string().optional(),
	pnl: z.string().optional(),
	market_question: z.string().optional(),
});

export type Position = z.infer<typeof PositionSchema>;

// Positions list response
export const PositionsListSchema = z.object({
	list: z.array(PositionSchema),
	total: z.number().optional(),
	page: z.number().optional(),
	limit: z.number().optional(),
});

export type PositionsList = z.infer<typeof PositionsListSchema>;

// Trade schema
export const TradeSchema = z.object({
	trade_id: z.string().optional(),
	market_id: z.number(),
	token_id: z.string(),
	side: z.string(), // BUY or SELL
	price: z.string(),
	size: z.string(),
	timestamp: z.string(),
	outcome: z.string().optional(),
	market_question: z.string().optional(),
});

export type Trade = z.infer<typeof TradeSchema>;

// Trades list response
export const TradesListSchema = z.object({
	list: z.array(TradeSchema),
	total: z.number().optional(),
	page: z.number().optional(),
	limit: z.number().optional(),
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

// Type aliases for API responses
export type MarketsApiResponse = z.infer<
	ReturnType<typeof ApiResponseSchema<typeof MarketsListSchema>>
>;
export type MarketApiResponse = z.infer<
	ReturnType<typeof ApiResponseSchema<typeof MarketSchema>>
>;
export type OrderBookApiResponse = z.infer<
	ReturnType<typeof ApiResponseSchema<typeof OrderBookSchema>>
>;
export type LatestPriceApiResponse = z.infer<
	ReturnType<typeof ApiResponseSchema<typeof LatestPriceSchema>>
>;
export type PriceHistoryApiResponse = z.infer<
	ReturnType<typeof ApiResponseSchema<typeof PriceHistorySchema>>
>;
export type PositionsApiResponse = z.infer<
	ReturnType<typeof ApiResponseSchema<typeof PositionsListSchema>>
>;
export type TradesApiResponse = z.infer<
	ReturnType<typeof ApiResponseSchema<typeof TradesListSchema>>
>;
export type QuoteTokensApiResponse = z.infer<
	ReturnType<typeof ApiResponseSchema<typeof QuoteTokensListSchema>>
>;
