-- Seed 3 consistent test users
-- UUIDs will be replaced by seed.ts before execution

INSERT INTO user (
  id,
  name,
  email,
  email_verified,
  created_at,
  updated_at,
  role,
  banned,
  image,
  ban_reason,
  ban_expires
) VALUES (
  '{{TESTER_ONE_ID}}',
  'Tester One',
  'tester1@gmail.com',
  1,
  1609459200000,
  1609459200000,
  'admin',
  0,
  NULL,
  NULL,
  NULL
);

INSERT INTO user (
  id,
  name,
  email,
  email_verified,
  created_at,
  updated_at,
  role,
  banned,
  image,
  ban_reason,
  ban_expires
) VALUES (
  '{{TESTER_TWO_ID}}',
  'Tester Two',
  'tester2@gmail.com',
  1,
  1609459200000,
  1609459200000,
  'user',
  0,
  NULL,
  NULL,
  NULL
);

INSERT INTO user (
  id,
  name,
  email,
  email_verified,
  created_at,
  updated_at,
  role,
  banned,
  image,
  ban_reason,
  ban_expires
) VALUES (
  '{{TESTER_THREE_ID}}',
  'Tester Three',
  'tester3@gmail.com',
  1,
  1609459200000,
  1609459200000,
  'user',
  0,
  NULL,
  NULL,
  NULL
);
