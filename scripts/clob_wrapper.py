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
except ImportError:
    print(json.dumps({
        "error": "opinion_clob_sdk not installed",
        "message": "Please install: pip install opinion-clob-sdk"
    }), file=sys.stderr)
    sys.exit(1)


def create_client(config: Dict[str, Any]) -> Client:
    """Create and return a configured CLOB client"""
    private_key = config.get("privateKey", "").strip()
    if not private_key:
        raise ValueError("privateKey is required and cannot be empty")
    
    # Ensure private key starts with 0x
    if not private_key.startswith("0x"):
        private_key = f"0x{private_key}"
    
    return Client(
        host=config.get("host", "https://proxy.opinion.trade:8443"),
        apikey=config.get("apikey", ""),
        chain_id=config.get("chainId", 56),
        rpc_url=config.get("rpcUrl", "https://bsc-dataseed.binance.org"),
        private_key=private_key,
        multi_sig_addr=config.get("multiSigAddr", ""),
    )


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
            "data": result.result if hasattr(result, "result") else None,
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
            "data": result.result if hasattr(result, "result") else None,
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
            "data": result.result if hasattr(result, "result") else None,
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
            "data": result.result if hasattr(result, "result") else None,
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
            "data": result.result if hasattr(result, "result") else None,
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
            "data": result.result if hasattr(result, "result") else None,
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
            "data": result.result if hasattr(result, "result") else None,
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
