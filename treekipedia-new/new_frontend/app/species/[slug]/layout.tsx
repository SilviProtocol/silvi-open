// This is a server component for static site generation
export function generateStaticParams() {
  // For static export, we'll pre-render a few example species pages
  return [
    { slug: 'giant-sequoia' },
    { slug: 'coast-redwood' },
    { slug: 'dawn-redwood' },
    { slug: 'red-oak' },
    { slug: 'sugar-maple' }
  ]
}

export default function SpeciesLayout({ children }: { children: React.ReactNode }) {
  return children;
}