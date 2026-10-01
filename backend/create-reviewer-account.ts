import bcrypt from 'bcryptjs';
import { getPublicPrisma, getTenantPrisma } from './src/prisma/tenant-prisma';

async function main() {
  const publicPrisma = getPublicPrisma();
  
  // Find first active tenant
  const tenants = await publicPrisma.tenant.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
  });

  if (tenants.length === 0) {
    console.error('❌ Tidak ditemukan tenant aktif.');
    process.exit(1);
  }

  const primaryTenant = tenants[0];
  console.log(`🏢 Menggunakan Tenant: ${primaryTenant.name} (Schema: ${primaryTenant.schemaName})`);

  const tenantPrisma = getTenantPrisma(primaryTenant.schemaName);
  const passwordHash = await bcrypt.hash('Tester123!', 10);

  // 1. Create / Upsert Karyawan (USER) Account for Reviewer
  const reviewerEmail = 'google.reviewer@yexssync.com';
  const existingUser = await tenantPrisma.user.findUnique({
    where: { email: reviewerEmail },
  });

  let userAccount;
  if (existingUser) {
    userAccount = await tenantPrisma.user.update({
      where: { email: reviewerEmail },
      data: {
        password: passwordHash,
        isActive: true,
        name: 'Google Reviewer',
        department: 'Operations',
        position: 'Staff Karyawan',
        employeeId: 'REV-001',
      },
    });
    console.log('✓ Akun Karyawan diperbarui:', userAccount.email);
  } else {
    userAccount = await tenantPrisma.user.create({
      data: {
        email: reviewerEmail,
        password: passwordHash,
        name: 'Google Reviewer',
        role: 'USER',
        department: 'Operations',
        position: 'Staff Karyawan',
        employeeId: 'REV-001',
        isActive: true,
      },
    });
    console.log('✓ Akun Karyawan baru berhasil dibuat:', userAccount.email);
  }

  console.log('\n======================================================');
  console.log('🎉 AKUN PENGUJI GOOGLE BERHASIL DIBUAT!');
  console.log('======================================================');
  console.log(`Email    : ${userAccount.email}`);
  console.log(`Password : Tester123!`);
  console.log(`Role     : ${userAccount.role} (Karyawan)`);
  console.log(`Tenant   : ${primaryTenant.name}`);
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('Error creating reviewer account:', e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
