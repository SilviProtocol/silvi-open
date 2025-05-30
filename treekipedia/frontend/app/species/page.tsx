import { redirect } from 'next/navigation';

// Species list page redirects to /search
export default function SpeciesPage() {
  redirect('/search');
}
