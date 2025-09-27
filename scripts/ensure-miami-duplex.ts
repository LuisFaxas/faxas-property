/**
 * Script to ensure Miami Duplex project exists with proper setup
 * Run with: tsx scripts/ensure-miami-duplex.ts
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function ensureMiamiDuplex() {
  try {
    console.log('🔍 Checking for Miami Duplex project...');

    // Check if Miami Duplex exists
    let miamiDuplex = await prisma.project.findFirst({
      where: {
        name: 'Miami Duplex Remodel'
      }
    });

    if (!miamiDuplex) {
      console.log('📦 Creating Miami Duplex project...');
      miamiDuplex = await prisma.project.create({
        data: {
          name: 'Miami Duplex Remodel',
          status: 'ACTIVE',
          projectType: 'RENOVATION',
          description: 'Complete renovation of Miami duplex property',
          color: '#3B82F6',
          address: 'Miami, FL',
          clientName: 'FAXAS Property Management',
          totalBudget: 500000,
          contingency: 50000,
          startDate: new Date('2025-01-01'),
          targetEndDate: new Date('2025-12-31'),
          timezone: 'America/New_York'
        }
      });
      console.log('✅ Miami Duplex project created with ID:', miamiDuplex.id);
    } else {
      console.log('✅ Miami Duplex project already exists with ID:', miamiDuplex.id);
    }

    // Get all ADMIN and STAFF users
    const adminStaffUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'STAFF']
        }
      }
    });

    console.log(`👥 Found ${adminStaffUsers.length} admin/staff users`);

    // Ensure all admin/staff have membership
    for (const user of adminStaffUsers) {
      const existingMembership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: miamiDuplex.id,
            userId: user.id
          }
        }
      });

      if (!existingMembership) {
        await prisma.projectMember.create({
          data: {
            projectId: miamiDuplex.id,
            userId: user.id,
            role: user.role
          }
        });
        console.log(`✅ Added ${user.email} (${user.role}) to Miami Duplex project`);
      } else {
        console.log(`⏭️  ${user.email} already has access to Miami Duplex`);
      }
    }

    // Ensure at least basic data exists for the project
    const taskCount = await prisma.task.count({
      where: { projectId: miamiDuplex.id }
    });

    if (taskCount === 0) {
      console.log('📝 Adding sample tasks to Miami Duplex...');

      await prisma.task.createMany({
        data: [
          {
            title: 'Initial Site Assessment',
            description: 'Complete initial assessment of the duplex property',
            status: 'COMPLETED',
            priority: 'HIGH',
            dueDate: new Date('2025-01-15'),
            projectId: miamiDuplex.id
          },
          {
            title: 'Obtain Building Permits',
            description: 'File and obtain all necessary building permits',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            dueDate: new Date('2025-02-01'),
            projectId: miamiDuplex.id
          },
          {
            title: 'Demo Existing Structure',
            description: 'Demolish interior walls and outdated fixtures',
            status: 'TODO',
            priority: 'MEDIUM',
            dueDate: new Date('2025-02-15'),
            projectId: miamiDuplex.id
          },
          {
            title: 'Electrical System Upgrade',
            description: 'Upgrade electrical panel and wiring throughout property',
            status: 'TODO',
            priority: 'HIGH',
            dueDate: new Date('2025-03-01'),
            projectId: miamiDuplex.id
          },
          {
            title: 'Plumbing Renovation',
            description: 'Replace all plumbing fixtures and pipes',
            status: 'TODO',
            priority: 'HIGH',
            dueDate: new Date('2025-03-15'),
            projectId: miamiDuplex.id
          }
        ]
      });

      console.log('✅ Sample tasks added');
    } else {
      console.log(`⏭️  Project already has ${taskCount} tasks`);
    }

    console.log('\n🎉 Miami Duplex project setup complete!');
    console.log(`   Project ID: ${miamiDuplex.id}`);
    console.log(`   Admin users with access: ${adminStaffUsers.length}`);

  } catch (error) {
    console.error('❌ Error ensuring Miami Duplex project:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

ensureMiamiDuplex();