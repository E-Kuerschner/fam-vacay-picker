-- Scenario 3: New vacation (2026), 1 proposal from Tester Two

-- Insert vacation cycle
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

-- Insert proposal from Tester Two (id: 2)
INSERT INTO proposal (
  id,
  user_id,
  destination_name,
  destination_image_url,
  activities,
  is_ai_generated_activities,
  budget_estimate,
  is_ai_generated_budget,
  created_at,
  updated_at
) VALUES (
  2,
  '{{TESTER_TWO_ID}}',
  'Hawaii',
  'https://images.unsplash.com/photo-1642112673500-b3ca09de3eb7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NTA4NTN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njg4ODY4NDl8&ixlib=rb-4.1.0&q=80&w=1080',
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  0,
  100,
  0,
  1735776000,
  1735776000
);

-- Link proposal to vacation cycle
INSERT INTO vacation_cycle_proposal (
  vacation_cycle_id,
  proposal_id,
  selection_weight
) VALUES (
  2,
  2,
  1
);
