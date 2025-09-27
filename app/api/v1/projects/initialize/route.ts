import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/response';
import { withAuth, type SecurityContext } from '@/lib/api/auth-wrapper';

// GET /api/v1/projects/initialize - Force Miami Duplex initialization
export const GET = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth } = security;

      // Only allow ADMIN users to initialize
      if (auth.role !== 'ADMIN' && auth.role !== 'STAFF') {
        return errorResponse(new Error('Only admin/staff can initialize projects'));
      }

      console.log('[Initialize] Starting Miami Duplex initialization for:', auth.user.email);

      // Check if Miami Duplex exists
      let miamiDuplex = await prisma.project.findFirst({
        where: { name: 'Miami Duplex Remodel' }
      });

      let created = false;
      if (!miamiDuplex) {
        console.log('[Initialize] Creating Miami Duplex project...');
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
        created = true;
        console.log('[Initialize] Miami Duplex created with ID:', miamiDuplex.id);
      }

      // Check membership
      let membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: miamiDuplex.id,
            userId: auth.user.id
          }
        }
      });

      let membershipCreated = false;
      if (!membership) {
        console.log('[Initialize] Creating project membership...');
        membership = await prisma.projectMember.create({
          data: {
            projectId: miamiDuplex.id,
            userId: auth.user.id,
            role: auth.role
          }
        });
        membershipCreated = true;
        console.log('[Initialize] Membership created');
      }

      // Check if sample tasks exist
      const taskCount = await prisma.task.count({
        where: { projectId: miamiDuplex.id }
      });

      let tasksCreated = false;
      if (taskCount === 0) {
        console.log('[Initialize] Creating sample tasks...');
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
        tasksCreated = true;
        console.log('[Initialize] Sample tasks created');
      }

      // Return full project with counts
      const projectWithDetails = await prisma.project.findUnique({
        where: { id: miamiDuplex.id },
        include: {
          _count: {
            select: {
              tasks: true,
              contacts: true,
              budgets: true,
              schedule: true,
              procurement: true,
            }
          }
        }
      });

      return successResponse({
        project: projectWithDetails,
        initialization: {
          projectCreated: created,
          membershipCreated: membershipCreated,
          tasksCreated: tasksCreated,
          message: 'Miami Duplex initialization complete'
        }
      });

    } catch (error) {
      console.error('[Initialize] Error:', error);
      return errorResponse(error);
    }
  }
);

// Export runtime for Firebase Admin
export const runtime = 'nodejs';