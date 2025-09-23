import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api/response';
import { requireAuth } from '@/lib/api/auth-check';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Navigation item validation schema
const navigationSchema = z.object({
  mobileNavItems: z.array(z.string()).length(3),
  navItemOrder: z.array(z.number()).length(3).optional()
});

// Valid navigation items per role
const VALID_NAV_ITEMS = {
  ADMIN: ['home', 'tasks', 'bidding', 'schedule', 'contacts', 'budget', 'procurement', 'plans', 'risks'],
  STAFF: ['home', 'tasks', 'bidding', 'schedule', 'contacts', 'budget', 'procurement', 'plans'],
  CONTRACTOR: ['home', 'my-tasks', 'bids', 'my-schedule', 'uploads', 'invoices', 'plans'],
  VIEWER: ['home', 'tasks', 'schedule', 'contacts', 'plans']
};

// Get navigation configuration
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth();

    // Get user preferences
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: authUser.uid },
      select: {
        mobileNavItems: true,
        navItemOrder: true,
        quickActions: true
      }
    });

    if (!preferences) {
      // Return defaults for the user's role
      const userRole = authUser.role || 'VIEWER';
      const defaultNavItems = {
        ADMIN: ['home', 'tasks', 'bidding'],
        STAFF: ['home', 'tasks', 'schedule'],
        CONTRACTOR: ['home', 'my-tasks', 'bids'],
        VIEWER: ['home', 'tasks', 'schedule']
      };

      return successResponse({
        mobileNavItems: defaultNavItems[userRole as keyof typeof defaultNavItems] || defaultNavItems.VIEWER,
        navItemOrder: [0, 1, 2],
        quickActions: [],
        availableItems: VALID_NAV_ITEMS[userRole as keyof typeof VALID_NAV_ITEMS] || VALID_NAV_ITEMS.VIEWER
      }, 'Default navigation configuration');
    }

    // Get available items for user's role
    const userRole = authUser.role || 'VIEWER';
    const availableItems = VALID_NAV_ITEMS[userRole as keyof typeof VALID_NAV_ITEMS] || VALID_NAV_ITEMS.VIEWER;

    return successResponse({
      ...preferences,
      availableItems
    }, 'Navigation configuration retrieved');
  } catch (error) {
    return errorResponse(error);
  }
}

// Update navigation configuration
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const data = await request.json();

    // Validate input
    const validated = navigationSchema.parse(data);

    // Validate that selected items are valid for user's role
    const userRole = authUser.role || 'VIEWER';
    const validItems = VALID_NAV_ITEMS[userRole as keyof typeof VALID_NAV_ITEMS] || VALID_NAV_ITEMS.VIEWER;

    const invalidItems = validated.mobileNavItems.filter(item => !validItems.includes(item));
    if (invalidItems.length > 0) {
      return errorResponse(
        new Error(`Invalid navigation items for your role: ${invalidItems.join(', ')}`),
        400
      );
    }

    // Get existing preferences
    const existing = await prisma.userPreferences.findUnique({
      where: { userId: authUser.uid }
    });

    // Update or create preferences
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: authUser.uid },
      update: {
        mobileNavItems: validated.mobileNavItems,
        navItemOrder: validated.navItemOrder || [0, 1, 2]
      },
      create: {
        userId: authUser.uid,
        mobileNavItems: validated.mobileNavItems,
        navItemOrder: validated.navItemOrder || [0, 1, 2]
      }
    });

    // Log the change
    if (existing) {
      await prisma.settingsChangeLog.create({
        data: {
          userId: authUser.uid,
          setting: 'navigation',
          oldValue: {
            mobileNavItems: existing.mobileNavItems,
            navItemOrder: existing.navItemOrder
          },
          newValue: {
            mobileNavItems: validated.mobileNavItems,
            navItemOrder: validated.navItemOrder
          },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent')
        }
      });
    }

    return successResponse({
      mobileNavItems: preferences.mobileNavItems,
      navItemOrder: preferences.navItemOrder,
      availableItems: validItems
    }, 'Navigation updated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(new Error('Invalid navigation configuration'), 400);
    }
    return errorResponse(error);
  }
}

// Reset navigation to defaults
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const userRole = authUser.role || 'VIEWER';

    // Default navigation per role
    const defaultNavItems = {
      ADMIN: ['home', 'tasks', 'bidding'],
      STAFF: ['home', 'tasks', 'schedule'],
      CONTRACTOR: ['home', 'my-tasks', 'bids'],
      VIEWER: ['home', 'tasks', 'schedule']
    };

    // Reset navigation
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: authUser.uid },
      update: {
        mobileNavItems: defaultNavItems[userRole as keyof typeof defaultNavItems] || defaultNavItems.VIEWER,
        navItemOrder: [0, 1, 2],
        quickActions: []
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
        setting: 'navigation_reset',
        oldValue: null,
        newValue: { action: 'reset_navigation_to_defaults' },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      }
    });

    const validItems = VALID_NAV_ITEMS[userRole as keyof typeof VALID_NAV_ITEMS] || VALID_NAV_ITEMS.VIEWER;

    return successResponse({
      mobileNavItems: preferences.mobileNavItems,
      navItemOrder: preferences.navItemOrder,
      quickActions: preferences.quickActions,
      availableItems: validItems
    }, 'Navigation reset to defaults');
  } catch (error) {
    return errorResponse(error);
  }
}