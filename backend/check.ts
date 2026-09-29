import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log('TENANTS:', tenants);
}
main().finally(() => prisma.$disconnect());
