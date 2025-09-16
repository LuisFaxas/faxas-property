import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.upsert({
    where: { id: 'miami-duplex' },
    update: {},
    create: { 
      id: 'miami-duplex', 
      name: 'Miami Duplex Remodel', 
      status: 'active' 
    }
  });

  console.log('Created project:', project);

  // Baseline Budget: Footings (installed) $25,000 (locked baseline)
  const budgetItem = await prisma.budgetItem.create({
    data: {
      projectId: project.id,
      discipline: 'structural',
      category: 'contractors',
      item: 'Footings (installed)',
      unit: 'lot',
      qty: 1,
      estUnitCost: 25000,
      estTotal: 25000,
      committedTotal: 0,
      paidToDate: 0,
      status: 'BUDGETED',
      variance: 0
    }
  });

  console.log('Created budget item:', budgetItem);

  // Seed RFP data
  const rfp = await prisma.rfp.create({
    data: {
      projectId: project.id,
      title: 'Electrical System Upgrade',
      description: 'Request for proposals for complete electrical system upgrade including panel replacement, rewiring, and fixture installation.',
      dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: 'DRAFT',
      createdBy: 'seed-user',
      items: {
        create: [
          {
            specCode: 'ELEC-001',
            description: '200A Main Electrical Panel',
            qty: 1,
            uom: 'EA'
          },
          {
            specCode: 'ELEC-002',
            description: '20A Circuit Breakers',
            qty: 12,
            uom: 'EA'
          },
          {
            specCode: 'ELEC-003',
            description: '12 AWG Romex Cable',
            qty: 500,
            uom: 'LF'
          },
          {
            specCode: 'ELEC-004',
            description: 'GFCI Outlets',
            qty: 8,
            uom: 'EA'
          },
          {
            specCode: 'ELEC-005',
            description: 'LED Recessed Lighting Fixtures',
            qty: 24,
            uom: 'EA'
          }
        ]
      }
    },
    include: {
      items: true
    }
  });

  console.log('Created RFP with items:', rfp);

  // Seed vendors
  const vendors = await Promise.all([
    prisma.vendor.create({
      data: {
        projectId: project.id,
        name: 'Miami Electric Solutions',
        email: 'contact@miamielectric.com',
        phone: '305-555-0100',
        status: 'ACTIVE'
      }
    }),
    prisma.vendor.create({
      data: {
        projectId: project.id,
        name: 'Sunshine State Electrical',
        email: 'info@sunshineelectrical.com',
        phone: '305-555-0200',
        status: 'ACTIVE'
      }
    }),
    prisma.vendor.create({
      data: {
        projectId: project.id,
        name: 'Premium Power Systems',
        email: 'sales@premiumpower.com',
        phone: '305-555-0300',
        status: 'ACTIVE'
      }
    })
  ]);

  console.log('Created vendors:', vendors.map(v => v.name));

  // Create sample attachment metadata (no actual files)
  const attachments = await Promise.all([
    prisma.attachment.create({
      data: {
        ownerType: 'RFP',
        ownerId: rfp.id,
        filename: 'electrical_specifications.pdf',
        mime: 'application/pdf',
        size: 245678,
        contentHash: 'sample-hash-1234567890abcdef',
        urlOrPath: `rfps/${project.id}/${rfp.id}/electrical_specifications.pdf`,
        createdBy: 'seed-user'
      }
    }),
    prisma.attachment.create({
      data: {
        ownerType: 'RFP',
        ownerId: rfp.id,
        filename: 'site_plans.pdf',
        mime: 'application/pdf',
        size: 567890,
        contentHash: 'sample-hash-0987654321fedcba',
        urlOrPath: `rfps/${project.id}/${rfp.id}/site_plans.pdf`,
        createdBy: 'seed-user'
      }
    })
  ]);

  console.log('Created attachment metadata:', attachments.map(a => a.filename));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });