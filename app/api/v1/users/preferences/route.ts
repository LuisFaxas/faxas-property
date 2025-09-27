import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api/response';
import { requireAuth } from '@/lib/api/auth-check';
import prisma from '@/lib/prisma';

// Get user preferences
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth();

    // Try to get existing preferences
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: authUser.uid }
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      const userRole = authUser.role || 'VIEWER';

      // Smart defaults based on role
      const defaultNavItems = {
        ADMIN: ['home', 'tasks', 'bidding'],
        STAFF: ['home', 'tasks', 'schedule'],
        CONTRACTOR: ['home', 'my-tasks', 'bids'],
        VIEWER: ['home', 'tasks', 'schedule']
      };

      preferences = await prisma.userPreferences.create({
        data: {
          userId: authUser.uid,
          mobileNavItems: defaultNavItems[userRole as keyof typeof defaultNavItems] || defaultNavItems.VIEWER,
          navItemOrder: [0, 1, 2],
          dashboardWidgets: [],
          quickActions: [],
          notificationSettings: {}
        }
      });
    }

    return successResponse(preferences, 'Preferences retrieved successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

// Create or update user preferences
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const data = await request.json();

    // Check if preferences exist
    const existing = await prisma.userPreferences.findUnique({
      where: { userId: authUser.uid }
    });

    let preferences;
    if (existing) {
      // Update existing preferences
      preferences = await prisma.userPreferences.update({
        where: { userId: authUser.uid },
        data
      });

      // Log the change
      if (data.mobileNavItems || data.theme || data.notificationSettings) {
        await prisma.settingsChangeLog.create({
          data: {
            userId: authUser.uid,
            setting: Object.keys(data).join(', '),
            oldValue: existing as any,
            newValue: data,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent')
          }
        });
      }
    } else {
      // Create new preferences
      preferences = await prisma.userPreferences.create({
        data: {
          userId: authUser.uid,
          ...data
        }
      });
    }

    return successResponse(preferences, 'Preferences updated successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

// Update specific preferences (partial update)
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const updates = await request.json();

    // Get existing preferences
    const existing = await prisma.userPreferences.findUnique({
      where: { userId: authUser.uid }
    });

    if (!existing) {
      // Create with updates if doesn't exist
      const preferences = await prisma.userPreferences.create({
        data: {
          userId: authUser.uid,
          ...updates
        }
      });
      return successResponse(preferences, 'Preferences created successfully');
    }

    // Update existing
    const preferences = await prisma.userPreferences.update({
      where: { userId: authUser.uid },
      data: updates
    });

    // Log significant changes
    const significantChanges = ['mobileNavItems', 'theme', 'notificationSettings', 'twoFactorMethod'];
    const changedKeys = Object.keys(updates);
    const hasSignificantChange = changedKeys.some(key => significantChanges.includes(key));

    if (hasSignificantChange) {
      await prisma.settingsChangeLog.create({
        data: {
          userId: authUser.uid,
          setting: changedKeys.join(', '),
          oldValue: existing as any,
          newValue: updates,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent')
        }
      });
    }

    return successResponse(preferences, 'Preferences updated successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

// Reset preferences to defaults
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await requireAuth();

    // Get user role for smart defaults
    const userRole = authUser.role || 'VIEWER';

    const defaultNavItems = {
      ADMIN: ['home', 'tasks', 'bidding'],
      STAFF: ['home', 'tasks', 'schedule'],
      CONTRACTOR: ['home', 'my-tasks', 'bids'],
      VIEWER: ['home', 'tasks', 'schedule']
    };

    // Reset to defaults
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: authUser.uid },
      update: {
        mobileNavItems: defaultNavItems[userRole as keyof typeof defaultNavItems] || defaultNavItems.VIEWER,
        navItemOrder: [0, 1, 2],
        theme: 'dark',
        density: 'comfortable',
        fontSize: 'medium',
        showCompleted: false,
        emailNotifications: true,
        pushNotifications: false,
        swipeActions: true,
        hapticFeedback: true,
        dashboardWidgets: [],
        quickActions: [],
        notificationSettings: {},
        featureFlags: null,
        customShortcuts: null
      },
      create: {
        userId: authUser.uid,
        mobileNavItems: defaultNavItems[userRole as keyof typeof defaultNavItems] || defaultNavItems.VIEWER,
        navItemOrder: [0, 1, 2]
      }
    });

    // Log the reset
    await prisma.settingsChangeLog.create({
      data: {
        userId: authUser.uid,
        setting: 'FULL_RESET',
        oldValue: null,
        newValue: { action: 'reset_to_defaults' },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      }
    });

    return successResponse(preferences, 'Preferences reset to defaults');
  } catch (error) {
    return errorResponse(error);
  }
}

// Force Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';