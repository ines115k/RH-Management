# RH-Management

Application web de gestion des ressources humaines : authentification sécurisée, gestion des rôles (Admin, Manager, Employé), gestion des employés, présences et congés, tableau de bord interactif.

## Stack technique
- **Backend** : Python / Django REST Framework + MongoEngine
- **Frontend** : React.js (Vite)
- **Base de données** : MongoDB
- **Conteneurisation** : Docker & Docker Compose
- **CI/CD** : GitHub Actions → Docker Hub

## ArchitecturetestChaque service tourne dans son propre conteneur Docker, orchestrés via `docker-compose.yml`.

## Lancer le projet en local

```bash
git clone https://github.com/ines115k/RH-Management.git
cd RH-Management
docker compose up --build
```

- Frontend : http://localhost:3000
- Backend (API) : http://localhost:8000
- MongoDB : port 27017

## Créer un premier compte admin

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rh.com","password":"Admin1234!","first_name":"Admin","last_name":"RH","role":"admin"}'
```

## Pipeline CI/CD

À chaque push sur `main`/`master`, GitHub Actions :
1. Teste le backend Django (`manage.py check`)
2. Teste le build du frontend React
3. Construit les images Docker (backend + frontend)
4. Les pousse sur Docker Hub

Images disponibles : `iness115/rh-backend`, `iness115/rh-frontend`

## Problème résolu pendant le développement

Le conteneur MongoDB (`mongo:latest`, version 8.2) crashait de façon aléatoire (exit code 139) lors de certaines requêtes, sans message d'erreur explicite dans les logs. Solution : épingler l'image à une version plus stable (`mongo:7.0`) dans `docker-compose.yml`.
