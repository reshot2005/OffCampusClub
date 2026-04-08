-- Admin CP SaaS: role templates, moderation, broadcasts, scheduled banners, platform JSON fields

ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "featureFlags" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "rateLimitPolicy" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "legalPrivacyHtml" TEXT;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "legalTermsHtml" TEXT;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "landingCmsExtra" JSONB NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS "admin_role_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_role_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "admin_role_templates_slug_key" ON "admin_role_templates"("slug");

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "adminRoleTemplateId" TEXT;
ALTER TABLE "users" ADD CONSTRAINT "users_adminRoleTemplateId_fkey" FOREIGN KEY ("adminRoleTemplateId") REFERENCES "admin_role_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "moderation_tickets" (
    "id" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assigneeId" TEXT,
    "dueAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moderation_tickets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "moderation_tickets_resourceType_resourceId_key" ON "moderation_tickets"("resourceType", "resourceId");
CREATE INDEX IF NOT EXISTS "moderation_tickets_status_dueAt_idx" ON "moderation_tickets"("status", "dueAt");

ALTER TABLE "moderation_tickets" ADD CONSTRAINT "moderation_tickets_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "admin_broadcasts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "audienceType" TEXT NOT NULL DEFAULT 'all',
    "audienceFilter" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "recipientCount" INTEGER,

    CONSTRAINT "admin_broadcasts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_broadcasts_createdAt_idx" ON "admin_broadcasts"("createdAt");

ALTER TABLE "admin_broadcasts" ADD CONSTRAINT "admin_broadcasts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "admin_scheduled_announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_scheduled_announcements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_scheduled_announcements_active_startsAt_endsAt_idx" ON "admin_scheduled_announcements"("active", "startsAt", "endsAt");
