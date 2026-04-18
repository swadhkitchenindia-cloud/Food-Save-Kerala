# FoodSave Kerala 🍃

A surplus food app for Kerala — connecting restaurants, bakeries & cafes with customers to reduce food waste.

---

## What's in this folder

```
foodsave-kerala/
├── src/
│   ├── firebase/config.js        ← Your Firebase config (already set)
│   ├── components/
│   │   ├── AuthContext.js        ← Login / auth logic
│   │   ├── RestaurantNav.js      ← Bottom nav for restaurant app
│   │   └── CustomerNav.js        ← Bottom nav for customer app
│   ├── pages/
│   │   ├── Landing.js            ← Home screen (choose role)
│   │   ├── restaurant/           ← All restaurant screens
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── PostItem.js
│   │   │   ├── Orders.js
│   │   │   └── Profile.js
│   │   └── customer/             ← All customer screens
│   │       ├── Login.js
│   │       ├── Register.js
│   │       ├── Browse.js
│   │       ├── ItemDetail.js
│   │       ├── Orders.js
│   │       └── Profile.js
│   ├── App.js                    ← Routes
│   ├── index.js
│   └── index.css                 ← All styles
├── public/index.html
├── firestore.rules               ← Security rules for Firebase
├── vercel.json                   ← Routing for deployment
└── package.json
```

---

## Deploy in 3 steps

### Step 1 — Set up Firestore security rules
1. Go to https://console.firebase.google.com
2. Open your project → Firestore Database → Rules tab
3. Replace everything with the contents of `firestore.rules`
4. Click **Publish**

### Step 2 — Deploy to Vercel
1. Go to https://vercel.com and sign up (free) with GitHub
2. Install Vercel CLI: `npm install -g vercel`  (skip if you use the website)

**Option A — Website (easiest, no terminal needed):**
1. Zip this entire `foodsave-kerala` folder
2. Go to vercel.com → New Project → drag and drop the zip
3. Framework: **Create React App**
4. Click **Deploy**
5. Your app is live at `https://foodsave-kerala.vercel.app` (or similar)

**Option B — Terminal:**
```bash
cd foodsave-kerala
npm install
npm run build
npx vercel --prod
```

### Step 3 — Share links
- Send the Vercel URL to restaurants → they tap "Restaurant / Bakery / Cafe"
- Send the same URL to customers → they tap "Customer"

---

## How it works

| Who | Flow |
|-----|------|
| Restaurant | Register → Dashboard → Post surplus item with price & pickup time |
| Customer | Register → Browse live deals → Tap item → Reserve → Get pickup code |
| Restaurant | Sees order with customer name & code → Marks collected when customer arrives |

## Features
- ✅ Real-time listings (Firestore live updates)
- ✅ Separate restaurant & customer apps in one URL
- ✅ Pickup code system (no payment needed to start)
- ✅ Order history with savings tracker
- ✅ Auto sold-out when quantity hits 0
- ✅ Urgency indicators (ending soon, low stock)

---

Built with React + Firebase + Vercel
