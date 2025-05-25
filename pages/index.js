// pages/index.js

import { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/styles.module.css';

export async function getStaticProps() {
  const res = await fetch("https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Lemons");
  const lemons = await res.json();
  return { props: { lemons }, revalidate: 3600 };
}

export default function Home({ lemons }) {
  const [form, setForm] = useState({
    name: '',
    quantity: '',
    quality: 'A1',
    delivery: '',
    contact: '',
  });
  const [orderStatus, setOrderStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setOrderStatus("Please enter a valid quantity.");
      setIsSubmitting(false);
      return;
    }

    if (!/^[0-9]{10}$/.test(form.contact)) {
      setOrderStatus("Please enter a valid 10-digit mobile number.");
      setIsSubmitting(false);
      return;
    }

    const dataToSend = {
      ...form,
      contact: `+91${form.contact}`,
      discount: quantity > 50 ? '10%' : '0%',
    };

    try {
      const res = await fetch("https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataToSend }),
      });

      if (res.ok) {
        setOrderStatus("Order submitted successfully!");
        setForm({ name: '', quantity: '', quality: 'A1', delivery: '', contact: '' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setOrderStatus("Failed to submit order. Please try again.");
      }
    } catch {
      setOrderStatus("Something went wrong. Try again later.");
    }
    setIsSubmitting(false);
  };

  const getWhatsappLink = () => {
    const msg = `Hi! I'd like to order:\nName: ${form.name}\nContact: +91${form.contact}\nQuantity: ${form.quantity}kg\nQuality: ${form.quality}\nAddress: ${form.delivery}`;
    return `https://wa.me/918500130926?text=${encodeURIComponent(msg)}`;
  };

  const pricePerKg = { A1: 80, A2: 70, A3: 60 };
  const quantity = Number(form.quantity) || 0;
  const discount = quantity > 50 ? 0.1 : 0;
  const total = pricePerKg[form.quality] * quantity * (1 - discount);

  return (
    <div className={styles.page}>
      <Head>
        <title>3 Lemons – Buy Fresh Lemons Online</title>
        <meta name="description" content="Buy premium lemons at affordable prices." />
      </Head>

      <main className={styles.container}>
        <section className={styles.hero}>
          <img src="/lemons-hero.jpg" alt="Fresh Lemons" className={styles.heroImage} />
          <div className={styles.heroOverlay}>
            <h1 className={styles.heroTitle}>3 Lemons Traders</h1>
            <p className={styles.heroSubtitle}>Fresh, Farm-Direct Lemons Across India</p>
            <a href="#buy-now" className={styles.heroButton}>Order Now</a>
          </div>
        </section>

        <section className={styles.lemonsSection}>
          <h2 className={styles.sectionTitle}>Our Lemons</h2>
          <div className={styles.lemonsGrid}>
            {lemons.map((lemon, idx) => (
              <div key={idx} className={styles.lemonCard}>
                <Image
                  src={lemon['Image url'] || '/lemon-tree.jpeg'}
                  alt={lemon['Grade']}
                  width={300}
                  height={200}
                  className={styles.cardImage}
                />
                <h3>{lemon['Grade']} – ₹{lemon['Price Per Kg']}/kg</h3>
                <p>{lemon['Description']}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.testimonials}>
          <h2 className={styles.sectionTitle}>What Our Customers Say</h2>
          <div className={styles.testimonialGrid}>
            <blockquote className={styles.testimonialCard}>“The lemons were incredibly fresh and juicy. Delivery was quick too!” – Priya S.</blockquote>
            <blockquote className={styles.testimonialCard}>“Best prices and reliable service. I’m ordering again!” – Rohit K.</blockquote>
            <blockquote className={styles.testimonialCard}>“I appreciated the bulk discount. Great for my restaurant.” – Neha D.</blockquote>
          </div>
        </section>

        <section id="buy-now" className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Buy Now</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGrid}>
              <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
              <input type="text" name="contact" placeholder="10-digit Mobile Number" value={form.contact} onChange={handleChange} maxLength={10} required />
              <select name="quality" value={form.quality} onChange={handleChange} required>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="A3">A3</option>
              </select>
              <input type="number" name="quantity" min={1} placeholder="Quantity (kg)" value={form.quantity} onChange={handleChange} required />
              <input type="text" name="delivery" placeholder="Delivery Address" value={form.delivery} onChange={handleChange} required />
            </div>
            <p className={styles.total}>Total: ₹{total.toFixed(2)} {discount > 0 && <span className={styles.discountNote}>(10% bulk discount)</span>}</p>
            <div className={styles.actions}>
              <button type="submit" disabled={isSubmitting}> {isSubmitting ? 'Submitting...' : 'Place Order'} </button>
              <a href={getWhatsappLink()} target="_blank" rel="noopener noreferrer">Order on WhatsApp</a>
            </div>
            {orderStatus && <p className={styles.statusMessage}>{orderStatus}</p>}
          </form>
        </section>
      </main>
    </div>
  );
}
