# Opinion MCP Server

MCP server for interacting with [Opinion.trade](https://opinion.trade) prediction markets on BNB Chain.

## Features

- **Market Data**: Browse and search prediction markets
- **Order Books**: View real-time bid/ask spreads
- **Price History**: Access historical OHLCV data
- **User Portfolios**: Check positions and trade history
- **Quote Tokens**: List available trading currencies

## Installation

```bash
# Clone the repository
git clone https://github.com/IQAIcom/mcp-opinion
cd mcp-opinion

# Install dependencies
pnpm install

# Build
pnpm run build
```

## Configuration

### Required Environment Variable

```bash
OPINION_API_KEY=your_api_key_here
```

To obtain an API key, apply through the [Opinion Builders Program](https://docs.google.com/forms/d/1h7gp8UffZeXzYQ-lv4jcou9PoRNOqMAQhyW4IwZDnII).

### Optional Environment Variables

```bash
# BNB Chain ID (default: 56 for mainnet, use 97 for testnet)
OPINION_CHAIN_ID=56

# Required for trading tools (see Trading Tools section)
OPINION_PRIVATE_KEY=your_private_key_here
```

### Private Key Setup

The `OPINION_PRIVATE_KEY` is your wallet's private key (the same one you use with MetaMask or other wallets).

**⚠️ Security Warning**: Never commit your private key to version control or share it publicly.

**How to get your private key:**
- **MetaMask**: Account menu → Account details → Show private key
- **Other wallets**: Check your wallet's export/backup options

**Best practices:**
- Use a separate trading wallet with limited funds
- Store the key securely (password manager, encrypted storage)
- Use environment variables, never hardcode in files

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "opinion": {
      "command": "node",
      "args": ["/path/to/mcp-opinion/dist/index.js"],
      "env": {
        "OPINION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Or if published to npm:

```json
{
  "mcpServers": {
    "opinion": {
      "command": "npx",
      "args": ["mcp-opinion"],
      "env": {
        "OPINION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Available Tools

### Market Tools

| Tool | Description |
|------|-------------|
| `GET_MARKETS` | List prediction markets with filters (status, type, pagination) |
| `GET_MARKET_DETAILS` | Get detailed information about a specific market |
| `SEARCH_MARKETS` | Search markets by keyword in question, description, or tags |

### Token Tools

| Tool | Description |
|------|-------------|
| `GET_ORDERBOOK` | View the order book (bids/asks) for a token |
| `GET_PRICE_HISTORY` | Get historical OHLCV price data |
| `GET_LATEST_PRICE` | Get the current/latest trade price |

### User Tools

| Tool | Description |
|------|-------------|
| `GET_POSITIONS` | Get positions held by a wallet address |
| `GET_TRADE_HISTORY` | Get trade history for a wallet address |

### Reference Tools

| Tool | Description |
|------|-------------|
| `GET_QUOTE_TOKENS` | List available quote currencies for trading |

### Trading Tools (Requires OPINION_PRIVATE_KEY)

| Tool | Description |
|------|-------------|
| `PLACE_ORDER` | Place a limit or market order |
| `PLACE_MARKET_ORDER` | Place a market order (executes immediately) |
| `CANCEL_ORDER` | Cancel an order by ID |
| `GET_OPEN_ORDERS` | Get your open orders with optional filters |
| `GET_BALANCES` | Get your token balances |
| `APPROVE_ALLOWANCES` | Approve quote tokens for trading (required once) |

## Usage Examples

### List Active Markets

```
Use GET_MARKETS with limit: 5, status: "activated"
```

### Search for Markets

```
Use SEARCH_MARKETS with query: "bitcoin", limit: 10
```

### Check Order Book

```
Use GET_ORDERBOOK with tokenId: "0x1234..."
```

### View Price History

```
Use GET_PRICE_HISTORY with tokenId: "0x1234...", interval: "1h"
```

### Check Wallet Positions

```
Use GET_POSITIONS with walletAddress: "0xYourWallet..."
```

## Development

```bash
# Watch mode
pnpm run watch

# Run development server
pnpm run start

# Lint
pnpm run lint

# Format
pnpm run format
```

## API Reference

This MCP server uses the Opinion OpenAPI:

- **Base URL**: `https://proxy.opinion.trade:8443/openapi`
- **Rate Limit**: 15 requests/second per API key
- **Documentation**: [Opinion Developer Guide](https://docs.opinion.trade/developer-guide/opinion-open-api)

## Trading Tools (Beta)

Trading tools are available when `OPINION_PRIVATE_KEY` is set. These tools use the Opinion CLOB SDK via a Python wrapper.

### Prerequisites

1. **Python 3** installed on your system
2. **Opinion CLOB SDK** installed:
   
   **Option 1: Using project virtual environment (recommended)**
   ```bash
   # Create virtual environment
   python3 -m venv venv
   
   # Activate it
   source venv/bin/activate  # On macOS/Linux
   # or
   venv\Scripts\activate     # On Windows
   
   # Install SDK
   pip install -r requirements.txt
   ```
   
   **Option 2: System-wide installation**
   ```bash
   pip install opinion-clob-sdk
   # or with user flag on macOS
   pip install --user opinion-clob-sdk
   ```
3. **OPINION_PRIVATE_KEY** environment variable set (see [Private Key Setup](#private-key-setup) below)

### Available Trading Tools

| Tool | Description |
|------|-------------|
| `PLACE_ORDER` | Place a limit or market order |
| `PLACE_MARKET_ORDER` | Place a market order (executes immediately) |
| `CANCEL_ORDER` | Cancel an order by ID |
| `GET_OPEN_ORDERS` | Get your open orders with optional filters |
| `GET_BALANCES` | Get your token balances |
| `APPROVE_ALLOWANCES` | Approve quote tokens for trading (required once) |

### Trading Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "opinion": {
      "command": "node",
      "args": ["/path/to/mcp-opinion/dist/index.js"],
      "env": {
        "OPINION_API_KEY": "your_api_key_here",
        "OPINION_PRIVATE_KEY": "your_private_key_here",
        "OPINION_CHAIN_ID": "56"
      }
    }
  }
}
```

**⚠️ Security Warning**: Never commit your private key to version control. Use environment variables or secure secret management.

## Related Projects

- [Polymarket MCP](https://github.com/IQAIcom/mcp-polymarket) - Similar MCP server for Polymarket
- [Opinion Python SDK](https://pypi.org/project/opinion-clob-sdk/) - Python SDK for trading

## License

MIT
