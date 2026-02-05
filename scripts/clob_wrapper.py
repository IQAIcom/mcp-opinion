#!/usr/bin/env python3
"""
Opinion CLOB SDK Wrapper for Node.js
Handles trading operations via the Opinion CLOB SDK
"""

import json
import sys
from typing import Any, Dict, Optional

try:
    from opinion_clob_sdk import Client
    from opinion_clob_sdk.chain.py_order_utils.model.order import PlaceOrderDataInput
    from opinion_clob_sdk.chain.py_order_utils.model.sides import OrderSide
    from opinion_clob_sdk.chain.py_order_utils.model.order_type import LIMIT_ORDER, MARKET_ORDER
    # Monkey-patch to handle empty multi_sig_addr
    from opinion_clob_sdk.chain.safe.utils import fast_to_checksum_address as original_fast_to_checksum_address
    from typing import Union
    from eth_typing.evm import ChecksumAddress, AnyAddress
    from eth_account import Account
    from eth_utils import to_checksum_address
    
    def patched_fast_to_checksum_address(value: Union[AnyAddress, str, bytes, None]) -> Union[ChecksumAddress, None]:
        """Patched version that handles None and empty strings"""
        if value is None or (isinstance(value, str) and value.strip() == ""):
            return None
        return original_fast_to_checksum_address(value)
    
    # Apply the patch
    import opinion_clob_sdk.sdk as sdk_module
    sdk_module.fast_to_checksum_address = patched_fast_to_checksum_address
except ImportError:
    print(json.dumps({
        "error": "opinion_clob_sdk not installed",
        "message": "Please install: pip install opinion-clob-sdk"
    }), file=sys.stderr)
    sys.exit(1)


def serialize_result_data(result_data: Any) -> Any:
    """Convert SDK result objects to JSON-serializable format"""
    if result_data is None:
        return None
    
    # If it's already a basic type, return as-is
    if isinstance(result_data, (dict, list, str, int, float, bool)):
        # Recursively process dicts and lists
        if isinstance(result_data, dict):
            return {k: serialize_result_data(v) for k, v in result_data.items()}
        elif isinstance(result_data, list):
            return [serialize_result_data(item) for item in result_data]
        return result_data
    
    # Try to convert object to dict
    if hasattr(result_data, "__dict__"):
        return serialize_result_data(result_data.__dict__)
    elif hasattr(result_data, "dict"):
        # Pydantic models have .dict() method
        return serialize_result_data(result_data.dict())
    elif hasattr(result_data, "model_dump"):
        # Pydantic v2 has .model_dump() method
        return serialize_result_data(result_data.model_dump())
    else:
        # Fallback: convert to string
        return str(result_data)


def create_client(config: Dict[str, Any]) -> Client:
    """Create and return a configured CLOB client"""
    private_key = config.get("privateKey", "").strip()
    if not private_key:
        raise ValueError("privateKey is required and cannot be empty")
    
    # Ensure private key starts with 0x
    if not private_key.startswith("0x"):
        private_key = f"0x{private_key}"
    
    # Get multi_sig_addr - if not provided, derive wallet address from private key
    # The SDK uses multi_sig_addr for allowance checks, so we need a valid address
    multi_sig_addr_raw = config.get("multiSigAddr", "")
    multi_sig_addr = multi_sig_addr_raw.strip() if multi_sig_addr_raw else None
    
    # If no multi_sig_addr provided, derive wallet address from private key
    # This allows regular wallets (non-multi-sig) to work
    if not multi_sig_addr:
        try:
            account = Account.from_key(private_key)
            multi_sig_addr = to_checksum_address(account.address)
        except Exception as e:
            raise ValueError(f"Failed to derive wallet address from private key: {e}")
    
    # Get API key - don't pass empty string
    apikey = config.get("apikey", "").strip() if config.get("apikey") else None
    
    client_params = {
        "host": config.get("host", "https://proxy.opinion.trade:8443"),
        "chain_id": config.get("chainId", 56),
        "rpc_url": config.get("rpcUrl", "https://bsc-dataseed.binance.org"),
        "private_key": private_key,
        "multi_sig_addr": multi_sig_addr,  # Always provide a valid address
    }
    
    # Only add apikey if it's provided and non-empty
    if apikey:
        client_params["apikey"] = apikey
    
    # Debug: print what we're passing (redact private key)
    import os
    if os.getenv("DEBUG"):
        debug_params = {**client_params, "private_key": f"{private_key[:8]}...{private_key[-6:]}"}
        print(f"[DEBUG] Client params: {debug_params}", file=sys.stderr)
    
    return Client(**client_params)


def place_order(config: Dict[str, Any], order_data: Dict[str, Any]) -> Dict[str, Any]:
    """Place a limit or market order"""
    try:
        client = create_client(config)

        # Validate required fields
        market_id = order_data.get("marketId")
        token_id = order_data.get("tokenId")
        if market_id is None or token_id is None:
            return {
                "success": False,
                "error": "Missing required order parameters: marketId and tokenId are required",
                "errno": -1,
                "errmsg": "Missing required order parameters: marketId and tokenId are required",
            }

        # Map order type
        order_type = LIMIT_ORDER if order_data.get("orderType") == "LIMIT" else MARKET_ORDER

        # Map side with explicit validation
        side_str = order_data.get("side")
        if side_str == "BUY":
            side = OrderSide.BUY
        elif side_str == "SELL":
            side = OrderSide.SELL
        else:
            return {
                "success": False,
                "error": f"Invalid order side: {side_str}. Must be 'BUY' or 'SELL'",
                "errno": -1,
                "errmsg": f"Invalid order side: {side_str}. Must be 'BUY' or 'SELL'",
            }

        # Build order input
        order_input = PlaceOrderDataInput(
            marketId=market_id,
            tokenId=token_id,
            side=side,
            orderType=order_type,
            price=order_data.get("price", "0"),
            makerAmountInQuoteToken=order_data.get("makerAmountInQuoteToken"),
            makerAmountInBaseToken=order_data.get("makerAmountInBaseToken"),
        )
        
        check_approval = order_data.get("checkApproval", False)
        result = client.place_order(order_input, check_approval=check_approval)
        
        return {
            "success": result.errno == 0,
            "errno": result.errno,
            "errmsg": result.errmsg,
            "data": serialize_result_data(result.result) if hasattr(result, "result") else None,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "errno": -1,
            "errmsg": str(e),
        }


def cancel_order(config: Dict[str, Any], order_id: Optional[str]) -> Dict[str, Any]:
    """Cancel a single order"""
    try:
        # Validate required parameter
        if not order_id:
            return {
                "success": False,
                "error": "Missing required parameter: orderId",
                "errno": -1,
                "errmsg": "Missing required parameter: orderId",
            }

        client = create_client(config)
        result = client.cancel_order(order_id)
        
        return {
            "success": result.errno == 0,
            "errno": result.errno,
            "errmsg": result.errmsg,
            "data": serialize_result_data(result.result) if hasattr(result, "result") else None,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "errno": -1,
            "errmsg": str(e),
        }


def cancel_orders_batch(config: Dict[str, Any], order_ids: list) -> Dict[str, Any]:
    """Cancel multiple orders"""
    try:
        client = create_client(config)
        result = client.cancel_orders_batch(order_ids)
        
        return {
            "success": result.errno == 0,
            "errno": result.errno,
            "errmsg": result.errmsg,
            "data": serialize_result_data(result.result) if hasattr(result, "result") else None,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "errno": -1,
            "errmsg": str(e),
        }


def cancel_all_orders(config: Dict[str, Any], market_id: Optional[int] = None, side: Optional[str] = None) -> Dict[str, Any]:
    """Cancel all orders, optionally filtered by market and side"""
    try:
        client = create_client(config)
        order_side = OrderSide.BUY if side == "BUY" else (OrderSide.SELL if side == "SELL" else None)
        result = client.cancel_all_orders(market_id=market_id, side=order_side)
        
        return {
            "success": result.errno == 0,
            "errno": result.errno,
            "errmsg": result.errmsg,
            "data": serialize_result_data(result.result) if hasattr(result, "result") else None,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "errno": -1,
            "errmsg": str(e),
        }


def get_my_orders(config: Dict[str, Any], market_id: Optional[int] = None, status: Optional[str] = None, page: Optional[int] = None, limit: Optional[int] = None) -> Dict[str, Any]:
    """Get user's orders with optional filters"""
    try:
        client = create_client(config)
        result = client.get_my_orders(
            market_id=market_id,
            status=status,
            page=page,
            limit=limit,
        )
        
        return {
            "success": result.errno == 0,
            "errno": result.errno,
            "errmsg": result.errmsg,
            "data": serialize_result_data(result.result) if hasattr(result, "result") else None,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "errno": -1,
            "errmsg": str(e),
        }


def get_my_balances(config: Dict[str, Any]) -> Dict[str, Any]:
    """Get user's token balances"""
    try:
        client = create_client(config)
        result = client.get_my_balances()
        
        return {
            "success": result.errno == 0,
            "errno": result.errno,
            "errmsg": result.errmsg,
            "data": serialize_result_data(result.result) if hasattr(result, "result") else None,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "errno": -1,
            "errmsg": str(e),
        }


def enable_trading(config: Dict[str, Any]) -> Dict[str, Any]:
    """Approve quote tokens for trading"""
    try:
        client = create_client(config)
        
        # Ensure addresses are checksummed before calling enable_trading
        # Get quote tokens and checksum addresses using Web3
        from web3 import Web3
        quote_token_list_response = client.get_quote_tokens()
        quote_token_list = client._parse_list_response(quote_token_list_response, "get quote tokens")
        
        supported_quote_tokens: dict = {}
        for quote_token in quote_token_list:
            # Use Web3's to_checksum_address to ensure proper checksumming
            quote_token_address = Web3.to_checksum_address(quote_token.quote_token_address)
            ctf_exchange_address = Web3.to_checksum_address(quote_token.ctf_exchange_address)
            supported_quote_tokens[quote_token_address] = ctf_exchange_address
        
        if len(supported_quote_tokens) == 0:
            from opinion_clob_sdk.sdk import OpenApiError
            raise OpenApiError('No supported quote tokens found')
        
        # Call enable_trading directly on contract_caller with checksummed addresses
        tx_hash, safe_tx_hash, return_value = client.contract_caller.enable_trading(supported_quote_tokens)
        result = client._format_transaction_result(tx_hash, safe_tx_hash, return_value)
        
        return {
            "success": True,
            "errno": 0,
            "errmsg": "",
            "data": serialize_result_data(result) if result else None,
        }
    except Exception as e:
        # Provide more detailed error information
        error_msg = str(e)
        error_details = error_msg
        
        # Check for common issues
        if "Could not transact" in error_msg or "contract function" in error_msg:
            # This could be due to:
            # 1. RPC endpoint issues
            # 2. Insufficient BNB for gas
            # 3. Network connectivity
            # 4. Contract deployment issues
            error_details = (
                f"{error_msg}\n\n"
                "Possible causes:\n"
                "1. RPC endpoint may be unavailable or slow\n"
                "2. Wallet may not have sufficient BNB for gas fees\n"
                "3. Network connectivity issues\n"
                "4. Contract may not be deployed on this chain\n\n"
                f"RPC URL: {config.get('rpcUrl', 'Not set')}\n"
                f"Chain ID: {config.get('chainId', 'Not set')}\n"
                f"Wallet: {client.contract_caller.multi_sig_addr if 'client' in locals() else 'Unknown'}"
            )
        elif "InvalidAddress" in error_msg or "checksum" in error_msg.lower():
            error_details = (
                f"{error_msg}\n\n"
                "This error indicates an address checksumming issue. "
                "The addresses should be automatically checksummed, but if this error persists, "
                "it may be a compatibility issue with the Web3.py version."
            )
        
        return {
            "success": False,
            "error": error_details,
            "errno": -1,
            "errmsg": error_msg,
        }


def main():
    """Main entry point - parse command and execute"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Missing command",
            "message": "Usage: clob_wrapper.py <command> [args_json]"
        }), file=sys.stderr)
        sys.exit(1)
    
    command = sys.argv[1]
    
    try:
        args = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    except json.JSONDecodeError:
        print(json.dumps({
            "error": "Invalid JSON",
            "message": "Arguments must be valid JSON"
        }), file=sys.stderr)
        sys.exit(1)
    
    config = args.get("config", {})
    
    try:
        if command == "place_order":
            result = place_order(config, args.get("order", {}))
        elif command == "cancel_order":
            result = cancel_order(config, args.get("orderId"))
        elif command == "cancel_orders_batch":
            result = cancel_orders_batch(config, args.get("orderIds", []))
        elif command == "cancel_all_orders":
            result = cancel_all_orders(
                config,
                market_id=args.get("marketId"),
                side=args.get("side"),
            )
        elif command == "get_my_orders":
            result = get_my_orders(
                config,
                market_id=args.get("marketId"),
                status=args.get("status"),
                page=args.get("page"),
                limit=args.get("limit"),
            )
        elif command == "get_my_balances":
            result = get_my_balances(config)
        elif command == "enable_trading":
            result = enable_trading(config)
        else:
            result = {
                "success": False,
                "error": f"Unknown command: {command}",
                "errno": -1,
                "errmsg": f"Unknown command: {command}",
            }
        
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "errno": -1,
            "errmsg": str(e),
        }), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
