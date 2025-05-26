import { useState, useEffect } from 'react';
import Head from 'next/head'; // For SEO metadata
import Image from 'next/image'; // For Next.js optimized images
import { FaWhatsapp } from 'react-icons/fa'; // Assuming you still want this icon
import styles from '../styles/styles.module.css';

// --- Start of getStaticProps (from your old code) ---
// This fetches data at build time for better performance and SEO
export async function getStaticProps() {
  try {
    const res = await fetch("https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Lemons"); // Ensure 'Lemons' is the correct sheet name
    if (!res.ok) {
      throw new Error(`Failed to fetch lemons: ${res.status} ${res.statusText}`);
    }
    const lemons = await res.json();

    // Ensure lemons data is an array
    if (!Array.isArray(lemons)) {
        console.error("Fetched lemons data is not an array:", lemons);
        return { props: { lemons: [] }, revalidate: 3600 };
    }

    return {
      props: { lemons },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error("Error in getStaticProps:", error);
    return { props: { lemons: [] }, revalidate: 3600 }; // Return empty array on error
  }
}
// --- End of getStaticProps ---


// Pass 'lemons' as a prop to your component
export default function Home({ lemons }) {
  const [orders, setOrders] = useState([{ grade: '', quantity: 1 }]);
  const [form, setForm] = useState({ name: '', delivery: '', contact: '' });
  const [total, setTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState(''); // To show success/error messages

  // SheetDB URL for submitting orders (assuming a separate sheet named 'orders')
  const ORDERS_SUBMISSION_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=orders'; 

  // Calculate total whenever orders or lemons (prices) change
  useEffect(() => {
    calculateTotal();
  }, [orders, lemons]); 

  const handleOrderChange = (index, field, value) => {
    const updated = [...orders];
    if (field === 'quantity') {
      value = Math.max(0, parseInt(value) || 0); 
    }
    updated[index][field] = value;
    setOrders(updated);
  };

  const handleAddVariety = () => {
    setOrders([...orders, { grade: '', quantity: 1 }]);
  };

  const calculateTotal = () => {
    let totalPrice = 0;
    orders.forEach(order => {
      const lemon = lemons.find(l => l.Grade === order.grade);
      if (lemon && order.quantity) {
        const price = parseFloat(lemon['Price Per Kg']); // Use parseFloat as prices can be decimals
        if (!isNaN(price)) { 
          totalPrice += price * order.quantity;
        } else {
          console.warn(`Price for grade ${order.grade} is not a valid number: ${lemon['Price Per Kg']}`);
        }
      }
    });
    setTotal(totalPrice);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionMessage(''); 

    if (!form.name || !form.delivery || !form.contact) {
      setSubmissionMessage('Please fill in all your personal details.');
      setIsSubmitting(false);
      return;
    }
    if (!/^\d{10}$/.test(form.contact)) {
        setSubmissionMessage('Please enter a valid 10-digit contact number.');
        setIsSubmitting(false);
        return;
    }

    const hasValidOrder = orders.some(order => order.grade && order.quantity > 0);
    if (!hasValidOrder) {
      setSubmissionMessage('Please add at least one lemon variety and quantity.');
      setIsSubmitting(false);
      return;
    }
    
    const rows = orders
      .filter(order => order.grade && order.quantity > 0) 
      .map(order => ({
        name: form.name,
        quantity: order.quantity,
        quality: order.grade,
        delivery: form.delivery,
        contact: form.contact,
        discount: '0%', 
        'Order Date': new Date().toLocaleString(),
      }));

    if (rows.length === 0) {
        setSubmissionMessage('No valid order items to submit.');
        setIsSubmitting(false);
        return;
    }

    try {
      const response = await fetch(ORDERS_SUBMISSION_URL, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }), 
      });

      if (response.ok) {
        setSubmissionMessage('Order submitted successfully!');
        setOrders([{ grade: '', quantity: 1 }]); 
        setForm({ name: '', delivery: '', contact: '' }); 
        setTotal(0); 
      } else {
        const errorData = await response.json(); 
        console.error('SheetDB submission error:', response.status, errorData);
        setSubmissionMessage(`Failed to submit order: ${errorData.message || 'Server error'}.`);
      }
    } catch (err) {
      console.error('Network or submission error:', err);
      setSubmissionMessage('Failed to submit order. Please check your internet connection.');
    }

    setIsSubmitting(false);
  };

  const getWhatsappLink = () => {
    const validOrders = orders.filter(order => order.grade && order.quantity > 0);
    if (validOrders.length === 0 || !form.contact || !/^\d{10}$/.test(form.contact)) {
        return '#'; 
    }

    const msg = validOrders
      .map(order => `${order.quantity} kg of ${order.grade}`)
      .join(', ');
      
    const whatsappContact = `91${form.contact}`; 
      
    const whatsappMessage = `Hi, I'm ${form.name}. I want to order: ${msg}. Delivery Address: ${form.delivery}. Total: ₹${total.toFixed(2)}. Please confirm.`;
    return `https://wa.me/${whatsappContact}?text=${encodeURIComponent(whatsappMessage)}`;
  };

  return (
    <div className={styles.page}> {/* Use styles.page for the outermost div */}
      <Head>
        <title>3 Lemons Traders – Buy Fresh Lemons Online</title>
        <meta name="description" content="Buy premium quality lemons at affordable prices across India. Direct farm to home delivery." />
        <meta property="og:title" content="Buy Fresh Lemons Online – 3 Lemons Traders" />
        <meta property="og:description" content="Get premium lemons delivered to your door at unbeatable prices. Farm fresh quality." />
        <meta property="og:image" content="/lemons-hero.jpg" /> {/* Ensure this image exists in your public folder */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://3lemons.in" /> {/* Update this if your main domain changes */}
      </Head>

      <main className={styles.container}> {/* This will center the main content */}
        {/* --- Hero Section (copied from old code) --- */}
        <section className={styles.hero}>
          <img
            src="/lemons-hero.jpg" // Ensure this image exists in your public folder
            alt="Fresh Lemons"
            className={styles.heroImage}
          />
          <div className={styles.heroOverlay}>
            <h1 className={styles.heroTitle}>3 Lemons Traders</h1>
            <p className={styles.heroSubtitle}>Buy fresh, farm-direct lemons delivered across India</p>
            <a href="#buy-now" className={styles.heroButton}>
              Order Now
            </a>
          </div>
        </section>

        {/* --- Lemons Section (copied from old code) --- */}
        <section className={styles.lemonsSection}>
          <h2 className={styles.sectionTitle}>Our Lemons</h2>
          <div className={styles.lemonsGrid}>
            {Array.isArray(lemons) && lemons.length > 0 ? (
              lemons.map((lemon, index) => (
                <div key={index} className={styles.lemonCard}>
                  {/* Using Next.js Image component requires it to be imported and images optimized */}
                  {/* Make sure "Image url" from SheetDB is a valid URL or path in your public folder */}
                  {lemon['Image url'] && (
                    <Image
                      src={lemon['Image url']}
                      alt={lemon['Grade'] || 'Lemon'}
                      width={300} // Adjust width/height as needed for your layout
                      height={200}
                      loading="lazy"
                      className={styles.cardImage}
                    />
                  )}
                  <p className={styles.cardTitle}>
                    {lemon['Grade']} – ₹{lemon['Price Per Kg']}/kg
                  </p>
                  <p className={styles.cardDescription}>{lemon['Description']}</p>
                </div>
              ))
            ) : (
              <p>Loading lemons or no lemon data available...</p> // Feedback for user
            )}
          </div>
        </section>

        {/* --- Form Section (your new improved form logic) --- */}
        <section id="buy-now" className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Buy Now</h2>
          {submissionMessage && (
            <p style={{ color: submissionMessage.includes('successfully') ? 'green' : 'red', fontWeight: 'bold' }}>
              {submissionMessage}
            </p>
          )}
          <form onSubmit={handleSubmit} className={styles.form}> {/* Apply form class */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Your Name</label>
              <input
                className={styles.input}
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Delivery Address</label>
              <input
                className={styles.input}
                required
                value={form.delivery}
                onChange={(e) => setForm({ ...form, delivery: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Contact Number</label>
              <input
                type="tel"
                className={styles.input}
                required
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                maxLength={10} 
                pattern="[0-9]{10}" 
                title="Please enter a 10-digit mobile number"
              />
            </div>

            {orders.map((order, index) => (
              <div className={styles.formGroup} key={index}>
                <label className={styles.label}>Select Grade</label>
                <select
                  className={styles.select}
                  value={order.grade}
                  onChange={(e) => handleOrderChange(index, 'grade', e.target.value)}
                  required
                >
                  <option value="">-- Select --</option>
                  {lemons.map((lemon, idx) => (
                    <option key={idx} value={lemon.Grade}>
                      {lemon.Grade} – ₹{lemon['Price Per Kg']}/kg
                    </option>
                  ))}
                </select>

                <label className={styles.label}>Quantity (kg)</label>
                <input
                  type="number"
                  min="1" 
                  className={styles.input}
                  value={order.quantity}
                  onChange={(e) => handleOrderChange(index, 'quantity', e.target.value)}
                  required 
                />
              </div>
            ))}

            <button type="button" onClick={handleAddVariety} className={styles.button}>
              ➕ Add Another Variety
            </button>

            <div className={styles.orderSummary}>
              <h3>Total: ₹{total.toFixed(2)}</h3>
            </div>

            <button type="submit" disabled={isSubmitting} className={styles.button}>
              {isSubmitting ? 'Ordering...' : '🛒 Place Order on Website'}
            </button>

            <a
              href={getWhatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.button}
              style={{ pointerEvents: (!form.contact || orders.filter(o => o.grade && o.quantity > 0).length === 0) ? 'none' : 'auto', opacity: (!form.contact || orders.filter(o => o.grade && o.quantity > 0).length === 0) ? 0.6 : 1 }}
            >
              🟢 Place Order on WhatsApp
            </a>
          </form>
        </section>
      </main>

      <div className={styles.footer}>
        <p>Pradeep Mamuduru</p>
        <p>
          📸 <a href="https://www.instagram.com/3Lemons_Traders" target="_blank" rel="noopener noreferrer">3Lemons_Traders</a> | 🌐 <a href="https://3lemons.vercel.app">3lemons.vercel.app</a>
        </p>
      </div>
    </div>
  );
}
