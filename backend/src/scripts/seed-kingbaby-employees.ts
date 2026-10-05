import bcrypt from 'bcryptjs';
import { getPublicPrisma, getTenantPrisma } from '../prisma/tenant-prisma';
import { normalizeEmail } from '../utils/email';

const employees = [
  { email: 'hasnarhma@gmail.com', name: 'Hasna Rahma' },
  { email: 'fadlinaditama@gmail.com', name: 'Fadlin Aditama' },
  { email: 'daffaabuhanifah@gmail.com', name: 'Daffa Abu Hanifah' },
  { email: 'aprilianahusna123@gmail.com', name: 'Apriliana Husna' },
  { email: 'septi6769@gmail.com', name: 'Septi' },
  { email: 'ndazzh06@gmail.com', name: 'Ndazzh' },
  { email: 'pintartidyah@gmail.com', name: 'Pintarti Dyah' },
  { email: 'heriprasojo27@gmail.com', name: 'Heri Prasojo' },
  { email: 'deprindah20@gmail.com', name: 'Depri Indah' },
  { email: 'wildan030811@gmail.com', name: 'Wildan' },
  { email: 'azizzarkasyiramadhan@gmail.com', name: 'Aziz Zarkasyi Ramadhan' },
  { email: 'hidayahindah20@gmail.com', name: 'Hidayah Indah' },
  { email: 'rbhe6965@gmail.com', name: 'Rbhe' },
];

async function main() {
  const publicPrisma = getPublicPrisma();
  
  // 1. Locate tenant for Kingbabyay
  const allTenants = await publicPrisma.tenant.findMany();
  console.log('Available tenants:', allTenants.map(t => ({ id: t.id, name: t.name, schema: t.schemaName })));

  let tenant = allTenants.find(t => 
    t.name.toLowerCase().includes('kingbaby') || 
    t.name.toLowerCase().includes('king baby') ||
    t.id === 2
  );

  if (!tenant) {
    console.error('❌ Tenant Kingbabyay not found!');
    process.exit(1);
  }

  console.log(`\n🏢 Found Tenant: ${tenant.name} (ID: ${tenant.id}, Schema: ${tenant.schemaName})`);
  const tenantPrisma = getTenantPrisma(tenant.schemaName);
  const passwordHash = await bcrypt.hash('user123', 10);

  console.log(`\n📝 Processing ${employees.length} employees with password 'user123'...`);

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const email = normalizeEmail(emp.email);
    const employeeId = `KB-${String(i + 1).padStart(3, '0')}`;

    try {
      const existing = await tenantPrisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        const updated = await tenantPrisma.user.update({
          where: { email },
          data: {
            name: emp.name,
            password: passwordHash,
            role: 'USER',
            isActive: true,
            jobType: 'Full Time (Tetap)',
            department: existing.department || 'Operasional',
            position: existing.position || 'Staff Karyawan',
          },
        });
        console.log(` [${i + 1}/${employees.length}] ✓ Diperbarui: ${updated.email} (${updated.name})`);
      } else {
        const created = await tenantPrisma.user.create({
          data: {
            email,
            password: passwordHash,
            name: emp.name,
            role: 'USER',
            employeeId,
            department: 'Operasional',
            position: 'Staff Karyawan',
            jobType: 'Full Time (Tetap)',
            isActive: true,
            salaryType: 'MONTHLY',
            salary: 0,
          },
        });
        console.log(` [${i + 1}/${employees.length}] + Berhasil Dibuat: ${created.email} (${created.name}, NIP: ${employeeId})`);
      }
    } catch (err: any) {
      console.error(` ✗ Gagal memproses ${email}:`, err.message);
    }
  }

  // Summary
  const allUsers = await tenantPrisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, employeeId: true, isActive: true },
    orderBy: { id: 'asc' },
  });

  console.log(`\n🎉 Total pegawai di ${tenant.name}: ${allUsers.length} pengguna`);
  console.table(allUsers);
}

main()
  .catch((err) => {
    console.error('Fatal Error:', err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
