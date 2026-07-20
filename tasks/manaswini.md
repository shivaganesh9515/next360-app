# 👋 Hey Manaswini! Your Tasks

## 📥 First: Get Latest Code
Open terminal and run:
```bash
git checkout main
git pull origin main
```

## 📦 Install Dependencies
```bash
cd apps/admin-panel
npm install
```

## 🚀 Start the App
```bash
npm run dev
```

Your app will open at: **http://localhost:3002**

---

## ✅ Task 1: Support Tickets Admin Pages

**Backend is being built by Abhinaya** — once her endpoints are ready, create these pages:

### Page 1: Tickets List

**Create file: `apps/admin-panel/src/app/(dashboard)/support/page.tsx`**

Create a simple table page showing: **Ticket ID, Subject, User, Status, Priority, Date**

Copy the pattern from an existing page like `apps/admin-panel/src/app/(dashboard)/vendors/page.tsx`.

```tsx
'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('OPEN');

  useEffect(() => {
    adminApi.getTickets(statusFilter).then(setTickets);
  }, [statusFilter]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Support Tickets</h1>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4">
        {['OPEN', 'ASSIGNED', 'RESOLVED', 'ALL'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded ${statusFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Subject</th>
            <th className="p-2 text-left">User</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Priority</th>
            <th className="p-2 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket: any) => (
            <tr key={ticket.id} className="border-b hover:bg-gray-50">
              <td className="p-2">{ticket.subject}</td>
              <td className="p-2">{ticket.user?.name || ticket.user?.email}</td>
              <td className="p-2">{ticket.status}</td>
              <td className="p-2">{ticket.priority}</td>
              <td className="p-2">{new Date(ticket.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Page 2: Ticket Detail

**Create file: `apps/admin-panel/src/app/(dashboard)/support/[id]/page.tsx`**

Show the full ticket with replies and a reply form at bottom. Copy the pattern from `vendors/[id]/page.tsx`.

---

## ✅ Task 2: Bulk Product Approval

**File to edit: `apps/admin-panel/src/app/(dashboard)/products/approvals/page.tsx`**

Add checkboxes to the approval table and a "Approve Selected" button:

```tsx
const [selectedIds, setSelectedIds] = useState<string[]>([]);

// Add checkbox in table header
<th><input type="checkbox" onChange={() => {
  if (selectedIds.length === products.length) {
    setSelectedIds([]);
  } else {
    setSelectedIds(products.map(p => p.id));
  }
}} /></th>

// Add checkbox in each row
<td><input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => {
  setSelectedIds(prev =>
    prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id]
  );
}} /></td>

// Add approve button
<button
  onClick={async () => {
    for (const id of selectedIds) {
      await adminApi.approveProduct(id);
    }
    alert(`Approved ${selectedIds.length} products`);
    setSelectedIds([]);
    // Refresh list
  }}
  disabled={selectedIds.length === 0}
  className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
>
  Approve Selected ({selectedIds.length})
</button>
```

---

## ✅ Task 3: Wire Payouts & Reports Pages

**File to edit: `apps/admin-panel/src/app/(dashboard)/payments/vendor-payouts/page.tsx`**
**File to edit: `apps/admin-panel/src/app/(dashboard)/payments/delivery-payouts/page.tsx`**
**File to edit: `apps/admin-panel/src/app/(dashboard)/reports/sales/page.tsx`**
**File to edit: `apps/admin-panel/src/app/(dashboard)/reports/revenue/page.tsx`**

Check that each page is calling the right API function from `adminApi`. If the backend endpoint exists, just wire it. If not, wait until the backend is ready (Abhinaya's task).

API functions to use:
- `adminApi.getPayouts()` → `GET /payouts`
- `adminApi.getVendorPayouts()` → `GET /payouts/vendors`
- `adminApi.getDeliveryPayouts()` → `GET /payouts/delivery`
- `adminApi.getSalesReport(startDate, endDate)` → `GET /reports/sales`
- `adminApi.getRevenueReport(startDate, endDate)` → `GET /reports/revenue`

---

## ✅ Task 4: Settings Notification Toggles

**File to edit: `apps/admin-panel/src/app/(dashboard)/settings/page.tsx`**

The backend already has `GET /admin/settings` and `PATCH /admin/settings`.

Add toggle switches for:
- Auto-approve vendors
- Auto-approve products
- COD enabled
- Maintenance mode

Example:
```tsx
<div className="flex items-center justify-between mb-4">
  <div>
    <p className="font-medium">Auto-Approve Vendors</p>
    <p className="text-sm text-gray-500">Automatically approve new vendor registrations</p>
  </div>
  <input
    type="checkbox"
    checked={settings.autoApproveVendors}
    onChange={(e) => updateSetting('autoApproveVendors', e.target.checked)}
    className="toggle"
  />
</div>
```

---

## ✅ Task 5: E2E Testing

Walk through every page in the admin panel and check:
1. ✅ Page loads without errors
2. ✅ Data appears from backend
3. ✅ Buttons work (approve, reject, delete, edit)
4. ✅ Filters work
5. ✅ Pagination works

**If you find any broken page, just make a note of it here.**

---

## ✅ Task 6: Dashboard Enhancement

**File to edit: `apps/admin-panel/src/app/(dashboard)/page.tsx`**

Add auto-refresh (every 30 seconds):
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetchDashboardData();
  }, 30000);
  return () => clearInterval(interval);
}, []);
```

Add more KPIs if the backend provides them:
- DAU (Daily Active Users)
- Conversion rate
- Average delivery time

---

## 📤 Push Your Changes
```bash
git add .
git commit -m "feat: admin panel improvements"
git push origin main
```
