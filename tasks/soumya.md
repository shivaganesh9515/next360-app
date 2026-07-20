# 👋 Hey Soumya! Your Tasks

## 📥 First: Get Latest Code
Open terminal and run each line one by one:
```bash
git checkout main
git pull origin main
cd apps/vendor-dashboard
npm install
```

## 🚀 Start the App
```bash
npm run dev
```

Your app will open at: **http://localhost:3001**

---

## 📋 Your Summary — 6 Tasks

| # | Task | Files to touch | Difficulty |
|---|------|---------------|------------|
| 1 | Wire payouts page to backend | 1 edit + check api client | ⭐ Easy |
| 2 | Add Razorpay Account ID to store profile | 1 edit | ⭐ Easy |
| 3 | Auto-refresh orders page (30s) | 1 edit | ⭐ Easy |
| 4 | CSV export button on analytics | 1-2 edits | ⭐ Easy |
| 5 | Cancellation reason modal on reject | 1 edit | ⭐⭐ Medium |
| 6 | Bulk actions on products page | 1 edit | ⭐⭐ Medium |

**⏱️ Total time: ~2-3 hours**

**What's already done for you:**
- ✅ Backend endpoints exist (`GET /vendors/me/payouts`, `PATCH /vendors/my-profile`)
- ✅ Razorpay Account ID field is accepted by the backend
- ✅ `POST /orders/:id/cancel` with reason body exists on backend
- ✅ CI/CD pipeline set up to catch errors when you push

---

## ✅ Task 1: Wire Payouts Page to Backend

**File to edit: `apps/vendor-dashboard/src/app/(dashboard)/earnings/payouts/page.tsx`**

Find the API call and make sure it calls the right endpoint. The backend already has:
- `GET /vendors/me/payouts` — returns payout list

In your API client (`apps/vendor-dashboard/src/lib/api.ts`), find the function that gets payouts and make sure it calls:
```typescript
async getMyPayouts() {
  return this.get('/vendors/me/payouts');
}
```

Then in your payouts page, show a simple table with: **Period, Amount, Status, Date**

---

## ✅ Task 2: Add Razorpay Account Field to Store Profile

**File to edit: `apps/vendor-dashboard/src/app/(dashboard)/store/edit/page.tsx`**

Add an input field for `razorpayAccountId`:

```tsx
<div className="mb-4">
  <label className="block text-sm font-medium mb-1">Razorpay Account ID</label>
  <input
    type="text"
    value={form.razorpayAccountId || ''}
    onChange={(e) => setForm({ ...form, razorpayAccountId: e.target.value })}
    placeholder="acc_xxxxxxxxxxxx"
    className="w-full px-3 py-2 border rounded-md"
  />
  <p className="text-xs text-gray-500 mt-1">
    Link your Razorpay account to receive instant payouts via Route.
    Format: acc_xxxxxxxxxxxx
  </p>
</div>
```

The backend already accepts this field in `PATCH /vendors/my-profile`.

---

## ✅ Task 3: Auto-Refresh Orders Page

**File to edit: `apps/vendor-dashboard/src/app/(dashboard)/orders/page.tsx`**

Add this at the top of your component (inside the function):

```typescript
import { useEffect } from 'react';

// Add this inside your component:
useEffect(() => {
  const interval = setInterval(() => {
    // Call your fetch orders function
    fetchOrders();
  }, 30000); // Refresh every 30 seconds

  return () => clearInterval(interval);
}, []);
```

---

## ✅ Task 4: Export CSV from Analytics

**File to edit: `apps/vendor-dashboard/src/app/(dashboard)/analytics/` pages**

Add a button at the top of analytics pages:

```tsx
<button
  onClick={() => {
    // Convert table data to CSV
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics.csv';
    a.click();
  }}
  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
>
  Export CSV
</button>
```

---

## ✅ Task 5: Order Cancellation Reason

**File to edit: `apps/vendor-dashboard/src/app/(dashboard)/orders/page.tsx`**

When a vendor clicks "Reject" on an order, show a small modal/popup asking:
- **Why are you rejecting this order?** (textarea)
- **Submit** button

Send the reason to backend:
```typescript
await api.post(`/orders/${orderId}/cancel`, { reason })
```

---

## ✅ Task 6: Product Bulk Actions

**File to edit: `apps/vendor-dashboard/src/app/(dashboard)/products/page.tsx`**

Add checkbox column to products table:
```tsx
// Add this state
const [selectedIds, setSelectedIds] = useState<string[]>([]);

// Add checkbox column in table header
<th className="p-2">
  <input type="checkbox" onChange={(e) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  }} />
</th>

// Add action buttons when items are selected
{selectedIds.length > 0 && (
  <div className="mb-4 p-3 bg-gray-100 rounded flex gap-2">
    <span>{selectedIds.length} selected</span>
    <button onClick={() => bulkToggleStatus(true)} className="px-3 py-1 bg-green-500 text-white rounded">
      Activate All
    </button>
    <button onClick={() => bulkToggleStatus(false)} className="px-3 py-1 bg-red-500 text-white rounded">
      Deactivate All
    </button>
  </div>
)}
```

---

## 📤 Push Your Changes
```bash
git add .
git commit -m "feat: vendor dashboard improvements"
git push origin main
```

## 🆘 Stuck?
- DM me on Slack — don't spend more than 30 min on any one task
- Check `apps/vendor-dashboard/src/lib/api.ts` to see what API functions already exist
- Run `npm run build` to check for errors before pushing
- If the dev server crashes on start, check that your backend is running first
