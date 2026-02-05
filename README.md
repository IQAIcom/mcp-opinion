# 🔮 Opinion MCP Server

[![npm version](https://img.shields.io/npm/v/@iqai/mcp-opinion.svg)](https://www.npmjs.com/package/@iqai/mcp-opinion)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 📖 Overview

The Opinion MCP Server enables AI agents to interact with [Opinion.trade](https://opinion.trade), a prediction market platform on the BNB Chain. This server provides comprehensive access to market data, real-time pricing, order books, and user portfolio information.

By implementing the Model Context Protocol (MCP), this server allows Large Language Models (LLMs) to discover prediction markets, analyze odds (probabilities), and track trading activity directly through their context window, bridging the gap between AI and decentralized prediction markets.

## ✨ Features

*   **Market Discovery**: Search and filter prediction markets by status, type (binary/categorical), and keywords.
*   **Real-time Pricing**: Access live price data, implied probabilities, and depth-of-market (order books) for any outcome token.
*   **Portfolio Tracking**: Monitor user positions, trade history, and unrealized PnL for specific wallet addresses.
*   **Metadata Access**: Retrieve detailed market rules, resolution criteria, and available quote tokens.

## 📦 Installation

### 🚀 Using npx (Recommended)

To use this server without installing it globally:

```bash
npx @iqai/mcp-opinion
```

### 🔧 Build from Source

```bash
git clone https://github.com/IQAIcom/mcp-opinion.git
cd mcp-opinion
pnpm install
pnpm run build
```

**Note:** The Python virtual environment is only needed for trading tools. Read-only tools work without it.

## ⚡ Running with an MCP Client

Add the following configuration to your MCP client settings (e.g., `claude_desktop_config.json`).

### 📋 Minimal Configuration

```json
{
  "mcpServers": {
    "opinion": {
      "command": "npx",
      "args": ["-y", "@iqai/mcp-opinion"],
      "env": {
        "OPINION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### ⚙️ Advanced Configuration (Local Build)

```json
{
  "mcpServers": {
    "opinion": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-opinion/dist/index.js"],
      "env": {
        "OPINION_API_KEY": "your_api_key_here",
        "OPINION_CHAIN_ID": "56"
      }
    }
  }
}
```

## 🔐 Configuration (Environment Variables)

| Variable | Required | Description | Default |
| :--- | :--- | :--- | :--- |
| `OPINION_API_KEY` | Yes | Your Opinion.trade API key | - |
| `OPINION_CHAIN_ID` | No | BNB Chain ID (56 for Mainnet, 97 for Testnet) | `56` |
| `OPINION_PRIVATE_KEY` | No | Reserved for future trading capabilities | - |

## 💡 Usage Examples

### 🔍 Market Discovery
*   "What are the trending prediction markets on Opinion right now?"
*   "Search for markets related to 'Bitcoin' or 'BTC'."
*   "Find active markets about the US Election."

### 📊 Analytics & Pricing
*   "Show me the order book for token 0x123... and check the spread."
*   "What is the current probability implied by the price of the 'Yes' token?"
*   "Get the 1-hour price history for this market token over the last 24 hours."

### 💼 Portfolio Management
*   "What positions am I currently holding in wallet 0xabc...?"
*   "Summarize my trade history for the last month."
*   "Check if I have any winning positions that need to be redeemed."

## 🛠️ MCP Tools

<!-- AUTO-GENERATED TOOLS START -->

### `GET_LATEST_PRICE`
Get the current/latest trade price for a prediction market token

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenId` | string | ✅ | The token ID to get the latest price for |

### `GET_MARKET_DETAILS`
Get detailed information about a specific prediction market by its ID

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `marketId` | number | ✅ | The unique identifier of the market |

### `GET_MARKETS`
Get a list of prediction markets from Opinion.trade with optional filters for status and market type

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number |  | 10 | Number of markets to return (max 20) |
| `status` | number |  |  | Filter by status: 1=Created, 2=Active, 3=Resolving, 4=Resolved |
| `marketType` | number |  |  | Market type: 0=Binary, 1=Categorical, 2=All |
| `page` | number |  |  | Page number for pagination |

### `GET_ORDERBOOK`
Get the order book (bids and asks) for a specific prediction market token

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenId` | string | ✅ | The token ID to get the order book for |

### `GET_POSITIONS`
Get the current prediction market positions held by a wallet address

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `walletAddress` | string | ✅ |  | The wallet address to get positions for |
| `limit` | number |  | 20 | Maximum number of positions to return |
| `page` | number |  |  | Page number for pagination |

### `GET_PRICE_HISTORY`
Get historical price data for a prediction market token

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tokenId` | string | ✅ |  | The token ID to get price history for |
| `interval` | string |  | "1h" | Time interval: 1m (1 minute), 5m (5 minutes), 1h (1 hour), 1d (1 day) |

### `GET_QUOTE_TOKENS`
Get the list of available quote tokens (currencies) that can be used for trading on Opinion.trade

_No parameters_

### `GET_TRADE_HISTORY`
Get the trade history for a wallet address on Opinion.trade

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `walletAddress` | string | ✅ |  | The wallet address to get trade history for |
| `limit` | number |  | 20 | Maximum number of trades to return |
| `page` | number |  |  | Page number for pagination |

### `SEARCH_MARKETS`
Search for prediction markets by keyword in the market title

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | ✅ |  | Search keyword to find in market titles |
| `limit` | number |  | 10 | Maximum number of results to return |
| `status` | number |  |  | Filter by status: 1=Created, 2=Active, 3=Resolving, 4=Resolved |

<!-- AUTO-GENERATED TOOLS END -->

### Trading tools (write)

These tools modify state or access wallet-specific data. They are only registered when `OPINION_PRIVATE_KEY` is set. **Never commit or share your private key.**

| Tool | Description |
|------|-------------|
| `PLACE_ORDER` | Place a limit or market order |
| `PLACE_MARKET_ORDER` | Place a market order (executes immediately) |
| `CANCEL_ORDER` | Cancel an order by ID |
| `GET_OPEN_ORDERS` | Get your open orders with optional filters |
| `GET_BALANCES` | Get your token balances |
| `APPROVE_ALLOWANCES` | Approve quote tokens for trading (required once before placing orders) |

## 👨‍💻 Development

### 🏗️ Build Project
```bash
pnpm run build
```

### 👁️ Development Mode (Watch)
```bash
pnpm run watch
```

### ✅ Linting & Formatting
```bash
pnpm run lint
pnpm run format
```

### 📁 Project Structure
*   `src/tools/`: Individual tool definitions
*   `src/services/`: API client and business logic
*   `src/lib/`: Shared utilities
*   `src/index.ts`: Server entry point

## 📚 Resources

*   [Opinion.trade API Documentation](https://docs.opinion.trade/developer-guide/opinion-open-api)
*   [Model Context Protocol (MCP)](https://modelcontextprotocol.io)
*   [Opinion.trade Platform](https://opinion.trade)

## ⚠️ Disclaimer

This project is an unofficial tool and is not directly affiliated with Opinion.trade. It interacts with financial and prediction market data. Users should exercise caution and verify all data independently. Trading in prediction markets involves risk.

## 📄 License

[MIT](LICENSE)
