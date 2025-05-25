// pages/index.js

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/styles.module.css';

export default function Home() {
  const [lemons, setLemons] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    grade: '',
    quantity: '',
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchLemons();
  }, []);

  const fetchLemons = async () => {
    try {
      const res = await fetch('https://sheetdb.io/api/v1/wm0oxtmmfkndt');
      const data = await res.json();
      setLemons(data);
    } catch (error) {
      console.error('Error fetching lemons:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateTotal = () => {
    const selected = lemons.find(l => l.Grade === formData.grade);
    const qty = parseFloat(formData.quantity);
    if (!selected || isNaN(qty)) return '₹0';
    let price = parseFloat(selected['Price Per Kg']) * qty;
    if (qty >= 100) price *= 0.95;
    return `₹${price.toFixed(2)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.grade || !formData.quantity) {
      setStatus('Please fill in all fields.');
      return;
    }
    try {
      await fetch('https://sheetdb.io/api/v1/wm0oxtmmfkndt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: formData }),
      });
      setStatus('Order placed successfully!');
      setFormData({ name: '', phone: '', grade: '', quantity: '' });
    } catch (err) {
      console.error(err);
      setStatus('Failed to place order.');
    }
  };

  const whatsappLink = `https://wa.me/91${formData.phone}?text=Hello, I want to order ${formData.quantity} kg of ${formData.grade} lemons.`;

  return (
    <div className={styles.page}>
      <Head>
        <title>3 Lemons - Fresh Lemons Delivered</title>
        <meta name="description" content="Order fresh, high-quality lemons directly from farmers." />
      </Head>

      <main className={styles.container}>
        <section className={styles.hero}>
          <Image
            src="/lemon-banner.jpg"
            alt="Fresh Lemons"
            width={1200}
            height={500}
            className={styles.heroImage}
          />
          <div className={styles.heroOverlay}>
            <h1 className={styles.heroTitle}>3 Lemons</h1>
            <p className={styles.heroSubtitle}>Fresh Lemons Delivered to Your Doorstep</p>
            <a href="#order" className={styles.heroButton}>Order Now</a>
          </div>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>Our Lemons</h2>
          <div className={styles.lemonsGrid}>
            {lemons.map((lemon, idx) => (
              <div key={idx} className={styles.lemonCard}>
                <Image
                  src={lemon['Image url'] || '/lemon.jpg'}
                  alt={lemon.Grade}
                  width={300}
                  height={200}
                  className={styles.cardImage}
                />
                <h3 className={styles.cardTitle}>{lemon.Grade}</h3>
                <p className={styles.cardDescription}>{lemon.Description}</p>
                <p><strong>₹{lemon['Price Per Kg']}/Kg</strong></p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>What Our Customers Say</h2>
          <div className={styles.testimonialGrid}>
            <div className={styles.testimonialCard}>
              “The lemons were incredibly fresh and juicy. Delivery was quick too!” – Priya S.
            </div>
            <div className={styles.testimonialCard}>
              “Best prices and reliable service. I’m ordering again!” – Rohit K.
            </div>
            <div className={styles.testimonialCard}>
              “I appreciated the bulk discount. Great for my restaurant.” – Neha D.
            </div>
          </div>
        </section>

        <section id="order" className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Place Your Order</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGrid}>
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleInputChange}
                className={`${styles.input} ${styles.inputFull}`}
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleInputChange}
                className={`${styles.input} ${styles.inputFull}`}
              />
              <select
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                className={`${styles.input} ${styles.inputFull}`}
              >
                <option value="">Select Grade</option>
                {lemons.map((lemon, idx) => (
                  <option key={idx} value={lemon.Grade}>{lemon.Grade}</option>
                ))}
              </select>
              <input
                type="number"
                name="quantity"
                placeholder="Quantity (kg)"
                value={formData.quantity}
                onChange={handleInputChange}
                className={`${styles.input} ${styles.inputFull}`}
              />
            </div>

            <p className={styles.total}>Total: {calculateTotal()}</p>
            {parseFloat(formData.quantity) >= 100 && (
              <p className={styles.discountNote}>5% discount applied!</p>
            )}

            <div className={styles.actions}>
              <button type="submit" className={styles.submitButton}>Submit</button>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappButton}
              >
                Chat on WhatsApp
              </a>
            </div>

            {status && <p className={styles.statusMessage}>{status}</p>}
          </form>
        </section>
      </main>
    </div>
  );
}
