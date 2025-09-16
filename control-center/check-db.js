const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Connecting to database...');

    // Check projects
    const projects = await prisma.project.findMany();
    console.log(`\nFound ${projects.length} project(s):`);
    projects.forEach(p => {
      console.log(`- ${p.name} (ID: ${p.id}, Status: ${p.status})`);
    });

    // Check users
    const users = await prisma.user.findMany();
    console.log(`\nFound ${users.length} user(s):`);
    users.forEach(u => {
      console.log(`- ${u.email} (Role: ${u.role})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();