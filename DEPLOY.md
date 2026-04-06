# Deploy PAWIN-ASSETS

## 1. Database — TiDB Cloud (MySQL-compatible, Free 5GB)
1. ไปที่ https://tidbcloud.com → Sign up
2. Create Cluster → เลือก Serverless (Free Tier: 5GB storage, 50M RUs/month)
3. ในหน้า Cluster → "Connect" → เลือก "General" → Copy connection string
4. ตั้งค่า Public Access (หรือใช้ IP whitelist สำหรับ Render)
5. สร้าง database: `CREATE DATABASE pawin_tech;`
6. นำ Credentials ใส่ `.env` ใน Render

**ตัวอย่าง .env สำหรับ TiDB Cloud:**
```
DB_HOST=<tidb-host>.aws.tidbcloud.com
DB_USER=<user>.root
DB_PASSWORD=<password>
DB_NAME=pawin_tech
DB_PORT=4000
DB_SSL=true
```

## 2. Backend — Render.com (Free Tier)
1. Push โค้ด backend ขึ้น GitHub (โฟลเดอร์ `pawin-assets-backend`)
2. ไปที่ https://render.com → New Web Service → Connect repo
3. ตั้งค่า:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:** ใส่ค่าจากข้อ 1 (DB credentials) + `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, `FRONTEND_URL`
4. กด Deploy

## 3. Frontend — Firebase Hosting (Free)
1. ติดตั้ง Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Init: `cd pawin-assets-frontend && firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy`
6. แก้ `.env.production` → เปลี่ยน `VITE_API_URL` และ `VITE_SOCKET_URL` เป็น URL ของ Render backend แล้ว build ใหม่

## 4. Update Frontend API URL
หลัง deploy backend ได้ URL แล้ว:
1. แก้ `/pawin-assets-frontend/.env.production`:
   ```
   VITE_API_URL=https://your-app.onrender.com
   VITE_SOCKET_URL=https://your-app.onrender.com
   ```
2. Run: `npm run build` แล้ว deploy ใหม่
