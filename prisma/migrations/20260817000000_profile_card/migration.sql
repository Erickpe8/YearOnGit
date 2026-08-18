-- CreateTable
CREATE TABLE "ProfileCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "usernameKey" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "stats" JSONB NOT NULL,
    "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refreshLockUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileCard_userId_key" ON "ProfileCard"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileCard_usernameKey_key" ON "ProfileCard"("usernameKey");

-- CreateIndex
CREATE INDEX "ProfileCard_refreshedAt_idx" ON "ProfileCard"("refreshedAt");

-- AddForeignKey
ALTER TABLE "ProfileCard" ADD CONSTRAINT "ProfileCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
