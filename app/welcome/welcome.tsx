import { Button } from '@coinbase/cds-web/buttons';

export function Welcome({ message }: { message: string }) {
  return (
    <main>
      <h1>Welcome</h1>
      <p>{message}</p>
      <Button onClick={() => alert("clicked")}>Click Me</Button>
    </main>
  );
}