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
    const message = `Hi, I'm interested in ordering lemons. My name is ${form.name}, I'd like ${form.quantity}kg of ${form.quality} quality. Here's my address: ${form.delivery}`;
    return `https://wa.me/918500130926?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-screen bg-yellow-50 bg-[url('/bg-pattern.svg')] bg-cover bg-no-repeat text-green-800 font-sans">
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
          <Image src="/lemons-hero.jpg" alt="Fresh Lemons" width={800} height={500} className="mx-auto rounded-xl shadow-xl" />
          <p className="mt-6 text-lg font-medium">Your trusted source for premium quality lemons in India.</p>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-4">About Us</h2>
          <p className="text-lg">We are a passionate team led by <strong>Pradeep Mamuduru</strong>, Business Executive & Partner, committed to delivering top-grade lemons across India. Our mission is to provide freshness, quality, and customer satisfaction with every order.</p>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">Our Lemons</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <Image src="/lemons-with-leaves.jpg" alt="A1 Quality Lemons" width={300} height={200} className="rounded-lg" />
              <p className="mt-3 font-semibold text-lg">A1 Quality – ₹80/kg</p>
              <p>Handpicked lemons with premium leaves, rich in juice and flavor.</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <Image src="/sliced-lemon.jpeg" alt="A2 Quality Lemons" width={300} height={200} className="rounded-lg" />
              <p className="mt-3 font-semibold text-lg">A2 Quality – ₹70/kg</p>
              <p>Good for regular home and restaurant use, moderately juicy.</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <Image src="/lemon-tree.jpeg" alt="A3 Quality Lemons" width={300} height={200} className="rounded-lg" />
              <p className="mt-3 font-semibold text-lg">A3 Quality – ₹60/kg</p>
              <p>Suitable for bulk uses, minor visual imperfections, high utility.</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <Image src="/basket-of-lemons.jpeg" alt="Bulk Orders" width={300} height={200} className="rounded-lg" />
              <p className="mt-3 font-semibold text-lg">Bulk Orders (50kg+) – ₹63/kg</p>
              <p>Flat 10% discount on any lemon quality for large orders.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">Buy Now</h2>
          <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
            <input name="name" type="text" placeholder="Your Name" value={form.name} onChange={handleChange} className="w-full border p-3 rounded" required />
            <input name="quantity" type="number" step="1" placeholder="Quantity (in kg)" value={form.quantity} onChange={handleChange} className="w-full border p-3 rounded" required />
            {parseInt(form.quantity) > 50 && <p className="text-green-600 text-sm font-medium">Bulk order detected: 10% discount will be applied.</p>}
            <select name="quality" value={form.quality} onChange={handleChange} className="w-full border p-3 rounded">
              <option value="A1">A1 Quality</option>
              <option value="A2">A2 Quality</option>
              <option value="A3">A3 Quality</option>
            </select>
            <textarea name="delivery" placeholder="Delivery Address" value={form.delivery} onChange={handleChange} className="w-full border p-3 rounded" required></textarea>
            <input name="contact" type="text" placeholder="WhatsApp Number" value={form.contact} onChange={handleChange} className="w-full border p-3 rounded" required />
            <button type="submit" disabled={isSubmitting} className="bg-green-700 hover:bg-green-800 text-white py-3 px-6 rounded font-semibold">
              {isSubmitting ? 'Placing Order...' : 'Place Order'}
            </button>
            {orderStatus && <p className="text-center mt-2 text-sm text-gray-700">{orderStatus}</p>}
          </form>
          <div className="mt-6 text-center">
            <a href={getWhatsappLink()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-white bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl text-lg font-semibold">
              <FaWhatsapp className="text-2xl" /> Chat on WhatsApp
            </a>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
          <p className="text-lg">Email: <a href="mailto:3lemons.traders@gmail.com" className="text-green-700 font-medium">3lemons.traders@gmail.com</a></p>
          <p className="text-lg">Phone/WhatsApp: <a href="tel:+918500130926" className="text-green-700 font-medium">8500130926</a></p>
          <p className="text-lg">Instagram: <a href="https://instagram.com/3Lemons_Traders" target="_blank" className="text-green-700 font-medium">@3Lemons_Traders</a></p>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-4">Testimonials</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="italic mb-2">“The lemons were juicy and fresh. Great service!” — Rahul, Hyderabad</p>
            <p className="italic">“Affordable and quality product. I ordered 60kg and got 10% off!” — Sneha, Bangalore</p>
          </div>
        </section>
      </main>
    </div>
  );
}
