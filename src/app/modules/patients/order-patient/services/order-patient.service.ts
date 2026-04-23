import { Gender, PatientRelation, Prisma } from '@prisma/client';

export type UpsertOrderPatientInput = {
  relationToUser?: PatientRelation;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date | null;
  gender?: Gender | null;
  phoneNumber?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

export class OrderPatientService {
  buildCreateInput(orderId: string, input: UpsertOrderPatientInput): Prisma.OrderPatientCreateWithoutOrderInput {
    return {
      order: undefined,
      relationToUser: input.relationToUser || 'SELF',
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      dateOfBirth: input.dateOfBirth || null,
      gender: input.gender || null,
      phoneNumber: input.phoneNumber || null,
      email: input.email || null,
      addressLine1: input.addressLine1 || null,
      addressLine2: input.addressLine2 || null,
      city: input.city || null,
      state: input.state || null,
      zipCode: input.zipCode || null,
      metadata: input.metadata === undefined ? Prisma.JsonNull : input.metadata,
      id: undefined,
      orderId,
    } as unknown as Prisma.OrderPatientCreateWithoutOrderInput;
  }
}

export const orderPatientService = new OrderPatientService();
