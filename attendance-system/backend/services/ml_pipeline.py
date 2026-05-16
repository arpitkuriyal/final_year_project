"""Regenerate embeddings and retrain ANN after new student photos."""

import logging
import subprocess
import sys
from pathlib import Path

from config import PROJECT_ROOT

logger = logging.getLogger(__name__)

EDGE_DIR = PROJECT_ROOT / "edge_face_recognition"


def retrain_face_model() -> dict:
    """Run generate_embeddings.py then train_Ann_model.py."""
    python = sys.executable
    steps = []

    for script in ("generate_embeddings.py", "train_Ann_model.py"):
        script_path = EDGE_DIR / script
        if not script_path.exists():
            return {"ok": False, "error": f"Missing {script_path}"}

        try:
            result = subprocess.run(
                [python, str(script_path)],
                cwd=str(EDGE_DIR),
                capture_output=True,
                text=True,
                timeout=600,
            )
        except subprocess.TimeoutExpired:
            return {"ok": False, "error": f"{script} timed out"}

        steps.append(
            {
                "script": script,
                "returncode": result.returncode,
                "stdout": (result.stdout or "")[-2000:],
                "stderr": (result.stderr or "")[-2000:],
            }
        )
        if result.returncode != 0:
            logger.error("ML step failed: %s\n%s", script, result.stderr)
            return {"ok": False, "steps": steps, "error": f"{script} failed"}

    return {"ok": True, "steps": steps, "message": "Model retrained successfully"}
