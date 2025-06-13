import { redirect } from 'next/navigation';

// Home page redirects to /search
export default function HomePage() {
  redirect('/search');
}