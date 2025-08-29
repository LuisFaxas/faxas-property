import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function restoreDatabase(backupFileName?: string) {
  const backupDir = path.join(process.cwd(), 'backups');
  
  // If no filename provided, use the most recent backup
  if (!backupFileName) {
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      console.error('No backup files found in backups directory');
      process.exit(1);
    }
    
    backupFileName = files[0];
    console.log(`Using most recent backup: ${backupFileName}`);
  }
  
  const backupFile = path.join(backupDir, backupFileName);
  
  if (!fs.existsSync(backupFile)) {
    console.error(`Backup file not found: ${backupFile}`);
    process.exit(1);
  }
  
  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  
  console.log(`Restoring from backup created at: ${backup.timestamp}`);
  console.log('⚠️  WARNING: This will delete all current data!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    // Clear existing data (order matters for foreign keys)
    console.log('Clearing existing data...');
    await prisma.taskComment.deleteMany();
    await prisma.taskAttachment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.scheduleEvent.deleteMany();
    await prisma.procurement.deleteMany();
    await prisma.budgetItem.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    // Don't delete users - they're linked to Firebase
    
    // Restore data
    console.log('Restoring data...');
    
    if (backup.data.projects?.length) {
      await prisma.project.createMany({ data: backup.data.projects });
      console.log(`✅ Restored ${backup.data.projects.length} projects`);
    }
    
    if (backup.data.contacts?.length) {
      await prisma.contact.createMany({ data: backup.data.contacts });
      console.log(`✅ Restored ${backup.data.contacts.length} contacts`);
    }
    
    if (backup.data.tasks?.length) {
      await prisma.task.createMany({ data: backup.data.tasks });
      console.log(`✅ Restored ${backup.data.tasks.length} tasks`);
    }
    
    if (backup.data.scheduleEvents?.length) {
      await prisma.scheduleEvent.createMany({ data: backup.data.scheduleEvents });
      console.log(`✅ Restored ${backup.data.scheduleEvents.length} schedule events`);
    }
    
    if (backup.data.budgetItems?.length) {
      await prisma.budgetItem.createMany({ data: backup.data.budgetItems });
      console.log(`✅ Restored ${backup.data.budgetItems.length} budget items`);
    }
    
    if (backup.data.procurementItems?.length) {
      await prisma.procurement.createMany({ data: backup.data.procurementItems });
      console.log(`✅ Restored ${backup.data.procurementItems.length} procurement items`);
    }
    
    console.log('\n✅ Database restored successfully!');
    
  } catch (error) {
    console.error('Restore failed:', error);
    process.exit(1);
  }
}

// Get backup filename from command line argument
const backupFile = process.argv[2];
restoreDatabase(backupFile)
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });