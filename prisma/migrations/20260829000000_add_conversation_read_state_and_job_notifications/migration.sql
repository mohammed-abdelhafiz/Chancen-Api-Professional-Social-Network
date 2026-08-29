-- Add per-participant read markers so unread message counts are stable after a thread is viewed.
ALTER TABLE "Conversation"
ADD COLUMN "user1LastReadAt" TIMESTAMP(3),
ADD COLUMN "user2LastReadAt" TIMESTAMP(3);

-- Distinguish job application events from connection events in notifications.
ALTER TYPE "NotificationType" ADD VALUE 'job_application';
