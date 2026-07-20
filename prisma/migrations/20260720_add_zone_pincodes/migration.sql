-- Add pincodes array to Zone model
ALTER TABLE "Zone" ADD COLUMN IF NOT EXISTS "pincodes" TEXT[] DEFAULT '{}';

-- Create index on pincodes for faster lookups
CREATE INDEX IF NOT EXISTS "Zone_pincodes_idx" ON "Zone" USING GIN ("pincodes");
