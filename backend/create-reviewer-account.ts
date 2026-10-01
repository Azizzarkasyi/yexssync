import bcrypt from 'bcryptjs';
import { getPublicPrisma, getTenantPrisma } from './src/prisma/tenant-prisma';
import { TenantService } from './src/prisma/tenant-service';

async function main() {
  const publicPrisma = getPublicPrisma();
  const tenantService = new TenantService();
  
  // 1. Find or create an active tenant
  let tenants = await publicPrisma.tenant.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
  });

  let primaryTenant;
  if (tenants.length === 0) {
    console.log('⚡ Belum ada tenant aktif. Membuat tenant demo pertama...');
    primaryTenant = await tenantService.createTenant({
      name: 'PT YexsSync Solusi Digital',
      adminEmail: 'admin.reviewer@yexssync.com',
      adminPassword: 'Tester123!',
      adminName: 'Admin Reviewer',
    });
    console.log(`✓ Tenant dibuat: ${primaryTenant.name} (${primaryTenant.schemaName})`);
  } else {
    primaryTenant = tenants[0];
    console.log(`🏢 Menggunakan Tenant: ${primaryTenant.name} (${primaryTenant.schemaName})`);
  }

  const tenantPrisma = getTenantPrisma(primaryTenant.schemaName);
  const passwordHash = await bcrypt.hash('Tester123!', 10);

  // 2. Create / Upsert Karyawan (USER) Account for Reviewer
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

  // 3. Ensure Admin account also has password 'Tester123!'
  const adminEmail = 'admin.reviewer@yexssync.com';
  const existingAdmin = await tenantPrisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    await tenantPrisma.user.update({
      where: { email: adminEmail },
      data: {
        password: passwordHash,
        isActive: true,
        name: 'Admin Reviewer',
      },
    });
  } else {
    await tenantPrisma.user.create({
      data: {
        email: adminEmail,
        password: passwordHash,
        name: 'Admin Reviewer',
        role: 'ADMIN',
        department: 'Human Resources',
        position: 'HR Administrator',
        employeeId: 'ADM-001',
        isActive: true,
      },
    });
  }
  console.log('✓ Akun Admin berhasil disiapkan:', adminEmail);

  console.log('\n======================================================');
  console.log('🎉 AKUN PENGUJI GOOGLE PLAY CONSOLE BERHASIL DIBUAT!');
  console.log('======================================================');
  console.log('1. Akun Karyawan (User - untuk testing presensi & tugas):');
  console.log(`   Email    : ${userAccount.email}`);
  console.log(`   Password : Tester123!`);
  console.log(`   Role     : ${userAccount.role}`);
  console.log('------------------------------------------------------');
  console.log('2. Akun Admin (Admin - untuk testing kelola pegawai):');
  console.log(`   Email    : ${adminEmail}`);
  console.log(`   Password : Tester123!`);
  console.log(`   Role     : ADMIN`);
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('Error creating reviewer account:', e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
