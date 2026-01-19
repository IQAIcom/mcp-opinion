import { z } from "zod";
import { API_RESPONSE_CODE } from "../constants.js";
import { config } from "../lib/config.js";
import { fetchJson } from "../lib/http.js";
import {
	ApiResponseSchema,
	type CategoricalMarket,
	CategoricalMarketSchema,
	type LatestPrice,
	LatestPriceSchema,
	type Market,
	MarketSchema,
	type MarketsList,
	MarketsListSchema,
	type OrderBook,
	OrderBookSchema,
	type PositionsList,
	PositionsListSchema,
	type PriceHistory,
	PriceHistorySchema,
	type QuoteTokensList,
	QuoteTokensListSchema,
	type TradesList,
	TradesListSchema,
} from "../types.js";

export interface GetMarketsParams {
	page?: number;
	limit?: number;
	status?: "activated" | "resolved";
	marketType?: 0 | 1 | 2; // 0=Binary, 1=Categorical, 2=All
	sortBy?: number;
}

export interface GetUserDataParams {
	page?: number;
	limit?: number;
}

export type PriceInterval = "1m" | "5m" | "1h" | "1d";

export class OpinionAPIService {
	private readonly apiKey: string;
	private readonly baseUrl: string;

	constructor() {
		this.apiKey = config.opinion.apiKey;
		this.baseUrl = config.opinion.baseUrl;
	}

	private getHeaders(): HeadersInit {
		return {
			apikey: this.apiKey,
			"Content-Type": "application/json",
		};
	}

	private validateApiKey(): void {
		if (!this.apiKey) {
			throw new Error(
				"Opinion API key is not configured. Please set the OPINION_API_KEY environment variable.",
			);
		}
	}

	private handleResponse<T>(data: { code: number; msg: string; result: T }): T {
		if (data.code !== API_RESPONSE_CODE.SUCCESS) {
			throw new Error(`Opinion API Error: ${data.msg}`);
		}
		return data.result;
	}

	/**
	 * Get a list of markets with optional filters
	 */
	async getMarkets(params?: GetMarketsParams): Promise<MarketsList> {
		this.validateApiKey();

		const url = new URL(`${this.baseUrl}/market`);

		if (params?.page !== undefined) {
			url.searchParams.append("page", params.page.toString());
		}
		if (params?.limit !== undefined) {
			url.searchParams.append("limit", params.limit.toString());
		}
		if (params?.status) {
			url.searchParams.append("status", params.status);
		}
		if (params?.marketType !== undefined) {
			url.searchParams.append("market_type", params.marketType.toString());
		}
		if (params?.sortBy !== undefined) {
			url.searchParams.append("sort_by", params.sortBy.toString());
		}

		const responseSchema = ApiResponseSchema(MarketsListSchema);
		const data = await fetchJson(
			url.toString(),
			{ headers: this.getHeaders() },
			responseSchema,
		);

		return this.handleResponse(data);
	}

	/**
	 * Get details for a specific market by ID
	 */
	async getMarketDetails(marketId: number): Promise<Market> {
		this.validateApiKey();

		const url = `${this.baseUrl}/market/${marketId}`;
		const responseSchema = ApiResponseSchema(MarketSchema);

		const data = await fetchJson(
			url,
			{ headers: this.getHeaders() },
			responseSchema,
		);

		return this.handleResponse(data);
	}

	/**
	 * Get details for a categorical market by ID
	 */
	async getCategoricalMarket(marketId: number): Promise<CategoricalMarket> {
		this.validateApiKey();

		const url = `${this.baseUrl}/market/categorical/${marketId}`;
		const responseSchema = ApiResponseSchema(CategoricalMarketSchema);

		const data = await fetchJson(
			url,
			{ headers: this.getHeaders() },
			responseSchema,
		);

		return this.handleResponse(data);
	}

	/**
	 * Get the latest trade price for a token
	 */
	async getLatestPrice(tokenId: string): Promise<LatestPrice> {
		this.validateApiKey();

		const url = new URL(`${this.baseUrl}/token/latest-price`);
		url.searchParams.append("token_id", tokenId);

		const responseSchema = ApiResponseSchema(LatestPriceSchema);

		const data = await fetchJson(
			url.toString(),
			{ headers: this.getHeaders() },
			responseSchema,
		);

		return this.handleResponse(data);
	}

	/**
	 * Get the order book (bids and asks) for a token
	 */
	async getOrderbook(tokenId: string): Promise<OrderBook> {
		this.validateApiKey();

		const url = new URL(`${this.baseUrl}/token/orderbook`);
		url.searchParams.append("token_id", tokenId);

		const responseSchema = ApiResponseSchema(OrderBookSchema);

		const data = await fetchJson(
			url.toString(),
			{ headers: this.getHeaders() },
			responseSchema,
		);

		return this.handleResponse(data);
	}

	/**
	 * Get historical price data for a token
	 */
	async getPriceHistory(
		tokenId: string,
		interval: PriceInterval = "1h",
	): Promise<PriceHistory> {
		this.validateApiKey();

		const url = new URL(`${this.baseUrl}/token/price-history`);
		url.searchParams.append("token_id", tokenId);
		url.searchParams.append("interval", interval);

		const responseSchema = ApiResponseSchema(PriceHistorySchema);

		const data = await fetchJson(
			url.toString(),
			{ headers: this.getHeaders() },
			responseSchema,
		);

		return this.handleResponse(data);
	}

	/**
	 * Get user positions by wallet address
	 */
	async getUserPositions(
		walletAddress: string,
		params?: GetUserDataParams,
	): Promise<PositionsList> {
		this.validateApiKey();

		const url = new URL(`${this.baseUrl}/position/user/${walletAddress}`);

		if (params?.page !== undefined) {
			url.searchParams.append("page", params.page.toString());
		}
		if (params?.limit !== undefined) {
			url.searchParams.append("limit", params.limit.toString());
		}

		const responseSchema = ApiResponseSchema(PositionsListSchema);

		const data = await fetchJson(
			url.toString(),
			{ headers: this.getHeaders() },
			responseSchema,
		);

		return this.handleResponse(data);
	}

	/**
	 * Get user trade history by wallet address
	 */
	async getUserTrades(
		walletAddress: string,
		params?: GetUserDataParams,
	): Promise<TradesList> {
		this.validateApiKey();

		const url = new URL(`${this.baseUrl}/trade/user/${walletAddress}`);

		if (params?.page !== undefined) {
			url.searchParams.append("page", params.page.toString());
		}
		if (params?.limit !== undefined) {
			url.searchParams.append("limit", params.limit.toString());
		}

		const responseSchema = ApiResponseSchema(TradesListSchema);

		const data = await fetchJson(
			url.toString(),
			{ headers: this.getHeaders() },
			responseSchema,
		);

		return this.handleResponse(data);
	}

	/**
	 * Get available quote tokens (currencies)
	 */
	async getQuoteTokens(): Promise<QuoteTokensList> {
		this.validateApiKey();

		const url = `${this.baseUrl}/quoteToken`;
		const responseSchema = ApiResponseSchema(QuoteTokensListSchema);

		const data = await fetchJson(
			url,
			{ headers: this.getHeaders() },
			responseSchema,
		);

		return this.handleResponse(data);
	}
}
