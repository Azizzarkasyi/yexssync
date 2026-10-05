import { getPublicPrisma, getTenantPrisma } from './src/prisma/tenant-prisma';

async function main() {
  const publicPrisma = getPublicPrisma();
  const superAdmins = await publicPrisma.superAdmin.findMany();
  console.log('SuperAdmins count:', superAdmins.length);
  superAdmins.forEach(s => console.log(' - SuperAdmin:', s.id, s.email, s.name));

  const tenants = await publicPrisma.tenant.findMany();
  console.log('\nTenants count:', tenants.length);
  for (const t of tenants) {
    console.log(` - Tenant ${t.id}: ${t.name} (schema: ${t.schemaName}, active: ${t.isActive})`);
    try {
      const tp = getTenantPrisma(t.schemaName);
      const userCount = await tp.user.count();
      const attCount = await tp.attendance.count();
      console.log(`    Users: ${userCount}, Attendances: ${attCount}`);
    } catch (e: any) {
      console.log(`    Error reading schema ${t.schemaName}:`, e.message);
    }
  }
}

main().catch(console.error).finally(() => process.exit(0));
