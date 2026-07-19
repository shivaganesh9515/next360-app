# Database Docs

## Migration Commands
```bash
# Create migration after schema change
npx prisma migrate dev --name <migration-name>

# Apply pending migrations
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Regenerate Prisma client
npx prisma generate

# Open Prisma Studio (GUI)
npx prisma studio
```

## Schema Location
`prisma/schema.prisma`

## Key Enums to Extend
```prisma
// New enum needed for support module
enum TicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}
```

## New Models Needed
```prisma
model SupportTicket {
  id          String       @id @default(uuid())
  userId      String
  user        User         @relation(fields: [userId], references: [id])
  subject     String
  description String
  status      TicketStatus @default(OPEN)
  priority    String       @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT
  orderId     String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  messages    TicketMessage[]
}

model TicketMessage {
  id        String   @id @default(uuid())
  ticketId  String
  ticket    SupportTicket @relation(fields: [ticketId], references: [id])
  senderId  String
  sender    User     @relation(fields: [senderId], references: [id])
  body      String
  createdAt DateTime @default(now())
}
```

## User Model Needs Relation
```prisma
model User {
  // ... existing fields ...
  supportTickets SupportTicket[] @relation("SupportTicketUser")
  sentMessages   TicketMessage[] @relation("TicketMessageSender")
}
```
