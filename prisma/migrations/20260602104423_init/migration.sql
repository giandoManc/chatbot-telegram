-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "telegramId" TEXT NOT NULL,
    "age" INTEGER,
    "height" INTEGER,
    "weight" DOUBLE PRECISION,
    "goal" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "step" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
