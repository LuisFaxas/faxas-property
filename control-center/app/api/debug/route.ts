import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const projects = await prisma.project.findMany();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true
      }
    });
    const members = await prisma.projectMember.findMany({
      include: {
        User: true,
        Project: true
      }
    });

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        projectCount: projects.length,
        projects: projects.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status
        })),
        userCount: users.length,
        users: users,
        membershipCount: members.length,
        memberships: members.map(m => ({
          userId: m.userId,
          userEmail: m.User.email,
          projectId: m.projectId,
          projectName: m.Project.name,
          role: m.role
        }))
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasDatabase: !!process.env.DATABASE_URL,
        hasFirebase: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}