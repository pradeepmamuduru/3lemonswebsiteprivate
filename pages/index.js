import { useState, useEffect } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import { FaWhatsapp } from 'react-icons/fa';

export default function Home() {
  const [form, setForm] = useState({
    name: '',
    quantity: '',
    quality: 'A1 Grade',
    delivery: '',
    contact: ''
  });
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
    // Only allow integers for quantity, no decimals or commas
    if (name === 'quantity' && (value.includes('.') || value.includes(','))) return;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setOrderStatus('Submitting...');

    const quantity = parseInt(form.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      setOrderStatus("Please enter a valid quantity (integer).");
      setIsSubmitting(false);
      return;
    }

    const isBulk = quantity > 50;
    const dataToSend = { ...form, quantity, discount: isBulk ? '10%' : '0%' };

    try {
      const response = await fetch("https://sheetdb.io/api/v1/q6ryvlhjjmu4q", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataToSend }),
      });

      if (response.ok) {
        setOrderStatus("Order submitted successfully!");
        setForm({ name: '', quantity: '', quality: 'A1 Grade', delivery: '', contact: '' });
      } else {
        setOrderStatus("Failed to submit order. Please try again.");
      }
    } catch (error) {
      setOrderStatus("Failed to submit order. Please try again.");
    }
    setIsSubmitting(false);
  };

  const getWhatsappLink = () => {
    const { name, quantity, quality, delivery, contact } = form;
    const message = `Hi! I'm interested in ordering lemons:\n👤 Name: ${name}\n📞 Contact: ${contact}\n📦 Quantity: ${quantity}kg\n⭐ Quality: ${quality}\n🏠 Address: ${delivery}\nPlease confirm availability.`;
    return `https://wa.me/918500130926?text=${encodeURIComponent(message)}`;
  };

  // Price mapping exactly matching spreadsheet grades
  const pricePerKg = {
    'A1 Grade': 80,
    'A2 Grade': 70,
    'A3 Grade': 60,
  };

  const quantity = parseInt(form.quantity) || 0;
  const isBulk = quantity > 50;
  const basePrice = (pricePerKg[form.quality] || 0) * quantity;
  const discount = isBulk ? 0.1 : 0;
  const totalPrice = basePrice * (1 - discount);

  return (
    <div className="min-h-screen bg-[url('/bg-pattern.svg')] bg-cover bg-fixed text-green-900 font-sans">
      <Head>
        <title>3 Lemons Traders – Buy Fresh Lemons Online</title>
        <meta name="description" content="Buy premium quality lemons at affordable prices across India. Direct farm to home delivery." />
      </Head>

      <header className="bg-green-700 text-white p-6 text-center shadow-lg">
        <h1 className="text-4xl font-extrabold">3 Lemons Traders</h1>
        <p className="text-md mt-1">Fresh Lemons, Fresher Deals – Direct to Your Doorstep</p>
      </header>

      <main className="p-8 space-y-16 max-w-7xl mx-auto">
        <section className="text-center">
          <Image
            src="/lemons-hero.jpg"
            alt="Fresh Lemons"
            width={800}
            height={500}
            className="mx-auto rounded-xl shadow-xl"
          />
          <p className="mt-6 text-lg font-medium">Your trusted source for premium quality lemons in India.</p>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">Our Lemons</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {lemons.map((lemon, index) => (
              <div key={index} className="bg-white p-4 rounded-xl shadow-lg">
                <img
                  src={lemon['Image url']}
                  alt={lemon['Grade']}
                  loading="lazy"
                  className="rounded-lg w-full h-48 object-cover"
                />
                <p className="mt-3 font-semibold text-lg">
                  {lemon['Grade']} – ₹{lemon['Price Per Kg']}/kg
                </p>
                <p>{lemon['Description']}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">Buy Now</h2>
          <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
            <input
              name="name"
              type="text"
              placeholder="Your Name"
              value={form.name}
              onChange={handleChange}
              className="w-full border p-3 rounded"
              required
            />
            <input
              name="quantity"
              type="number"
              step="1"
              placeholder="Quantity (in kg)"
              value={form.quantity}
              onChange={handleChange}
              className="w-full border p-3 rounded"
              required
            />
            {isBulk && (
              <p className="text-green-600 text-sm font-medium">
                Bulk order detected: 10% discount will be applied.
              </p>
            )}
            <select
              name="quality"
              value={form.quality}
              onChange={handleChange}
              className="w-full border p-3 rounded"
            >
              <option value="A1 Grade">A1 Grade</option>
              <option value="A2 Grade">A2 Grade</option>
              <option value="A3 Grade">A3 Grade</option>
            </select>
            <textarea
              name="delivery"
              placeholder="Delivery Address"
              value={form.delivery}
              onChange={handleChange}
              className="w-full border p-3 rounded"
              required
            ></textarea>
            <input
              name="contact"
              type="text"
              placeholder="WhatsApp Number"
              value={form.contact}
              onChange={handleChange}
              className="w-full border p-3 rounded"
              required
            />
            {quantity > 0 && (
              <p className="text-md text-green-700 font-medium">
                Total Price: ₹{totalPrice.toFixed(2)} {isBulk && <span>(10% bulk discount applied)</span>}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-700 hover:bg-green-800 text-white py-3 px-6 rounded font-semibold"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path d="M22 12a10 10 0 01-10 10" fill="currentColor" />
                  </svg>
                  Placing Order...
                </span>
              ) : (
                'Place Order'
              )}
            </button>
            {orderStatus && (
              <p className="text-center mt-2 text-sm text-gray-700">{orderStatus}</p>
            )}
          </form>

          <div className="mt-6 text-center">
            <a
              href={getWhatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-white bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl text-lg font-semibold"
            >
              <FaWhatsapp className="text-2xl" /> Chat on WhatsApp
            </a>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
          <p className="text-lg">
            Email:{' '}
            <a href="mailto:3lemons.traders@gmail.com" className="text-green-700 font-medium">
              3lemons.traders@gmail.com
            </a>
          </p>
          <p className="text-lg">
            Phone:{' '}
            <a href="tel:+918500130926" className="text-green-700 font-medium">
              +91 85001 30926
            </a>
          </p>
        </section>
      </main>

      <footer className="bg-green-700 text-white text-center py-6 mt-16">
        <p>© 2025 3 Lemons Traders. All rights reserved.</p>
      </footer>
    </div>
  );
}
