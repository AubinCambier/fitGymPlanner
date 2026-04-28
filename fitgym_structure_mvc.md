# FitGym Planner — Structure MVC

```
fitgym-planner/
│
├── docker-compose.yml
├── Dockerfile
├── .env
├── .env.example
├── package.json
├── tsconfig.json
│
└── src/
    │
    ├── server.ts                    # Point d'entrée — lance Express
    ├── app.ts                       # Config Express (middlewares, routes, CORS)
    │
    ├── config/
    │   └── db.ts                    # Pool PostgreSQL (pg)
    │
    ├── middlewares/
    │   ├── authenticate.ts          # Vérifie le JWT → req.user
    │   ├── authorize.ts             # Vérifie le rôle (ADMIN, COACH, MEMBER)
    │   ├── validateBody.ts          # Valide le body avec un schéma Zod
    │   └── errorHandler.ts          # Middleware global de gestion des erreurs
    │
    ├── utils/
    │   ├── JwtManager.ts            # createJWT() / decodeJWT()
    │   ├── mailer.ts                # Config Nodemailer (SMTP)
    │   └── AppError.ts              # Classe d'erreur custom (status + message)
    │
    ├── routes/
    │   ├── index.ts                 # Agrège toutes les routes
    │   ├── authRoutes.ts            # /api/v1/auth/*
    │   ├── adminUserRoutes.ts       # /api/v1/admin/users/*
    │   ├── adminSanctionRoutes.ts   # /api/v1/admin/sanctions/*
    │   ├── adminPricingRoutes.ts    # /api/v1/admin/pricing/*
    │   ├── adminRequestRoutes.ts    # /api/v1/admin/requests/*
    │   ├── sessionTypeRoutes.ts     # /api/v1/session-types/*
    │   ├── sessionRoutes.ts         # /api/v1/sessions/*
    │   ├── coachRoutes.ts           # /api/v1/coach/*
    │   ├── bookingRoutes.ts         # /api/v1/bookings/*
    │   ├── membershipRoutes.ts      # /api/v1/memberships/*
    │   └── preferenceRoutes.ts      # /api/v1/preferences/* (Phase 6)
    │
    ├── controllers/
    │   ├── authController.ts        # register, login, logout, getMe, updateMe
    │   ├── adminUserController.ts   # CRUD utilisateurs
    │   ├── sanctionController.ts    # CRUD sanctions
    │   ├── pricingController.ts     # CRUD tarifs
    │   ├── sessionTypeController.ts # CRUD types de session
    │   ├── sessionController.ts     # CRUD sessions + participants
    │   ├── coachController.ts       # Planning coach + demandes suppression
    │   ├── bookingController.ts     # Réservations membre
    │   ├── membershipController.ts  # Abonnements membre
    │   └── preferenceController.ts  # Préférences + recommandations (Phase 6)
    │
    ├── models/
    │   ├── userModel.ts             # Requêtes SQL users
    │   ├── sessionModel.ts          # Requêtes SQL sessions
    │   ├── sessionTypeModel.ts      # Requêtes SQL session_types
    │   ├── bookingModel.ts          # Requêtes SQL bookings
    │   ├── pricingModel.ts          # Requêtes SQL pricing
    │   ├── membershipModel.ts       # Requêtes SQL memberships
    │   ├── coachRequestModel.ts     # Requêtes SQL coach_requests
    │   ├── sanctionModel.ts         # Requêtes SQL sanctions
    │   └── preferenceModel.ts       # Requêtes SQL preferences (Phase 6)
    │
    └── validators/
        ├── authValidator.ts         # Schémas Zod pour login/register
        ├── sessionValidator.ts      # Schémas Zod pour sessions
        ├── bookingValidator.ts      # Schémas Zod pour bookings
        ├── sanctionValidator.ts     # Schémas Zod pour sanctions
        ├── pricingValidator.ts      # Schémas Zod pour tarifs
        └── membershipValidator.ts   # Schémas Zod pour memberships
```

## Flow d'une requête (MVC)

```
Client
  → POST /api/v1/bookings { session_id: 12 }
  → Header: Authorization: Bearer eyJhbG...

Route (bookingRoutes.ts)
  → authenticate        ← vérifie le JWT
  → authorize("MEMBER") ← vérifie le rôle
  → validateBody(schema) ← vérifie le body avec Zod
  → bookingController.create

Controller (bookingController.ts)
  → Appelle bookingModel.create(memberId, sessionId)
  → Gère la logique métier (vérifs, erreurs)
  → Retourne la réponse JSON

Model (bookingModel.ts)
  → Exécute la requête SQL via le pool pg
  → Retourne les données brutes au controller
```

## Rôle de chaque couche

- **Routes** → branchent URL + middlewares + controller. Zéro logique.
- **Controllers** → reçoivent req/res, appellent les models, formatent la réponse.
- **Models** → uniquement les requêtes SQL (SELECT, INSERT, UPDATE, DELETE).
- **Validators** → schémas Zod, importés par les routes pour validateBody().
- **Middlewares** → transversaux (auth, erreurs, validation).
- **Utils** → outils partagés (JWT, mailer, erreurs custom).
