from app.graph_engine import analyze_payment_graph

def run_test():
    # 1. Clean Graph
    clean = analyze_payment_graph(include_fraud=False)
    print("CLEAN GRAPH:")
    print("Topology Status:", clean["metrics"]["topology_status"])
    print("Anomalies Count:", len(clean["anomalies"]))
    print("Health Score:", clean["metrics"]["health_score"])

    # 2. Fraud Scenario Graph
    fraud = analyze_payment_graph(include_fraud=True)
    print("\nFRAUD GRAPH:")
    print("Topology Status:", fraud["metrics"]["topology_status"])
    print("Anomalies Count:", len(fraud["anomalies"]))
    print("Health Score:", fraud["metrics"]["health_score"])
    for a in fraud["anomalies"]:
        safe_title = a['title'].replace('\u20b9', 'Rs.')
        print(f"  - [{a['severity']}] {a['type']}: {safe_title}")

    has_vpa_degree = any(a["type"] == "VPA_DEGREE_ANOMALY" for a in fraud["anomalies"])
    attacker_node = next((n for n in fraud["nodes"] if n["id"] == "maintenance.sunrise@icici"), None)
    
    print("\nAttacker Node Found:", attacker_node is not None)
    print("Attacker Node Is Anomaly:", attacker_node["is_anomaly"] if attacker_node else False)
    print("VPA_DEGREE_ANOMALY Finding Present:", has_vpa_degree)
    
    assert clean["metrics"]["topology_status"] == "CLEAN_STAR_TOPOLOGY"
    assert len(clean["anomalies"]) == 0
    assert fraud["metrics"]["topology_status"] == "TOPOLOGY_COMPROMISED"
    assert has_vpa_degree is True
    assert attacker_node is not None
    assert attacker_node["is_anomaly"] is True
    print("\n*** ALL PHASE 3 BACKEND EXIT CONDITIONS VERIFIED SUCCESSFULLY ***")

if __name__ == "__main__":
    run_test()
