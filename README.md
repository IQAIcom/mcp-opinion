# Opinion MCP Server

[![npm version](https://img.shields.io/npm/v/@iqai/mcp-opinion.svg)](https://www.npmjs.com/package/@iqai/mcp-opinion)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server for interacting with [Opinion.trade](https://opinion.trade) prediction markets on BNB Chain. This server provides tools for retrieving market data, order books, and user portfolios, enabling AI agents to interact with Opinion prediction markets seamlessly.

## Features

### Market Data Tools
- **GET_MARKETS**: List prediction markets with filtering by status, type, and pagination
- **GET_MARKET_DETAILS**: Get detailed information about a specific market
- **SEARCH_MARKETS**: Search markets by keyword in question, description, or tags

### Token Tools
- **GET_ORDERBOOK**: View the order book (bids/asks) for a specific token
- **GET_PRICE_HISTORY**: Get historical OHLCV price data with configurable intervals
- **GET_LATEST_PRICE**: Get the current/latest trade price for a token

### User Tools
- **GET_POSITIONS**: Get positions held by a wallet address
- **GET_TRADE_HISTORY**: Get trade history for a wallet address

### Reference Tools
- **GET_QUOTE_TOKENS**: List available quote currencies for trading

## Quick Start

### Using with npx (Recommended)

The easiest way to use this MCP server is with `npx`:

```json
{
  "mcpServers": {
    "opinion": {
      "command": "npx",
      "args": ["@iqai/mcp-opinion"],
      "env": {
        "OPINION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Manual Installation (For Development)

```bash
git clone https://github.com/IQAIcom/mcp-opinion
cd mcp-opinion
pnpm install
pnpm run build
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPINION_API_KEY` | Yes | Your Opinion API key |
| `OPINION_CHAIN_ID` | No | BNB Chain ID (default: 56 for mainnet, use 97 for testnet) |
| `OPINION_PRIVATE_KEY` | No | Reserved for future trading support |

### Getting API Credentials

1. Visit the [Opinion Builders Program](https://docs.google.com/forms/d/1h7gp8UffZeXzYQ-lv4jcou9PoRNOqMAQhyW4IwZDnII)
2. Fill out the application form
3. Once approved, you'll receive your API key
4. Store your API key securely

### For Claude Desktop

Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "opinion": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-opinion/dist/index.js"],
      "env": {
        "OPINION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Usage Examples

### Sample Questions for AI Agents

**Market Discovery:**
- "What prediction markets are currently active on Opinion?"
- "Search for markets related to cryptocurrency"
- "Show me details for market ID 12345"

**Price Data:**
- "What's the current price for token 0x1234...?"
- "Show me the order book for this token"
- "Get the hourly price history for the past week"

**Portfolio:**
- "What positions does wallet 0xABC... hold?"
- "Show me the trade history for my wallet"

### Detailed Examples

#### List Active Markets
```
Show me 5 active prediction markets on Opinion
```

#### Search Markets
```
Search for Bitcoin-related markets
```

#### Check Order Book
```
Show me the order book for token 0x1234...
```

#### View Price History
```
Get the 1-hour price history for token 0x1234...
```

## API Documentation

This server uses the Opinion OpenAPI:
- **Base URL**: `https://proxy.opinion.trade:8443/openapi`
- **Rate Limit**: 15 requests/second per API key
- [Official API Documentation](https://docs.opinion.trade/developer-guide/opinion-open-api)

## Development

### Build
```bash
pnpm run build
```

### Development Mode
```bash
pnpm run watch
```

### Run Server
```bash
pnpm run start
```

### Linting and Formatting
```bash
pnpm run lint
pnpm run format
```

## Project Structure

```
mcp-opinion/
├── src/
│   ├── lib/
│   │   └── config.ts          # Configuration management
│   ├── services/
│   │   └── opinion-client.ts  # API client
│   ├── tools/
│   │   ├── get-markets.ts     # Market listing tool
│   │   ├── get-market-details.ts
│   │   ├── search-markets.ts
│   │   ├── get-orderbook.ts
│   │   ├── get-price-history.ts
│   │   ├── get-latest-price.ts
│   │   ├── get-positions.ts
│   │   ├── get-trade-history.ts
│   │   └── get-quote-tokens.ts
│   └── index.ts               # MCP server entry point
├── dist/                      # Compiled output
├── package.json
└── README.md
```

## Technologies

- **TypeScript**: Type-safe development
- **fastmcp**: MCP server implementation
- **Zod**: Parameter validation
- **Biome**: Linting and formatting

## Future Enhancements

Trading support via the Opinion CLOB SDK is planned for a future release:
- Place limit orders
- Place market orders
- Cancel orders
- Manage open orders
- Token approvals

## Disclaimer

This is an unofficial tool and is not affiliated with Opinion.trade. Use at your own risk. Always verify transactions and understand the risks involved in prediction market trading.

## Related Projects

- [Polymarket MCP](https://github.com/IQAIcom/mcp-polymarket) - MCP server for Polymarket
- [Kalshi MCP](https://github.com/IQAIcom/mcp-kalshi) - MCP server for Kalshi
- [Limitless MCP](https://github.com/IQAIcom/mcp-limitless) - MCP server for Limitless
- [Opinion Python SDK](https://pypi.org/project/opinion-clob-sdk/) - Python SDK for trading

## License

MIT
