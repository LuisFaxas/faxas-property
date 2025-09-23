import { prisma } from '@/lib/prisma';
import { Vendor, Contact } from '@prisma/client';

/**
 * Ensures a Vendor exists for a given Contact
 * Creates one if it doesn't exist, using contact.company as vendor name
 * Links the vendor to the contact via primaryContactId
 *
 * @param contactId - The contact ID to ensure vendor for
 * @returns The vendorId (existing or newly created)
 */
export async function ensureVendorForContact(contactId: string): Promise<string> {
  // First, get the contact details
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: {
      id: true,
      name: true,
      company: true,
      emails: true,
      phones: true,
      projectId: true,
      specialty: true,
      category: true,
    }
  });

  if (!contact) {
    throw new Error(`Contact with ID ${contactId} not found`);
  }

  // Check if a vendor already exists for this contact
  const existingVendor = await prisma.vendor.findFirst({
    where: {
      primaryContactId: contactId,
      projectId: contact.projectId,
    }
  });

  if (existingVendor) {
    return existingVendor.id;
  }

  // Create vendor name from company or contact name
  const vendorName = contact.company || contact.name;
  const vendorEmail = contact.emails?.[0] || `${contactId}@placeholder.local`;
  const vendorPhone = contact.phones?.[0] || undefined;

  // Check if vendor exists with same email in the project
  const existingVendorByEmail = await prisma.vendor.findFirst({
    where: {
      projectId: contact.projectId,
      email: vendorEmail,
    }
  });

  if (existingVendorByEmail) {
    // Link existing vendor to this contact
    await prisma.vendor.update({
      where: { id: existingVendorByEmail.id },
      data: { primaryContactId: contactId }
    });
    return existingVendorByEmail.id;
  }

  // Create new vendor
  const newVendor = await prisma.vendor.create({
    data: {
      projectId: contact.projectId,
      name: vendorName,
      email: vendorEmail,
      phone: vendorPhone,
      primaryContactId: contactId,
      status: 'ACTIVE',
    }
  });

  return newVendor.id;
}

/**
 * Bulk ensures vendors exist for multiple contacts
 * Useful for batch invite operations
 *
 * @param contactIds - Array of contact IDs
 * @returns Map of contactId to vendorId
 */
export async function ensureVendorsForContacts(
  contactIds: string[]
): Promise<Map<string, string>> {
  const vendorMap = new Map<string, string>();

  for (const contactId of contactIds) {
    try {
      const vendorId = await ensureVendorForContact(contactId);
      vendorMap.set(contactId, vendorId);
    } catch (error) {
      console.error(`Failed to ensure vendor for contact ${contactId}:`, error);
      // Continue with other contacts
    }
  }

  return vendorMap;
}