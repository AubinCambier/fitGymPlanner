# PlaniscopeIA

Application web qui génère automatiquement un planning de révisions personnalisé pour les étudiants.

## Fonctionnement

1. L'étudiant renseigne ses matières, leurs dates d'examen et sa priorité (1–5)
2. Il indique ses disponibilités jour par jour (heures libres)
3. L'application génère un planning semaine par semaine, affiché dans un calendrier interactif
4. Il peut cocher les sessions terminées au fil des jours

## Stack

| Couche | Techno |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Langage | TypeScript |
| Base de données | PostgreSQL |
| Auth | JWT + bcrypt |
| Front-end | HTML / CSS / TypeScript (compilé via esbuild) |
| Calendrier | FullCalendar.js |

## Installation

### Prérequis

- Node.js 18+
- PostgreSQL

### Setup

```bash
# 1. Cloner le repo
git clone https://github.com/AubinCambier/PlaniscopeIa.git
cd PlaniscopeIa

# 2. Installer les dépendances
npm install

# 3. Créer le fichier d'environnement
cp .env.example .env
# puis éditer .env avec tes valeurs

# 4. Initialiser la base de données
psql -U <user> -d planiscopeia -f init.sql

# 5. Lancer en développement
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Créer un fichier `.env` à la racine :

```
DATABASE_URL=postgresql://<user>@localhost:5432/planiscopeia
JWT_SECRET=une_chaine_secrete_longue
PORT=3000
```

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Compile le front-end et lance le serveur en dev |
| `npm run build` | Compile le back-end (tsc) et le front-end (esbuild) |
| `npm start` | Lance le serveur compilé (après build) |
| `npm run build:client` | Compile uniquement le front-end TypeScript |

## Structure

```
planiscopeia/
├── client/          # TypeScript front-end (source)
├── src/             # TypeScript back-end
│   ├── routes/      # Routes Express
│   ├── middleware/  # Middleware JWT
│   └── db/          # Connexion PostgreSQL
├── public/          # Fichiers statiques servis par Express
│   ├── css/
│   ├── js/          # Généré par esbuild (ne pas éditer)
│   ├── index.html
│   ├── dashboard.html
│   └── upgrade.html
├── init.sql         # Schéma BDD
└── .env             # Variables d'environnement (non versionné)
```

## Modèle Freemium

- **Gratuit** : jusqu'à 10 matières
- **Premium** : matières illimitées, export PDF *(à venir)*

> Le paiement n'est pas implémenté — démo portfolio uniquement.
