import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🎨 Seeding Berger Paint Inventory…");

  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bergerpaint.local" },
    update: {},
    create: {
      email: "admin@bergerpaint.local",
      passwordHash,
      name: "Store Admin",
      role: "admin",
    },
  });
  console.log(`✓ Admin user: ${admin.email} / admin123`);

  // Demo role accounts for RBAC testing
  const demoUsers = [
    { email: "owner@bergerpaint.local", name: "Pemilik Toko", role: "owner", pwd: "owner123" },
    { email: "manajer@bergerpaint.local", name: "Manajer Toko", role: "manager", pwd: "manajer123" },
    { email: "staf@bergerpaint.local", name: "Staf Gudang", role: "staff", pwd: "staf123" },
  ];
  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, name: u.name, role: u.role, passwordHash: await bcrypt.hash(u.pwd, 10) },
    });
  }
  console.log(`✓ ${demoUsers.length} demo role users (owner/manajer/staf)`);

  const supplierData = [
    { name: "Nippon Paint Indonesia", contactName: "Andi Pratama", phone: "+62-21-555-0101", email: "sales@nippon.example", address: "Jl. Industri Raya No. 1, Jakarta", leadTimeDays: 5 },
    { name: "Dulux ICI", contactName: "Sari Wulan", phone: "+62-21-555-0202", email: "order@dulux.example", address: "Kawasan Industri MM2100, Bekasi", leadTimeDays: 7 },
    { name: "Mowilex Specialty", contactName: "Budi Hartono", phone: "+62-21-555-0303", email: "cs@mowilex.example", address: "Jl. Daan Mogot KM 14, Tangerang", leadTimeDays: 4 },
    { name: "Local Hardware Supply", contactName: "Pak Joko", phone: "+62-812-3456-7890", email: "joko@hardware.example", address: "Pasar Pagi, Jakarta Pusat", leadTimeDays: 2 },
  ];
  const suppliers = [];
  for (const s of supplierData) {
    const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
    suppliers.push(existing ?? (await prisma.supplier.create({ data: s })));
  }
  console.log(`✓ ${suppliers.length} suppliers`);

  // Products: paint variants, colorants, supplies
  const productData = [
    // Wall paint - white base, 5L
    { sku: "NP-WP-WB-5L", name: "Nippon Vinilex Pro Wall Paint 5L", category: "Paint", brand: "Nippon", paintType: "wall paint", colorName: "Pure White", colorCode: "PW-001", finishType: "matte", tintBase: "white base", packageSize: "5L", unit: "can", rackLocation: "A-01", minStock: 10, currentStock: 0, purchasePrice: 285000, sellingPrice: 365000, supplierId: suppliers[0].id },
    { sku: "NP-WP-WB-1L", name: "Nippon Vinilex Pro Wall Paint 1L", category: "Paint", brand: "Nippon", paintType: "wall paint", colorName: "Pure White", colorCode: "PW-001", finishType: "matte", tintBase: "white base", packageSize: "1L", unit: "can", rackLocation: "A-02", minStock: 20, currentStock: 0, purchasePrice: 75000, sellingPrice: 105000, supplierId: suppliers[0].id },
    { sku: "DLX-WP-DB-5L", name: "Dulux Weathershield Deep Base 5L", category: "Paint", brand: "Dulux", paintType: "wall paint", colorName: "Deep Base", colorCode: "DB-100", finishType: "satin", tintBase: "deep base", packageSize: "5L", unit: "can", rackLocation: "A-03", minStock: 8, currentStock: 0, purchasePrice: 425000, sellingPrice: 555000, supplierId: suppliers[1].id },
    { sku: "DLX-WP-AB-5L", name: "Dulux Catylac Base A 5L", category: "Paint", brand: "Dulux", paintType: "wall paint", colorName: "Base A", colorCode: "A-001", finishType: "matte", tintBase: "base A", packageSize: "5L", unit: "can", rackLocation: "A-04", minStock: 8, currentStock: 0, purchasePrice: 310000, sellingPrice: 405000, supplierId: suppliers[1].id },
    { sku: "MWX-WD-CB-1L", name: "Mowilex Wood Stain Clear 1L", category: "Paint", brand: "Mowilex", paintType: "wood paint", colorName: "Clear", colorCode: "CL-W01", finishType: "gloss", tintBase: "clear base", packageSize: "1L", unit: "can", rackLocation: "B-01", minStock: 6, currentStock: 0, purchasePrice: 115000, sellingPrice: 158000, supplierId: suppliers[2].id },
    { sku: "MWX-MT-BK-1L", name: "Mowilex Metal Paint Black 1L", category: "Paint", brand: "Mowilex", paintType: "metal paint", colorName: "Jet Black", colorCode: "BK-001", finishType: "gloss", tintBase: "n/a", packageSize: "1L", unit: "can", rackLocation: "B-02", minStock: 8, currentStock: 0, purchasePrice: 95000, sellingPrice: 135000, supplierId: suppliers[2].id },
    { sku: "NP-PR-WH-5L", name: "Nippon Primer Sealer 5L", category: "Primer", brand: "Nippon", paintType: "primer", colorName: "Off White", colorCode: "OW-PR", finishType: "matte", tintBase: "n/a", packageSize: "5L", unit: "can", rackLocation: "A-05", minStock: 6, currentStock: 0, purchasePrice: 245000, sellingPrice: 320000, supplierId: suppliers[0].id },
    { sku: "DLX-WP-WPF-5L", name: "Dulux Aquaproof Waterproofing 5L", category: "Waterproofing", brand: "Dulux", paintType: "waterproofing", colorName: "Grey", colorCode: "GR-WP", finishType: "matte", tintBase: "n/a", packageSize: "5L", unit: "can", rackLocation: "C-01", minStock: 4, currentStock: 0, purchasePrice: 365000, sellingPrice: 475000, supplierId: suppliers[1].id },
    { sku: "LCL-TH-1L", name: "Thinner A Quality 1L", category: "Supplies", brand: "Local", paintType: "thinner", colorName: "Clear", colorCode: "TH-A", finishType: "other", tintBase: "n/a", packageSize: "1L", unit: "can", rackLocation: "D-01", minStock: 15, currentStock: 0, purchasePrice: 22000, sellingPrice: 32000, supplierId: suppliers[3].id },
    { sku: "LCL-PT-1KG", name: "Wall Putty 1kg", category: "Supplies", brand: "Local", paintType: "putty", colorName: "White", colorCode: "PT-W", finishType: "other", tintBase: "n/a", packageSize: "1kg", unit: "kg", rackLocation: "D-02", minStock: 25, currentStock: 0, purchasePrice: 18000, sellingPrice: 28000, supplierId: suppliers[3].id },

    // Colorants
    { sku: "CLR-RED-250ML", name: "Colorant Red Oxide 250ml", category: "Colorant", brand: "Universal", paintType: "other", colorName: "Red Oxide", colorCode: "RO-250", finishType: "other", tintBase: "n/a", packageSize: "250ml", unit: "pcs", rackLocation: "E-01", minStock: 10, currentStock: 0, purchasePrice: 35000, sellingPrice: 50000, supplierId: suppliers[3].id },
    { sku: "CLR-YEL-250ML", name: "Colorant Yellow 250ml", category: "Colorant", brand: "Universal", paintType: "other", colorName: "Chrome Yellow", colorCode: "CY-250", finishType: "other", tintBase: "n/a", packageSize: "250ml", unit: "pcs", rackLocation: "E-02", minStock: 10, currentStock: 0, purchasePrice: 35000, sellingPrice: 50000, supplierId: suppliers[3].id },
    { sku: "CLR-BLU-250ML", name: "Colorant Phthalo Blue 250ml", category: "Colorant", brand: "Universal", paintType: "other", colorName: "Phthalo Blue", colorCode: "PB-250", finishType: "other", tintBase: "n/a", packageSize: "250ml", unit: "pcs", rackLocation: "E-03", minStock: 10, currentStock: 0, purchasePrice: 38000, sellingPrice: 55000, supplierId: suppliers[3].id },
    { sku: "CLR-BLK-250ML", name: "Colorant Lamp Black 250ml", category: "Colorant", brand: "Universal", paintType: "other", colorName: "Lamp Black", colorCode: "LB-250", finishType: "other", tintBase: "n/a", packageSize: "250ml", unit: "pcs", rackLocation: "E-04", minStock: 10, currentStock: 0, purchasePrice: 32000, sellingPrice: 48000, supplierId: suppliers[3].id },

    // Tools & supplies
    { sku: "TL-BRSH-3IN", name: 'Paint Brush 3"', category: "Tools", brand: "Local", paintType: "brush", colorName: null, colorCode: null, finishType: null, tintBase: "n/a", packageSize: "3 inch", unit: "pcs", rackLocation: "F-01", minStock: 30, currentStock: 0, purchasePrice: 12000, sellingPrice: 18000, supplierId: suppliers[3].id },
    { sku: "TL-ROLR-9IN", name: 'Paint Roller 9"', category: "Tools", brand: "Local", paintType: "roller", colorName: null, colorCode: null, finishType: null, tintBase: "n/a", packageSize: "9 inch", unit: "pcs", rackLocation: "F-02", minStock: 20, currentStock: 0, purchasePrice: 25000, sellingPrice: 38000, supplierId: suppliers[3].id },
    { sku: "TL-SAND-150", name: "Sandpaper #150", category: "Tools", brand: "Local", paintType: "sandpaper", colorName: null, colorCode: null, finishType: null, tintBase: "n/a", packageSize: "sheet", unit: "sheet", rackLocation: "F-03", minStock: 50, currentStock: 0, purchasePrice: 3500, sellingPrice: 5500, supplierId: suppliers[3].id },
  ];

  const products = [];
  for (const p of productData) {
    const created = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p as any,
    });
    products.push(created);
  }
  console.log(`✓ ${products.length} products`);

  // Skip seeding stock if movements already exist
  const existingMovements = await prisma.stockMovement.count();
  if (existingMovements > 0) {
    console.log("✓ Stock data already exists, skipping inbound seed");
    return;
  }

  // Seed initial inbound batches
  const today = new Date();
  function daysAhead(d: number) {
    const x = new Date(today); x.setDate(x.getDate() + d); return x;
  }

  const batches = [
    // Healthy stock
    { sku: "NP-WP-WB-5L", batchNumber: "NP-2025-A1", quantity: 24, expiryDays: 720, supplierIdx: 0 },
    { sku: "NP-WP-WB-1L", batchNumber: "NP-2025-A2", quantity: 60, expiryDays: 720, supplierIdx: 0 },
    { sku: "DLX-WP-DB-5L", batchNumber: "DLX-2025-D1", quantity: 18, expiryDays: 540, supplierIdx: 1 },
    { sku: "DLX-WP-AB-5L", batchNumber: "DLX-2025-D2", quantity: 14, expiryDays: 540, supplierIdx: 1 },
    { sku: "MWX-WD-CB-1L", batchNumber: "MWX-2025-W1", quantity: 12, expiryDays: 365, supplierIdx: 2 },
    { sku: "MWX-MT-BK-1L", batchNumber: "MWX-2025-M1", quantity: 16, expiryDays: 365, supplierIdx: 2 },
    { sku: "NP-PR-WH-5L", batchNumber: "NP-2025-P1", quantity: 9, expiryDays: 365, supplierIdx: 0 },
    { sku: "DLX-WP-WPF-5L", batchNumber: "DLX-2025-WP1", quantity: 5, expiryDays: 540, supplierIdx: 1 },
    { sku: "LCL-TH-1L", batchNumber: "LCL-2025-T1", quantity: 40, expiryDays: null, supplierIdx: 3 },
    { sku: "LCL-PT-1KG", batchNumber: "LCL-2025-PT1", quantity: 50, expiryDays: 365, supplierIdx: 3 },
    { sku: "CLR-RED-250ML", batchNumber: "U-2025-R1", quantity: 24, expiryDays: 730, supplierIdx: 3 },
    { sku: "CLR-YEL-250ML", batchNumber: "U-2025-Y1", quantity: 24, expiryDays: 730, supplierIdx: 3 },
    { sku: "CLR-BLU-250ML", batchNumber: "U-2025-B1", quantity: 24, expiryDays: 730, supplierIdx: 3 },
    { sku: "CLR-BLK-250ML", batchNumber: "U-2025-K1", quantity: 24, expiryDays: 730, supplierIdx: 3 },
    { sku: "TL-BRSH-3IN", batchNumber: "LCL-TL-B1", quantity: 80, expiryDays: null, supplierIdx: 3 },
    { sku: "TL-ROLR-9IN", batchNumber: "LCL-TL-R1", quantity: 50, expiryDays: null, supplierIdx: 3 },
    { sku: "TL-SAND-150", batchNumber: "LCL-TL-S1", quantity: 200, expiryDays: null, supplierIdx: 3 },

    // Near-expiry batch (warning case)
    { sku: "NP-WP-WB-1L", batchNumber: "NP-2024-OLD", quantity: 6, expiryDays: 30, supplierIdx: 0 },

    // Expired batch
    { sku: "DLX-WP-AB-5L", batchNumber: "DLX-2024-EXP", quantity: 2, expiryDays: -15, supplierIdx: 1 },
  ];

  for (const b of batches) {
    const product = products.find((p) => p.sku === b.sku);
    if (!product) continue;
    const expiry = b.expiryDays === null ? null : daysAhead(b.expiryDays);
    const supplier = suppliers[b.supplierIdx];

    const batch = await prisma.batch.create({
      data: {
        productId: product.id,
        supplierId: supplier.id,
        batchNumber: b.batchNumber,
        quantity: b.quantity,
        initialQuantity: b.quantity,
        receivedDate: daysAhead(-Math.floor(Math.random() * 30) - 1),
        expiryDate: expiry,
        unitCost: product.purchasePrice,
        conditionStatus: "good",
      },
    });

    const before = product.currentStock;
    const after = before + b.quantity;
    await prisma.product.update({
      where: { id: product.id },
      data: { currentStock: after },
    });
    product.currentStock = after;

    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        batchId: batch.id,
        userId: admin.id,
        type: "INBOUND",
        reason: "purchase",
        quantity: b.quantity,
        stockBefore: before,
        stockAfter: after,
        destinationLocation: product.rackLocation,
        notes: "Initial stock seed",
      },
    });
  }

  // Set one product to low-stock by simulating sales
  const sandpaper = products.find((p) => p.sku === "TL-SAND-150");
  if (sandpaper) {
    const batch = await prisma.batch.findFirst({ where: { productId: sandpaper.id, quantity: { gt: 0 } } });
    if (batch) {
      const sellQty = batch.quantity - 30;
      if (sellQty > 0) {
        await prisma.batch.update({ where: { id: batch.id }, data: { quantity: 30 } });
        const before = sandpaper.currentStock;
        const after = before - sellQty;
        await prisma.product.update({ where: { id: sandpaper.id }, data: { currentStock: after } });
        await prisma.stockMovement.create({
          data: {
            productId: sandpaper.id,
            batchId: batch.id,
            userId: admin.id,
            type: "OUTBOUND",
            reason: "sale",
            quantity: -sellQty,
            stockBefore: before,
            stockAfter: after,
            notes: "Sample sales activity",
          },
        });
      }
    }
  }

  console.log("✓ Stock seeded with initial batches");
  console.log("\n✅ Done. Login: admin@bergerpaint.local / admin123\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
