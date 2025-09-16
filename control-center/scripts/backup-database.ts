import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backupDatabase() {
  const backupDir = path.join(process.cwd(), 'backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  console.log('Starting database backup...');

  const backup: any = {
    timestamp: new Date().toISOString(),
    data: {}
  };

  // Backup all tables
  try {
    backup.data.projects = await prisma.project.findMany();
    backup.data.users = await prisma.user.findMany();
    backup.data.tasks = await prisma.task.findMany();
    backup.data.contacts = await prisma.contact.findMany();
    backup.data.scheduleEvents = await prisma.scheduleEvent.findMany();
    backup.data.budgetItems = await prisma.budgetItem.findMany();
    backup.data.procurementItems = await prisma.procurement.findMany();
    
    // Add more tables as needed
    
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`✅ Backup saved to: ${backupFile}`);
    
    // Show summary
    console.log('\nBackup Summary:');
    console.log(`- Projects: ${backup.data.projects?.length || 0}`);
    console.log(`- Users: ${backup.data.users?.length || 0}`);
    console.log(`- Tasks: ${backup.data.tasks?.length || 0}`);
    console.log(`- Contacts: ${backup.data.contacts?.length || 0}`);
    console.log(`- Schedule Events: ${backup.data.scheduleEvents?.length || 0}`);
    console.log(`- Budget Items: ${backup.data.budgetItems?.length || 0}`);
    console.log(`- Procurement Items: ${backup.data.procurementItems?.length || 0}`);
    
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

backupDatabase()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });