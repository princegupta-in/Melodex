/*
  Warnings:

  - You are about to drop the column `isVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationCode` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "isVerified",
DROP COLUMN "verificationCode";

-- CreateTable
CREATE TABLE "TempUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "provider" "Providers" NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationCode" TEXT NOT NULL,

    CONSTRAINT "TempUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
