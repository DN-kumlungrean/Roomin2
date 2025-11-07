/*
  Warnings:

  - You are about to drop the column `Name` on the `Roommate` table. All the data in the column will be lost.
  - You are about to drop the column `Tel` on the `Roommate` table. All the data in the column will be lost.
  - You are about to drop the column `Name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - Added the required column `RoomName` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Roommate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Gmail` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "chargeId" TEXT,
ADD COLUMN     "qrUrl" TEXT,
ADD COLUMN     "sourceId" TEXT;

-- AlterTable
ALTER TABLE "public"."Room" ADD COLUMN     "RoomName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Roommate" DROP COLUMN "Name",
DROP COLUMN "Tel",
ADD COLUMN     "phone" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "Name",
DROP COLUMN "email",
ADD COLUMN     "Gmail" TEXT NOT NULL,
ADD COLUMN     "dormitoryId" INTEGER,
ADD COLUMN     "promptpay" TEXT;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES "public"."Dormitory"("Dormitoryid") ON DELETE SET NULL ON UPDATE CASCADE;
