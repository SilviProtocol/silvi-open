import { redirect } from 'next/navigation';

// Root page redirects to /home 
export default function RootPage() {
  redirect('/home');
}
