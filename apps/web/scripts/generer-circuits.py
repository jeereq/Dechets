#!/usr/bin/env python3
"""
Genere src/lib/carte-camions-donnees.ts : reseau de rues, batiments, circuits des
camions et tricycles, avec phases choisies pour qu'aucun vehicule n'en touche un autre.

Les rues sont une grille irreguliere STYLISEE (pas un releve) posee sur la carte des
communes. Chaque vehicule suit un circuit ferme, toujours dans le meme sens.

Usage : python3 scripts/generer-circuits.py
"""
import json
import math
import random
from pathlib import Path

import numpy as np

SORTIE = Path(__file__).resolve().parent.parent / 'src/lib/carte-camions-donnees.ts'

COLS, LIGNES = 12, 6
X0, DX = 253, 44
Y0, DY = 60, 36
DEMI_ROUTE = 4.5          # route large de 9 unites
RAYON_VIRAGE = 8
RAYON_CAMION, RAYON_TRICYCLE = 7.2, 4.3   # cercles englobants (camion 12,5 x 4,4 ; tricycle 7,6 x 3,5)
MARGE = 2.0
VITESSE_CIBLE = 10.0      # unites par seconde
DUREES = [20, 30, 60]
PERIODE = 60.0
PAS_T = 0.1

alea = random.Random(20261124)

# --- noeuds ---------------------------------------------------------------
noeuds = {}
for r in range(LIGNES):
    for c in range(COLS):
        noeuds[(c, r)] = (
            round(X0 + c * DX + alea.uniform(-7, 7) + r * 3, 1),
            round(Y0 + r * DY + alea.uniform(-6, 6) - c * 1.5, 1),
        )


def N(c, r):
    return noeuds[(c, r)]


# --- chemins ----------------------------------------------------------------
def pts_rectangle(c, r, w, h):
    """Noeuds du perimetre d'un rectangle de cellules, dans le sens horaire."""
    p = []
    for i in range(c, c + w):
        p.append((i, r))
    for j in range(r, r + h):
        p.append((c + w, j))
    for i in range(c + w, c, -1):
        p.append((i, r + h))
    for j in range(r + h, r, -1):
        p.append((c, j))
    return [N(*k) for k in p]


def chemin_arrondi(pts, rayon=RAYON_VIRAGE):
    """Polyligne fermee aux virages arrondis. Renvoie (d, liste de segments)."""
    n = len(pts)
    segs = []  # ('L', a, b) ou ('Q', a, c, b)
    coins = []
    for i in range(n):
        a, p, b = pts[(i - 1) % n], pts[i], pts[(i + 1) % n]
        da = math.hypot(a[0] - p[0], a[1] - p[1])
        db = math.hypot(b[0] - p[0], b[1] - p[1])
        r = min(rayon, da * 0.45, db * 0.45)
        entree = (p[0] + (a[0] - p[0]) / da * r, p[1] + (a[1] - p[1]) / da * r)
        sortie = (p[0] + (b[0] - p[0]) / db * r, p[1] + (b[1] - p[1]) / db * r)
        coins.append((entree, p, sortie))
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
                x = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0]
                y = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]
                pts.append((x, y))
    pts.append(pts[0])
    arr = np.array(pts)
    seg_len = np.hypot(*(arr[1:] - arr[:-1]).T)
    cum = np.concatenate([[0], np.cumsum(seg_len)])
    return arr, cum


# --- circuits ---------------------------------------------------------------
# Boucles de 1 x 1 cellule en damier : deux boucles voisines ne partagent jamais une rue,
# elles se touchent seulement par un coin. Les vehicules ne se croisent donc que la ou le
# calcul de phases ci-dessous garantit qu'ils ne se rencontrent pas.
COMPOSITIONS = [
    [('camion', 0)],
    [('tricycle', 2)],
    [('camion', 2), ('tricycle', 3)],
    [('tricycle', 0)],
    [('camion', 1)],
    [('tricycle', 1), ('camion', 3)],
    [('tricycle', 3)],
]
CIRCUITS_DEF = []
k = 0
for r in range(LIGNES - 1):
    for c in range(COLS - 1):
        if (c + r) % 2 == 0:
            CIRCUITS_DEF.append(('c%dr%d' % (c, r), (c, r, 1, 1), COMPOSITIONS[k % len(COMPOSITIONS)]))
            k += 1

circuits = []
for nom, (c, r, w, h), veh in CIRCUITS_DEF:
    pts = pts_rectangle(c, r, w, h)
    d, segs = chemin_arrondi(pts)
    arr, cum = echantillonner(segs)
    longueur = float(cum[-1])
    duree = min(DUREES, key=lambda D: abs(longueur / D - VITESSE_CIBLE))
    circuits.append({'nom': nom, 'd': d, 'arr': arr, 'cum': cum, 'longueur': longueur,
                     'duree': duree, 'veh': veh})

# positions sur une grille de temps commune (periode 120 s)
T = np.arange(0, PERIODE, PAS_T)
NT = len(T)
for ci in circuits:
    s = (T / ci['duree']) % 1.0 * ci['longueur']
    x = np.interp(s, ci['cum'], ci['arr'][:, 0])
    y = np.interp(s, ci['cum'], ci['arr'][:, 1])
    ci['pos0'] = np.stack([x, y], axis=1)  # phase 0


def positions(ci, phase):
    decal = int(round(phase * ci['duree'] / PAS_T)) % NT
    # le vehicule est a la position de l'instant t + phase*duree
    return np.roll(ci['pos0'], -decal, axis=0)


def rayon(typ):
    return RAYON_CAMION if typ == 'camion' else RAYON_TRICYCLE


def vehicules_de(ci, ph):
    k = len(ci['veh'])
    return [(positions(ci, ph + i / k), rayon(typ)) for i, (typ, _) in enumerate(ci['veh'])]


def clair_paire(v1, v2):
    pire = 1e9
    for p1, r1 in v1:
        for p2, r2 in v2:
            dist = np.hypot(*(p1 - p2).T)
            pire = min(pire, float(dist.min()) - r1 - r2 - MARGE)
    return pire


# boucles voisines : celles dont les trajets passent a moins de 40 unites l'un de l'autre
voisines = {i: [] for i in range(len(circuits))}
for i in range(len(circuits)):
    for j in range(i + 1, len(circuits)):
        d = np.hypot(*(circuits[i]['pos0'][::10, None, :] - circuits[j]['pos0'][None, ::10, :]).transpose(2, 0, 1)).min()
        if d < 40:
            voisines[i].append(j)
            voisines[j].append(i)


def clair_local(idx, phases):
    mine = vehicules_de(circuits[idx], phases[idx])
    pire = 1e9
    for j in voisines[idx]:
        pire = min(pire, clair_paire(mine, vehicules_de(circuits[j], phases[j])))
    # vehicules d'une meme boucle
    for a_ in range(len(mine)):
        for b_ in range(a_ + 1, len(mine)):
            pire = min(pire, clair_paire([mine[a_]], [mine[b_]]))
    return pire


def clairance(phases):
    return min(clair_local(i, phases) for i in range(len(circuits)))


phases = [alea.random() for _ in circuits]
for passe in range(8):
    for idx in range(len(circuits)):
        meilleur_l = clair_local(idx, phases)
        for _ in range(120):
            essai = list(phases)
            essai[idx] = alea.random()
            c = clair_local(idx, essai)
            if c > meilleur_l:
                meilleur_l, phases = c, essai
    meilleur = clairance(phases)
    print('passe', passe, round(meilleur, 2))
    if meilleur > 2.0:
        break
print('clairance minimale :', round(meilleur, 2), 'unites')
assert meilleur > 0, 'collision inevitable : reduire le nombre de vehicules'

# --- reseau decoratif -----------------------------------------------------------
aretes = []
for r in range(LIGNES):
    aretes.append('M' + 'L'.join('%.1f %.1f' % N(c, r) for c in range(COLS)))
for c in range(COLS):
    aretes.append('M' + 'L'.join('%.1f %.1f' % N(c, r) for r in range(LIGNES)))

# --- batiments et arbres -----------------------------------------------------------
def bilin(c, r, u, v):
    a, b, cc, dd = N(c, r), N(c + 1, r), N(c + 1, r + 1), N(c, r + 1)
    return (
        (1 - u) * (1 - v) * a[0] + u * (1 - v) * b[0] + u * v * cc[0] + (1 - u) * v * dd[0],
        (1 - u) * (1 - v) * a[1] + u * (1 - v) * b[1] + u * v * cc[1] + (1 - u) * v * dd[1],
    )


batiments = {0: [], 1: [], 2: []}
arbres = []
for r in range(LIGNES - 1):
    for c in range(COLS - 1):
        mu, mv = 7.2 / DX, 7.2 / DY
        for (u0, u1) in ((mu, 0.5 - 0.03), (0.5 + 0.03, 1 - mu)):
            for (v0, v1) in ((mv, 0.5 - 0.035), (0.5 + 0.035, 1 - mv)):
                tirage = alea.random()
                if tirage < 0.2:
                    x, y = bilin(c, r, (u0 + u1) / 2, (v0 + v1) / 2)
                    arbres.append([round(x, 1), round(y, 1), round(alea.uniform(2.6, 4.2), 1)])
                    continue
                # un lot, reduit au hasard pour varier les toitures
                du, dv = (u1 - u0), (v1 - v0)
                a0 = u0 + du * alea.uniform(0, 0.12)
                a1 = u1 - du * alea.uniform(0, 0.12)
                b0 = v0 + dv * alea.uniform(0, 0.12)
                b1 = v1 - dv * alea.uniform(0, 0.12)
                q = [bilin(c, r, a0, b0), bilin(c, r, a1, b0), bilin(c, r, a1, b1), bilin(c, r, a0, b1)]
                batiments[int(alea.random() * 3)].append(
                    'M' + 'L'.join('%.1f %.1f' % p for p in q) + 'Z')

# --- tas de dechets le long des rues -------------------------------------------------
tas = []
for _ in range(14):
    if alea.random() < 0.5:
        r = alea.randrange(LIGNES)
        c = alea.randrange(COLS - 1)
        a, b = N(c, r), N(c + 1, r)
    else:
        c = alea.randrange(COLS)
        r = alea.randrange(LIGNES - 1)
        a, b = N(c, r), N(c, r + 1)
    t = alea.uniform(0.3, 0.7)
    x, y = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
    L = math.hypot(b[0] - a[0], b[1] - a[1])
    nx, ny = -(b[1] - a[1]) / L, (b[0] - a[0]) / L
    cote = alea.choice((-1, 1))
    tas.append([round(x + nx * 6.6 * cote, 1), round(y + ny * 6.6 * cote, 1)])

# --- sortie ------------------------------------------------------------------------------
sortie = {
    'aretes': aretes,
    'boucles': [ci['d'] for ci in circuits],
    'batiments': [batiments[k] for k in (0, 1, 2)],
    'arbres': arbres,
    'tas': tas,
    'circuits': [
        {
            'nom': ci['nom'],
            'd': ci['d'],
            'duree': ci['duree'],
            'vehicules': [
                {'type': typ, 'niveau': niv, 'phase': round((phases[k] + i / len(ci['veh'])) % 1.0, 4)}
                for i, (typ, niv) in enumerate(ci['veh'])
            ],
        }
        for k, ci in enumerate(circuits)
    ],
}

en_tete = '''/**
 * GENERE par scripts/generer-circuits.py : ne pas modifier a la main.
 * Reseau de rues stylise, batiments, circuits des camions et tricycles. Les phases de depart
 * sont choisies par simulation pour qu'aucun vehicule n'en touche un autre (clairance
 * minimale %.1f unites de carte).
 */
''' % meilleur
SORTIE.write_text(
    en_tete
    + 'export const RESEAU = '
    + json.dumps({k: sortie[k] for k in ('aretes', 'boucles', 'batiments', 'arbres', 'tas')}, separators=(',', ':'))
    + ' as const;\n\nexport const CIRCUITS_DONNEES = '
    + json.dumps(sortie['circuits'], separators=(',', ':'))
    + ' as const;\n'
)
print('ecrit', SORTIE, SORTIE.stat().st_size, 'octets')
