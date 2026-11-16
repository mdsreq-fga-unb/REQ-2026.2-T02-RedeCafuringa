import re
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


# Renderização de visões da fonte única durante a compilação do MkDocs.
def on_page_markdown(markdown, page, config, files):
    src = page.file.src_uri.replace(chr(92), '/')
    if src not in {'visao/historias_usuario.md', 'visao/mvp.md', 'visao/cronograma.md'} and not re.fullmatch(r'visao/historias/HU\d+\.md', src):
        return markdown
    from importlib import util
    spec = util.spec_from_file_location('requisitos_unificados_autobuild', ROOT / 'scripts/requisitos_unificados.py')
    if spec is None or spec.loader is None:
        raise RuntimeError('Não foi possível carregar o gerador de requisitos')
    module = util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.render_page(markdown, src, module.read_json(ROOT), module.rf_catalog(ROOT))
