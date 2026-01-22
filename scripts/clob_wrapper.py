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
    
    # Get multi_sig_addr - SDK has a bug where it tries to normalize empty strings
    # We need to either pass None (if SDK accepts it) or a valid address
    # Since SDK defaults to '', we'll pass None explicitly to see if it handles it
    multi_sig_addr_raw = config.get("multiSigAddr", "")
    multi_sig_addr = multi_sig_addr_raw.strip() if multi_sig_addr_raw else None
    
    # Get API key - don't pass empty string
    apikey = config.get("apikey", "").strip() if config.get("apikey") else None
    
    client_params = {
        "host": config.get("host", "https://proxy.opinion.trade:8443"),
        "chain_id": config.get("chainId", 56),
        "rpc_url": config.get("rpcUrl", "https://bsc-dataseed.binance.org"),
        "private_key": private_key,
    }
    
    # Only add apikey if it's provided and non-empty
    if apikey:
        client_params["apikey"] = apikey
    
    # SDK bug: it normalizes multi_sig_addr even if empty, causing errors
    # We've monkey-patched fast_to_checksum_address to handle empty strings
    # So we can safely pass empty string and it will return None
    # But we still need to handle the ContractCaller - let's pass empty string
    # and let our patch handle it, OR pass a dummy address
    # Actually, let's check if ContractCaller handles None
    # For now, pass empty string and let the patch convert it to None
    # But wait - the patch returns None, but ContractCaller might not accept None
    # Let's just pass the empty string and let the patch handle the normalization
    if multi_sig_addr:
        client_params["multi_sig_addr"] = multi_sig_addr
    # If empty, don't pass it - let SDK use default and our patch will handle it
    
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
        
        # Map order type
        order_type = LIMIT_ORDER if order_data.get("orderType") == "LIMIT" else MARKET_ORDER
        
        # Map side
        side = OrderSide.BUY if order_data.get("side") == "BUY" else OrderSide.SELL
        
        # Build order input
        order_input = PlaceOrderDataInput(
            marketId=order_data["marketId"],
            tokenId=order_data["tokenId"],
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


def cancel_order(config: Dict[str, Any], order_id: str) -> Dict[str, Any]:
    """Cancel a single order"""
    try:
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
        result = client.enable_trading()
        
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
            result = cancel_order(config, args.get("orderId", ""))
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
