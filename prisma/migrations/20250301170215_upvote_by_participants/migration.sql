/*
  Warnings:

  - A unique constraint covering the columns `[participantId,streamId]` on the table `Upvote` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Upvote" DROP CONSTRAINT "Upvote_userId_fkey";

-- AlterTable
ALTER TABLE "Upvote" ADD COLUMN     "participantId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Upvote_participantId_streamId_key" ON "Upvote"("participantId", "streamId");

-- AddForeignKey
ALTER TABLE "Upvote" ADD CONSTRAINT "Upvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upvote" ADD CONSTRAINT "Upvote_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "RoomParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
