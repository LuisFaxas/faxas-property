// Temporary helper to handle missing database columns until migration is applied
export function sanitizeScheduleEvent(event: any) {
  return {
    ...event,
    description: event.description || null,
    location: event.location || null,
    attendees: event.attendees || [],
    isAllDay: event.isAllDay || false,
    timezone: event.timezone || 'America/New_York',
    recurringEventId: event.recurringEventId || null,
    updatedAt: event.updatedAt || event.createdAt || new Date(),
    createdBy: event.createdBy || null,
  };
}

export function prepareScheduleEventForDb(data: any) {
  // Remove fields that don't exist in the database yet
  const { 
    description,
    location,
    attendees,
    isAllDay,
    timezone,
    recurringEventId,
    updatedAt,
    createdBy,
    ...dbData 
  } = data;
  
  return dbData;
}