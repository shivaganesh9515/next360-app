'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Send } from 'lucide-react';

const faqs = [
  { q: 'How do I add a new product?', a: 'Go to Products → Add Product. Fill in the product details, upload images, set price and stock, then save.' },
  { q: 'How do I process a refund?', a: 'Navigate to Orders → Returns, find the return request, and approve or reject it.' },
  { q: 'When do I get paid?', a: 'Payouts are processed weekly on Mondays for all completed orders from the previous week.' },
  { q: 'How do I update my store profile?', a: 'Go to Store Profile → Edit to update your store name, description, logo, and banner.' },
  { q: 'How do low stock alerts work?', a: 'Products with stock of 5 or fewer units appear on the Low Stock Alerts page and trigger notifications.' },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setSent(true);
    setTimeout(() => { setSent(false); setForm({ subject: '', message: '' }); }, 3000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Support</h2><p className="text-sm text-gray-500">Get help and answers</p></div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Frequently Asked Questions</h3>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-gray-100 rounded-lg overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full flex items-center justify-between p-4 text-sm text-left hover:bg-gray-50">
                <span className="font-medium text-gray-700">{faq.q}</span>
                {openFaq === idx ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </button>
              {openFaq === idx && <div className="px-4 pb-4 text-sm text-gray-500">{faq.a}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Contact Us</h3>
        {sent ? (
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg text-sm text-center">Message sent! We&apos;ll get back to you within 24 hours.</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="How can we help?" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} rows={4} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Describe your issue..." /></div>
            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"><Send className="w-4 h-4" /> Send Message</button>
          </form>
        )}
      </div>
    </div>
  );
}
