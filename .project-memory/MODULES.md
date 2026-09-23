# Modules

## All NestJS Modules (35+)

| Module | Controller Routes | Service Methods | Status |
|--------|------------------|-----------------|--------|
| Auth | POST signup, login, send-otp, verify-otp, forgot-password, reset-password | register, login, sendOtp, verifyOtpLogin | Complete |
| Users | GET me, PATCH me, GET (list), PATCH :id/role | findById, findByEmail, updateProfile, findAll, updateRole | **Missing: GET :id, PATCH :id/status** |
| Vendors | POST register, GET list, PATCH :id/approve, PATCH :id/status, GET :id/detail | register, findAll, approve, updateStatus, getAdminDetail | Complete |
| Products | CRUD, GET :id, PATCH :id/approve | create, findAll, findOne, update, remove, approve | Complete |
| Orders | POST create, GET list, GET :id, PATCH :id/status, POST :id/cancel | create, findAll, findOne, updateStatus, cancel | Complete |
| Payments | POST razorpay-order, POST verify, POST webhook, GET :orderId | createOrder, verifyPayment, handleWebhook, findByOrder | Complete |
| Cart | POST/GET/PATCH/DELETE | addItem, getCart, updateQuantity, removeItem, clearCart | Complete |
| Wishlist | POST/DELETE, GET list | add, remove, findAll | Complete |
| Reviews | POST create, GET by product, DELETE :id | create, findByProduct, delete | Complete |
| Addresses | CRUD | create, findAll, update, delete, setDefault | Complete |
| Categories | CRUD with storeType | create, findAll, update, delete | Complete |
| Sub-Categories | CRUD nested | create, findAll, update, delete | Complete |
| Brands | CRUD with storeType | create, findAll, update, delete | Complete |
| Coupons | CRUD with validation | create, findAll, update, delete, validate | Complete |
| Offers | CRUD with date range | create, findAll, update, delete | Complete |
| Returns | POST request, PATCH :id | request, findAll, update | Complete |
| Inventory | GET stock, PATCH :productId, GET low-stock | getStock, updateStock, getLowStock | Complete |
| Upload | POST image (multipart) | uploadImage | Complete |
| Notifications | GET list, unread-count, PATCH read/read-all, POST register, DELETE unregister, GET tokens | findAll, getUnreadCount, markAsRead, markAllAsRead, registerPushToken, getAllPushTokens, 33+ event methods | **Missing: POST broadcast** |
| Commission | GET summary, PATCH :id/pay, PATCH rate/:vendorId | getSummary, markPaid, updateRate | Complete |
| KYC | POST submit, GET status, PATCH :id/verify | submit, getStatus, verify | Complete |
| Roles | CRUD | create, findAll, update, delete | Complete |
| Permissions | CRUD | create, findAll, delete | Complete |
| CMS | Pages CRUD, Banners CRUD | pages: CRUD, banners: CRUD | Complete |
| AI | POST chat, POST scan, GET recommendations, GET health-insights, GET admin/logs, GET admin/analytics | chat, scan, getRecommendations, getHealthInsights, getLogs, getAnalytics | Complete |
| Seed | POST seed-demo-data, POST reset | seedDemoData, reset | Complete |
| Health | GET /health | check | Complete |
| Admin | GET dashboard, GET/PATCH settings | getDashboard, getSettings, updateSettings | Complete |
| Audit | GET list, GET summary | findAll, getSummary, log | Complete |
| Delivery Slot | GET list, POST (admin) | findAll, create | Complete |
| Delivery | Assignment, OTP, tracking | assign, verifyOtp, updateLocation, complete | Complete |
| Disputes | GET list, PATCH :id/resolve | findAll, resolve | Complete |
| Delivery Partners | CRUD, status, KYC | register, findAll, findOne, updateStatus | Complete |
| Zones | CRUD | create, findAll, update, delete | Complete |

## Modules to Create (Ashwanth's tasks)
| Module | Purpose | Priority |
|--------|---------|----------|
| Reports | GET /reports/sales, GET /reports/revenue | P1 |
| PayoutsAdmin | GET /payouts/vendors, GET /payouts/delivery | P1 |
| Support | Ticket CRUD, admin reply, status management | P0 |
