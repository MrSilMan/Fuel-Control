/*
  Warnings:

  - A unique constraint covering the columns `[mecNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mecNumber" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_mecNumber_key" ON "User"("mecNumber");
