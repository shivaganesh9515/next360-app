---
phase: 11-ai-features
plan: 11
type: execute
wave: 7
depends_on:
  - 05-customer-app-a-06
  - 09-admin-panel-09
files_modified:
  - apps/api/src/ai/ai.module.ts
  - apps/api/src/ai/ai.controller.ts
  - apps/api/src/ai/ai.service.ts
  - apps/api/src/ai/dto/*.ts
  - apps/api/src/app.module.ts
  - apps/api/package.json
  - apps/customer-app/src/screens/ai/AiAssistantScreen.tsx
  - apps/customer-app/src/screens/ai/AiProductScannerScreen.tsx
  - apps/customer-app/src/screens/ai/AiRecommendationsScreen.tsx
  - apps/customer-app/src/screens/ai/AiHealthInsightsScreen.tsx
  - apps/customer-app/src/screens/ai/AiChatHistoryScreen.tsx
  - apps/customer-app/src/navigation/AppNavigator.tsx
  - apps/customer-app/src/lib/api.ts
  - apps/customer-app/package.json
  - apps/admin-panel/src/app/(dashboard)/ai-logs/page.tsx
  - apps/admin-panel/src/app/(dashboard)/ai-logs/recommendations/page.tsx
  - apps/admin-panel/src/app/(dashboard)/ai-logs/analytics/page.tsx
  - apps/admin-panel/src/lib/api.ts
  - .env.example
autonomous: false
requirements:
  - AI-01
  - AI-02
  - AI-03
  - AI-04
  - AI-05
  - AI-06
  - AI-07
  - AI-08
must_haves:
  truths:
    - "Customer can chat with AI assistant about products, orders, and health tips"
    - "Customer can scan a product using camera to identify it and get details"
    - "Customer receives personalized product recommendations"
    - "Customer gets AI-powered health insights based on purchased products"
    - "Customer can view their AI chat history"
    - "Admin can view AI scanner logs"
    - "Admin can manage AI recommendations"
    - "Admin can view AI analytics (usage, popular queries, accuracy)"
  artifacts:
    - path: "apps/customer-app/src/screens/ai/AiAssistantScreen.tsx"
      provides: "AI chat assistant screen"
      min_lines: 80
    - path: "apps/customer-app/src/screens/ai/AiProductScannerScreen.tsx"
      provides: "Camera-based product scanner"
    - path: "apps/api/src/ai/ai.service.ts"
      provides: "AI backend service (OpenAI/Gemini integration)"
  key_links:
    - from: "apps/api/src/ai/ai.service.ts"
      to: "OpenAI/Gemini API"
      via: "REST API calls"
    - from: "apps/customer-app/src/screens/ai/AiAssistantScreen.tsx"
      to: "apps/api/ai/chat"
      via: "POST /ai/chat"
    - from: "apps/customer-app/src/screens/ai/AiProductScannerScreen.tsx"
      to: "apps/api/ai/scan"
      via: "POST /ai/scan with image"
---

<objective>
Implement AI-powered features: AI Assistant chat, AI Product Scanner, AI Recommendations, AI Health Insights, and admin AI management.

Purpose: Differentiate the platform with intelligent features — help customers make informed purchasing decisions and improve engagement through AI.
Output: AI backend module with OpenAI/Gemini integration + 5 customer screens (chat, scanner, recommendations, health insights, history) + 3 admin management screens (logs, recommendations, analytics).
</objective>

<execution_context>
@C:/Users/gunny/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/gunny/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/05-customer-app-a/05-customer-app-a-06-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: AI backend module — OpenAI/Gemini integration with chat, scan, recommend</name>
  <files>
    apps/api/src/ai/ai.module.ts
    apps/api/src/ai/ai.service.ts
    apps/api/src/ai/ai.controller.ts
    apps/api/src/ai/dto/chat.dto.ts
    apps/api/src/ai/dto/scan.dto.ts
    apps/api/src/app.module.ts
    apps/api/package.json
    .env.example
  </files>
  <action>
    Create AI module with OpenAI/Gemini integration:

    1. Install dependencies: openai or @google/generative-ai, multer (for image upload)

    2. Create ai.module.ts — imports PrismaModule, registers AiService and AiController

    3. Create ai.service.ts with methods:

       a. chat(userId, message, context?):
          - Accept user message and optional context (current product, cart, order)
          - Call OpenAI/Gemini with system prompt about marketplace, products, health
          - System prompt includes store info, product categories, dietary guidelines
          - Stream response or return complete message
          - Log interaction in AI_Log table (type: CHAT)
          - Return AI response

       b. scanProduct(imageBuffer):
          - Accept image from camera upload
          - Call OpenAI Vision or Gemini Vision API to identify product
          - Extract: product name, category, estimated nutritional info
          - Search database for matching product
          - Log in AI_Log (type: SCANNER)
          - Return identified product + nutritional data

       c. getRecommendations(userId, limit?):
          - Analyze user's order history and wishlist
          - Get products from categories user frequently buys
          - Call AI to rank/personalize recommendations
          - Return top N products with reason
          - Log in AI_Log (type: RECOMMENDATION)

       d. getHealthInsights(userId):
          - Analyze user's purchased products (organic groceries, natural items)
          - Call AI with nutritional data of purchased items
          - Generate personalized health tips, dietary suggestions
          - Return insights: { summary, tips[], warnings[] }
          - Log in AI_Log (type: HEALTH_INSIGHT)

       e. getChatHistory(userId, page, limit):
          - Return paginated chat history from AI_Log table

       f. getAdminLogs(filters):
          - Admin endpoint to view all AI interactions
          - Filter by type (SCANNER/CHAT/RECOMMENDATION/HEALTH_INSIGHT)
          - Filter by user, date range
          - Pagination

       g. getAdminAnalytics(dateRange):
          - Total AI interactions
          - Most popular queries
          - Most scanned products
          - Recommendation click-through rate (if tracked)
          - User engagement metrics

    4. Create ai.controller.ts with endpoints:
       - POST /ai/chat — protected, send message to AI assistant
         - Body: { message, context?: { productId?, orderId? } }
       - POST /ai/scan — protected, upload product image for scanning
         - Multipart: file (image)
       - GET /ai/recommendations — protected, get personalized recommendations
         - Query: limit (default 10)
       - GET /ai/health-insights — protected, get health insights
       - GET /ai/chat-history — protected, get chat history
         - Query: page, limit
       - GET /ai/admin/logs — admin only, view all AI logs
         - Query: type, userId, startDate, endDate, page, limit
       - GET /ai/admin/analytics — admin only, AI usage analytics
         - Query: dateRange

    5. Update .env.example with AI API keys:
       - OPENAI_API_KEY=
       - GEMINI_API_KEY=

    6. Register AiModule in app.module.ts

    7. Rate limiting: AI endpoints should have higher limits (30 req/min for chat, 10 req/min for scan)
  </action>
  <verify>
    Check ai.service.ts has chat, scanProduct, getRecommendations, getHealthInsights methods.
    Check ai.controller.ts has all 7 endpoints.
    Verify AI logs are created in AI_Log table.
  </verify>
  <done>
    AI backend module with chat, scan, recommendations, health insights, and admin endpoints is complete.
  </done>
</task>

<task type="auto">
  <name>Task 2: Customer AI screens — Assistant, Scanner, Recommendations, Health Insights, Chat History</name>
  <files>
    apps/customer-app/src/screens/ai/AiAssistantScreen.tsx
    apps/customer-app/src/screens/ai/AiProductScannerScreen.tsx
    apps/customer-app/src/screens/ai/AiRecommendationsScreen.tsx
    apps/customer-app/src/screens/ai/AiHealthInsightsScreen.tsx
    apps/customer-app/src/screens/ai/AiChatHistoryScreen.tsx
    apps/customer-app/src/navigation/AppNavigator.tsx
    apps/customer-app/src/lib/api.ts
    apps/customer-app/package.json
  </files>
  <action>
    Build 5 AI screens for the customer app:

    1. Install dependencies: expo-camera, expo-image-picker (for scanner)

    2. AiAssistantScreen (AI Chat):
       - Full chat interface with message bubbles
       - Text input + send button at bottom
       - User messages: right-aligned, brand color
       - AI messages: left-aligned, gray bubble with bot avatar
       - Loading indicator while AI responds
       - Streaming text effect (optional)
       - Suggested quick prompts: "What's good for immunity?", "Recommend organic snacks", "Track my order"
       - Context-aware: if user came from a product page, include product context
       - Scroll-to-bottom on new messages
       - Empty state: welcome message with suggestions

    3. AiProductScannerScreen:
       - Camera viewfinder (full screen, with scan frame overlay)
       - "Scan a product" instruction text
       - On scan: capture image, send to /ai/scan
       - Loading: "Identifying product..."
       - Results overlay:
         - Product name, image, category
         - Match found → navigate to Product Detail
         - No match → show nutritional info from AI, "Search manually" option
       - Flash toggle, camera flip button
       - Gallery pick option (for testing)

    4. AiRecommendationsScreen:
       - "Recommended for You" header with personalization note
       - Horizontal scrollable category rows: "Based on your orders", "Trending in Organic", "You might like"
       - Each recommendation card: product image, name, price, "Why?" reason badge
       - Tap → Product Detail
       - Pull-to-refresh
       - Empty state: "Order more to get personalized recommendations"
       - Loading skeleton

    5. AiHealthInsightsScreen:
       - Dashboard-style layout
       - Summary card: "Based on your purchases, here's your wellness profile"
       - Insight cards with icons:
         - Dietary tips based on purchased items
         - Nutritional highlights
         - Suggestions for next purchase
         - Warnings (e.g., "You haven't ordered vegetables this week")
       - "Boost your health" section with product suggestions
       - Share insights button (optional)
       - Pull-to-refresh
       - Loading skeleton

    6. AiChatHistoryScreen:
       - List of past AI conversations, grouped by date
       - Each item: first 2 lines of conversation preview, date, time
       - Tap → open AiAssistantScreen with that conversation loaded
       - Swipe to delete individual chats
       - "Clear All" button with confirmation
       - Empty state: "No chat history yet"
       - Pagination

    7. Update AppNavigator.tsx:
       - Add AI section to bottom tab or profile menu
       - Add AI tab with brain/sparkle icon (or add to profile section)
       - Tab order: Home, AI, Cart, Orders, Profile (if AI is a main tab)
       - Or: AI entry from Home screen floating button + Profile menu

    8. Update src/lib/api.ts with AI methods:
       - sendAiMessage(message, context?), scanProduct(image), getAiRecommendations(limit), getHealthInsights(), getChatHistory(page, limit), deleteChat(id)
  </action>
  <verify>
    Check AiAssistantScreen renders chat UI with input field.
    Check AiProductScannerScreen has camera viewfinder.
    Check AiRecommendationsScreen shows product cards with reasons.
    Check AiHealthInsightsScreen shows insight cards.
    Check AiChatHistoryScreen shows conversations grouped by date.
  </verify>
  <done>
    All 5 customer AI screens (assistant, scanner, recommendations, health insights, history) are complete.
  </done>
</task>

<task type="auto">
  <name>Task 3: Admin AI management screens — Log viewer, Recommendation manager, Analytics</name>
  <files>
    apps/admin-panel/src/app/(dashboard)/ai-logs/page.tsx
    apps/admin-panel/src/app/(dashboard)/ai-logs/recommendations/page.tsx
    apps/admin-panel/src/app/(dashboard)/ai-logs/analytics/page.tsx
    apps/admin-panel/src/lib/api.ts
  </files>
  <action>
    Build 3 admin AI management screens:

    1. AI Scanner Logs page:
       - Table of all product scans
       - Columns: User, Product Scanned, AI Result, Confidence, Date
       - Search by user name, product name
       - Filter by date range
       - Click row → expand to see full AI response
       - Pagination
       - Export to CSV option

    2. AI Recommendations page:
       - Table of generated recommendations
       - Columns: User, Recommended Products, Category, Date Generated, Clicked?
       - Filter by date range
       - "Popular Recommendations" section (most frequently recommended products)
       - Toggle recommendation types on/off

    3. AI Analytics page:
       - Summary cards:
         - Total AI Interactions (today/this week/this month)
         - Most Used Feature (Chat vs Scanner vs Recommendations vs Health)
         - Average Response Time
         - User Satisfaction (thumbs up/down ratio if tracked)
       - Usage over time — line chart
       - Popular queries — word cloud or ranked list
       - Feature breakdown — donut chart
       - Top scanned products — bar chart
       - User engagement metrics — daily active AI users

    4. Update admin lib/api.ts with:
       - getAiLogs(filters), getAiRecommendations(filters), getAiAnalytics(dateRange)
  </action>
  <verify>
    Check ai-logs page renders table of scanner logs.
    Check ai-logs/recommendations page shows recommendation data.
    Check ai-logs/analytics page has charts and metrics.
  </verify>
  <done>
    Admin AI management screens (logs, recommendations, analytics) are complete.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>AI features: chat assistant, product scanner, recommendations, health insights, admin AI management</what-built>
  <how-to-verify>
    1. Start API server with AI API keys configured
    2. Test AI chat:
       - POST /ai/chat with message "Recommend organic fruits"
       - Expect: AI response with product recommendations
    3. Test product scanner (requires camera/upload):
       - POST /ai/scan with image file
       - Expect: identified product or nutritional info
    4. Test recommendations:
       - GET /ai/recommendations
       - Expect: personalized product list with reasons
    5. Test health insights:
       - GET /ai/health-insights
       - Expect: wellness insights based on order history
    6. Open customer app → AI tab → test chat, scanner, recommendations
    7. Open admin panel → AI Logs → view scanner logs
    8. Open admin AI Analytics → view charts and metrics
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
1. AI chat returns coherent, context-aware responses
2. Product scanner identifies products from images
3. Recommendations are personalized to user history
4. Health insights provide actionable dietary tips
5. AI logs are recorded for all interactions
6. Admin can view and analyze AI usage
</verification>

<success_criteria>
- AI Assistant provides helpful product and health information
- Product scanner works with camera uploads
- Recommendations improve product discovery
- Health insights add value for health-conscious customers
- Admin has visibility into AI usage and effectiveness
</success_criteria>

<output>
After completion, create `.planning/phases/11-ai-features/11-ai-features-11-SUMMARY.md`
</output>
