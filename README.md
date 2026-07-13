# Saraburi Energy Station Management System
ระบบจัดเก็บและบริหารข้อมูลสถานีบริการพลังงาน จังหวัดสระบุรี (น้ำมัน, LPG, NGV, EV Charger)

ระบบเว็บแอปพลิเคชันเวอร์ชันใช้งานจริง (Production-ready) ออกแบบโครงสร้างด้วยแนวคิด **Mobile-First 100%** สำหรับเจ้าหน้าที่ในการลงพื้นที่สำรวจและบริหารจัดการข้อมูลพลังงาน ครอบคลุมพื้นที่ทั้ง 13 อำเภอในจังหวัดสระบุรี (ข้อมูลอำเภอจัดเก็บและแสดงผลในรูปแบบภาษาไทยอย่างสมบูรณ์ ทั้งในระดับฐานข้อมูลและ API)

---

## ⚡ Tech Stack (สถาปัตยกรรมระบบ)
- **Frontend/Backend Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS (Premium Dark Theme & Glassmorphism)
- **Database ORM**: Prisma ORM (v7) พร้อม PostgreSQL Database
- **Object Storage**: MinIO (S3-Compatible Object Storage) สำหรับอัปโหลดภาพสถานี
- **Authentication**: Stateless Cookie Session (JWT via `jose` library)
- **Route Guard / Protection**: Next.js 16 `proxy.ts` (มาแทน Middleware เดิม)
- **Infrastructure & Proxy**: Docker Compose & Traefik Reverse Proxy

---

## 📂 โครงสร้างโฟลเดอร์หลัก
```bash
├── docker/                  # ไฟล์การตั้งค่าสำหรับ Docker Services
│   └── postgres/init.sql    # สคริปต์สร้าง Extension และสิทธิ์ฐานข้อมูลเริ่มต้น
├── prisma/
│   ├── schema.prisma        # Database Schema (Station & User models)
│   ├── seed.ts              # ข้อมูลผู้ใช้เริ่มต้น และสถานีตัวอย่าง 7 แห่ง
│   └── config.ts            # ไฟล์ตั้งค่าสำหรับรันคำสั่ง Migrate/Seed บน Prisma v7
├── src/
│   ├── app/
│   │   ├── (app)/           # ส่วนที่เข้าถึงได้เฉพาะผู้ใช้ที่ผ่านการ Login (Protected)
│   │   │   ├── admin/users/ # ระบบจัดการผู้ใช้ของ Admin (RBAC)
│   │   │   ├── dashboard/   # หน้าหลัก สรุปสถิติ รายการสถานี ค้นหาและตัวกรอง
│   │   │   ├── map/         # หน้าแผนที่แบบ Leaflet Map แสดงหมุดและกรองรายอำเภอ
│   │   │   └── stations/    # หน้า รายละเอียด, เพิ่มสถานีใหม่ และแก้ไขสถานี
│   │   ├── (auth)/login/    # หน้าเข้าสู่ระบบ
│   │   ├── api/             # REST API endpoints (Auth, Stations, Upload, Users)
│   │   ├── globals.css      # Custom styling, Glassmorphism, animations
│   │   └── layout.tsx       # Root layout และ viewport ป้องกันการซูมบนมือถือ
│   ├── components/          # UI Components แยกส่วนการใช้งานอย่างเป็นระบบ
│   ├── lib/                 # คลังโค้ดช่วยเหลือ (MinIO helper, Prisma singleton, constants)
│   └── proxy.ts             # ระบบป้องกันความปลอดภัยเส้นทาง URL (Next.js 16 Proxy)
├── Dockerfile               # การสร้าง Docker Image แบบ Multi-stage
└── docker-compose.yml       # ตัวควบคุมระบบและเครือข่าย Container ทั้งหมด
```

---

## 🔑 บัญชีเข้าใช้งานระบบเริ่มต้น (Default Users)
ระบบทำการเข้ารหัสรหัสผ่านด้วย `bcryptjs` อย่างปลอดภัย บัญชีต่อไปนี้จะถูกสร้างโดยอัตโนมัติหลังจากการรัน database seed:

| Username | รหัสผ่าน | บทบาท (Role) | สิทธิ์การเข้าถึงข้อมูล (RBAC) |
| :--- | :--- | :--- | :--- |
| **admin** | `saraburi2025` | `ADMIN` | จัดการระบบได้ทั้งหมด (รวมถึงแก้ไข/ลบผู้ใช้ และลบสถานี) |
| **editor** | `saraburi2025` | `EDITOR` | ลงพื้นที่สำรวจข้อมูล: เพิ่ม และแก้ไขข้อมูลสถานีได้ (ไม่มีสิทธิ์ลบ หรือจัดการผู้ใช้) |
| **viewer** | `saraburi2025` | `VIEWER` | ดูข้อมูล รายการสถานี และแผนที่ได้เท่านั้น (อ่านอย่างเดียว) |

---

## 🚀 ขั้นตอนการติดตั้งและรันระบบด้วย Docker Compose

ก่อนทำการเริ่มระบบ ตรวจสอบให้แน่ใจว่าคุณได้จัดเตรียมไฟล์ `.dockerignore` ในโปรเจกต์แล้วเพื่อป้องกันข้อผิดพลาดในการโหลด context (ซึ่งมีอยู่แล้วในไฟล์ระบบขณะนี้)

### 1. กำหนดค่าสภาพแวดล้อม (Environment Variables)
คัดลอกไฟล์ต้นแบบ `.env.example` ไปเป็น `.env` และกำหนดค่าดังนี้:
```bash
cp .env.example .env
```
ค่าที่สำคัญใน `.env`:
* `DATABASE_URL`: สำหรับระบบ Next.js และ Prisma (ชี้ไปยังเครื่อง `postgres` ภายในวงเน็ตเวิร์ก Docker)
* `SESSION_SECRET`: คีย์สุ่มสำหรับเข้ารหัส JWT Session (ควรเปลี่ยนเป็นคีย์ที่ปลอดภัยสำหรับการใช้งานจริง)
* `MINIO_PUBLIC_URL`: ลิงก์สาธารณะสำหรับเข้าถึงรูปภาพสถานี (กรณีรันบนเซิร์ฟเวอร์คลาวด์ ให้ชี้ไปยัง Domain หรือ IP ของเซิร์ฟเวอร์แทน `http://localhost:9000`)

### 2. สั่งรันระบบผ่าน Docker Compose
รันคำสั่งนี้เพื่อดาวน์โหลดอิมเมจ และเริ่มการสร้างระบบทั้งหมดในลักษณะ Background Mode:
```bash
docker compose up -d --build
```

### 3. รัน Database Migrate และ Seed ข้อมูลเริ่มต้น
เมื่อระบบของ Container ทั้งหมดเริ่มทำงานเรียบร้อยแล้ว ให้สั่งรันคำสั่งเหล่านี้เพื่อสร้างตารางและใส่ข้อมูลเริ่มต้น (Admin + Editor + Viewer และสถานีจำลอง) จากภายในคอนเทนเนอร์:

```bash
# รันคำสั่งสร้างโครงสร้างตารางและอัปเดตฐานข้อมูลภายในคอนเทนเนอร์
docker compose exec nextjs npm run db:push

# รันคำสั่งใส่ข้อมูลจำลองและสิทธิ์แอดมินเริ่มต้นภายในคอนเทนเนอร์
docker compose exec nextjs npm run db:seed
```

### 4. การอัปเดตระบบและการ Migrate ฐานข้อมูล (สำหรับ Production Updates)
เมื่อมีการดึงอัปเดตโค้ดใหม่ที่มีการเปลี่ยนแปลงโครงสร้างฐานข้อมูล (เช่น การปรับค่า Enum อำเภอเป็นภาษาไทย):
1. ดึงโค้ดล่าสุดและสั่ง Build คอนเทนเนอร์ Next.js ใหม่:
   ```bash
   git pull origin main
   docker compose up -d --build nextjs
   ```
2. รันคำสั่งตรวจสอบและ Deploy Migration เพื่อเปลี่ยนแปลงโครงสร้างฐานข้อมูลจริง:
   ```bash
   docker compose exec nextjs npx prisma migrate deploy
   ```

---

## ⚙️ ข้อมูลโดเมนและการเข้าถึงภายนอก (Domain & Access Map)

เมื่อเปิดใช้งานระบบร่วมกับ Traefik (โดยมีเครือข่ายภายนอก `proxy_net`) จะสามารถเข้าใช้งานผ่านโดเมนต่างๆ ดังนี้:
- **แอปพลิเคชันหลัก (Next.js)**: [https://energy.saraburidev.org](https://energy.saraburidev.org) (รองรับการทำ Redirect จาก www)
- **MinIO Object Console (หน้าจัดการไฟล์)**: [https://console.energy.saraburidev.org](https://console.energy.saraburidev.org) (เข้าใช้งานด้วย `minioadmin` / `minioadmin123`)
- **MinIO API (S3 Endpoint)**: [https://s3.energy.saraburidev.org](https://s3.energy.saraburidev.org)

---

## 🛡️ การแก้ไขปัญหาเบื้องต้น (Troubleshooting)

### ❌ ข้อผิดพลาด "invalid file request .next/node_modules/..." ตอนรัน Docker build
* **สาเหตุ**: Docker Daemon พยายามส่งแคชโฟลเดอร์ `.next` หรือ `node_modules` ที่เกิดจากการรันโปรเจกต์ภายในเครื่อง (Local Windows) เข้าไปใน Docker Build Context ซึ่งมีสัญลักษณ์ลิงก์ (Symlink) ที่ระบบ Linux Docker อ่านไม่ได้
* **วิธีแก้ไข**: เพิ่มไฟล์ `.dockerignore` ลงในโฟลเดอร์หลักของโปรเจกต์ และระบุโฟลเดอร์ `.next`, `node_modules`, `dist` และ `.git` ไว้ (ในโปรเจกต์นี้ได้รับการเพิ่มไฟล์และกำหนดค่าเรียบร้อยแล้ว)

### ❌ รูปภาพสถานีไม่อัปโหลด หรือแสดงภาพพัง (Broken Image)
* **สาเหตุ**: ค่าพารามิเตอร์ `MINIO_PUBLIC_URL` ในไฟล์ `.env` ชี้ไปยัง `localhost:9000` ทำให้เบราว์เซอร์จากภายนอกไม่สามารถดึงรูปภาพได้
* **วิธีแก้ไข**: เปลี่ยนค่า `MINIO_PUBLIC_URL` ใน `.env` ของเซิร์ฟเวอร์ ให้เป็นโดเมนหรือไอพีแอดเดรสสาธารณะของเซิร์ฟเวอร์ เช่น `MINIO_PUBLIC_URL=http://your-server-ip:9000` จากนั้นสั่ง restart container:
  ```bash
  docker compose down && docker compose up -d
  ```
