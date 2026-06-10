"""Start/stop the local face attendance scanner process."""

from __future__ import annotations

import os
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
EDGE_DIR = PROJECT_ROOT / "edge_face_recognition"
SCANNER_SCRIPT = EDGE_DIR / "hostel_live_recognition.py"
MODEL_PATH = EDGE_DIR / "models" / "ann_model.joblib"
ENCODER_PATH = EDGE_DIR / "models" / "label_encoder.joblib"
LOG_PATH = EDGE_DIR / "scanner.log"

_process: subprocess.Popen | None = None
_started_at: float | None = None
_camera_index: int | None = None
_duration_minutes: int | None = None
_expires_at: float | None = None
_stop_timer: threading.Timer | None = None


def _is_running() -> bool:
    return _process is not None and _process.poll() is None


def _status() -> dict:
    running = _is_running()
    return {
        "running": running,
        "pid": _process.pid if running and _process else None,
        "startedAt": _started_at if running else None,
        "expiresAt": _expires_at if running else None,
        "durationMinutes": _duration_minutes if running else None,
        "cameraIndex": _camera_index if running else None,
        "script": str(SCANNER_SCRIPT),
        "modelReady": MODEL_PATH.exists() and ENCODER_PATH.exists(),
        "log": str(LOG_PATH),
    }


def get_scanner_status() -> dict:
    return _status()


def _terminate_process(process: subprocess.Popen) -> None:
    try:
        if os.name == "nt":
            process.send_signal(signal.CTRL_BREAK_EVENT)
        else:
            os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        process.wait(timeout=8)
    except Exception:
        if os.name == "nt":
            process.kill()
        else:
            os.killpg(os.getpgid(process.pid), signal.SIGKILL)
        process.wait(timeout=5)


def _auto_stop() -> None:
    stop_scanner()


def _tail_log(max_chars: int = 2000) -> str:
    if not LOG_PATH.exists():
        return ""
    try:
        return LOG_PATH.read_text(errors="replace")[-max_chars:]
    except OSError:
        return ""


def start_scanner(camera_index: int = 0, duration_minutes: int = 30) -> dict:
    global _process, _started_at, _camera_index, _duration_minutes, _expires_at, _stop_timer

    if _is_running():
        return {
            **_status(),
            "success": True,
            "message": "Attendance scanner is already running.",
        }

    if not SCANNER_SCRIPT.exists():
        return {
            **_status(),
            "success": False,
            "message": f"Scanner script not found at {SCANNER_SCRIPT}.",
        }

    if not MODEL_PATH.exists() or not ENCODER_PATH.exists():
        return {
            **_status(),
            "success": False,
            "message": (
                "Face model is not trained yet. From attendance-system/edge_face_recognition run: "
                "python generate_embeddings.py && python train_Ann_model.py"
            ),
        }

    if _stop_timer:
        _stop_timer.cancel()

    env = os.environ.copy()
    env["CAMERA_INDEX"] = str(camera_index)

    popen_kwargs = {
        "cwd": str(EDGE_DIR),
        "env": env,
    }
    if os.name == "nt":
        popen_kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        popen_kwargs["start_new_session"] = True

    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    log_file = LOG_PATH.open("a", buffering=1)
    log_file.write(f"\n--- Starting scanner at {time.strftime('%Y-%m-%d %H:%M:%S')} ---\n")

    try:
        _process = subprocess.Popen(
            [sys.executable, str(SCANNER_SCRIPT)],
            stdout=log_file,
            stderr=subprocess.STDOUT,
            **popen_kwargs,
        )
    finally:
        log_file.close()

    _started_at = time.time()
    _camera_index = camera_index
    _duration_minutes = max(1, duration_minutes)
    _expires_at = _started_at + (_duration_minutes * 60)

    time.sleep(1.5)
    if _process.poll() is not None:
        exit_code = _process.returncode
        _process = None
        _started_at = None
        _camera_index = None
        _duration_minutes = None
        _expires_at = None
        return {
            **_status(),
            "success": False,
            "message": (
                f"Attendance scanner failed to start (exit code {exit_code}). "
                f"Check camera permission/index and model files. Recent log: {_tail_log()}"
            ),
        }

    _stop_timer = threading.Timer(_duration_minutes * 60, _auto_stop)
    _stop_timer.daemon = True
    _stop_timer.start()

    return {
        **_status(),
        "success": True,
        "message": f"Attendance scanner started for {_duration_minutes} minutes.",
    }


def stop_scanner() -> dict:
    global _process, _started_at, _camera_index, _duration_minutes, _expires_at, _stop_timer

    if not _is_running():
        _process = None
        _started_at = None
        _camera_index = None
        _duration_minutes = None
        _expires_at = None
        if _stop_timer:
            _stop_timer.cancel()
        _stop_timer = None
        return {
            **_status(),
            "success": True,
            "message": "Attendance scanner is already stopped.",
        }

    process = _process
    try:
        _terminate_process(process)
    finally:
        _process = None
        _started_at = None
        _camera_index = None
        _duration_minutes = None
        _expires_at = None
        if _stop_timer:
            _stop_timer.cancel()
        _stop_timer = None

    return {
        **_status(),
        "success": True,
        "message": "Attendance scanner stopped.",
    }
