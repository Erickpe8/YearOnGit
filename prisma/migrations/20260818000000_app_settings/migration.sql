CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "signInsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByLogin" TEXT,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AppSettings" ("id", "maintenanceMode", "signInsEnabled", "updatedAt")
VALUES ('default', false, true, CURRENT_TIMESTAMP);
