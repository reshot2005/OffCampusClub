-- Add enum value for admin step-up OTP. Safe to re-run.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'OtpPurpose'
      AND e.enumlabel = 'ADMIN_LOGIN'
  ) THEN
    ALTER TYPE "OtpPurpose" ADD VALUE 'ADMIN_LOGIN';
  END IF;
END $$;

