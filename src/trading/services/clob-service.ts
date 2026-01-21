import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../../lib/config.js";

// Resolve path to scripts directory relative to project root
// From src/trading/services/clob-service.ts -> project root -> scripts/
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "../../../");
const PYTHON_SCRIPT = join(PROJECT_ROOT, "scripts/clob_wrapper.py");
const VENV_PYTHON = join(PROJECT_ROOT, "venv/bin/python3");

export interface ClobResponse<T = unknown> {
	success: boolean;
	errno: number;
	errmsg: string;
	data?: T;
	error?: string;
}

export interface PlaceOrderParams {
	marketId: number;
	tokenId: string;
	side: "BUY" | "SELL";
	orderType: "LIMIT" | "MARKET";
	price: string;
	makerAmountInQuoteToken?: string;
	makerAmountInBaseToken?: string;
	checkApproval?: boolean;
}

export interface CancelOrderParams {
	orderId: string;
}

export interface CancelOrdersBatchParams {
	orderIds: string[];
}

export interface CancelAllOrdersParams {
	marketId?: number;
	side?: "BUY" | "SELL";
}

export interface GetMyOrdersParams {
	marketId?: number;
	status?: string;
	page?: number;
	limit?: number;
}

/**
 * Service for interacting with Opinion CLOB SDK via Python wrapper
 */
export class ClobService {
	private readonly config: {
		host: string;
		apikey: string;
		chainId: number;
		rpcUrl: string;
		privateKey: string;
		multiSigAddr?: string;
	};

	constructor() {
		const privateKey = config.opinion.privateKey?.trim();
		if (!privateKey || privateKey.length === 0) {
			throw new Error(
				"OPINION_PRIVATE_KEY is required for trading operations. Please set it as an environment variable.",
			);
		}

		// Validate private key format (should be 64 hex characters + optional 0x prefix = 66 chars total)
		const keyWithoutPrefix = privateKey.startsWith("0x")
			? privateKey.slice(2)
			: privateKey;
		
		if (keyWithoutPrefix.length !== 64 || !/^[0-9a-fA-F]+$/.test(keyWithoutPrefix)) {
			throw new Error(
				"OPINION_PRIVATE_KEY must be a valid 64-character hexadecimal string (with or without 0x prefix)",
			);
		}

		// Ensure private key starts with 0x if it doesn't already
		const normalizedPrivateKey = privateKey.startsWith("0x")
			? privateKey
			: `0x${privateKey}`;

		this.config = {
			host: "https://proxy.opinion.trade:8443",
			apikey: config.opinion.apiKey,
			chainId: config.opinion.chainId,
			rpcUrl:
				config.opinion.chainId === 56
					? "https://bsc-dataseed.binance.org"
					: "https://data-seed-prebsc-1-s1.binance.org:8545",
			privateKey: normalizedPrivateKey,
		};
	}

	/**
	 * Execute a Python command and return the result
	 */
	private async executePython(
		command: string,
		args: Record<string, unknown> | object,
	): Promise<ClobResponse> {
		return new Promise((resolve, reject) => {
			const pythonArgs = [
				PYTHON_SCRIPT,
				command,
				JSON.stringify({
					config: this.config,
					...(args as Record<string, unknown>),
				}),
			];

			// Try to use venv Python if available, otherwise fall back to system python3
			const pythonExecutable = existsSync(VENV_PYTHON)
				? VENV_PYTHON
				: "python3";

			const python = spawn(pythonExecutable, pythonArgs, {
				stdio: ["pipe", "pipe", "pipe"],
			});

			let stdout = "";
			let stderr = "";

			python.stdout.on("data", (data) => {
				stdout += data.toString();
			});

			python.stderr.on("data", (data) => {
				stderr += data.toString();
			});

			python.on("close", (code) => {
				if (code !== 0) {
					try {
						const error = JSON.parse(stderr || stdout);
						reject(
							new Error(error.message || error.error || "Python script failed"),
						);
					} catch {
						reject(
							new Error(
								`Python script failed with code ${code}: ${stderr || stdout}`,
							),
						);
					}
					return;
				}

				try {
					const result = JSON.parse(stdout);
					resolve(result);
				} catch (error) {
					reject(
						new Error(
							`Failed to parse Python output: ${stdout}\nError: ${error}`,
						),
					);
				}
			});

			python.on("error", (error) => {
				reject(
					new Error(
						`Failed to spawn Python process: ${error.message}. Make sure Python 3 and opinion-clob-sdk are installed.`,
					),
				);
			});
		});
	}

	/**
	 * Place a limit or market order
	 */
	async placeOrder(params: PlaceOrderParams): Promise<ClobResponse> {
		return this.executePython("place_order", { order: params });
	}

	/**
	 * Cancel a single order
	 */
	async cancelOrder(params: CancelOrderParams): Promise<ClobResponse> {
		return this.executePython("cancel_order", params);
	}

	/**
	 * Cancel multiple orders
	 */
	async cancelOrdersBatch(
		params: CancelOrdersBatchParams,
	): Promise<ClobResponse> {
		return this.executePython("cancel_orders_batch", params);
	}

	/**
	 * Cancel all orders, optionally filtered
	 */
	async cancelAllOrders(
		params: CancelAllOrdersParams = {},
	): Promise<ClobResponse> {
		return this.executePython("cancel_all_orders", params);
	}

	/**
	 * Get user's open orders
	 */
	async getMyOrders(params: GetMyOrdersParams = {}): Promise<ClobResponse> {
		return this.executePython("get_my_orders", params);
	}

	/**
	 * Get user's token balances
	 */
	async getMyBalances(): Promise<ClobResponse> {
		return this.executePython("get_my_balances", {});
	}

	/**
	 * Approve quote tokens for trading
	 */
	async enableTrading(): Promise<ClobResponse> {
		return this.executePython("enable_trading", {});
	}
}
