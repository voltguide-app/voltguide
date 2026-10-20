"""
Rassemble VoltGuide en un seul fichier HTML pour le publier sur une page Claude.

Utilisation (depuis le dossier voltguide) :
    python3 outils/page_claude.py <fichier de sortie>

Ce que fait le script :
- met le contenu de style.css et de tous les fichiers .js directement dans la page ;
- enlève les balises <html>, <head>, <body> (la page Claude les ajoute elle-même) ;
- désactive l'impression, qui ne fonctionne pas sur une page Claude.
"""
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent


def lire(chemin):
    return (RACINE / chemin).read_text(encoding="utf-8")


def construire():
    page = lire("index.html")

    titre = re.search(r"<title>.*?</title>", page).group(0)
    corps = re.search(r"<body>(.*)</body>", page, re.S).group(1)

    # Les scripts dans l'ordre où index.html les charge
    scripts = re.findall(r'<script src="([^"]+)"></script>', corps)
    corps = re.sub(r'\s*<script src="[^"]+"></script>', "", corps)
    corps = re.sub(r"\s*<!-- (Données|Code).*?-->", "", corps)

    code = "\n".join(f"// ===== {s} =====\n{lire(s)}" for s in scripts)
    if "</script" in code:
        sys.exit("Erreur : un fichier .js contient « </script », la page serait cassée.")

    return f"""{titre}
<style>
{lire("style.css")}
</style>
{corps.strip()}
<script>
window.VOLTGUIDE_SANS_IMPRESSION = true;
{code}
</script>
"""


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    sortie = Path(sys.argv[1])
    sortie.parent.mkdir(parents=True, exist_ok=True)
    sortie.write_text(construire(), encoding="utf-8")
    print(f"Page créée : {sortie} ({sortie.stat().st_size // 1024} Ko)")
