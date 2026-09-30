"""Substituído por diversidade.py (confere efeitos, voz, trilha, fontes e paleta). Mantido como atalho."""
import runpy, sys
from pathlib import Path
sys.argv[0] = str(Path(__file__).with_name("diversidade.py"))
runpy.run_path(sys.argv[0], run_name="__main__")
