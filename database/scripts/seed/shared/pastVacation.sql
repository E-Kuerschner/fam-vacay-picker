-- Seed 2023 past vacation with Tester Two's winning proposal

-- Insert vacation cycle (id: 1) without winning_proposal_id first
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
  1,
  2023,
  'past',
  1672531200,
  1675209600,
  NULL,
  1675296000,
  1680307200,
  1672531200,
  1680393600
);

-- Insert proposal from Tester Two (id: 1)
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
  1,
  '{{TESTER_TWO_ID}}',
  'Costa Rica',
  'https://images.unsplash.com/photo-1642112673500-b3ca09de3eb7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NTA4NTN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njg4ODY4NDl8&ixlib=rb-4.1.0&q=80&w=1080',
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  0,
  100,
  0,
  1672617600,
  1672617600
);

-- Link proposal to vacation cycle
INSERT INTO vacation_cycle_proposal (
  vacation_cycle_id,
  proposal_id,
  selection_weight
) VALUES (
  1,
  1,
  1
);

-- Update vacation cycle with winning proposal
UPDATE vacation_cycle
SET winning_proposal_id = 1
WHERE id = 1;
