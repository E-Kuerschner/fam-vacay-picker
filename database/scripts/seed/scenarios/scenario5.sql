-- Scenario 5: New vacation (2026), all proposals in, Tester One's proposal selected as winner

-- Insert vacation cycle with selection_complete status
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
  'selection_complete',
  1735689600,
  1738368000,
  NULL,
  NULL,
  1740787200,
  1735689600,
  1738368000
);

-- Insert proposal from Tester One (id: 2) - WINNER
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
  '{{TESTER_ONE_ID}}',
  'Iceland',
  'https://images.unsplash.com/photo-1642112673500-b3ca09de3eb7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NTA4NTN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njg4ODY4NDl8&ixlib=rb-4.1.0&q=80&w=1080',
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  0,
  100,
  0,
  1735776000,
  1735776000
);

-- Insert proposal from Tester Two (id: 3)
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
  3,
  '{{TESTER_TWO_ID}}',
  'Hawaii',
  'https://images.unsplash.com/photo-1642112673500-b3ca09de3eb7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NTA4NTN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njg4ODY4NDl8&ixlib=rb-4.1.0&q=80&w=1080',
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  0,
  100,
  0,
  1735862400,
  1735862400
);

-- Insert proposal from Tester Three (id: 4)
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
  4,
  '{{TESTER_THREE_ID}}',
  'Japan',
  'https://images.unsplash.com/photo-1642112673500-b3ca09de3eb7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NTA4NTN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njg4ODY4NDl8&ixlib=rb-4.1.0&q=80&w=1080',
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  0,
  100,
  0,
  1735948800,
  1735948800
);

-- Link all proposals to vacation cycle
INSERT INTO vacation_cycle_proposal (
  vacation_cycle_id,
  proposal_id,
  selection_weight
) VALUES
  (2, 2, 1),
  (2, 3, 1),
  (2, 4, 1);

-- Update vacation cycle with winning proposal (Tester One's proposal)
UPDATE vacation_cycle
SET winning_proposal_id = 2
WHERE id = 2;
