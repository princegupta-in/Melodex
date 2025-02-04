import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
//this is not the best, we should introduce a singleton here