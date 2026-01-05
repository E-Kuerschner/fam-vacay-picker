import { Button } from '@coinbase/cds-web/buttons';
import { VStack } from '@coinbase/cds-web/layout';
import { Link } from 'react-router';
import { signOut } from '~/auth/auth.client';

type Session = {
  user: {
    id: string;
    email: string;
    name: string;
  };
} | null;

export function Welcome({ message, session }: { message: string; session: Session }) {
  async function handleSignOut() {
    await signOut();
    window.location.reload();
  }

  return (
    <main>
      <VStack gap={4}>
        <h1>Welcome</h1>
        <p>{message}</p>
        {session ? (
          <VStack gap={2}>
            <p>Signed in as: <strong>{session.user.email}</strong></p>
            {session.user.name && <p>Name: {session.user.name}</p>}
            <Button onClick={handleSignOut}>Sign Out</Button>
          </VStack>
        ) : (
          <VStack gap={2}>
            <p>You are not signed in.</p>
            <Link to="/login">
              <Button>Sign In</Button>
            </Link>
          </VStack>
        )}
      </VStack>
    </main>
  );
}