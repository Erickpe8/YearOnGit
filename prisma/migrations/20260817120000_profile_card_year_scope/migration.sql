-- Profile cards are year-scoped: one card per user per Wrapped year.
-- URL shape: /cards/{username}/{year}.png

DROP INDEX IF EXISTS "ProfileCard_userId_key";
DROP INDEX IF EXISTS "ProfileCard_usernameKey_key";

CREATE UNIQUE INDEX "ProfileCard_userId_year_key" ON "ProfileCard"("userId", "year");
CREATE UNIQUE INDEX "ProfileCard_usernameKey_year_key" ON "ProfileCard"("usernameKey", "year");
CREATE INDEX "ProfileCard_usernameKey_year_idx" ON "ProfileCard"("usernameKey", "year");
