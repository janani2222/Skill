# SkillBridge Phase 4–5 Deployment

## Team and administration

Team dashboards are available at `/projects/:id/team` to project owners and accepted members. Team APIs are under `/api/team`. Admin console is `/admin`; every admin API is protected by backend role middleware.

The production administrator is seeded from `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` after MongoDB connects. There is no public role-promotion API.

## Production setup

1. Provision MongoDB Atlas (or another MongoDB service) and configure `MONGODB_URI` from `server/.env.example`.
2. Set `MONGODB_URI`, a long random `JWT_SECRET`, `NODE_ENV=production`, the frontend origin in `CLIENT_URL`, and `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. In Vercel, add these under Project Settings → Environment Variables; a local `.env` file is not deployed. Do not commit real secrets.
3. Deploy the API from `server/` with `npm install` and `npm start`. Until object storage is configured, mount persistent writable storage at `server/uploads`. Back up the volume.
4. Configure the frontend's `VITE_API_URL` from `client/.env.example` to the API URL ending in `/api`. Run `npm install` and `npm run build` in `client/`, then publish `dist/` on a static host.
5. Configure frontend SPA route fallbacks and proxy `/uploads` to the API (or use a public media host). Restrict database network access to the API host and require TLS.
6. Verify registration, login, profile and cover image persistence, accepted-member access, tasks, status notifications, and admin access after deployment.

## Data-store note

The existing join-request and group-chat controllers use the JSON local store and return unavailable responses when MongoDB is connected. The new team task and milestone operations likewise currently require local data mode. The JSON store requires a persistent disk. Before deploying collaboration features with MongoDB, migrate those collections and the new team activity data to MongoDB-backed models. The current project and student profile models already use MongoDB.
