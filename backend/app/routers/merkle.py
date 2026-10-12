from fastapi import APIRouter, HTTPException
import json
from app.database import get_db
from app.merkle_utils import build_merkle_tree, get_merkle_proof, verify_merkle_proof

router = APIRouter(prefix="/api/merkle", tags=["Merkle Forest"])

@router.get("/epoch/latest")
def get_latest_epoch():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM merkle_epochs ORDER BY epoch_id DESC LIMIT 1")
        epoch = cursor.fetchone()
        if not epoch:
            raise HTTPException(status_code=404, detail="No Merkle epoch found")
        
        leaf_hashes = json.loads(epoch["leaf_hashes_json"])
        _, levels = build_merkle_tree(leaf_hashes)
        
        cursor.execute("SELECT * FROM merkle_events ORDER BY index_num ASC")
        events = [
            {
                "index": r["index_num"],
                "event_type": r["event_type"],
                "trace_id": r["trace_id"],
                "timestamp": r["timestamp"],
                "payload_hash": r["payload_hash"],
                "details": json.loads(r["details_json"])
            }
            for r in cursor.fetchall()
        ]
        
        return {
            "epoch_id": epoch["epoch_id"],
            "root_hash": epoch["root_hash"],
            "event_count": epoch["event_count"],
            "closed_at": epoch["closed_at"],
            "leaf_hashes": leaf_hashes,
            "levels": levels,
            "events": events
        }

@router.get("/proof/{event_index}")
def get_event_proof(event_index: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM merkle_epochs ORDER BY epoch_id DESC LIMIT 1")
        epoch = cursor.fetchone()
        if not epoch:
            raise HTTPException(status_code=404, detail="No Merkle epoch found")
            
        leaf_hashes = json.loads(epoch["leaf_hashes_json"])
        if event_index < 0 or event_index >= len(leaf_hashes):
            raise HTTPException(status_code=400, detail="Invalid event index")
            
        root_hash, levels = build_merkle_tree(leaf_hashes)
        proof = get_merkle_proof(event_index, levels)
        leaf_hash = leaf_hashes[event_index]
        is_valid = verify_merkle_proof(leaf_hash, proof, root_hash)
        
        cursor.execute("SELECT * FROM merkle_events WHERE index_num = ?", (event_index,))
        ev = cursor.fetchone()
        
        return {
            "epoch_id": epoch["epoch_id"],
            "event_index": event_index,
            "event": {
                "event_type": ev["event_type"],
                "trace_id": ev["trace_id"],
                "details": json.loads(ev["details_json"])
            } if ev else None,
            "leaf_hash": leaf_hash,
            "root_hash": root_hash,
            "proof": proof,
            "is_valid": is_valid
        }
