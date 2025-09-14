import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTasks() {
  console.log('Seeding tasks...');
  
  const tasks = [
    {
      projectId: 'miami-duplex',
      title: 'Demolition - Interior Walls',
      description: 'Remove non-load bearing walls per architectural plans',
      status: 'TODO',
      priority: 'HIGH',
      trade: 'DEMOLITION',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      estimatedHours: 40,
      actualHours: 0,
      progressPercentage: 0
    },
    {
      projectId: 'miami-duplex', 
      title: 'Foundation Inspection',
      description: 'Engineer inspection of existing foundation',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      trade: 'STRUCTURAL',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      estimatedHours: 8,
      actualHours: 4,
      progressPercentage: 50
    },
    {
      projectId: 'miami-duplex',
      title: 'Electrical Rough-In',
      description: 'Install new electrical wiring and panels',
      status: 'TODO',
      priority: 'MEDIUM',
      trade: 'ELECTRICAL',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      estimatedHours: 60,
      actualHours: 0,
      progressPercentage: 0
    },
    {
      projectId: 'miami-duplex',
      title: 'Plumbing Rough-In',
      description: 'Install water supply and drain lines',
      status: 'TODO',
      priority: 'MEDIUM',
      trade: 'PLUMBING',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      estimatedHours: 48,
      actualHours: 0,
      progressPercentage: 0
    },
    {
      projectId: 'miami-duplex',
      title: 'HVAC Installation',
      description: 'Install new HVAC system and ductwork',
      status: 'TODO',
      priority: 'MEDIUM',
      trade: 'HVAC',
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      estimatedHours: 32,
      actualHours: 0,
      progressPercentage: 0
    }
  ];

  for (const task of tasks) {
    try {
      const created = await prisma.task.create({ data: task as any });
      console.log(`Created task: ${created.title}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`Task already exists: ${task.title}`);
      } else {
        throw error;
      }
    }
  }
  
  console.log('Task seeding complete');
}

async function seedContacts() {
  console.log('Seeding contacts...');
  
  const contacts = [
    {
      projectId: 'miami-duplex',
      name: 'John Smith',
      company: 'Smith Electric',
      specialty: 'Master Electrician',
      category: 'electrical',
      status: 'ACTIVE',
      emails: ['john@smithelectric.com'],
      phones: ['305-555-0100'],
      notes: 'Highly recommended, 20 years experience'
    },
    {
      projectId: 'miami-duplex',
      name: 'Maria Garcia',
      company: 'MG Plumbing',
      specialty: 'Licensed Plumber',
      category: 'plumbing',
      status: 'ACTIVE',
      emails: ['maria@mgplumbing.com'],
      phones: ['305-555-0200'],
      notes: 'Excellent work on previous projects'
    },
    {
      projectId: 'miami-duplex',
      name: 'Bob Johnson',
      company: 'Johnson Construction',
      specialty: 'General Contractor',
      category: 'general',
      status: 'ACTIVE',
      emails: ['bob@johnsonconstruction.com'],
      phones: ['305-555-0300'],
      notes: 'Primary GC for this project'
    },
    {
      projectId: 'miami-duplex',
      name: 'Sarah Lee',
      company: 'Lee HVAC Services',
      specialty: 'HVAC Specialist',
      category: 'hvac',
      status: 'ACTIVE',
      emails: ['sarah@leehvac.com'],
      phones: ['305-555-0400'],
      notes: 'Certified for all major brands'
    },
    {
      projectId: 'miami-duplex',
      name: 'Mike Davis',
      company: 'Davis Roofing',
      specialty: 'Roofing Contractor',
      category: 'roofing',
      status: 'PENDING',
      emails: ['mike@davisroofing.com'],
      phones: ['305-555-0500'],
      notes: 'Pending insurance verification'
    }
  ];

  for (const contact of contacts) {
    try {
      const created = await prisma.contact.create({ data: contact });
      console.log(`Created contact: ${created.name}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`Contact already exists: ${contact.name}`);
      } else {
        throw error;
      }
    }
  }
  
  console.log('Contact seeding complete');
}

async function main() {
  console.log('Starting data seed...');
  await seedTasks();
  await seedContacts();
  console.log('✅ All data seeded successfully!');
}

main()
  .catch(e => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });