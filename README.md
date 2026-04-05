# Maid Café DreamGarden

Kawaii CMS für das offizielle Schweizer Maid Café DreamGarden.

**Stack:** PHP 8.2 · MariaDB · React 18 · TailwindCSS · Framer Motion · Vite

---

## Schnellstart (Docker)

### 1. Klonen & Konfiguration

```bash
git clone https://github.com/AndyNope/maidcafe-dreamgarden.git
cd maidcafe-dreamgarden
cp .env.example .env
```

### 2. Admin-Passwort generieren

```bash
php scripts/hash_password.php
```

Passwort eingeben → den generierten Hash in `.env` eintragen:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2y$12$...
JWT_SECRET=langer_zufaelliger_string_hier
```

### 3. Docker Compose starten

```bash
docker compose up -d
```

Warten bis alle Container laufen (ca. 30 Sekunden für die DB).

### 4. Frontend Dev-Server

In einem zweiten Terminal:

```bash
cd frontend
npm install
npm run dev
```

Öffne http://localhost:5173

---

## Projektstruktur

```
maidcafe-dreamgarden/
├── backend/               PHP API
│   ├── public/            Apache document root
│   │   ├── index.php      Front controller / Router
│   │   ├── uploads/       Hochgeladene Bilder (auto-erstellt)
│   │   └── .htaccess
│   └── src/
│       ├── Database.php
│       ├── Router.php
│       ├── JWT.php
│       ├── Auth.php
│       └── controllers/
├── database/
│   └── schema.sql         MariaDB Schema + Seed-Daten
├── frontend/              React App
│   └── src/
│       ├── components/    Cursor, Intro, Navbar, Footer, ...
│       ├── pages/         Home, Menu, Members, Blog, BlogPost
│       ├── admin/         CMS Login + Dashboard
│       ├── api/           Axios client
│       └── context/       Auth Context
├── scripts/
│   └── hash_password.php  Passwort-Hash Generator
├── docker-compose.yml
└── .env.example
```

---

## API Endpunkte

### Öffentlich (kein Token nötig)
| Method | Pfad               | Beschreibung               |
|--------|--------------------|----------------------------|
| GET    | /api/posts         | Alle veröffentlichten Posts |
| GET    | /api/posts/{slug}  | Einzelner Post             |
| GET    | /api/members       | Alle aktiven Mitglieder    |
| GET    | /api/menu          | Menü nach Kategorien       |

### Admin (Bearer JWT nötig)
| Method | Pfad                      | Beschreibung              |
|--------|---------------------------|---------------------------|
| POST   | /api/auth/login           | Login → JWT               |
| POST   | /api/posts                | Post erstellen            |
| PUT    | /api/posts/{id}           | Post bearbeiten           |
| DELETE | /api/posts/{id}           | Post löschen              |
| POST   | /api/members              | Mitglied hinzufügen       |
| PUT    | /api/members/{id}         | Mitglied bearbeiten       |
| DELETE | /api/members/{id}         | Mitglied löschen          |
| POST   | /api/menu                 | Menü-Item hinzufügen      |
| PUT    | /api/menu/{id}            | Menü-Item bearbeiten      |
| DELETE | /api/menu/{id}            | Menü-Item löschen         |
| POST   | /api/menu/categories      | Kategorie hinzufügen      |
| POST   | /api/upload               | Bild hochladen (→ URL)    |

---

## Deployment auf Plesk Shared Hosting

### Backend

1. `backend/public/` Inhalt → Server-Webroot (z.B. `/httpdocs/`) hochladen
2. `backend/src/` → `/httpdocs/src/` hochladen
3. `backend/.htaccess` (aus `public/`) sicherstellen
4. Im Plesk-Panel Umgebungsvariablen setzen **oder** eine `.env` Datei einen Level oberhalb des Webroots ablegen

### Frontend

```bash
cd frontend
npm ci
VITE_API_URL=https://maidcafe-dreamgarden.ch npm run build
```

Den Inhalt von `frontend/dist/` in den Webroot hochladen.

> Da React alle Routen clientseitig verwaltet, braucht es eine `.htaccess` die alle Anfragen auf `index.html` weiterleitet:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_URI} !^/uploads/
RewriteRule ^ index.html [L]
```

### Datenbank

Im Plesk-Panel eine MariaDB-Datenbank erstellen, dann das Schema importieren:

```bash
mysql -h HOST -u USER -p DBNAME < database/schema.sql
```

---

## Lokale Entwicklung ohne Docker

```bash
# PHP Built-in Server (nur für Entwicklung)
cd backend/public
php -S localhost:8080

# Frontend
cd frontend
npm install
npm run dev
```

---

## GitHub

```bash
git remote add origin https://github.com/AndyNope/maidcafe-dreamgarden.git
git branch -M main
git push -u origin main
```

---

## CMS Admin

Erreichbar unter `/admin/login` — Login mit den konfigurierten Zugangsdaten.

**Moe Moe Kyun~!**
