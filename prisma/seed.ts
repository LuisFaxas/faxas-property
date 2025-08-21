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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });