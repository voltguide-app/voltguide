"""
Dessine les icônes de VoltGuide (éclair noir sur fond jaune) en PNG,
sans aucune bibliothèque externe.

Utilisation (depuis le dossier voltguide) :
    python3 outils/icones.py
"""
import struct
import zlib
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
FOND = (0xFF, 0xC4, 0x00)    # jaune électrique
ECLAIR = (0x1B, 0x1D, 0x21)  # noir de l'en-tête

# Contour de l'éclair, coordonnées de 0 à 1
ECLAIR_POINTS = [(0.52, 0.10), (0.70, 0.10), (0.57, 0.40), (0.72, 0.40),
                 (0.38, 0.90), (0.47, 0.55), (0.30, 0.55)]
ECHELLE = 0.82  # garde l'éclair dans la zone sûre des icônes « maskable » (Android)


def couverture(taille):
    """Pour chaque pixel, la part (0 à 1) couverte par l'éclair (bords lissés)."""
    pts = [((x - 0.5) * ECHELLE * taille + taille / 2, (y - 0.5) * ECHELLE * taille + taille / 2)
           for x, y in ECLAIR_POINTS]
    aretes = list(zip(pts, pts[1:] + pts[:1]))
    sous_lignes = 4
    grille = [[0.0] * taille for _ in range(taille)]
    for py in range(taille):
        for s in range(sous_lignes):
            y = py + (s + 0.5) / sous_lignes
            xs = sorted(x1 + (y - y1) * (x2 - x1) / (y2 - y1)
                        for (x1, y1), (x2, y2) in aretes if (y1 <= y < y2) or (y2 <= y < y1))
            for debut, fin in zip(xs[::2], xs[1::2]):
                for px in range(max(0, int(debut)), min(taille, int(fin) + 1)):
                    part = min(fin, px + 1) - max(debut, px)
                    if part > 0:
                        grille[py][px] += part / sous_lignes
    return grille


def png(taille, chemin):
    grille = couverture(taille)
    lignes = b""
    for rang in grille:
        lignes += b"\x00"  # pas de filtre
        for c in rang:
            c = min(1.0, c)
            lignes += bytes(round(f * (1 - c) + e * c) for f, e in zip(FOND, ECLAIR))
    bloc = lambda type_, donnees: (struct.pack(">I", len(donnees)) + type_ + donnees
                                   + struct.pack(">I", zlib.crc32(type_ + donnees)))
    contenu = (b"\x89PNG\r\n\x1a\n"
               + bloc(b"IHDR", struct.pack(">IIBBBBB", taille, taille, 8, 2, 0, 0, 0))
               + bloc(b"IDAT", zlib.compress(lignes, 9))
               + bloc(b"IEND", b""))
    chemin.parent.mkdir(exist_ok=True)
    chemin.write_bytes(contenu)
    print(f"{chemin.relative_to(RACINE)} ({taille} × {taille})")


if __name__ == "__main__":
    for taille, nom in [(192, "icone-192.png"), (512, "icone-512.png"), (180, "icone-apple.png")]:
        png(taille, RACINE / "icones" / nom)
