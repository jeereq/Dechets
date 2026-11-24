#!/usr/bin/env python3
"""
Genere la mini-carte de toute la province de Kinshasa (CARTE_PROVINCE) a partir
des limites administratives d'OpenStreetMap (reponse Nominatim, une entree par
commune, dans osm.json). Meme projection que la grande carte, a plus petite echelle.

Usage : python3 generer-carte-province.py osm.json >> src/lib/carte-kinshasa.ts
Donnees © contributeurs OpenStreetMap, licence ODbL.
"""
import json, sys

K = 300.0                       # pixels par degre (la grande carte : 2750)
CADRE = (2748.9, -41604.4, -2750.14, -11803.37, 935, 847)  # projection de la grande carte
TOL = 0.7                       # tolerance de simplification, en pixels
MARGE = 8

def rdp(pts, tol):
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    n = (dx * dx + dy * dy) ** 0.5 or 1e-9
    imax, dmax = 0, 0.0
    for i in range(1, len(pts) - 1):
        d = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / n
        if d > dmax:
            imax, dmax = i, d
    if dmax <= tol:
        return [pts[0], pts[-1]]
    return rdp(pts[: imax + 1], tol)[:-1] + rdp(pts[imax:], tol)

def anneaux(geo):
    if geo["type"] == "Polygon":
        return [r for r in geo["coordinates"]]
    return [r for poly in geo["coordinates"] for r in poly]

data = json.load(open(sys.argv[1]))
allpts = [p for v in data.values() for r in anneaux(v["geojson"]) for p in r]
lon0 = min(p[0] for p in allpts)
lat0 = max(p[1] for p in allpts)
proj = lambda lon, lat: ((lon - lon0) * K + MARGE, (lat0 - lat) * K + MARGE)
W = round((max(p[0] for p in allpts) - lon0) * K + 2 * MARGE)
H = round((lat0 - min(p[1] for p in allpts)) * K + 2 * MARGE)

communes = []
for nom, v in data.items():
    rings = [[proj(*p) for p in r] for r in anneaux(v["geojson"])]
    d = ""
    for r in rings:
        # anneau ferme : on le coupe en deux au point le plus eloigne du depart
        m = max(range(len(r)), key=lambda i: (r[i][0] - r[0][0]) ** 2 + (r[i][1] - r[0][1]) ** 2)
        s = rdp(r[: m + 1], TOL)[:-1] + rdp(r[m:], TOL)[:-1]
        if len(s) < 3:
            continue
        d += "M" + "L".join(f"{x:.0f} {y:.0f}" for x, y in s) + "Z"
    biggest = max(rings, key=len)
    xs, ys = [p[0] for p in biggest], [p[1] for p in biggest]
    communes.append((nom, round((min(xs) + max(xs)) / 2), round((min(ys) + max(ys)) / 2), d))

# cadre de la grande carte, converti en coordonnees de la mini-carte
sx, bx, sy, by, w, h = CADRE
lon = lambda x: (x - bx) / sx
lat = lambda y: (y - by) / sy
x0, y0 = proj(lon(0), lat(0))
x1, y1 = proj(lon(w), lat(h))

print("\n/**")
print(" * Mini-carte de toute la province (Maluku et Nsele y sont entieres), meme projection")
print(" * que ci-dessus a plus petite echelle. `cadre` marque la zone de la grande carte.")
print(" * Genere par scripts/generer-carte-province.py ; ne pas modifier a la main.")
print(" */")
print("export const CARTE_PROVINCE = {")
print(f"  largeur: {W},\n  hauteur: {H},")
print(f"  cadre: {{ x: {x0:.0f}, y: {y0:.0f}, largeur: {x1 - x0:.0f}, hauteur: {y1 - y0:.0f} }},")
print("  communes: [")
for nom, x, y, d in communes:
    print(f'    {{ nom: "{nom}", x: {x}, y: {y}, d: "{d}" }},')
print("  ],\n} as const;")
