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
    fetch("https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Lemons")
      .then(res => res.json())
      .then(data => setLemons(data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'quantity' && (value.includes('.') || value.includes(','))) return;
    if (name === 'contact' && (!/^[0-9]*$/.test(value) || value.length > 10)) return;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setOrderStatus('Submitting...');

    const quantity = Number(form.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
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

    const response = await fetch("https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: dataToSend })
    });

    if (response.ok) {
      setOrderStatus("Order submitted successfully!");
      setForm({ name: '', quantity: '', quality: 'A1', delivery: '', contact: '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
  const quantity = Number(form.quantity) || 0;
  const isBulk = quantity > 50;
  const basePrice = pricePerKg[form.quality] * quantity;
  const discount = isBulk ? 0.1 : 0;
  const totalPrice = basePrice * (1 - discount);

  return (
    <div className="min-h-screen bg-[url('/deca30a0-9675-4778-9175-c2d8820e04fc.png')] bg-cover bg-center text-green-100 font-sans">
      <Head>
        <title>3 Lemons Traders – Buy Fresh Lemons Online</title>
        <meta name="description" content="Buy premium quality lemons at affordable prices across India. Direct farm to home delivery." />
        <meta property="og:title" content="Buy Fresh Lemons Online – 3 Lemons Traders" />
        <meta property="og:description" content="Get premium lemons delivered to your door at unbeatable prices. Farm fresh quality." />
        <meta property="og:image" content="/lemons-hero.jpg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://3lemons.in" />
      </Head>

      <main className="p-4 sm:p-8 space-y-16 max-w-7xl mx-auto">
        <section className="relative bg-opacity-30 rounded-xl overflow-hidden mb-10">
          <img
            src="/lemons-hero.jpg"
            alt="Fresh Lemons"
            className="w-full h-96 object-cover opacity-60 rounded-xl"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white z-10 p-4">
            <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 drop-shadow-lg">3 Lemons Traders</h1>
            <p className="text-xl sm:text-2xl font-medium drop-shadow-lg">Buy fresh, farm-direct lemons delivered across India</p>
            <a href="#buy-now" className="inline-block mt-6 px-6 py-3 bg-green-700 text-white rounded-full font-semibold shadow-lg hover:bg-green-800 transition">
              Order Now
            </a>
          </div>
        </section>

        <section className="bg-white bg-opacity-80 p-6 rounded-xl">
          <h2 className="text-4xl font-bold mb-6 text-green-900">Our Lemons</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {lemons.map((lemon, index) => (
              <div key={index} className="bg-white p-4 rounded-xl shadow-lg">
                <Image src={lemon['Image url']} alt={lemon['Grade'] || 'Lemon'} width={300} height={200} loading="lazy" className="rounded-lg w-full h-48 object-cover" />
                <p className="mt-3 font-bold text-lg text-green-800">{lemon['Grade']} – ₹{lemon['Price Per Kg']}/kg</p>
                <p className="text-gray-700">{lemon['Description']}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="buy-now" className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg">
          <h2 className="text-4xl font-bold mb-6 text-green-900">Buy Now</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your Name"
                required
                className="border rounded p-3 w-full"
              />
              <input
                type="text"
                name="contact"
                value={form.contact}
                onChange={handleChange}
                placeholder="10-digit Mobile Number"
                maxLength={10}
                required
                className="border rounded p-3 w-full"
              />
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="Quantity (kg)"
                required
                className="border rounded p-3 w-full"
              />
              <select
                name="quality"
                value={form.quality}
                onChange={handleChange}
                className="border rounded p-3 w-full"
              >
                <option value="A1">A1 – ₹80/kg</option>
                <option value="A2">A2 – ₹70/kg</option>
                <option value="A3">A3 – ₹60/kg</option>
              </select>
              <input
                type="text"
                name="delivery"
                value={form.delivery}
                onChange={handleChange}
                placeholder="Delivery Address"
                required
                className="border rounded p-3 w-full md:col-span-2"
              />
            </div>

            <div className="text-lg font-medium text-green-900">
              Total Price: ₹{totalPrice} {isBulk && <span className="text-sm text-green-600">(10% bulk discount applied)</span>}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition"
              >
                {isSubmitting ? 'Submitting...' : 'Place Order'}
              </button>
              <a
                href={getWhatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-6 py-3 border border-green-700 text-green-700 rounded-lg hover:bg-green-50 transition"
              >
                <FaWhatsapp className="mr-2" /> Order via WhatsApp
              </a>
            </div>

            {orderStatus && (
              <p className="mt-4 text-center font-semibold text-green-900">{orderStatus}</p>
            )}
          </form>
        </section>

      </main>
    </div>
  );
}
