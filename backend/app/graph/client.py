"""Unified TigerGraph Client Interface with Dual-Engine Architecture.

Provides seamless connectivity to live TigerGraph Savanna / Enterprise REST++
endpoints, with an automatic in-memory graph simulator (NetworkX-backed)
for zero-friction local testing, benchmarking, and offline demo execution.
"""

from typing import Any, Dict, List, Optional, Set
import os
import time
import logging
import networkx as nx
import httpx

logger = logging.getLogger("TigerGraphClient")


class BaseGraphClient:
    """Abstract interface defining required TigerGraph GSQL capabilities."""

    def get_transaction(self, txn_id: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError

    def get_customer(self, customer_id: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError

    def query_transaction_neighborhood(self, txn_id: str, depth: int = 2) -> Dict[str, Any]:
        raise NotImplementedError

    def query_device_reuse(self, device_id: str, threshold: int = 2) -> Dict[str, Any]:
        raise NotImplementedError

    def query_ip_reuse(self, ip_address: str, threshold: int = 2) -> Dict[str, Any]:
        raise NotImplementedError

    def query_shared_identity(self, customer_id: str) -> Dict[str, Any]:
        raise NotImplementedError

    def query_temporal_velocity(self, account_id: str, window_seconds: int = 300) -> Dict[str, Any]:
        raise NotImplementedError

    def query_similar_cases(self, pattern_name: str = "", min_risk: float = 0.50, top_k: int = 5) -> Dict[str, Any]:
        raise NotImplementedError

    def run_community_detection(self, max_iterations: int = 10) -> Dict[str, Any]:
        raise NotImplementedError


class InMemoryTigerGraphSimulator(BaseGraphClient):
    """High-fidelity in-memory graph simulator implementing TigerGraph GSQL queries."""

    def __init__(self):
        self.graph = nx.MultiDiGraph()
        self.vertices: Dict[str, Dict[str, Any]] = {}
        self.cases: Dict[str, Dict[str, Any]] = {}
        self.patterns: Dict[str, Dict[str, Any]] = {}

    def _ensure_seeded(self):
        if len(self.graph) == 0:
            logger.info("Graph simulator is empty. Auto-seeding initial benchmark dataset...")
            try:
                from scripts.ingest.generate_seed_dataset import build_and_seed_dataset
                build_and_seed_dataset()
            except Exception as e:
                logger.warning(f"Auto-seed exception: {e}")

    def add_vertex(self, v_type: str, v_id: str, attributes: Dict[str, Any]):
        node_key = f"{v_type}_{v_id}"
        attrs = {"type": v_type, "id": v_id, **attributes}
        self.vertices[node_key] = attrs
        self.graph.add_node(node_key, **attrs)

    def add_edge(self, from_type: str, from_id: str, to_type: str, to_id: str, edge_type: str, attributes: Optional[Dict[str, Any]] = None):
        u = f"{from_type}_{from_id}"
        v = f"{to_type}_{to_id}"
        attrs = attributes or {}
        attrs["edge_type"] = edge_type
        self.graph.add_edge(u, v, key=edge_type, **attrs)

    def get_transaction(self, txn_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_seeded()
        key = f"Transaction_{txn_id}"
        return self.vertices.get(key)

    def get_customer(self, customer_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_seeded()
        key = f"Customer_{customer_id}"
        return self.vertices.get(key)

    def query_transaction_neighborhood(self, txn_id: str, depth: int = 2) -> Dict[str, Any]:
        self._ensure_seeded()
        start_node = f"Transaction_{txn_id}"
        if start_node not in self.graph:
            return {"nodes": [], "edges": [], "summary": f"Transaction {txn_id} not in graph"}

        # BFS neighborhood expansion up to depth
        sub_nodes: Set[str] = {start_node}
        current_frontier = {start_node}

        for _ in range(depth):
            next_frontier = set()
            for node in current_frontier:
                # Outgoing neighbors
                for nbr in self.graph.successors(node):
                    if nbr not in sub_nodes:
                        sub_nodes.add(nbr)
                        next_frontier.add(nbr)
                # Incoming neighbors (e.g. Account performs Transaction)
                for nbr in self.graph.predecessors(node):
                    if nbr not in sub_nodes:
                        sub_nodes.add(nbr)
                        next_frontier.add(nbr)
            current_frontier = next_frontier

        # Extract subgraph elements
        nodes_list = []
        for n in sub_nodes:
            attrs = self.vertices.get(n, {})
            nodes_list.append({
                "id": attrs.get("id", n),
                "type": attrs.get("type", "Unknown"),
                "attributes": {k: v for k, v in attrs.items() if k not in ("id", "type")}
            })

        edges_list = []
        for u, v, k, data in self.graph.edges(sub_nodes, keys=True, data=True):
            if u in sub_nodes and v in sub_nodes:
                edges_list.append({
                    "source": self.vertices.get(u, {}).get("id", u),
                    "source_type": self.vertices.get(u, {}).get("type", "Unknown"),
                    "target": self.vertices.get(v, {}).get("id", v),
                    "target_type": self.vertices.get(v, {}).get("type", "Unknown"),
                    "type": data.get("edge_type", k),
                    "attributes": {k2: v2 for k2, v2 in data.items() if k2 != "edge_type"}
                })

        return {
            "target_transaction": txn_id,
            "depth": depth,
            "nodes": nodes_list,
            "edges": edges_list,
            "node_count": len(nodes_list),
            "edge_count": len(edges_list)
        }

    def query_device_reuse(self, device_id: str, threshold: int = 2) -> Dict[str, Any]:
        self._ensure_seeded()
        dev_node = f"Device_{device_id}"
        if dev_node not in self.graph:
            return {"device_id": device_id, "is_suspicious": False, "accounts": [], "cards": [], "reused_count": 0}

        connected_txns = [u for u, v, d in self.graph.in_edges(dev_node, data=True) if d.get("edge_type") == "USES_DEVICE"]
        connected_cards = set()
        connected_accounts = set()

        for t_node in connected_txns:
            # Card
            for nbr in self.graph.successors(t_node):
                if nbr.startswith("Card_"):
                    connected_cards.add(self.vertices.get(nbr, {}).get("id"))
            # Account
            for nbr in self.graph.predecessors(t_node):
                if nbr.startswith("Account_"):
                    connected_accounts.add(self.vertices.get(nbr, {}).get("id"))

        reused_count = max(len(connected_cards), len(connected_accounts))
        return {
            "device_id": device_id,
            "is_suspicious": reused_count >= threshold,
            "reused_count": reused_count,
            "cards": list(connected_cards),
            "accounts": list(connected_accounts),
            "transaction_count": len(connected_txns)
        }

    def query_ip_reuse(self, ip_address: str, threshold: int = 2) -> Dict[str, Any]:
        self._ensure_seeded()
        ip_node = f"IP_{ip_address}"
        if ip_node not in self.graph:
            return {"ip_address": ip_address, "is_suspicious": False, "accounts": [], "cards": []}

        connected_txns = [u for u, v, d in self.graph.in_edges(ip_node, data=True) if d.get("edge_type") == "ORIGINATES_FROM_IP"]
        connected_accounts = set()
        connected_cards = set()

        for t_node in connected_txns:
            for nbr in self.graph.predecessors(t_node):
                if nbr.startswith("Account_"):
                    connected_accounts.add(self.vertices.get(nbr, {}).get("id"))
            for nbr in self.graph.successors(t_node):
                if nbr.startswith("Card_"):
                    connected_cards.add(self.vertices.get(nbr, {}).get("id"))

        is_suspicious = len(connected_accounts) >= threshold or len(connected_cards) >= threshold
        return {
            "ip_address": ip_address,
            "is_suspicious": is_suspicious,
            "account_count": len(connected_accounts),
            "card_count": len(connected_cards),
            "accounts": list(connected_accounts),
            "cards": list(connected_cards)
        }

    def query_shared_identity(self, customer_id: str) -> Dict[str, Any]:
        self._ensure_seeded()
        cust_node = f"Customer_{customer_id}"
        if cust_node not in self.graph:
            return {"customer_id": customer_id, "shared_syndicate": False, "connected_customers": []}

        # Customer -> Account -> Transaction -> (Device, IP, Address, Email)
        accounts = [v for u, v, d in self.graph.out_edges(cust_node, data=True) if d.get("edge_type") == "OWNS"]
        txns = []
        for a in accounts:
            txns.extend([v for u, v, d in self.graph.out_edges(a, data=True) if d.get("edge_type") == "PERFORMS_TRANSACTION"])

        pivot_entities = set()
        for t in txns:
            for v in self.graph.successors(t):
                if any(v.startswith(prefix) for prefix in ("Address_", "Email_")):
                    pivot_entities.add(v)

        connected_customers = set()
        for pivot in pivot_entities:
            # reverse to transactions
            rev_txns = self.graph.predecessors(pivot)
            for rt in rev_txns:
                for ra in self.graph.predecessors(rt):
                    if ra.startswith("Account_"):
                        for rc in self.graph.predecessors(ra):
                            if rc.startswith("Customer_") and rc != cust_node:
                                connected_customers.add(self.vertices.get(rc, {}).get("id"))

        return {
            "customer_id": customer_id,
            "shared_syndicate": len(connected_customers) >= 2,
            "connected_customers": list(connected_customers),
            "shared_attributes_count": len(pivot_entities)
        }

    def query_temporal_velocity(self, account_id: str, window_seconds: int = 300) -> Dict[str, Any]:
        self._ensure_seeded()
        acct_node = f"Account_{account_id}"
        if acct_node not in self.graph:
            return {"account_id": account_id, "burst_detected": False, "burst_count": 0, "burst_volume": 0.0}

        txns = []
        for u, v, d in self.graph.out_edges(acct_node, data=True):
            if d.get("edge_type") == "PERFORMS_TRANSACTION":
                t_attrs = self.vertices.get(v, {})
                txns.append({
                    "id": t_attrs.get("id"),
                    "amount": float(t_attrs.get("amount", 0.0)),
                    "timestamp": int(t_attrs.get("timestamp", 0))
                })

        txns.sort(key=lambda x: x["timestamp"], reverse=True)
        burst_count = 0
        burst_volume = 0.0

        for i in range(len(txns)):
            for j in range(i + 1, len(txns)):
                if txns[i]["timestamp"] - txns[j]["timestamp"] <= window_seconds:
                    burst_count += 1
                    burst_volume += txns[i]["amount"]

        return {
            "account_id": account_id,
            "total_transactions": len(txns),
            "burst_detected": burst_count >= 3,
            "burst_count": burst_count,
            "burst_volume": round(burst_volume, 2),
            "transactions": txns[:10]
        }

    def query_similar_cases(self, pattern_name: str = "", min_risk: float = 0.50, top_k: int = 5) -> Dict[str, Any]:
        matched = []
        for c_id, c_data in self.cases.items():
            if c_data.get("risk_score", 0.0) >= min_risk:
                if not pattern_name or c_data.get("pattern") == pattern_name:
                    matched.append(c_data)

        matched.sort(key=lambda x: x.get("risk_score", 0.0), reverse=True)
        return {"matched_cases": matched[:top_k], "total_found": len(matched)}

    def run_community_detection(self, max_iterations: int = 10) -> Dict[str, Any]:
        # Weakly connected components on undirected projection
        undirected = self.graph.to_undirected()
        components = list(nx.connected_components(undirected))
        clusters = []

        for i, comp in enumerate(components):
            if len(comp) >= 3:
                clusters.append({
                    "community_id": i + 1,
                    "size": len(comp),
                    "members": [self.vertices.get(n, {}).get("id", n) for n in list(comp)[:10]]
                })

        clusters.sort(key=lambda x: x["size"], reverse=True)
        return {
            "algorithm": "WeaklyConnectedComponents",
            "total_communities": len(components),
            "suspicious_clusters": clusters[:10]
        }


class TigerGraphRESTClient(BaseGraphClient):
    """Client for live TigerGraph REST++ GSQL endpoints."""

    def __init__(self, host: str, graph: str, token: Optional[str] = None):
        self.host = host.rstrip("/")
        self.graph = graph
        self.headers = {"Authorization": f"Bearer {token}"} if token else {}

    def _post_query(self, query_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.host}/query/{self.graph}/{query_name}"
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, json=params, headers=self.headers)
                res.raise_for_status()
                return res.json().get("results", [{}])[0]
        except Exception as e:
            logger.error(f"Error querying TigerGraph endpoint {query_name}: {e}")
            return {"error": str(e)}

    def get_transaction(self, txn_id: str) -> Optional[Dict[str, Any]]:
        url = f"{self.host}/graph/{self.graph}/vertices/Transaction/{txn_id}"
        try:
            with httpx.Client(timeout=5.0) as client:
                res = client.get(url, headers=self.headers)
                if res.status_code == 200:
                    return res.json().get("results", [{}])[0].get("attributes")
        except Exception as e:
            logger.warning(f"Failed to fetch vertex Transaction {txn_id}: {e}")
        return None

    def get_customer(self, customer_id: str) -> Optional[Dict[str, Any]]:
        url = f"{self.host}/graph/{self.graph}/vertices/Customer/{customer_id}"
        try:
            with httpx.Client(timeout=5.0) as client:
                res = client.get(url, headers=self.headers)
                if res.status_code == 200:
                    return res.json().get("results", [{}])[0].get("attributes")
        except Exception as e:
            logger.warning(f"Failed to fetch vertex Customer {customer_id}: {e}")
        return None

    def query_transaction_neighborhood(self, txn_id: str, depth: int = 2) -> Dict[str, Any]:
        return self._post_query("transaction_neighborhood", {"target_txn": txn_id, "depth": depth})

    def query_device_reuse(self, device_id: str, threshold: int = 2) -> Dict[str, Any]:
        return self._post_query("device_reuse_detection", {"target_device_id": device_id, "threshold": threshold})

    def query_ip_reuse(self, ip_address: str, threshold: int = 2) -> Dict[str, Any]:
        return self._post_query("ip_reuse_detection", {"target_ip": ip_address, "min_accounts": threshold})

    def query_shared_identity(self, customer_id: str) -> Dict[str, Any]:
        return self._post_query("shared_identity_attributes", {"target_customer": customer_id})

    def query_temporal_velocity(self, account_id: str, window_seconds: int = 300) -> Dict[str, Any]:
        return self._post_query("temporal_velocity_burst", {"target_account": account_id, "window_seconds": window_seconds})

    def query_similar_cases(self, pattern_name: str = "", min_risk: float = 0.50, top_k: int = 5) -> Dict[str, Any]:
        return self._post_query("similar_cases", {"target_pattern_name": pattern_name, "min_risk": min_risk, "top_k": top_k})

    def run_community_detection(self, max_iterations: int = 10) -> Dict[str, Any]:
        return self._post_query("community_detection", {"max_iter": max_iterations})


# Global singleton instance
_GLOBAL_GRAPH_CLIENT: Optional[BaseGraphClient] = None

def get_default_graph_client() -> BaseGraphClient:
    """Returns configured TigerGraph client, auto-fallback to in-memory simulator."""
    global _GLOBAL_GRAPH_CLIENT
    if _GLOBAL_GRAPH_CLIENT is None:
        tg_host = os.getenv("TIGERGRAPH_HOST")
        tg_graph = os.getenv("TIGERGRAPH_GRAPH", "FraudInvestigationGraph")
        tg_token = os.getenv("TIGERGRAPH_API_TOKEN")

        if tg_host and tg_host.startswith("http"):
            logger.info(f"Connecting to live TigerGraph at {tg_host} (Graph: {tg_graph})")
            _GLOBAL_GRAPH_CLIENT = TigerGraphRESTClient(host=tg_host, graph=tg_graph, token=tg_token)
        else:
            logger.info("Initializing high-fidelity InMemoryTigerGraphSimulator (NetworkX engine)")
            _GLOBAL_GRAPH_CLIENT = InMemoryTigerGraphSimulator()

    return _GLOBAL_GRAPH_CLIENT
