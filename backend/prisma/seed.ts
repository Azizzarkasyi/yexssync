import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const SALT_ROUNDS = 10;

async function main() {
  const publicPrisma = new PrismaClient();

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@yexssync.com';
  const superAdminPasswordRaw = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!';
  const superAdminName = process.env.SUPER_ADMIN_NAME || 'Super Admin';

  console.log('🌱 Starting database seed...');
  console.log(`Setting up Super Admin (${superAdminEmail})...`);

  const hashedPassword = await bcrypt.hash(superAdminPasswordRaw, SALT_ROUNDS);

  await publicPrisma.superAdmin.upsert({
    where: { email: superAdminEmail },
    update: { password: hashedPassword, name: superAdminName },
    create: {
      email: superAdminEmail,
      password: hashedPassword,
      name: superAdminName,
    },
  });

  // Remove any other superadmin accounts
  await publicPrisma.superAdmin.deleteMany({
    where: {
      email: { not: superAdminEmail },
    },
  });

  console.log(`✓ Super Admin configured: ${superAdminEmail}`);
  console.log('✓ All other super admin accounts removed.');
  console.log('🎉 Seed completed successfully without errors!');

  await publicPrisma.$disconnect();
}

main().catch((e) => {
  console.error('Fatal error during seed execution:', e);
  process.exit(1);
});
