# 🎉 Brio Youth Academy — Backend

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)](https://nodejs.org/)  
[![Express](https://img.shields.io/badge/Express-4.x-black?logo=express)](https://expressjs.com/)  
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14.x-blue?logo=postgresql)](https://www.postgresql.org/)  
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)  

> 💼 API REST pour gérer :  
> - Joueurs, Passports, Matches, Statistiques  
> - Authentification admin (JWT)  
> - Upload de photos (Multer)  
> - Sécurité CORS & validation  

---

## 📋 Table des matières

1. [Fonctionnalités](#-fonctionnalités)  
2. [Technologies](#%EF%B8%8F-technologies)  
3. [Prérequis](#%EF%B8%8F-prérequis)  
4. [Installation](#%EF%B8%8F-installation)  

---

## 🚀 Fonctionnalités

- **CRUD** complet pour **players**, **matches**, **stats**, **passports**  
- **Recherche** par âge, poste, passeport  
- **Gestion** des relations many-to-many player↔passport  
- **Upload** de photo (Multer + dossier `/uploads`)  
- **Auth** JWT + middleware pour protéger les routes création & modification  
- **CORS** configuré  

---

## 🛠️ Technologies

- Node.js + Express  
- PostgreSQL + `pg` / `pool`  
- Multer (upload fichiers)  
- jsonwebtoken (JWT)  
- bcrypt (hachage de mot de passe)  
- dotenv (variables d’env)  

---

## 💻 Prérequis

- Node.js ≥ 16  
- PostgreSQL ≥ 12  
- Fichier `.env` configuré  

---

## ⚙️ Installation

```bash
# 1. Cloner le repo
git clone https://github.com/ton-compte/brio-youth-backend.git
cd brio-youth-backend

# 2. Installer les dépendances
npm install

# 3. Créer et ajuster le .env
cp .env.example .env
# → DATABASE_URL, ADMIN_PASSWORD (bcrypt hash), JWT_SECRET, JWT_EXPIRES_IN

# 4. Initialiser la base (run scripts SQL ou migration)
psql $DATABASE_URL -f db/schema.sql

# 5. Démarrer le serveur
npm run dev
