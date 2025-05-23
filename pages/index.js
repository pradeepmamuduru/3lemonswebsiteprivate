import { useState, useEffect } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import { FaWhatsapp } from 'react-icons/fa';

export default function Home() {
  const [form, setForm] = useState({ name: '', quantity: '', quality: 'A1', delivery: '', contact: '' });
  const [lemons, setLemons] = useState([]);
  const [orderStatus, setOrderStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("https://sheetdb.io/api/v1/wm0oxtmmfkndt")
      .then(res => res.json())
      .then(data => setLemons(data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'quantity') {
      if (value.includes('.') || value.includes(',')) return; // integer only
    }

    if (name === 'contact') {
      // Allow only digits, max length 10
      if (!/^\d*$/.test(value)) return;
      if (value.length > 10) return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setOrderStatus('Submitting...');

    const quantity = parseInt(form.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      setOrderStatus("Please enter a valid quantity (integer). ");
      setIsSubmitting(false);
      return;
    }

    if (!/^[0-9]{10}$/.test(form.contact)) {
      setOrderStatus("Please enter a valid 10-digit mobile number.");
      setIsSubmitting(false);
      return;
    }

    const isBulk = quantity > 50;
    const dataToSend = { ...form, contact: `+91${form.contact}`, quantity, discount: isBulk ? '10%' : '0%' };

    const response = await fetch("https://sheetdb.io/api/v1/q6ryvlhjjmu4q", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: dataToSend })
    });

    if (response.ok) {
      setOrderStatus("Order submitted successfully!");
      setForm({ name: '', quantity: '', quality: 'A1', delivery: '', contact: '' });
    } else {
      setOrderStatus("Failed to submit order. Please try again.");
    }
    setIsSubmitting(false);
  };

  const getWhatsappLink = () => {
    const { name, quantity, quality, delivery, contact } = form;
    const message = `\nHi! I'm interested in ordering lemons:\n👤 Name: ${name}\n📞 Contact: +91${contact}\n📦 Quantity: ${quantity}kg\n⭐ Quality: ${quality}\n🏠 Address: ${delivery}\n\nPlease confirm availability.`;
    return `https://wa.me/918500130926?text=${encodeURIComponent(message)}`;
  };

  const pricePerKg = {
    A1: 80,
    A2: 70,
    A3: 60
  };
  const quantity = parseInt(form.quantity) || 0;
  const isBulk = quantity > 50;
  const basePrice = pricePerKg[form.quality] * quantity;
  const discount = isBulk ? 0.1 : 0;
  const totalPrice = basePrice * (1 - discount);

  return (
    <div className="min-h-screen bg-[#fdfdfd] text-green-900 font-sans">
      <Head>
        <title>3 Lemons Traders – Buy Fresh Lemons Online</title>
        <meta name="description" content="Buy premium quality lemons at affordable prices across India. Direct farm to home delivery." />
        <meta property="og:title" content="Buy Fresh Lemons Online – 3 Lemons Traders" />
        <meta property="og:description" content="Get premium lemons delivered to your door at unbeatable prices. Farm fresh quality." />
        <meta property="og:image" content="/lemons-hero.jpg" />
      </Head>

      <header className="bg-gradient-to-r from-yellow-600 to-lime-600 text-white p-8 text-center shadow-xl">
        <h1 className="text-5xl font-black uppercase drop-shadow-md tracking-wide">3 Lemons Traders</h1>
        <p className="text-2xl mt-4 font-medium italic">Fresh Lemons, Fresher Deals – Direct to Your Doorstep</p>
      </header>

      <main className="p-4 sm:p-8 space-y-16 max-w-7xl mx-auto">
        <section className="relative w-full h-[60vh] sm:h-[50vh] md:h-[40vh] mb-12">
          <Image
            src="/lemons-hero.jpg"
            alt="Fresh Lemons"
            layout="fill"
            objectFit="cover"
            className="rounded-none shadow-inner"
            priority
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-3xl sm:text-4xl font-bold text-white bg-black bg-opacity-50 px-6 py-4 rounded-xl shadow-xl max-w-[90%] text-center">
              Your trusted source for premium quality lemons in India.
            </p>
          </div>
        </section>

        <section className="bg-yellow-50 p-6 rounded-xl">
          <h2 className="text-4xl font-bold mb-6 text-green-700">Our Lemons</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {lemons.map((lemon, index) => (
              <div key={index} className="bg-white p-4 rounded-xl shadow-lg">
                <Image src={lemon['Image url']} alt={lemon['Grade']} width={300} height={200} className="rounded-lg w-full h-48 object-cover" />
                <p className="mt-3 font-bold text-lg text-green-800">{lemon['Grade']} – ₹{lemon['Price Per Kg']}/kg</p>
                <p className="text-gray-700">{lemon['Description']}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-4xl font-bold mb-6 text-green-700">Buy Now</h2>
          <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl mx-auto">
            <input name="name" type="text" placeholder="Your Name" value={form.name} onChange={handleChange} className="w-full border p-3 rounded" required />
            <input name="quantity" type="number" step="1" min="1" placeholder="Quantity (in kg)" value={form.quantity} onChange={handleChange} className="w-full border p-3 rounded" required />
            {isBulk && <p className="text-green-600 text-sm font-medium">Bulk order detected: 10% discount will be applied.</p>}
            <select name="quality" value={form.quality} onChange={handleChange} className="w-full border p-3 rounded">
              <option value="A1">A1 Quality</option>
              <option value="A2">A2 Quality</option>
              <option value="A3">A3 Quality</option>
            </select>
            <textarea name="delivery" placeholder="Delivery Address" value={form.delivery} onChange={handleChange} className="w-full border p-3 rounded" required></textarea>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">🇮🇳 +91</span>
              <input
                name="contact"
                type="tel"
                placeholder="10-digit mobile number"
                value={form.contact}
                onChange={handleChange}
                className="w-full border p-3 rounded pl-20"
                maxLength={10}
                pattern="\d{10}"
                required
              />
            </div>
            {quantity > 0 && (
              <p className="text-md text-green-700 font-medium">
                Total Price: ₹{totalPrice} {isBulk && <span>(10% bulk discount applied)</span>}
              </p>
            )}
            <button type="submit" disabled={isSubmitting} className="bg-green-700 hover:bg-green-800 text-white py-3 px-6 rounded font-semibold">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path d="M22 12a10 10 0 01-10 10" fill="currentColor" />
                  </svg>
                  Placing Order...
                </span>
              ) : 'Place Order'}
            </button>
            {orderStatus && <p className="text-center mt-2 text-sm text-gray-700">{orderStatus}</p>}
          </form>
          <div className="mt-6 text-center">
            <a href={getWhatsappLink()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-white bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl text-lg font-semibold">
              <FaWhatsapp className="text-2xl" /> Chat on WhatsApp
            </a>
          </div>
        </section>

        <section className="text-center text-sm text-gray-600 mt-16">
          <p>© 2025 3 Lemons Traders. All rights reserved.</p>
        </section>
      </main>
    </div>
  );
}
