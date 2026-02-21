PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "monthlyPrice" REAL NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO Product VALUES('cmjrzt0wk0001rpeiwbngxckm','Standing Desk','Adjustable height standing desk with cable management. Perfect for digital nomads who want to alternate between sitting and standing.','Desks','',500000.0,15,1767063202004,1767063202004);
INSERT INTO Product VALUES('cmjrzt0wk0002rpeioxtqz7tc','Executive Desk','Spacious executive desk with drawers. Ideal for serious work sessions.','Desks','',400000.0,20,1767063202005,1767063202005);
INSERT INTO Product VALUES('cmjrzt0wl0003rpei9kz0gi75','Compact Desk','Space-saving compact desk perfect for small workspaces.','Desks','',300000.0,25,1767063202006,1767063202006);
INSERT INTO Product VALUES('cmjrzt0wm0004rpei7zwxqdwr','27" 4K Monitor','Ultra HD display with perfect color accuracy. Great for designers and developers.','Monitors','',400000.0,20,1767063202007,1767063202007);
INSERT INTO Product VALUES('cmjrzt0wn0005rpeihmf8hy6b','24" Full HD Monitor','Crystal clear 1080p display for everyday productivity.','Monitors','',250000.0,30,1767063202007,1767063202007);
INSERT INTO Product VALUES('cmjrzt0wn0006rpei2s9w3mfn','32" Curved Monitor','Immersive curved display for an enhanced viewing experience.','Monitors','',500000.0,10,1767063202008,1767063202008);
INSERT INTO Product VALUES('cmjrzt0wo0007rpei7zh8mr1k','Ergonomic Office Chair','Fully adjustable ergonomic chair with lumbar support. Work in comfort all day.','Chairs','',300000.0,25,1767063202009,1767063202009);
INSERT INTO Product VALUES('cmjrzt0wp0008rpeikmhvr3nm','Mesh Chair','Breathable mesh chair with modern design. Stay cool while you work.','Chairs','',250000.0,30,1767063202009,1767063202009);
INSERT INTO Product VALUES('cmjrzt0wq0009rpeir5b8txhm','Executive Leather Chair','Premium leather chair for the ultimate comfort experience.','Chairs','',400000.0,10,1767063202011,1767063202011);
INSERT INTO Product VALUES('cmjrzt0wt000arpeipp7bcteo','Mechanical Keyboard','Clicky mechanical keyboard for responsive typing.','Keyboard & Mouse','',100000.0,40,1767063202014,1767063202014);
INSERT INTO Product VALUES('cmjrzt0wu000brpeiqwq4x5ta','Wireless Keyboard & Mouse Set','Wireless combo with reliable performance.','Keyboard & Mouse','',80000.0,35,1767063202014,1767063202014);
INSERT INTO Product VALUES('cmjrzt0wu000crpeiu7haos1b','Ergonomic Mouse','Designed to reduce strain during long work sessions.','Keyboard & Mouse','',50000.0,50,1767063202015,1767063202015);
INSERT INTO Product VALUES('cmjrzt0wv000drpeis0dj0op1','Adjustable Laptop Stand','Ergonomic laptop stand for better posture and cooling.','Accessories','',75000.0,30,1767063202016,1767063202016);
INSERT INTO Product VALUES('cmjrzt0ww000erpeiw8izuekh','HD Webcam','High definition webcam for video conferences and meetings.','Accessories','',100000.0,25,1767063202016,1767063202016);
INSERT INTO Product VALUES('cmjrzt0wx000frpeiug5739an','Noise Cancelling Headset','Premium headset with active noise cancellation.','Accessories','',120000.0,20,1767063202017,1767063202017);
INSERT INTO Product VALUES('cmjrzt0wy000grpei6x3bigqr','LED Desk Lamp','Adjustable LED lamp with multiple brightness levels.','Accessories','',50000.0,35,1767063202018,1767063202018);
CREATE TABLE IF NOT EXISTS "Package" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "price" REAL NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO Package VALUES('cmjrzt0wz000hrpei8x3d4iaw','Starter Package','Everything you need to get started working remotely in Bali.','',700000.0,30,1767063202020,1767063202020);
INSERT INTO Package VALUES('cmjrzt0x0000mrpein3bqwsu0','Professional Package','Complete professional workstation setup for power users.','',1200000.0,30,1767063202021,1767063202021);
INSERT INTO Package VALUES('cmjrzt0x2000trpei5nn8yk0h','Digital Nomad Package','Ultimate setup for the traveling professional.','',2000000.0,30,1767063202022,1767063202022);
CREATE TABLE IF NOT EXISTS "PackageItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PackageItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO PackageItem VALUES('cmjrzt0wz000jrpeil53dkmkc','cmjrzt0wz000hrpei8x3d4iaw','cmjrzt0wk0001rpeiwbngxckm',1,1767063202020);
INSERT INTO PackageItem VALUES('cmjrzt0wz000krpeiy20azda0','cmjrzt0wz000hrpei8x3d4iaw','cmjrzt0wo0007rpei7zh8mr1k',1,1767063202020);
INSERT INTO PackageItem VALUES('cmjrzt0wz000lrpei4hgo8dtr','cmjrzt0wz000hrpei8x3d4iaw','cmjrzt0wm0004rpei7zwxqdwr',1,1767063202020);
INSERT INTO PackageItem VALUES('cmjrzt0x0000orpeia13uxib7','cmjrzt0x0000mrpein3bqwsu0','cmjrzt0wk0002rpeioxtqz7tc',1,1767063202021);
INSERT INTO PackageItem VALUES('cmjrzt0x0000prpeiede6krcn','cmjrzt0x0000mrpein3bqwsu0','cmjrzt0wq0009rpeir5b8txhm',1,1767063202021);
INSERT INTO PackageItem VALUES('cmjrzt0x0000qrpeiblnuj1y5','cmjrzt0x0000mrpein3bqwsu0','cmjrzt0wn0006rpei2s9w3mfn',1,1767063202021);
INSERT INTO PackageItem VALUES('cmjrzt0x0000rrpeif466n7sz','cmjrzt0x0000mrpein3bqwsu0','cmjrzt0wt000arpeipp7bcteo',1,1767063202021);
INSERT INTO PackageItem VALUES('cmjrzt0x0000srpeisys5k1ka','cmjrzt0x0000mrpein3bqwsu0','cmjrzt0wu000crpeiu7haos1b',1,1767063202021);
INSERT INTO PackageItem VALUES('cmjrzt0x2000vrpeitekga8rt','cmjrzt0x2000trpei5nn8yk0h','cmjrzt0wk0001rpeiwbngxckm',1,1767063202022);
INSERT INTO PackageItem VALUES('cmjrzt0x2000wrpeiely8e8wo','cmjrzt0x2000trpei5nn8yk0h','cmjrzt0wo0007rpei7zh8mr1k',1,1767063202022);
INSERT INTO PackageItem VALUES('cmjrzt0x2000xrpeiytr1iedp','cmjrzt0x2000trpei5nn8yk0h','cmjrzt0wm0004rpei7zwxqdwr',2,1767063202022);
INSERT INTO PackageItem VALUES('cmjrzt0x2000yrpeifemfjn3x','cmjrzt0x2000trpei5nn8yk0h','cmjrzt0wu000brpeiqwq4x5ta',1,1767063202022);
INSERT INTO PackageItem VALUES('cmjrzt0x2000zrpeiuldxys2i','cmjrzt0x2000trpei5nn8yk0h','cmjrzt0wv000drpeis0dj0op1',1,1767063202022);
INSERT INTO PackageItem VALUES('cmjrzt0x20010rpeih065h6xy','cmjrzt0x2000trpei5nn8yk0h','cmjrzt0ww000erpeiw8izuekh',1,1767063202022);
INSERT INTO PackageItem VALUES('cmjrzt0x20011rpeiy0b84rm2','cmjrzt0x2000trpei5nn8yk0h','cmjrzt0wx000frpeiug5739an',1,1767063202022);
INSERT INTO PackageItem VALUES('cmjrzt0x20012rpei15pdfbv7','cmjrzt0x2000trpei5nn8yk0h','cmjrzt0wy000grpei6x3bigqr',1,1767063202022);
CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "guestWhatsapp" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "totalAmount" REAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "deliveryAddress" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workerId" TEXT,
    "deliveryPhotos" TEXT,
    "deliveryConfirmed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "Order" VALUES('cmjs1rzjs0001rpj9tmvc3mj9','ORD-1767066512818-0001','cmjrzt0wh0000rpei6oiwca1h',NULL,NULL,NULL,'PENDING','CASH','USD',1200000.0,1767066512818,1769658512818,'','',1767066512824,1767066512824,NULL,NULL,0);
CREATE TABLE IF NOT EXISTS "RentalItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "packageId" TEXT,
    "itemType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RentalItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RentalItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RentalItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO RentalItem VALUES('cmjs1rzjs0003rpj9pefi31i6','cmjs1rzjs0001rpj9tmvc3mj9',NULL,'cmjrzt0x0000mrpein3bqwsu0','PACKAGE','Professional Package',1,1200000.0,1200000.0,1767066512824);
CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" DATETIME,
    "pdfUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "baliAddress" TEXT,
    "mapsAddressLink" TEXT,
    "passportPhoto" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO User VALUES('cmjrzt0wh0000rpei6oiwca1h','admin','$2b$10$CXjzrIOgs5iCgThz7tdsQ.S/VTO.16Eb9p27EmyzZwwQmYjP2OrAm','tropictechindo@gmail.com','Tropic Tech Admin','+6282266574860',NULL,NULL,NULL,'ADMIN',1767063202001,1767063202001);
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
COMMIT;
