"""Hooks do MkDocs.

Publica shared/openapi.json (fonte única do contrato) ao lado do Swagger UI
estático em docs/api/, sem duplicar o arquivo no repositório.
"""

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def on_post_build(config, **kwargs):
    destino = Path(config["site_dir"]) / "api"
    destino.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / "shared" / "openapi.json", destino / "openapi.json")
