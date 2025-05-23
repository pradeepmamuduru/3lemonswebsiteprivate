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
    contact: '',
  });
  const [lemons, setLemons] = useState([]);
  const [orderStatus, setOrderStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('https://sheetdb.io/api/v1/wm0oxtmmfkndt')
      .then((res) => res.json())
      .then((data) => setLemons(data))
      .catch(() => setLemons([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'quantity') {
      // Only allow integers and empty
      if (/^\d*$/.test(value)) {
        setForm({ ...form, [name]: value });
      }
      return;
    }

    if (name === 'contact') {
      // Allow only digits up to 10, remove +91 manually from input
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setForm({ ...form, contact: digits });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setOrderStatus('Submitting...');

    const quantity = parseInt(form.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      setOrderStatus('Please enter a valid quantity (integer).');
      setIsSubmitting(false);
      return;
    }

    if (form.contact.length !== 10) {
      setOrderStatus('Please enter a valid 10-digit WhatsApp number.');
      setIsSubmitting(false);
      return;
    }

    const isBulk = quantity > 50;
    const dataToSend = {
      ...form,
      quantity,
      discount: isBulk ? '10%' : '0%',
      contact: '+91' + form.contact,
    };

    try {
      const response = await fetch('https://sheetdb.io/api/v1/q6ryvlhjjmu4q', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataToSend }),
      });

      if (response.ok) {
        setOrderStatus('Order submitted successfully!');
        setForm({
          name: '',
          quantity: '',
          quality: 'A1 Grade',
          delivery: '',
          contact: '',
        });
      } else {
        setOrderStatus('Failed to submit order. Please try again.');
      }
    } catch (error) {
      setOrderStatus('Failed to submit order. Please try again.');
    }

    setIsSubmitting(false);
  };

  const getWhatsappLink = () => {
    const { name, quantity, quality, delivery, contact } = form;
    const message = `Hi! I'm interested in ordering lemons:
👤 Name: ${name}
📞 Contact: +91${contact}
📦 Quantity: ${quantity}kg
⭐ Quality: ${quality}
🏠 Address: ${delivery}

Please confirm availability.`;
    return `https://wa.me/918500130926?text=${encodeURIComponent(message)}`;
  };

  const pricePerKgMap = {
    'A1 Grade': 80,
    'A2 Grade': 70,
    'A3 Grade': 60,
  };

  const quantity = parseInt(form.quantity) || 0;
  const isBulk = quantity > 50;
  const basePrice = (pricePerKgMap[form.quality] || 0) * quantity;
  const discount = isBulk ? 0.1 : 0;
  const totalPrice = basePrice * (1 - discount);

  return (
    <div className="min-h-screen bg-[url('/bg-pattern.svg')] bg-cover bg-fixed text-green-900 font-sans">
      <Head>
        <title>3 Lemons Traders – Buy Fresh Lemons Online</title>
        <meta
          name="description"
          content="Buy premium quality lemons at affordable prices across India. Direct farm to home delivery."
        />
      </Head>

      <header className="bg-green-700 text-white p-6 text-center shadow-lg">
        <h1 className="text-4xl font-extrabold">3 Lemons Traders</h1>
        <p className="text-md mt-1">
          Fresh Lemons, Fresher Deals – Direct to Your Doorstep
        </p>
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
          <p className="mt-6 text-lg font-medium">
            Your trusted source for premium quality lemons in India.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">Our Lemons</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {lemons.map((lemon, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-xl shadow-lg flex flex-col items-center"
              >
                <Image
                  src={lemon['Image url']}
                  alt={lemon['Grade']}
                  width={300}
                  height={200}
                  className="rounded-lg object-cover"
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
          <form
            onSubmit={handleSubmit}
            className="space-y-5 max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg"
          >
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

            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-700 font-semibold"
                aria-hidden="true"
              >
                🇮🇳 +91
              </span>
              <input
                name="contact"
                type="tel"
                placeholder="WhatsApp Number"
                value={form.contact}
                onChange={handleChange}
                className="w-full border pl-16 p-3 rounded"
                required
              />
            </div>

            {quantity > 0 && (
              <p className="text-md text-green-700 font-medium">
                Total Price: ₹{totalPrice.toFixed(0)}{' '}
                {isBulk && <span>(10% bulk discount applied)</span>}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-700 hover:bg-green-800 text-white py-3 px-6 rounded font-semibold"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Place Order'
              )}
            </button>

            {orderStatus && (
              <p
                className={`mt-4 font-semibold ${
                  orderStatus.includes('success')
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {orderStatus}
              </p>
            )}
          </form>
        </section>

        <section className="text-center">
          <a
            href={getWhatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded shadow-lg"
          >
            <FaWhatsapp size={24} /> Chat on WhatsApp
          </a>
        </section>
      </main>
    </div>
  );
}
