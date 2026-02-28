const fs = require('fs');
const path = require('path');

const schemaPath = path.join('/Users/bayu/Desktop/tropictech101-main/prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Remove Order.deliveryStatus
schema = schema.replace(/  deliveryStatus                           String\?\s+@default\("PENDING"\) @map\("delivery_status"\) @db\.VarChar\(20\)\n/, '');
schema = schema.replace(/  workerSchedules                          WorkerSchedule\[\]\n/, '');
schema = schema.replace(/  @@index\(\[deliveryStatus\], map: "idx_orders_delivery_status"\)\n/, '');

// 2. Add deliveries to Invoice
schema = schema.replace(
    /  order               Order\?    @relation\(fields: \[orderId\], references: \[id\], onDelete: Cascade, onUpdate: NoAction\)/,
    `  order               Order?    @relation(fields: [orderId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  deliveries          Delivery[]`
);

// 3. User Relations Update
schema = schema.replace(/  assignedSchedules                         WorkerSchedule\[\]        @relation\("AssignedSchedules"\)\n/, '');
schema = schema.replace(/  workerSchedules                           WorkerSchedule\[\]        @relation\("WorkerSchedules"\)\n/, '');
schema = schema.replace(/  dailyReports                              DailyReport\[\]\n/, '');

schema = schema.replace(
    /  workerAttendance                          WorkerAttendance\[\]/,
    `  workerAttendance                          WorkerAttendance[]
  claimedDeliveries                         Delivery[]              @relation("WorkerDeliveries")
  deliveryLogs                              DeliveryLog[]           @relation("UserDeliveryLogs")
  deliveryEditLogs                          DeliveryEditLog[]       @relation("UserDeliveryEditLogs")`
);

// 4. RentalItem Add
schema = schema.replace(
    /  unit          ProductUnit\?   @relation\(fields: \[unitId\], references: \[id\]\)/,
    `  unit          ProductUnit?   @relation(fields: [unitId], references: [id])
  deliveryItems DeliveryItem[]`
);

// 5. Remove WorkerSchedule model totally
schema = schema.replace(/model WorkerSchedule {[\s\S]*?@@map\("worker_schedules"\)\n}\n\n/, '');

// 6. Remove DailyReport model totally
schema = schema.replace(/model DailyReport {[\s\S]*?@@map\("daily_reports"\)\n}\n\n/, '');

// 7. Remove DeliveryChecklistItem model totally
schema = schema.replace(/model DeliveryChecklistItem {[\s\S]*?@@map\("delivery_checklist_items"\)\n}\n\n/, '');

// 8. Remove schedule_status enum globally
schema = schema.replace(/enum schedule_status {[\s\S]*?}\n\n/, '');

// 9. Append new Enum and Models at the bottom
const appendData = `

// --- DELIVERY & DISPATCH NEW MODELS ---

enum VehicleType {
  VAN
  MOTORCYCLE
}

enum VehicleStatus {
  AVAILABLE
  IN_USE
  MAINTENANCE
}

enum DeliveryMethod {
  INTERNAL
  GOJEK
}

enum DeliveryType {
  DROPOFF
  PICKUP
}

enum DeliveryStatus {
  QUEUED
  CLAIMED
  OUT_FOR_DELIVERY
  PAUSED
  DELAYED
  CANCEL_REQUESTED
  COMPLETED
  CANCELED
}

enum DeliveryRole {
  ADMIN
  WORKER
  SYSTEM
}

model Vehicle {
  id                  String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name                String
  type                VehicleType
  status              VehicleStatus  @default(AVAILABLE)
  currentDeliveryId   String?        @map("current_delivery_id") @db.Uuid
  createdAt           DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)

  deliveries          Delivery[]

  @@map("vehicles")
}

model Delivery {
  id                  String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  invoiceId           String?        @map("invoice_id") @db.Uuid
  deliveryMethod      DeliveryMethod @map("delivery_method")
  deliveryType        DeliveryType   @map("delivery_type")
  vehicleId           String?        @map("vehicle_id") @db.Uuid
  status              DeliveryStatus @default(QUEUED)
  
  claimedByWorkerId   String?        @map("claimed_by_worker_id") @db.Uuid
  claimedAt           DateTime?      @map("claimed_at") @db.Timestamptz(6)
  startedAt           DateTime?      @map("started_at") @db.Timestamptz(6)
  completedAt         DateTime?      @map("completed_at") @db.Timestamptz(6)
  
  eta                 DateTime?      @db.Timestamptz(6)
  etaOverrideCount    Int            @default(0) @map("eta_override_count")
  delayMinutes        Int            @default(0) @map("delay_minutes")
  
  latitude            Float?
  longitude           Float?
  lastLocationUpdate  DateTime?      @map("last_location_update") @db.Timestamptz(6)
  
  trackingCode        String?        @unique @map("tracking_code")
  
  createdAt           DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)

  invoice             Invoice?       @relation(fields: [invoiceId], references: [id])
  vehicle             Vehicle?       @relation(fields: [vehicleId], references: [id])
  claimedByWorker     User?          @relation("WorkerDeliveries", fields: [claimedByWorkerId], references: [id])
  
  items               DeliveryItem[]
  logs                DeliveryLog[]
  editLogs            DeliveryEditLog[]

  @@index([status])
  @@index([trackingCode])
  @@index([invoiceId])
  @@map("deliveries")
}

model DeliveryItem {
  id              String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  deliveryId      String      @map("delivery_id") @db.Uuid
  rentalItemId    String      @map("rental_item_id") @db.Uuid
  quantity        Int

  delivery        Delivery    @relation(fields: [deliveryId], references: [id], onDelete: Cascade)
  rentalItem      RentalItem  @relation(fields: [rentalItemId], references: [id], onDelete: Cascade)

  @@index([deliveryId])
  @@index([rentalItemId])
  @@map("delivery_items")
}

model DeliveryLog {
  id                String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  deliveryId        String       @map("delivery_id") @db.Uuid
  eventType         String       @map("event_type")
  oldValue          Json?        @map("old_value")
  newValue          Json?        @map("new_value")
  createdByUserId   String?      @map("created_by_user_id") @db.Uuid
  role              DeliveryRole
  createdAt         DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)

  delivery          Delivery     @relation(fields: [deliveryId], references: [id], onDelete: Cascade)
  createdByUser     User?        @relation("UserDeliveryLogs", fields: [createdByUserId], references: [id])

  @@index([deliveryId])
  @@map("delivery_logs")
}

model DeliveryEditLog {
  id                String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  deliveryId        String       @map("delivery_id") @db.Uuid
  editedByUserId    String       @map("edited_by_user_id") @db.Uuid
  role              DeliveryRole
  fieldChanged      String       @map("field_changed")
  oldValue          String?      @map("old_value")
  newValue          String?      @map("new_value")
  reason            String?
  createdAt         DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)

  delivery          Delivery     @relation(fields: [deliveryId], references: [id], onDelete: Cascade)
  editedByUser      User         @relation("UserDeliveryEditLogs", fields: [editedByUserId], references: [id])

  @@index([deliveryId])
  @@map("delivery_edit_logs")
}
`;

fs.writeFileSync(schemaPath, schema + appendData);
console.log('Schema updated successfully!');
