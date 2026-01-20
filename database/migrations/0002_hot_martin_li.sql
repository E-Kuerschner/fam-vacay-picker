-- Add vacation_date column
ALTER TABLE `vacation_cycle` ADD `vacation_date` integer;

-- Update status values from old enum to new enum
UPDATE `vacation_cycle`
SET `status` = CASE
  WHEN `status` = 'draft' THEN 'submission_open'
  WHEN `status` = 'open' THEN 'submission_open'
  WHEN `status` = 'finalized' THEN 'trip_finalized'
  ELSE `status`
END;