import { z } from "zod";
import { API_RESPONSE_CODE } from "../constants.js";
import { config } from "../lib/config.js";
import { fetchJson } from "../lib/http.js";
import {
	ApiResponseSchema,
	type CategoricalMarket,
	CategoricalMarketDetailSchema,
	type LatestPrice,
	LatestPriceSchema,
	type Market,
	MarketDetailSchema,
	type MarketsList,
	MarketsListSchema,
	NullableApiResponseSchema,
	type OrderBook,
	OrderBookSchema,
	type PositionsList,
	PositionsListSchema,
	type PriceHistory,
	PriceHistoryRawSchema,
	type QuoteTokensList,
	QuoteTokensListSchema,
	type TradesList,
	TradesListSchema,
} from "../types.js";

export interface GetMarketsParams {
	page?: number;
	limit?: number;
	status?: number; // 1=CREATED, 2=ACTIVATED, 3=RESOLVING, 4=RESOLVED
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

	private handleResponse<T>(data: {
		errno: number;
		errmsg: string;
		result: T;
	}): T {
		if (data.errno !== API_RESPONSE_CODE.SUCCESS) {
			throw new Error(`Opinion API Error: ${data.errmsg || "Unknown error"}`);
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
		if (params?.status !== undefined) {
			url.searchParams.append("status", params.status.toString());
		}
		if (params?.marketType !== undefined) {
			url.searchParams.append("marketType", params.marketType.toString());
		}
		if (params?.sortBy !== undefined) {
			url.searchParams.append("sortBy", params.sortBy.toString());
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
		const responseSchema = ApiResponseSchema(MarketDetailSchema);

		const data = await fetchJson(
			url,
			{ headers: this.getHeaders() },
			responseSchema,
		);

		return this.handleResponse(data).data;
	}

	/**
	 * Get details for a categorical market by ID
	 */
	async getCategoricalMarket(marketId: number): Promise<CategoricalMarket> {
		this.validateApiKey();

		const url = `${this.baseUrl}/market/categorical/${marketId}`;
		const responseSchema = ApiResponseSchema(CategoricalMarketDetailSchema);

		const data = await fetchJson(
			url,
			{ headers: this.getHeaders() },
			responseSchema,
		);

		return this.handleResponse(data).data;
	}

	/**
	 * Get the latest trade price for a token
	 */
	async getLatestPrice(tokenId: string): Promise<LatestPrice | null> {
		this.validateApiKey();

		const url = new URL(`${this.baseUrl}/token/latest-price`);
		url.searchParams.append("token_id", tokenId);

		const responseSchema = NullableApiResponseSchema(LatestPriceSchema);

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
	async getOrderbook(tokenId: string): Promise<OrderBook | null> {
		this.validateApiKey();

		const url = new URL(`${this.baseUrl}/token/orderbook`);
		url.searchParams.append("token_id", tokenId);

		const responseSchema = NullableApiResponseSchema(OrderBookSchema);

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
	): Promise<PriceHistory | null> {
		this.validateApiKey();

		const url = new URL(`${this.baseUrl}/token/price-history`);
		url.searchParams.append("token_id", tokenId);
		url.searchParams.append("interval", interval);

		const responseSchema = NullableApiResponseSchema(PriceHistoryRawSchema);

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

		const url = new URL(`${this.baseUrl}/positions/user/${walletAddress}`);

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
