import json
import subprocess
from pathlib import Path

SERVICES_DIR = Path(__file__).resolve().parent
APP_DIR = SERVICES_DIR.parent
BACKEND_DIR = APP_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

ENGINE_PATH = PROJECT_ROOT / "engine" / "build" / "deltabox_engine"
INPUT_PATH = APP_DIR / "data" / "sample_strategy_input.json"

def get_strategy_recommendations(driver: str):
    result = subprocess.run(
        [str(ENGINE_PATH), str(INPUT_PATH), driver],
        capture_output=True,
        text=True,
        check=True
    )
    return json.loads(result.stdout)