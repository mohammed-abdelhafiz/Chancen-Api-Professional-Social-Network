ALTER TABLE "Notification" ADD COLUMN "link" TEXT;
CREATE INDEX "Notification_link_idx" ON "Notification"("link");
