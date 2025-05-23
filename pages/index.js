import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Home() {
  const [form, setForm] = useState({ name: '', quantity: '', delivery: '', contact: '' });
  const [lemons, setLemons] = useState([]);
  const [orderStatus, setOrderStatus] = useState('');

  useEffect(() => {
    fetch("https://sheetdb.io/api/v1/wm0oxtmmfkndt")
      .then(res => res.json())
      .then(data => setLemons(data));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOrderStatus('Submitting...');

    const response = await fetch("https://sheetdb.io/api/v1/q6ryvlhjjmu4q", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: form })
    });

    if (response.ok) {
      setOrderStatus("Order submitted successfully!");
      setForm({ name: '', quantity: '', delivery: '', contact: '' });
    } else {
      setOrderStatus("Failed to submit order. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 text-green-800 font-sans">
      <header className="bg-green-600 text-white p-4 text-center shadow-lg">
        <h1 className="text-3xl font-bold">3 Lemons Traders</h1>
        <p className="text-sm">Fresh Lemons, Fresher Deals!</p>
      </header>

      <main className="p-4 space-y-12">
        <section className="text-center">
          <Image src="/lemons-hero.jpg" alt="Fresh Lemons" width={600} height={400} className="mx-auto rounded-xl shadow" />
          <p className="mt-4 text-lg">Your trusted source for premium quality lemons in India.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-2">About Us</h2>
          <p>We are a passionate team led by <strong>Pradeep Mamuduru</strong>, Business Executive & Partner, committed to delivering top-grade lemons across India. Our mission is to provide freshness, quality, and customer satisfaction with every order.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-2">Our Lemons</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded shadow">
              <Image src="/lemons-with-leaves.jpg" alt="Lemons with Leaves" width={300} height={200} className="rounded-lg" />
              <p className="mt-2 font-semibold">Premium Grade A - ₹80/kg</p>
              <p>Handpicked lemons with leaves, rich in juice and flavor.</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <Image src="/sliced-lemon.jpeg" alt="Sliced Lemons" width={300} height={200} className="rounded-lg" />
              <p className="mt-2 font-semibold">Juicy Slices - ₹75/kg</p>
              <p>Perfectly sliced for instant use in kitchens and juice shops.</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <Image src="/basket-of-lemons.jpeg" alt="Basket of Lemons" width={300} height={200} className="rounded-lg" />
              <p className="mt-2 font-semibold">Bulk Basket - ₹70/kg</p>
              <p>Ideal for wholesale buyers and markets.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-2">Buy Now</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto bg-white p-6 rounded-lg shadow">
            <input name="name" type="text" placeholder="Your Name" value={form.name} onChange={handleChange} className="w-full border p-2 rounded" required />
            <input name="quantity" type="text" placeholder="Quantity (in kg)" value={form.quantity} onChange={handleChange} className="w-full border p-2 rounded" required />
            <textarea name="delivery" placeholder="Delivery Address" value={form.delivery} onChange={handleChange} className="w-full border p-2 rounded" required></textarea>
            <input name="contact" type="text" placeholder="WhatsApp Number" value={form.contact} onChange={handleChange} className="w-full border p-2 rounded" required />
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded">Place Order</button>
            {orderStatus && <p className="text-center mt-2 text-sm text-gray-700">{orderStatus}</p>}
          </form>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-2">Contact Us</h2>
          <p>Email: <a href="mailto:3lemons.traders@gmail.com" className="text-green-600">3lemons.traders@gmail.com</a></p>
          <p>Phone/WhatsApp: <a href="tel:+918500130926" className="text-green-600">8500130926</a></p>
          <p>Instagram: <a href="https://instagram.com/3Lemons_Traders" target="_blank" className="text-green-600">@3Lemons_Traders</a></p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-2">Testimonials</h2>
          <p className="italic">(Coming soon: Hear what our happy customers have to say!)</p>
        </section>
      </main>
    </div>
  );
}
