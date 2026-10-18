# Nova Hunger Food — Premium Full-Stack Food Delivery Web Application

Nova Hunger Food is a modern, responsive, production-oriented food delivery platform featuring four distinct user experiences:
1. **Customers**: Explore certified artisan kitchens, customize dishes, apply promo codes (`NOVAFIRST`, `SUPERNOVA`), order with Cash on Delivery or Card, and track deliveries via a live 8-stage interactive stepper.
2. **Delivery Riders**: Register through dedicated `/rider/register`, await mandatory administrative review on a dedicated Pending Approval screen (`/rider/pending`), go online once approved, and accept & fulfill delivery orders.
3. **Restaurant Managers**: Register commercial kitchens through dedicated `/restaurant/register`, await administrative safety review on `/restaurant/pending`, manage live menus (pricing, stock availability, veg/non-veg tags, prep time), receive incoming kitchen tickets, and dispatch orders to couriers.
4. **Platform Administrators**: Complete administrative control via secure `/admin/login` with real-time KPI counters, rider identity vetting (approve/reject with mandatory justification reasons, suspend/reactivate), restaurant auditing, order dispatch reassignment, and immutable audit logging.

---

## 🎨 Brand Identity & Design System

- **Brand Name**: Nova Hunger Food
- **Primary Background**: `#0B0B0D`
- **Secondary Background**: `#151518`
- **Primary Orange**: `#FF7900`
- **Highlight Orange**: `#FF9D00`
- **Main Text**: `#FFFFFF`
- **Secondary Text**: `#B8B8C0`
- **Borders**: `#2B2B30`
- **Typography**: Display headlines in `Outfit`, body in `Plus Jakarta Sans`.
- **Zero-Pill Discipline**: Unboxed metadata with clean typographic separators (`·`).
- **Micro-Interactions**: Smooth hover lifts, animated search focus, image zoom transitions, and interactive order simulation.

---

## 🚀 Portals & Testing Credentials

Dedicated portals ensure clean role isolation:

| Role | Email | Password | Dedicated Portal |
| :--- | :--- | :--- | :--- |
| **Customer** (Elena Rostova) | `customer@novahunger.com` | `pass123` | Customer Portal (`/customer/dashboard`) |
| **Approved Rider** (Alex Mercer) | `rider.alex@novahunger.com` | `pass123` | Rider Dashboard (`/rider/dashboard`) |
| **Pending Rider** (David Vance) | `rider.david@novahunger.com` | `pass123` | Pending Approval Screen (`/rider/pending`) |
| **Restaurant Manager** (Flame & Crust) | `owner.flame@novahunger.com` | `pass123` | Kitchen Dashboard (`/restaurant/dashboard`) |
| **Master Admin** | `admin@novahunger.com` | `admin123` | Admin Console (`/admin/dashboard`) |

*(All portal credentials use the standard @novahunger.com domain).*

---

## 🛡️ Rider & Restaurant Approval Workflows

1. Couriers and kitchens register through dedicated portal routes (`/rider/register` and `/restaurant/register`).
2. Accounts strictly initiate with status `pending`.
3. Users are routed to dedicated **Pending Approval** screens and cannot access orders or live delivery tools until approved.
4. The administrator inspects applications in the **Admin Dashboard**:
   - **Approve**: Immediately transitions status to `approved` and sends an in-app approval notification.
   - **Reject**: A specific **rejection reason** is required. The applicant views the recorded reason upon login.
   - **Suspend / Reactivate**: Temporarily toggles active operational privileges.
5. All operations are re-validated server-side before execution.

---

## 🛠️ Installation & Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Run full-stack dev server (Express + Vite on Port 3000)
npm run dev

# 3. Production build
npm run build
npm start
```
