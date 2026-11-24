#!/usr/bin/env python3
"""
Genere la VRAIE carte de fond (rues et batiments d'OpenStreetMap, quartier de Lingwala et
alentours) et les circuits des camions et tricycles.

Sorties :
  public/carte-lingwala.svg          fond de carte (groupe #cc-fond), charge une fois par le navigateur
  src/lib/carte-camions-donnees.ts   circuits, phases, tas de dechets, dimensions

Entree : scripts/donnees/osm-lingwala.json.gz (reponse Overpass, voir osm-lingwala.requete.txt).
Les circuits suivent les contours reels des ilots (rues OSM), toujours dans le meme sens ; les
phases sont choisies par simulation pour qu'aucun vehicule n'en touche un autre.

Donnees © contributeurs OpenStreetMap, licence ODbL (https://www.openstreetmap.org/copyright).
Usage : python3 scripts/generer-carte-reelle.py
"""
import gzip
import json
import math
import random
import re
from pathlib import Path

import numpy as np
from shapely.geometry import LineString, MultiLineString, Polygon, box
from shapely.ops import polygonize, unary_union

RACINE = Path(__file__).resolve().parent.parent
DONNEES = RACINE / 'scripts/donnees/osm-lingwala.json.gz'
SVG = RACINE / 'public/carte-lingwala.svg'
TS = RACINE / 'src/lib/carte-camions-donnees.ts'
COMMUNES_TS = RACINE / 'src/lib/carte-kinshasa.ts'

LAT0, LON0 = -4.308, 15.288                       # origine de la reponse OSM
KX, KY = 111320 * math.cos(math.radians(4.32)), 110574
M = 2.0                                            # metres par unite de carte
FEN = (430, 850, 1780, 1550)                      # fenetre en metres (x0, y0, x1, y1)
LARGEUR = round((FEN[2] - FEN[0]) / M)
HAUTEUR = round((FEN[3] - FEN[1]) / M)

# largeur de chaussee dessinee (unites) : un peu exageree pour rester lisible
LARGEURS = {'trunk': 9.0, 'primary': 9.0, 'secondary': 7.4, 'tertiary': 6.0,
            'unclassified': 5.0, 'residential': 4.8, 'living_street': 4.2, 'service': 2.4}
ORDRE = ['service', 'living_street', 'residential', 'unclassified', 'tertiary', 'secondary', 'primary', 'trunk']

ECHELLE_CAMION, ECHELLE_TRICYCLE = 0.8, 0.7      # taille des vehicules par rapport aux symboles
RAYON_CAMION, RAYON_TRICYCLE = 7.2 * ECHELLE_CAMION, 4.3 * ECHELLE_TRICYCLE
MARGE = 1.6
RAYON_VIRAGE = 8
VITESSE_CIBLE = 10.0
DUREES = [15, 20, 30, 60]
PERIODE = 60.0
PAS_T = 0.1
# zone ou circulent les vehicules : la moitie droite de la carte (le texte est a gauche)
ZONE = (round(LARGEUR * 0.6), HAUTEUR // 2 - 80, LARGEUR - 8, HAUTEUR // 2 + 80)
N_CAMIONS, N_TRICYCLES = 4, 6

alea = random.Random(20261124)


def proj(p):
    return ((p['lon'] - LON0) * KX - FEN[0]) / M, ((LAT0 - p['lat']) * KY - FEN[1]) / M


# --- lecture OSM ----------------------------------------------------------------
osm = json.load(gzip.open(DONNEES))
fen = box(-10, -10, LARGEUR + 10, HAUTEUR + 10)
routes, batiments, verts = [], [], []
for e in osm['elements']:
    t = e['tags']
    pts = [proj(p) for p in e['geometry']]
    if 'highway' in t and t['highway'] in LARGEURS and len(pts) > 1:
        g = LineString(pts).intersection(fen)
        for l in (g.geoms if hasattr(g, 'geoms') else [g]):
            if l.geom_type == 'LineString' and l.length > 0.5:
                routes.append((t['highway'], t.get('name'), l))
    elif 'building' in t and len(pts) > 3:
        poly = Polygon(pts)
        if poly.is_valid and poly.area > 3 and poly.intersects(fen):
            batiments.append(poly.simplify(0.25))
    elif ('landuse' in t or 'leisure' in t) and len(pts) > 3:
        poly = Polygon(pts)
        if poly.is_valid and poly.area > 12 and t.get('leisure') != 'pitch':
            verts.append(poly.simplify(0.5).intersection(fen))
print('routes', len(routes), 'batiments', len(batiments), 'espaces verts', len(verts))


def chemin(geom, d=1):
    if geom.is_empty:
        return ''
    if geom.geom_type in ('MultiPolygon', 'GeometryCollection'):
        return ''.join(chemin(g, d) for g in geom.geoms)
    if geom.geom_type == 'Polygon':
        return 'M' + 'L'.join(('%%.%df %%.%df' % (d, d)) % c for c in geom.exterior.coords[:-1]) + 'Z'
    return 'M' + 'L'.join(('%%.%df %%.%df' % (d, d)) % c for c in geom.coords)


# --- communes (contours existants, reprojetes) ------------------------------------
src = COMMUNES_TS.read_text()
communes = []
for nom, x, y, d in re.findall(r'\{ nom: "([^"]+)", x: (\d+), y: (\d+), d: "([^"]+)" \}', src)[:23]:
    anneaux = re.findall(r'M[^M]+', d)
    for a in anneaux:
        pts = [tuple(map(float, p.split())) for p in re.findall(r'[ML]?([\d.]+ [\d.]+)', a)]
        if len(pts) < 3:
            continue
        ll = [{'lon': (px + 41604.4) / 2748.9, 'lat': (py + 11803.37) / -2750.14} for px, py in pts]
        poly = Polygon([proj(p) for p in ll])
        if poly.is_valid and poly.intersects(fen) and poly.area > 5000:
            communes.append((nom, poly))
print('communes dans la fenetre :', sorted({n for n, _ in communes}))

# --- reseau, ilots -----------------------------------------------------------------
lignes_ok = [l for cl, _, l in routes if cl != 'service']
noeuds = unary_union(lignes_ok)
ilots = [p for p in polygonize(noeuds) if p.is_valid]


def contenu(poly):
    x0, y0, x1, y1 = poly.bounds
    return x0 >= ZONE[0] and y0 >= ZONE[1] and x1 <= ZONE[2] and y1 <= ZONE[3]


def orienter(pts):
    """Sens horaire a l'ecran (y vers le bas)."""
    s = sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1]
            for i in range(len(pts)))
    return pts if s > 0 else pts[::-1]


cand = []
for p in ilots:
    if not contenu(p):
        continue
    ring = LineString(p.exterior.coords)
    if not 120 <= ring.length <= 580:
        continue
    # ilot "propre" : peu de sommets apres simplification, forme pas trop tordue
    pts = list(ring.simplify(0.7).coords)[:-1]
    if len(pts) < 4:
        continue
    cand.append({'poly': p, 'ring': ring, 'pts': orienter(pts), 'long': ring.length, 'c': p.centroid})
print('ilots candidats', len(cand))


def recouvre(a, b):
    return a['ring'].buffer(0.9).intersection(b['ring']).length


def choisir(n):
    choisis = []
    # premier : le plus a droite (visible sur mobile)
    cand_tri = sorted(cand, key=lambda c: -c['c'].x)
    choisis.append(cand_tri[0])
    while len(choisis) < n:
        meilleur, score = None, -1
        for c in cand:
            if c in choisis or any(c['ring'].distance(o['ring']) < 10 for o in choisis):
                continue
            s = min(c['c'].distance(o['c']) for o in choisis)
            if s > score:
                meilleur, score = c, s
        if meilleur is None:
            break
        choisis.append(meilleur)
    return choisis


choisis = choisir(N_CAMIONS + N_TRICYCLES)
choisis.sort(key=lambda c: -c['long'])
print('boucles retenues', len(choisis), [round(c['long']) for c in choisis])


def chemin_arrondi(pts, rayon=RAYON_VIRAGE):
    n = len(pts)
    segs, coins = [], []
    for i in range(n):
        a, p, b = pts[(i - 1) % n], pts[i], pts[(i + 1) % n]
        da = math.hypot(a[0] - p[0], a[1] - p[1])
        db = math.hypot(b[0] - p[0], b[1] - p[1])
        r = min(rayon, da * 0.45, db * 0.45)
        coins.append(((p[0] + (a[0] - p[0]) / da * r, p[1] + (a[1] - p[1]) / da * r), p,
                      (p[0] + (b[0] - p[0]) / db * r, p[1] + (b[1] - p[1]) / db * r)))
    d = 'M%.1f %.1f' % coins[0][2]
    pos = coins[0][2]
    for i in range(1, n + 1):
        entree, p, sortie = coins[i % n]
        d += 'L%.1f %.1f' % entree
        segs.append(('L', pos, entree))
        d += 'Q%.1f %.1f %.1f %.1f' % (p[0], p[1], sortie[0], sortie[1])
        segs.append(('Q', entree, p, sortie))
        pos = sortie
    return d + 'Z', segs


def echantillonner(segs, pas=0.5):
    pts = []
    for s in segs:
        if s[0] == 'L':
            a, b = s[1], s[2]
            n = max(2, int(math.hypot(b[0] - a[0], b[1] - a[1]) / pas))
            for k in range(n):
                t = k / n
                pts.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
        else:
            a, c, b = s[1], s[2], s[3]
            for k in range(24):
                t = k / 24
                pts.append(((1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
                            (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]))
    pts.append(pts[0])
    arr = np.array(pts)
    cum = np.concatenate([[0], np.cumsum(np.hypot(*(arr[1:] - arr[:-1]).T))])
    return arr, cum


# --- composition : camions sur les plus longues boucles, tricycles sur les autres -----
COMPOSITION = [  # (type, indice de chargement : 0 plein ... 3 presque vide), des boucles les plus longues aux plus courtes
    [('camion', 0), ('camion', 2)],
    [('camion', 1), ('tricycle', 0)],
    [('camion', 3), ('tricycle', 1)],
    [('tricycle', 2)],
    [('tricycle', 0)],
    [('tricycle', 1)],
    [('tricycle', 3)],
    [('tricycle', 2)],
]
circuits = []
for i, c in enumerate(choisis):
    d, segs = chemin_arrondi(c['pts'])
    arr, cum = echantillonner(segs)
    longueur = float(cum[-1])
    duree = min(DUREES, key=lambda D: abs(longueur / D - VITESSE_CIBLE))
    for k, (typ, niv) in enumerate(COMPOSITION[i % len(COMPOSITION)]):
        circuits.append({'nom': 'b%d-%d' % (i, k), 'd': d, 'arr': arr, 'cum': cum, 'longueur': longueur,
                         'duree': duree, 'type': typ, 'niveau': niv})
    print(' ', round(longueur), 'u', duree, 's', round(longueur / duree, 1), 'u/s', COMPOSITION[i % len(COMPOSITION)])

T = np.arange(0, PERIODE, PAS_T)
NT = len(T)
for ci in circuits:
    s = (T / ci['duree']) % 1.0 * ci['longueur']
    ci['pos0'] = np.stack([np.interp(s, ci['cum'], ci['arr'][:, 0]),
                           np.interp(s, ci['cum'], ci['arr'][:, 1])], axis=1)


def positions(ci, phase):
    return np.roll(ci['pos0'], -int(round(phase * ci['duree'] / PAS_T)) % NT, axis=0)


def rayon(ci):
    return RAYON_CAMION if ci['type'] == 'camion' else RAYON_TRICYCLE


def clair_paire(i, pi, j, pj):
    d = np.hypot(*(positions(circuits[i], pi) - positions(circuits[j], pj)).T)
    return float(d.min()) - rayon(circuits[i]) - rayon(circuits[j]) - MARGE


voisines = {i: [j for j in range(len(circuits)) if j != i and
                np.hypot(*(circuits[i]['pos0'][::10, None, :] - circuits[j]['pos0'][None, ::10, :])
                         .transpose(2, 0, 1)).min() < 34] for i in range(len(circuits))}


def clair_local(i, ph):
    return min([clair_paire(i, ph[i], j, ph[j]) for j in voisines[i]] or [99])


phases = [alea.random() for _ in circuits]
for passe in range(10):
    for i in range(len(circuits)):
        meilleur = clair_local(i, phases)
        for _ in range(150):
            essai = list(phases)
            essai[i] = alea.random()
            c = clair_local(i, essai)
            if c > meilleur:
                meilleur, phases = c, essai
    clair = min(clair_local(i, phases) for i in range(len(circuits)))
    print('passe', passe, round(clair, 2))
    if clair > 2.5:
        break
assert clair > 0, 'collision inevitable'

# --- tas de dechets le long des rues du cote droit -------------------------------------
tas = []
rues = [(cl, l) for cl, _, l in routes if cl in ('residential', 'unclassified', 'tertiary')]
essais = 0
while len(tas) < 12 and essais < 4000:
    essais += 1
    cl, l = alea.choice(rues)
    f = alea.uniform(0.2, 0.8)
    p, q = l.interpolate(max(0, f * l.length - 1)), l.interpolate(min(l.length, f * l.length + 1))
    x, y = p.x, p.y
    if not (ZONE[0] + 6 <= x <= ZONE[2] - 6 and ZONE[1] + 6 <= y <= ZONE[3] - 6):
        continue
    dx, dy = q.x - p.x, q.y - p.y
    n = math.hypot(dx, dy) or 1
    cote = alea.choice((-1, 1))
    dec = LARGEURS[cl] / 2 + 1.8
    px, py = x - dy / n * dec * cote, y + dx / n * dec * cote
    if all(math.hypot(px - a, py - b) > 34 for a, b in tas) and not any(
            Polygon(b.exterior).contains(__import__('shapely.geometry', fromlist=['Point']).Point(px, py))
            for b in batiments if b.bounds[0] < px < b.bounds[2] and b.bounds[1] < py < b.bounds[3]):
        tas.append((round(px, 1), round(py, 1)))
print('tas', len(tas))

# --- SVG de fond ----------------------------------------------------------------------
fond = []
Lingwala = [p for n, p in communes if n == 'Lingwala']
for n, p in communes:
    pilote = n == 'Lingwala'
    d = chemin(p.intersection(fen), 1)
    if pilote:
        fond.append('<path d="%s" fill="rgba(245,168,0,0.08)" stroke="#f5a800" stroke-width="1.2" stroke-dasharray="6 3"/>' % d)
    else:
        fond.append('<path d="%s" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.7"/>' % d)
if verts:
    fond.append('<path d="%s" fill="rgba(61,220,106,0.16)"/>' % ''.join(chemin(v, 1) for v in verts))
tons = ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0.1)']
groupes = {0: [], 1: [], 2: []}
for i, b in enumerate(batiments):
    groupes[(i * 7 + int(b.area)) % 3].append(chemin(b, 1))
for k in (0, 1, 2):
    fond.append('<path d="%s" fill="%s"/>' % (''.join(groupes[k]), tons[k]))

ordonnees = sorted(routes, key=lambda r: ORDRE.index(r[0]))
par_classe = {}
for cl, _, l in ordonnees:
    par_classe.setdefault(cl, []).append(chemin(l, 1))
fond.append('<g fill="none" stroke-linecap="round" stroke-linejoin="round">')
for cl in ORDRE:
    if cl in par_classe:
        fond.append('<path d="%s" stroke="rgba(255,255,255,0.3)" stroke-width="%.1f"/>' % (''.join(par_classe[cl]), LARGEURS[cl] + 1.3))
for cl in ORDRE:
    if cl in par_classe:
        fond.append('<path d="%s" stroke="%s" stroke-width="%.1f"/>' % (
            ''.join(par_classe[cl]), '#2f6a4c' if cl in ('primary', 'trunk', 'secondary') else '#2a5a42', LARGEURS[cl]))
for cl in ('trunk', 'primary', 'secondary'):
    if cl in par_classe:
        fond.append('<path d="%s" stroke="rgba(255,255,255,0.38)" stroke-width="0.3" stroke-dasharray="2.4 2.8"/>' % ''.join(par_classe[cl]))
fond.append('</g>')

# noms des grandes avenues, le long du trace
vus = set()
etiq = []
for cl, nom, l in sorted(routes, key=lambda r: -r[2].length):
    if nom and cl in ('secondary', 'tertiary', 'primary') and nom not in vus and l.length > 140:
        vus.add(nom)
        pts = list(l.coords)
        if pts[0][0] > pts[-1][0]:
            pts = pts[::-1]
        d = 'M' + 'L'.join('%.1f %.1f' % p for p in pts)
        etiq.append((nom, d))
        if len(etiq) >= 4:
            break
defs = ''.join('<path id="nom%d" d="%s"/>' % (i, d) for i, (_, d) in enumerate(etiq))
for i, (nom, _) in enumerate(etiq):
    fond.append('<text font-size="3.6" font-weight="600" letter-spacing="0.5" fill="rgba(255,255,255,0.7)" '
                'stroke="rgba(11,60,34,0.8)" stroke-width="0.8" paint-order="stroke" '
                'style="text-transform:uppercase"><textPath href="#nom%d" startOffset="12%%">%s</textPath></text>' % (i, nom))
# noms de communes
for n, p in communes:
    q = p.intersection(fen)
    if q.is_empty or q.area < 6000:
        continue
    pilote = n == 'Lingwala'
    pt = q.representative_point()
    fond.append('<text x="%.0f" y="%.0f" text-anchor="middle" font-size="%s" font-weight="%d" letter-spacing="1.4" '
                'fill="%s" stroke="rgba(11,60,34,0.8)" stroke-width="1" paint-order="stroke" '
                'style="text-transform:uppercase">%s</text>' % (
                    (LARGEUR - 70 if pilote else pt.x), (ZONE[1] - 6 if pilote else pt.y), '7' if pilote else '5.5', 800 if pilote else 600,
                    '#f5a800' if pilote else 'rgba(255,255,255,0.55)', n))

svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" font-family="system-ui, sans-serif">'
       '<!-- Fond de carte : donnees © contributeurs OpenStreetMap, licence ODbL. Genere par '
       'scripts/generer-carte-reelle.py -->'
       '<defs>%s</defs><g id="cc-fond">%s</g></svg>') % (LARGEUR, HAUTEUR, defs, ''.join(fond))
SVG.write_text(svg)
print('svg', SVG.stat().st_size, 'octets')

# --- donnees TypeScript ------------------------------------------------------------------
sortie = [{
    'nom': ci['nom'], 'd': ci['d'], 'duree': ci['duree'],
    'vehicules': [{'type': ci['type'], 'niveau': ci['niveau'], 'phase': round(phases[k] % 1.0, 4)}],
} for k, ci in enumerate(circuits)]
TS.write_text(
    '/**\n * GENERE par scripts/generer-carte-reelle.py : ne pas modifier a la main.\n'
    ' * Circuits des camions et tricycles sur les vraies rues de Lingwala (OpenStreetMap, ODbL).\n'
    ' * Les phases de depart sont choisies par simulation : clairance minimale %.1f unites.\n */\n'
    'export const CARTE = %s as const;\n\n'
    'export const ECHELLES = { camion: %s, tricycle: %s } as const;\n\n'
    'export const TAS = %s as const;\n\n'
    'export const CIRCUITS_DONNEES = %s as const;\n' % (
        clair,
        json.dumps({'largeur': LARGEUR, 'hauteur': HAUTEUR, 'zoneX': ZONE[0]}),
        ECHELLE_CAMION, ECHELLE_TRICYCLE,
        json.dumps([list(t) for t in tas], separators=(',', ':')),
        json.dumps(sortie, separators=(',', ':'))))
print('ts', TS.stat().st_size, 'octets ; vehicules :', len(circuits), ' clairance', round(clair, 2))
