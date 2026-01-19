// src/constants.ts

export const APP_NAME = "Opinion MCP Server";
export const APP_VERSION = "0.0.1";

// Opinion API configuration
export const OPINION_API_BASE = "https://proxy.opinion.trade:8443/openapi";

// BNB Chain IDs
export const BNB_CHAIN_ID = 56;
export const BNB_TESTNET_CHAIN_ID = 97;

// Market status values
export const MARKET_STATUS = {
	ACTIVATED: "activated",
	RESOLVED: "resolved",
} as const;

// Market types
export const MARKET_TYPE = {
	BINARY: 0,
	CATEGORICAL: 1,
	ALL: 2,
} as const;

// Price history intervals
export const PRICE_INTERVAL = {
	ONE_MINUTE: "1m",
	FIVE_MINUTES: "5m",
	ONE_HOUR: "1h",
	ONE_DAY: "1d",
} as const;

// API response codes
export const API_RESPONSE_CODE = {
	SUCCESS: 0,
} as const;

// Rate limit (requests per second)
export const RATE_LIMIT = 15;

// Default pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 20;
