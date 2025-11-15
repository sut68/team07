import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/login');

  return <div><h1>Redirecting...</h1></div>;
}