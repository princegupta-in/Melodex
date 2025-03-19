/*
  Warnings:

  - You are about to drop the column `active` on the `Stream` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Stream" DROP COLUMN "active",
ADD COLUMN     "played" BOOLEAN NOT NULL DEFAULT false;
