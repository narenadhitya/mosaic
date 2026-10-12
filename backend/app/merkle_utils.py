import hashlib
import json
from typing import List, Dict, Any, Tuple

def sha256_hex(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()

def canonical_event_hash(event: Dict[str, Any]) -> str:
    # Deterministic serialization
    canonical = json.dumps(event, sort_keys=True)
    return sha256_hex(canonical)

def build_merkle_tree(leaf_hashes: List[str]) -> Tuple[str, List[List[str]]]:
    if not leaf_hashes:
        return "", []
    
    levels = [leaf_hashes]
    current = leaf_hashes
    
    while len(current) > 1:
        next_level = []
        for i in range(0, len(current), 2):
            left = current[i]
            right = current[i + 1] if i + 1 < len(current) else left
            combined = sha256_hex(left + right)
            next_level.append(combined)
        levels.append(next_level)
        current = next_level
        
    return current[0], levels

def get_merkle_proof(leaf_index: int, levels: List[List[str]]) -> List[Dict[str, str]]:
    proof = []
    idx = leaf_index
    for level in levels[:-1]:
        is_right = idx % 2 == 1
        sibling_idx = idx - 1 if is_right else idx + 1
        if sibling_idx < len(level):
            sibling_hash = level[sibling_idx]
        else:
            sibling_hash = level[idx] # paired with itself if odd
        proof.append({
            "position": "left" if is_right else "right",
            "hash": sibling_hash
        })
        idx = idx // 2
    return proof

def verify_merkle_proof(leaf_hash: str, proof: List[Dict[str, str]], expected_root: str) -> bool:
    current = leaf_hash
    for p in proof:
        if p["position"] == "left":
            current = sha256_hex(p["hash"] + current)
        else:
            current = sha256_hex(current + p["hash"])
    return current == expected_root
