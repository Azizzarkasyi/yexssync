/**
 * Auto-migrate tenant schemas on boot.
 * Ensures all tenant schemas have the latest columns and enum types.
 */
export async function autoMigrateTenants() {
  try {
    const {getPublicPrisma} = require("../prisma/tenant-prisma");
    const prisma = getPublicPrisma();
    const tenants = await prisma.tenant.findMany();

    for (const tenant of tenants) {
      const schema = tenant.schemaName;

      // Create enum types if missing
      await prisma
        .$executeRawUnsafe(
          `DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_type t
              JOIN pg_namespace n ON n.oid = t.typnamespace
              WHERE t.typname = 'LeaveApprovalStatus' AND n.nspname = '${schema}'
            ) THEN
              CREATE TYPE "${schema}"."LeaveApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
            END IF;
          END $$;`,
        )
        .catch(() => {});

      await prisma
        .$executeRawUnsafe(
          `DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_type t
              JOIN pg_namespace n ON n.oid = t.typnamespace
              WHERE t.typname = 'CorrectionStatus' AND n.nspname = '${schema}'
            ) THEN
              CREATE TYPE "${schema}"."CorrectionStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');
            END IF;
          END $$;`,
        )
        .catch(() => {});

      // Migrate varchar columns to enum types
      await prisma
        .$executeRawUnsafe(
          `DO $$
          BEGIN
            IF EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = '${schema}'
                AND table_name = 'Attendance'
                AND column_name = 'leaveApprovalStatus'
                AND data_type = 'character varying'
            ) THEN
              ALTER TABLE "${schema}"."Attendance"
                  ALTER COLUMN "leaveApprovalStatus" DROP DEFAULT,
                ALTER COLUMN "leaveApprovalStatus" TYPE "${schema}"."LeaveApprovalStatus"
                USING "leaveApprovalStatus"::text::"${schema}"."LeaveApprovalStatus";
            END IF;

            IF EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = '${schema}'
                AND table_name = 'Attendance'
                AND column_name = 'correctionStatus'
                AND data_type = 'character varying'
            ) THEN
              ALTER TABLE "${schema}"."Attendance"
                  ALTER COLUMN "correctionStatus" DROP DEFAULT,
                ALTER COLUMN "correctionStatus" TYPE "${schema}"."CorrectionStatus"
                USING "correctionStatus"::text::"${schema}"."CorrectionStatus";
            END IF;
          END $$;`,
        )
        .catch(() => {});

      // Set defaults for enum columns
      await prisma
        .$executeRawUnsafe(
          `ALTER TABLE "${schema}"."Attendance"
            ALTER COLUMN "leaveApprovalStatus" SET DEFAULT 'PENDING',
            ALTER COLUMN "correctionStatus" SET DEFAULT 'NONE';`,
        )
        .catch(() => {});

      // Widen work time columns
      await prisma
        .$executeRawUnsafe(
          `ALTER TABLE "${schema}"."User" ALTER COLUMN "startWorkTime" TYPE VARCHAR(255)`,
        )
        .catch(() => {});
      await prisma
        .$executeRawUnsafe(
          `ALTER TABLE "${schema}"."User" ALTER COLUMN "endWorkTime" TYPE VARCHAR(255)`,
        )
        .catch(() => {});

      // Add workLocations JSONB column
      await prisma
        .$executeRawUnsafe(
          `ALTER TABLE "${schema}"."User" ADD COLUMN IF NOT EXISTS "workLocations" JSONB`,
        )
        .catch(() => {});

      // Add attendance correction/leave columns
      await prisma
        .$executeRawUnsafe(
          `ALTER TABLE "${schema}"."Attendance"
          ADD COLUMN IF NOT EXISTS "leaveApprovalStatus" "${schema}"."LeaveApprovalStatus" NOT NULL DEFAULT 'PENDING',
          ADD COLUMN IF NOT EXISTS "leaveReviewNote" TEXT,
          ADD COLUMN IF NOT EXISTS "leaveReviewedAt" TIMESTAMP(3),
          ADD COLUMN IF NOT EXISTS "correctionStatus" "${schema}"."CorrectionStatus" NOT NULL DEFAULT 'NONE',
          ADD COLUMN IF NOT EXISTS "correctionReason" TEXT,
          ADD COLUMN IF NOT EXISTS "correctionRequestedClockIn" TIMESTAMP(3),
          ADD COLUMN IF NOT EXISTS "correctionRequestedClockOut" TIMESTAMP(3),
          ADD COLUMN IF NOT EXISTS "correctionReviewNote" TEXT,
          ADD COLUMN IF NOT EXISTS "correctionRequestedAt" TIMESTAMP(3),
          ADD COLUMN IF NOT EXISTS "correctionReviewedAt" TIMESTAMP(3),
          ADD COLUMN IF NOT EXISTS "leaveDescription" TEXT,
          ADD COLUMN IF NOT EXISTS "lateReason" TEXT,
          ADD COLUMN IF NOT EXISTS "lateDeductionStatus" TEXT DEFAULT 'PENDING'`,
        )
        .catch(() => {});

      // Add Employee Profile & Bank Account columns to User
      await prisma
        .$executeRawUnsafe(
          `ALTER TABLE "${schema}"."User" 
          ADD COLUMN IF NOT EXISTS "employeeId" VARCHAR(100),
          ADD COLUMN IF NOT EXISTS "department" VARCHAR(100),
          ADD COLUMN IF NOT EXISTS "position" VARCHAR(100),
          ADD COLUMN IF NOT EXISTS "phone" VARCHAR(50),
          ADD COLUMN IF NOT EXISTS "joinDate" TIMESTAMP(3),
          ADD COLUMN IF NOT EXISTS "bankName" VARCHAR(100),
          ADD COLUMN IF NOT EXISTS "bankAccountNumber" VARCHAR(100),
          ADD COLUMN IF NOT EXISTS "bankAccountHolder" VARCHAR(100),
          ADD COLUMN IF NOT EXISTS "nik" VARCHAR(50),
          ADD COLUMN IF NOT EXISTS "address" TEXT,
          ADD COLUMN IF NOT EXISTS "jobType" VARCHAR(100) DEFAULT 'Full Time (Tetap)',
          ADD COLUMN IF NOT EXISTS "overrideLocation" BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS "locationName" VARCHAR(200)`,
        )
        .catch(() => {});

      // Add new Attendance columns
      await prisma
        .$executeRawUnsafe(
          `ALTER TABLE "${schema}"."Attendance"
          ADD COLUMN IF NOT EXISTS "leaveType" VARCHAR(100),
          ADD COLUMN IF NOT EXISTS "leaveDuration" INTEGER DEFAULT 1,
          ADD COLUMN IF NOT EXISTS "leaveDocument" TEXT,
          ADD COLUMN IF NOT EXISTS "faceVerified" BOOLEAN DEFAULT false`,
        )
        .catch(() => {});

      // Add CompanyConfig operational & profile columns
      await prisma
        .$executeRawUnsafe(
          `ALTER TABLE "${schema}"."CompanyConfig"
          ADD COLUMN IF NOT EXISTS "companyEmail" VARCHAR(150),
          ADD COLUMN IF NOT EXISTS "companyPhone" VARCHAR(50),
          ADD COLUMN IF NOT EXISTS "companyAddress" TEXT,
          ADD COLUMN IF NOT EXISTS "companyWebsite" VARCHAR(150),
          ADD COLUMN IF NOT EXISTS "workStartTime" VARCHAR(50) DEFAULT '08:00',
          ADD COLUMN IF NOT EXISTS "workEndTime" VARCHAR(50) DEFAULT '17:00',
          ADD COLUMN IF NOT EXISTS "workDays" VARCHAR(10) DEFAULT '6',
          ADD COLUMN IF NOT EXISTS "requireGps" BOOLEAN DEFAULT true,
          ADD COLUMN IF NOT EXISTS "requireSelfie" BOOLEAN DEFAULT true,
          ADD COLUMN IF NOT EXISTS "rejectOutsideShift" BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS "shifts" JSONB,
          ADD COLUMN IF NOT EXISTS "departments" JSONB`,
        )
        .catch(() => {});

      // Add Task Metadata columns
      await prisma
        .$executeRawUnsafe(
          `ALTER TABLE "${schema}"."Task"
          ADD COLUMN IF NOT EXISTS "priority" VARCHAR(20) DEFAULT 'MEDIUM',
          ADD COLUMN IF NOT EXISTS "project" VARCHAR(150),
          ADD COLUMN IF NOT EXISTS "location" VARCHAR(150),
          ADD COLUMN IF NOT EXISTS "notes" TEXT,
          ADD COLUMN IF NOT EXISTS "progress" INTEGER DEFAULT 0`,
        )
        .catch(() => {});
    }

    console.log("Auto-migration completed for all tenants.");
  } catch (e) {
    console.error("Auto-migration error (non-fatal):", e);
  }
}
