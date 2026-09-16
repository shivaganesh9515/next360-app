import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Next360 Organic Marketplace',
  description: 'Privacy Policy and Data Handling Terms for Next360 Organic ERP & Marketplace.',
};

export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-20 text-charcoal">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-charcoal-muted mb-4">Last Updated: July 2026</p>
      
      <section className="space-y-6 text-sm leading-relaxed">
        <p>
          At <strong>Next360</strong>, accessible from our mobile applications and web services, protecting your privacy is our top priority.
          This Privacy Policy outlines the types of information we collect and how we use it to provide organic marketplace & delivery services.
        </p>

        <h2 className="text-xl font-semibold mt-6">1. Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Personal Information:</strong> Name, phone number, email address, and delivery addresses provided during registration or checkout.</li>
          <li><strong>Location Data:</strong> Device location accessed with your permission to identify delivery zones and nearby organic vendor stores.</li>
          <li><strong>Order & Transaction History:</strong> Purchase history, wallet balances, and support tickets.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">2. How We Use Your Information</h2>
        <p>We use your information to fulfill orders, process payments, provide real-time delivery tracking, send critical order notifications, and improve our services.</p>

        <h2 className="text-xl font-semibold mt-6">3. Account & Data Deletion Request</h2>
        <p>
          You have full right to request the deletion of your account and personal data at any time. You can submit an account deletion request directly inside the Next360 Customer Mobile App under Profile &gt; Delete Account &amp; Data, or by emailing our support team at <strong>support@next360.com</strong>.
        </p>

        <h2 className="text-xl font-semibold mt-6">4. Contact Us</h2>
        <p>If you have any questions regarding this Privacy Policy, please contact us at support@next360.com.</p>
      </section>
    </main>
  );
}
