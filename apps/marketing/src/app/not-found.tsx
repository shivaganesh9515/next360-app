import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found | Next360',
};

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-20">
      <p className="font-display text-6xl text-brand-primary mb-4">404</p>
      <h1 className="font-display text-2xl md:text-3xl font-semibold text-text-primary mb-3">
        This page has wandered off the field
      </h1>
      <p className="text-text-secondary max-w-md mb-8">
        The page you're looking for doesn't exist or may have moved. Let's get you back to fresh, organic ground.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-brand-accent text-white text-sm font-semibold shadow-btn hover:scale-105 transition-all duration-300"
      >
        Back to Home
      </Link>
    </main>
  );
}
