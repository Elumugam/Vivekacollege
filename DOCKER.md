# Running MongoDB locally with Docker

Prerequisite: install Docker Desktop for Windows:
https://docs.docker.com/desktop/install/windows-install/

From the project root run (PowerShell):

```powershell
docker compose up -d
```

This brings up:
- MongoDB on `localhost:27017`
- Mongo Express admin UI on `http://localhost:8081`

When running the backend with Docker-provided Mongo, use the provided env file:

PowerShell (set server env and start):

```powershell
cd server
Copy-Item -Path .env.docker -Destination .env -Force
npm run dev
```

Unix / WSL:

```bash
cd server
cp .env.docker .env
npm run dev
```

After Mongo starts, seed the database:

```powershell
cd server
node seed.js
```

Notes:
- If Docker Desktop is not installed, follow the installer link above and then re-run `docker compose up -d`.
- I cannot install Docker on your machine from this session. If you'd like, after you install Docker I can run `docker compose up -d` for you from this environment.
