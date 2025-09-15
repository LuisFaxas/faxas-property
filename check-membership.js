const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMembership() {
  try {
    console.log('Checking project memberships...\n');

    // Get all project members
    const members = await prisma.projectMember.findMany({
      include: {
        user: true,
        project: true
      }
    });

    console.log(`Found ${members.length} project membership(s):`);
    members.forEach(m => {
      console.log(`- User: ${m.user.email} -> Project: ${m.project.name} (Role: ${m.role})`);
    });

    // Get user module access
    const access = await prisma.userModuleAccess.findMany();

    console.log(`\nFound ${access.length} module access record(s):`);
    access.forEach(a => {
      console.log(`- UserID: ${a.userId} -> ProjectID: ${a.projectId} -> Module: ${a.module}`);
    });

    // Check if admin user has access to Miami Duplex
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@schoolworldvacation.com' }
    });

    if (adminUser) {
      const membership = await prisma.projectMember.findFirst({
        where: {
          userId: adminUser.id,
          projectId: 'miami-duplex'
        }
      });

      if (!membership) {
        console.log('\n⚠️ ADMIN USER DOES NOT HAVE PROJECT MEMBERSHIP!');
        console.log('Creating membership...');

        await prisma.projectMember.create({
          data: {
            userId: adminUser.id,
            projectId: 'miami-duplex',
            role: 'PROJECT_MANAGER'
          }
        });

        console.log('✅ Created project membership for admin user');
      } else {
        console.log('\n✅ Admin user has project membership');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMembership();