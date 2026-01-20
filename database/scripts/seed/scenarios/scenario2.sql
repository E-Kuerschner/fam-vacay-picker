-- Scenario 2: New vacation (2026), no proposals

INSERT INTO vacation_cycle (
  id,
  year,
  status,
  submission_start_date,
  submission_end_date,
  winning_proposal_id,
  finalized_at,
  vacation_date,
  created_at,
  updated_at
) VALUES (
  2,
  2026,
  'submission_open',
  1735689600,
  1738368000,
  NULL,
  NULL,
  1740787200,
  1735689600,
  1735689600
);
