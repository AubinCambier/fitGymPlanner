# FitGym Planner — Routes API REST

## Base URL

```
/api/v1
```

---

## Authentification

| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| POST | `/auth/register` | Public | Inscription d'un nouveau membre |
| POST | `/auth/login` | Public | Connexion (retourne un JWT) |
| POST | `/auth/logout` | Authentifié | Déconnexion (invalidation token) |
| GET | `/auth/me` | Authentifié | Récupérer le profil connecté |
| PUT | `/auth/me` | Authentifié | Modifier son profil (nom, email, mot de passe) |

---

## Gestion des utilisateurs (Admin)

| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| GET | `/admin/users` | ADMIN | Lister tous les utilisateurs (avec filtres ?role=COACH&active=true) |
| GET | `/admin/users/:id` | ADMIN | Détail d'un utilisateur |
| POST | `/admin/users` | ADMIN | Créer un compte (coach ou membre) |
| PUT | `/admin/users/:id` | ADMIN | Modifier un compte (rôle, infos) |
| PATCH | `/admin/users/:id/status` | ADMIN | Activer / désactiver un compte |

---

## Sanctions (Admin)

| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| GET | `/admin/sanctions` | ADMIN | Lister toutes les sanctions |
| GET | `/admin/sanctions/:id` | ADMIN | Détail d'une sanction |
| POST | `/admin/sanctions` | ADMIN | Appliquer une sanction (WARNING, SUSPENSION, BAN) |
| PATCH | `/admin/sanctions/:id` | ADMIN | Modifier / lever une sanction |

**Body POST :**
```json
{
  "user_id": 5,
  "sanction_type": "SUSPENSION",
  "reason": "Absences répétées sans annulation",
  "end_date": "2026-07-01T00:00:00Z"
}
```

---

## Tarifs (Admin)

| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| GET | `/pricing` | Public | Lister les tarifs actifs |
| POST | `/admin/pricing` | ADMIN | Créer un tarif |
| PUT | `/admin/pricing/:id` | ADMIN | Modifier un tarif |
| PATCH | `/admin/pricing/:id/status` | ADMIN | Activer / désactiver un tarif |

---

## Types de session

| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| GET | `/session-types` | Public | Lister les types de session |
| POST | `/admin/session-types` | ADMIN | Créer un type |
| PUT | `/admin/session-types/:id` | ADMIN | Modifier un type |
| DELETE | `/admin/session-types/:id` | ADMIN | Supprimer un type |

---

## Sessions de cours

| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| GET | `/sessions` | Authentifié | Lister les sessions (filtres : ?type=Yoga&date=2026-05-11&coach_id=3) |
| GET | `/sessions/:id` | Authentifié | Détail d'une session (avec nb inscrits) |
| POST | `/sessions` | ADMIN, COACH | Créer une session |
| PUT | `/sessions/:id` | ADMIN, COACH (propriétaire) | Modifier une session |
| DELETE | `/sessions/:id` | ADMIN | Supprimer une session |
| GET | `/sessions/:id/participants` | ADMIN, COACH (propriétaire) | Liste des participants inscrits |

**Body POST :**
```json
{
  "title": "Yoga matinal",
  "description": "Séance de yoga douce pour bien commencer la journée",
  "session_type_id": 1,
  "start_time": "2026-05-11T09:30:00Z",
  "end_time": "2026-05-11T10:30:00Z",
  "capacity": 20,
  "intensity": "LOW"
}
```

---

## Planning Coach

| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| GET | `/coach/sessions` | COACH | Lister ses propres sessions |
| GET | `/coach/sessions/:id/participants` | COACH | Participants de sa session |

---

## Demandes de suppression (Coach → Admin)

| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| GET | `/coach/requests` | COACH | Lister ses demandes de suppression |
| POST | `/coach/requests` | COACH | Soumettre une demande |
| GET | `/admin/requests` | ADMIN | Lister toutes les demandes (filtres : ?status=PENDING) |
| PATCH | `/admin/requests/:id` | ADMIN | Approuver ou refuser (envoie un email Nodemailer) |

**Body POST (Coach) :**
```json
{
  "session_id": 12,
  "reason": "Indisponibilité personnelle"
}
```

**Body PATCH (Admin) :**
```json
{
  "status": "APPROVED",
  "admin_comment": "Demande acceptée, session annulée"
}
```

---

## Réservations (Membre)

| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| GET | `/bookings` | MEMBER | Lister ses réservations |
| POST | `/bookings` | MEMBER | S'inscrire à une session |
| PATCH | `/bookings/:id/cancel` | MEMBER | Annuler sa participation |

**Body POST :**
```json
{
  "session_id": 12
}
```

---

## Abonnements (Membre)

| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| GET | `/memberships/me` | MEMBER | Voir son abonnement actuel |
| POST | `/memberships` | MEMBER | Souscrire à un abonnement |
| PATCH | `/memberships/me/cancel` | MEMBER | Annuler son abonnement |

**Body POST :**
```json
{
  "pricing_id": 1,
  "payment_mode": "MONTHLY"
}
```

---

## Préférences & Recommandations (Phase 6 — Optionnel)

| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| GET | `/preferences` | MEMBER | Voir ses préférences |
| PUT | `/preferences` | MEMBER | Définir / modifier ses préférences |
| GET | `/recommendations` | MEMBER | Obtenir des recommandations de sessions |
| GET | `/training-plan` | MEMBER | Générer un plan d'entraînement multi-mois |

**Body PUT préférences :**
```json
{
  "preferred_types": [1, 3],
  "preferred_intensity": "MEDIUM",
  "preferred_days": ["MONDAY", "WEDNESDAY", "FRIDAY"],
  "preferred_time_start": "08:00",
  "preferred_time_end": "12:00"
}
```

---

## Middlewares

| Middleware | Description |
|------------|-------------|
| `authenticate` | Vérifie le JWT, extrait `user.id` et `user.role` |
| `authorize(roles)` | Vérifie que le rôle est autorisé (ex: `authorize('ADMIN')`) |
| `validateBody(schema)` | Valide le body avec un schéma Zod |
| `checkActive` | Vérifie que le compte n'est pas désactivé / sanctionné |

---

## Format des réponses

**Succès :**
```json
{
  "status": "success",
  "data": { ... }
}
```

**Erreur :**
```json
{
  "status": "error",
  "code": 409,
  "message": "Session complète : 20 / 20 places"
}
```

---

## Codes HTTP utilisés

| Code | Utilisation |
|------|-------------|
| 200 | Succès (GET, PUT, PATCH) |
| 201 | Création réussie (POST) |
| 204 | Suppression réussie (DELETE) |
| 400 | Body invalide / validation échouée |
| 401 | Non authentifié (token manquant ou expiré) |
| 403 | Non autorisé (rôle insuffisant) |
| 404 | Ressource introuvable |
| 409 | Conflit (session pleine, doublon) |
| 500 | Erreur serveur |
