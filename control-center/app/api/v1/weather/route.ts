import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { prisma } from '@/lib/prisma';
import { geocodeAddress } from '@/lib/geocode';
import { fetchWeather, formatWeatherResponse } from '@/lib/weather';

export async function GET(request: NextRequest) {
  try {
    // Require authentication - don't pass request, let it use headers()
    await requireAuth();

    // Get projectId from query params
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return errorResponse(new Error('Project ID is required'), 400);
    }

    // Fetch project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        timezone: true
      }
    });

    if (!project) {
      return errorResponse(new Error('Project not found'), 404);
    }

    if (!project.address) {
      return errorResponse(new Error('Project address not set'), 400);
    }

    let lat = project.latitude;
    let lng = project.longitude;

    // Geocode if needed and persist
    if (!lat || !lng) {
      try {
        const geocoded = await geocodeAddress(project.address);
        lat = geocoded.lat;
        lng = geocoded.lng;

        // Persist to database
        await prisma.project.update({
          where: { id: projectId },
          data: {
            latitude: lat,
            longitude: lng
          }
        });
      } catch (geocodeError) {
        return errorResponse(geocodeError, 500);
      }
    }

    // Fetch weather
    const weatherData = await fetchWeather(lat, lng, project.timezone);

    // Get today's events count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const eventsCount = await prisma.scheduleEvent.count({
      where: {
        projectId,
        start: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Format response
    const response = formatWeatherResponse(
      weatherData,
      project.address,
      eventsCount
    );

    return successResponse(response);
  } catch (error) {
    return errorResponse(error);
  }
}