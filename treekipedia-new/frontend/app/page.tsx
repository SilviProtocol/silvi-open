import { redirect } from 'next/navigation';

// Root page redirects to /search
export default function RootPage() {
  redirect('/search');
}
