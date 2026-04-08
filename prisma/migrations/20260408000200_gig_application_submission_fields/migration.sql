ALTER TABLE "gig_applications"
ADD COLUMN IF NOT EXISTS "workDescription" TEXT,
ADD COLUMN IF NOT EXISTS "submissionFileUrl" TEXT,
ADD COLUMN IF NOT EXISTS "submissionFileName" TEXT,
ADD COLUMN IF NOT EXISTS "submissionFileMime" TEXT,
ADD COLUMN IF NOT EXISTS "submissionFileSize" INTEGER;

