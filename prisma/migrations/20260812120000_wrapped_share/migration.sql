-- CreateTable
CREATE TABLE "WrappedShare" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "stats" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "WrappedShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WrappedShare_slug_key" ON "WrappedShare"("slug");

-- CreateIndex
CREATE INDEX "WrappedShare_slug_isActive_idx" ON "WrappedShare"("slug", "isActive");

-- CreateIndex
CREATE INDEX "WrappedShare_username_year_idx" ON "WrappedShare"("username", "year");

-- CreateIndex
CREATE UNIQUE INDEX "WrappedShare_userId_year_key" ON "WrappedShare"("userId", "year");

-- AddForeignKey
ALTER TABLE "WrappedShare" ADD CONSTRAINT "WrappedShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
