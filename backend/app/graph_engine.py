import networkx as nx
from typing import Dict, Any, List
from collections import defaultdict
from app.database import get_db
from app.config import TRUSTED_VPA, TRUSTED_PAYEE_NAME

def analyze_payment_graph(include_fraud: bool = False) -> Dict[str, Any]:
    """
    Constructs a directed graph using NetworkX from all payment records and executes
    graph-structural intelligence to detect anomalies:
    1. VPA Degree Anomaly
    2. Untrusted VPA
    3. Isolated New Node
    4. Same-Amount Duplicate Route
    5. Star Collapse
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Fetch Residents
        cursor.execute("SELECT id, name, flat_no FROM users WHERE role = 'resident'")
        residents = cursor.fetchall()
        
        # 2. Fetch Payments
        if include_fraud:
            cursor.execute("SELECT * FROM payments ORDER BY created_at ASC")
        else:
            cursor.execute("SELECT * FROM payments WHERE is_fraud_scenario = 0 ORDER BY created_at ASC")
        payments = cursor.fetchall()

    G = nx.DiGraph()
    
    # Track metadata
    node_metadata: Dict[str, Dict[str, Any]] = {}
    
    # Add Trusted Society VPA Node
    G.add_node(TRUSTED_VPA, node_type="vpa_trusted", is_anomaly=False, label="Society VPA (Trusted)")
    node_metadata[TRUSTED_VPA] = {
        "id": TRUSTED_VPA,
        "label": TRUSTED_PAYEE_NAME,
        "sublabel": TRUSTED_VPA,
        "type": "vpa_trusted",
        "is_anomaly": False,
        "trusted": True
    }
    
    # Add Resident Nodes
    for r in residents:
        r_id = r["id"]
        G.add_node(r_id, node_type="resident", is_anomaly=False, label=f"Flat {r['flat_no']}")
        node_metadata[r_id] = {
            "id": r_id,
            "label": f"Flat {r['flat_no']}",
            "sublabel": r["name"],
            "type": "resident",
            "is_anomaly": False,
            "flat_no": r["flat_no"]
        }

    # Add Payments and Directed Edges:
    # Resident -> Payment Node -> VPA Node
    vpa_to_payers = defaultdict(set)
    vpa_to_payments = defaultdict(list)
    amount_vpa_routes = defaultdict(list)
    
    for p in payments:
        p_node_id = f"PAY_{p['id']}"
        target_vpa = p["target_vpa"]
        is_fraud = bool(p["is_fraud_scenario"])
        
        # Add payment node
        G.add_node(p_node_id, node_type="payment", is_anomaly=is_fraud)
        node_metadata[p_node_id] = {
            "id": p_node_id,
            "label": f"₹{p['amount_paise']/100:,.0f}",
            "sublabel": p["status"],
            "type": "payment_fraud" if is_fraud else "payment",
            "is_anomaly": is_fraud,
            "payment_id": p["id"],
            "amount_paise": p["amount_paise"],
            "trace_id": p["trace_id"],
            "target_vpa": target_vpa,
            "payer_user_id": p["user_id"],
            "flat_no": p["flat_no"],
            "created_at": p["created_at"]
        }
        
        # Ensure target VPA node exists
        if target_vpa not in G:
            is_untrusted_vpa = (target_vpa != TRUSTED_VPA)
            G.add_node(target_vpa, node_type="vpa_untrusted" if is_untrusted_vpa else "vpa_trusted", is_anomaly=is_untrusted_vpa)
            node_metadata[target_vpa] = {
                "id": target_vpa,
                "label": p["target_payee_name"],
                "sublabel": target_vpa,
                "type": "vpa_untrusted" if is_untrusted_vpa else "vpa_trusted",
                "is_anomaly": is_untrusted_vpa,
                "trusted": not is_untrusted_vpa
            }
            
        # Add edges
        G.add_edge(p["user_id"], p_node_id, edge_type="initiates", is_anomaly=is_fraud)
        G.add_edge(p_node_id, target_vpa, edge_type="routes_to", is_anomaly=is_fraud)
        
        vpa_to_payers[target_vpa].add(p["user_id"])
        vpa_to_payments[target_vpa].append(p)
        amount_vpa_routes[(target_vpa, p["amount_paise"])].append(p)

    # =========================================================================
    # STRUCTURAL ANOMALY DETECTION ENGINE
    # =========================================================================
    anomalies: List[Dict[str, Any]] = []
    anomalous_node_ids = set()

    # Pattern 1 & 2 & 5: Analyze each distinct VPA
    for vpa, payer_set in vpa_to_payers.items():
        if vpa != TRUSTED_VPA:
            num_payers = len(payer_set)
            num_payments = len(vpa_to_payments[vpa])
            anomalous_node_ids.add(vpa)
            
            # 1. Untrusted VPA finding
            anomalies.append({
                "type": "UNTRUSTED_VPA",
                "severity": "HIGH",
                "title": f"Untrusted Destination VPA: {vpa}",
                "description": f"Payment address '{vpa}' is not registered with Sunrise Housing Society. Any external VPA collection is unapproved.",
                "affected_vpa": vpa,
                "affected_payers_count": num_payers,
                "affected_nodes": list(payer_set) + [vpa]
            })
            
            # 2. VPA Degree Anomaly (3 or more residents routing to untrusted VPA)
            if num_payers >= 3:
                anomalies.append({
                    "type": "VPA_DEGREE_ANOMALY",
                    "severity": "CRITICAL",
                    "title": f"Payee Substitution Attack (Degree: {num_payers})",
                    "description": f"CRITICAL: {num_payers} distinct residents routed maintenance payments to unregistered VPA '{vpa}'. Structural graph anomaly indicates widespread payee substitution in society communication channels.",
                    "affected_vpa": vpa,
                    "affected_payers_count": num_payers,
                    "affected_nodes": list(payer_set) + [vpa]
                })

            # 3. Star Collapse (many payment edges converging on unregistered address)
            if num_payments >= 5:
                anomalies.append({
                    "type": "STAR_COLLAPSE",
                    "severity": "CRITICAL",
                    "title": "Star Topology Collapse",
                    "description": f"Legitimate star topology collapsed as {num_payments} transaction edges converge on rogue node '{vpa}'.",
                    "affected_vpa": vpa,
                    "affected_payers_count": num_payers,
                    "affected_nodes": [vpa]
                })

            # 4. Isolated New Node (cold-start risk receiving substantial money)
            total_untrusted_paise = sum(p["amount_paise"] for p in vpa_to_payments[vpa])
            if total_untrusted_paise >= 2000000: # >= Rs 20,000
                anomalies.append({
                    "type": "ISOLATED_NEW_NODE",
                    "severity": "HIGH",
                    "title": f"Cold-Start High-Volume Node: {vpa}",
                    "description": f"Unregistered node '{vpa}' received ₹{total_untrusted_paise/100:,.0f} with no historical tenure in the society graph.",
                    "affected_vpa": vpa,
                    "affected_payers_count": num_payers,
                    "affected_nodes": [vpa]
                })

    # Pattern 5: Same-Amount Duplicate Route
    for (vpa, amt_paise), dup_list in amount_vpa_routes.items():
        if vpa != TRUSTED_VPA and len(dup_list) >= 2:
            anomalies.append({
                "type": "SAME_AMOUNT_DUPLICATE_ROUTE",
                "severity": "HIGH",
                "title": f"Duplicate Route Pattern (₹{amt_paise/100:,.0f})",
                "description": f"{len(dup_list)} payments with identical amount ₹{amt_paise/100:,.0f} routed to untrusted payee '{vpa}' with different invoice references.",
                "affected_vpa": vpa,
                "affected_payers_count": len(dup_list),
                "affected_nodes": [f"PAY_{p['id']}" for p in dup_list] + [vpa]
            })

    # Mark affected nodes
    for a in anomalies:
        for nid in a.get("affected_nodes", []):
            if nid in node_metadata:
                node_metadata[nid]["is_anomaly"] = True
                node_metadata[nid]["anomaly_severity"] = a["severity"]

    # Format nodes and links for D3 / SVG rendering
    nodes_out = []
    for node_id, meta in node_metadata.items():
        nodes_out.append(meta)

    links_out = []
    for u, v, data in G.edges(data=True):
        is_edge_anomaly = bool(node_metadata.get(u, {}).get("is_anomaly") or node_metadata.get(v, {}).get("is_anomaly"))
        links_out.append({
            "source": u,
            "target": v,
            "type": data.get("edge_type", "routes"),
            "is_anomaly": is_edge_anomaly
        })

    # Topology Health Metric
    is_clean = len(anomalies) == 0
    health_score = 100 if is_clean else max(20, 100 - (len(anomalies) * 20))

    return {
        "nodes": nodes_out,
        "links": links_out,
        "anomalies": anomalies,
        "fraud_scenario_active": include_fraud,
        "metrics": {
            "total_nodes": len(nodes_out),
            "total_edges": len(links_out),
            "anomalies_count": len(anomalies),
            "topology_status": "CLEAN_STAR_TOPOLOGY" if is_clean else "TOPOLOGY_COMPROMISED",
            "health_score": health_score,
            "trusted_vpa": TRUSTED_VPA
        }
    }
