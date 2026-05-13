# FitGym Planner — Frontend Design

## Contexte

Frontend web pour l'API REST FitGym Planner (Express + PostgreSQL).
3 rôles côté backend : ADMIN, COACH, MEMBER.
Scope initial : rôle MEMBER uniquement. COACH et ADMIN ajoutés ensuite.

---

## Stack technique

| Outil | Rôle |
|---|---|
| Vue 3 + Vite + TypeScript | Framework + bundler + typage |
| Vue Router | Navigation entre pages |
| Pinia | État global (token JWT, utilisateur connecté) |
| CSS scoped (`<style scoped>`) | Styles par composant, pas de framework CSS |
| Fetch natif | Appels HTTP vers l'API |

Choix Vue 3 plutôt que React : courbe d'apprentissage plus douce, syntaxe plus lisible, plus facile à expliquer.
Choix CSS pur : pas de dépendance supplémentaire, contrôle total, cohérent avec la maquette login fournie.

---

## Organisation dans le repo

Monorepo : backend et frontend dans le même dépôt Git.

```
fitGymPlanner/
├── backend/        ← API Express (existant)
├── frontend/       ← Vue 3 (à créer)
├── docker-compose.yml
├── CLAUDE.md
└── README.md
```

Le frontend a son propre `package.json` et `node_modules`.
L'API tourne sur `http://localhost:3000`, le frontend sur `http://localhost:5173` (Vite default).

---

## Architecture frontend

Architecture en 4 couches, inspirée du MVC backend :

| Couche | Dossier | Responsabilité |
|---|---|---|
| API | `src/api/` | Fonctions fetch vers le backend |
| État global | `src/stores/` | Token JWT + utilisateur (Pinia) |
| Routing | `src/router/` | Routes + navigation guard |
| UI | `src/views/` + `src/components/` | Pages et composants réutilisables |

---

## Structure des fichiers

```
frontend/src/
├── api/
│   ├── auth.ts          ← login, register, getMe, updateProfile
│   ├── sessions.ts      ← getSessions, getSessionById
│   ├── bookings.ts      ← getBookings, createBooking, cancelBooking
│   └── membership.ts    ← getMembership, subscribe, cancelMembership
│
├── stores/
│   └── auth.ts          ← { token, user } + login(), logout()
│
├── router/
│   └── index.ts         ← routes + navigation guard
│
├── views/
│   ├── LoginView.vue
│   ├── RegisterView.vue
│   └── member/
│       ├── DashboardView.vue
│       ├── SessionsView.vue
│       ├── BookingsView.vue
│       ├── MembershipView.vue
│       └── ProfileView.vue
│
├── components/
│   ├── AppHeader.vue
│   ├── SessionCard.vue
│   └── BookingCard.vue
│
├── App.vue
└── main.ts
```

---

## Pages — Scope MEMBER

| Route | Vue | Accès | Description |
|---|---|---|---|
| `/login` | `LoginView.vue` | Public | Formulaire connexion |
| `/register` | `RegisterView.vue` | Public | Formulaire inscription |
| `/member/dashboard` | `DashboardView.vue` | MEMBER | Résumé : prochaines sessions réservées, statut abonnement |
| `/member/sessions` | `SessionsView.vue` | MEMBER | Liste des sessions disponibles + bouton réserver |
| `/member/bookings` | `BookingsView.vue` | MEMBER | Mes réservations + bouton annuler |
| `/member/membership` | `MembershipView.vue` | MEMBER | Mon abonnement + souscrire / annuler |
| `/member/profile` | `ProfileView.vue` | MEMBER | Modifier nom, email, mot de passe |

---

## Gestion du token JWT

**Stockage :** `localStorage` (persiste après fermeture du navigateur).

**Flux connexion :**
1. Login → API retourne `{ token, user }`
2. Pinia store sauvegarde `token` et `user`
3. `localStorage.setItem('token', ...)` + `localStorage.setItem('user', ...)`
4. Redirect vers `/member/dashboard` selon le rôle

**Flux déconnexion :**
1. `logout()` dans le store Pinia
2. Vide `token` et `user` dans le store
3. `localStorage.removeItem('token')` + `localStorage.removeItem('user')`
4. Redirect vers `/login`

**Initialisation au démarrage :**
Dans `main.ts` ou `App.vue` : lire `localStorage` et réhydrater le store Pinia si un token existe.

**Navigation guard (router) :**
```ts
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.token) {
    return '/login'
  }
})
```

**Envoi du token dans chaque requête :**
```ts
// api/auth.ts — pattern répété dans chaque fichier api/
const token = useAuthStore().token
fetch(url, {
  headers: { Authorization: `Bearer ${token}` }
})
```

---

## Design visuel

Référence : maquette login fournie (HTML/CSS pur).
- Palette : fond blanc / dark navy (`#0F172A`) + vert émeraude (`#10B981`)
- Fonts : Outfit (titres) + DM Sans (corps)
- Style : cards épurées, inputs avec icônes, boutons avec état loading

Chaque composant Vue utilise `<style scoped>` avec les mêmes variables CSS :
```css
:root {
  --primary: #0F172A;
  --accent: #10B981;
  --accent-hover: #059669;
  --border: #E2E8F0;
  --text-muted: #64748B;
}
```

Ces variables sont définies dans un fichier global `src/assets/main.css` importé dans `main.ts`.

---

## Ordre d'implémentation

1. Initialisation Vite + Vue Router + Pinia
2. `stores/auth.ts` + `api/auth.ts`
3. `LoginView.vue` (basé sur la maquette)
4. `RegisterView.vue`
5. Navigation guard + `AppHeader.vue`
6. `api/sessions.ts` + `SessionsView.vue`
7. `api/bookings.ts` + `BookingsView.vue`
8. `DashboardView.vue` (agrège sessions + bookings)
9. `api/membership.ts` + `MembershipView.vue`
10. `ProfileView.vue`

---

## Extensions futures (hors scope initial)

- Dashboard COACH : ses sessions, participants, demandes de suppression
- Dashboard ADMIN : users, sanctions, tarifs, types de session
- Application mobile (React Native ou Flutter) consommant le même backend REST
