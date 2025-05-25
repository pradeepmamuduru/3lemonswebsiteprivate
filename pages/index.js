import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';

export default function Home() {
  const [lemons, setLemons] = useState([]);
  const [form, setForm] = useState({ name: '', quantity: '', quality: 'A1', delivery: '', contact: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('https://sheetdb.io/api/v1/wm0oxtmmfkndt')
      .then(res => res.json())
      .then(data => setLemons(data));
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'contact' && !/^\d{0,10}$/.test(value)) return;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setStatus('Submitting...');
    if (!form.name || !form.quantity || !form.delivery || !form.contact.match(/^\d{10}$/)) {
      setStatus('Please fill all fields correctly.');
      return;
    }
    const dataToSend = { ...form, contact: '+91' + form.contact };
    const res = await fetch('https://sheetdb.io/api/v1/q6ryvlhjjmu4q', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: dataToSend })
    });
    if (res.ok) {
      setForm({ name: '', quantity: '', quality: 'A1', delivery: '', contact: '' });
      setStatus('Order placed successfully!');
    } else {
      setStatus('Error placing order.');
    }
  };

  return (
    <div className="bg-[#e0e0e0] text-green-900 min-h-screen font-sans">
      <Head>
        <title>3 Lemons – Premium Fresh Lemons Delivered</title>
        <meta name="description" content="Order high-quality lemons directly from 3 Lemons Traders. Fast delivery across India." />
      </Head>

      <header className="relative h-[80vh] w-full overflow-hidden">
        <Image src="/lemons-hero.jpg" alt="Hero Lemons" layout="fill" objectFit="cover" priority />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-white text-center px-6">
            <h1 className="text-5xl font-extrabold drop-shadow-lg">3 Lemons Traders</h1>
            <p className="text-xl mt-4 font-light">Fresh. Affordable. Delivered to your Doorstep.</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-16">
        <section>
          <h2 className="text-4xl font-bold text-green-800 mb-6">Available Lemon Grades</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {lemons.map((lemon, i) => (
              <div key={i} className="bg-[#f2f2f2] p-4 rounded-xl shadow-sm border border-gray-300">
                <Image src={lemon['Image url']} alt={lemon['Grade']} width={400} height={250} className="rounded-md object-cover w-full h-48" />
                <h3 className="text-xl font-semibold mt-4 text-green-700">{lemon['Grade']} – ₹{lemon['Price Per Kg']}/kg</h3>
                <p className="text-gray-800 mt-2">{lemon['Description']}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#f3f3f3] p-8 rounded-xl border border-gray-300">
          <h2 className="text-3xl font-bold text-green-800 mb-6">Place Your Order</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 max-w-xl">
            <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} className="border p-3 rounded bg-white" required />
            <input name="quantity" type="number" min="1" placeholder="Quantity (kg)" value={form.quantity} onChange={handleChange} className="border p-3 rounded bg-white" required />
            <select name="quality" value={form.quality} onChange={handleChange} className="border p-3 rounded bg-white">
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="A3">A3</option>
            </select>
            <textarea name="delivery" placeholder="Delivery Address" value={form.delivery} onChange={handleChange} className="border p-3 rounded bg-white" required />
            <input name="contact" placeholder="10-digit Phone Number" value={form.contact} onChange={handleChange} className="border p-3 rounded bg-white" required />
            <button className="bg-green-700 text-white font-semibold py-3 rounded hover:bg-green-800" type="submit">Submit Order</button>
            <p className="text-sm text-center text-gray-700">{status}</p>
          </form>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-green-800 mb-4">Contact & Socials</h2>
          <p>Email: <a href="mailto:3lemons.traders@gmail.com" className="text-green-700 underline">3lemons.traders@gmail.com</a></p>
          <p>Phone: <a href="tel:+918500130926" className="text-green-700 underline">+91 8500130926</a></p>
          <p>Instagram: <a href="https://instagram.com/3Lemons_Traders" className="text-green-700 underline">@3Lemons_Traders</a></p>
        </section>

        <section className="bg-[#d8d8d8] p-6 rounded-xl">
          <h2 className="text-2xl font-semibold text-green-800 mb-2">What Our Customers Say</h2>
          <blockquote className="italic text-gray-800">“The lemons were incredibly fresh and the service was fantastic!” – Ravi, Chennai</blockquote>
          <blockquote className="italic text-gray-800 mt-2">“I placed a bulk order and it arrived on time with great quality.” – Anjali, Pune</blockquote>
        </section>
      </main>
    </div>
  );
}
