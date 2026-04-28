import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="max-w-3xl mx-auto px-4 py-24 text-center">
      <h1 className="text-5xl font-extrabold text-brand-dark mb-4">404</h1>
      <p className="text-gray-600 mb-6">
        Sorry, we couldn’t find that page. Try our Morse Code Translator instead.
      </p>
      <Link href="/" className="inline-block bg-brand text-white px-5 py-2 rounded hover:bg-brand-dark">
        Go to Translator
      </Link>
    </section>
  );
}
