import { useState } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import styles from '../styles/styles.module.css';

export async function getStaticProps() {
  const res = await fetch("https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Lemons");
  const lemons = await res.json();

  return {
    props: { lemons },
    revalidate: 3600,
  };
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
    if (name === 'quantity') {
      // Prevent negative and decimal
      if (value === '') {
        setForm({ ...form, quantity: '' });
        return;
      }
      if (!/^\d+$/.test(value)) return;
    }
    if (name === 'contact' && (!/^[0-9]*$/.test(value) || value.length > 10)) return;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setOrderStatus('Submitting...');

    const quantity = Number(form.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setOrderStatus("Please enter a valid quantity (integer).");
      setIsSubmitting(false);
      return;
    }

    if (!/^[0-9]{10}$/.test(form.contact)) {
      setOrderStatus("Please enter a valid 10-digit mobile number.");
      setIsSubmitting(false);
      return;
    }

    const isBulk = quantity > 50;
    const dataToSend = {
      ...form,
      contact: `+91${form.contact}`,
      quantity,
      discount: isBulk ? '10%' : '0%',
    };

    try {
      const response = await fetch(
        "https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=orders",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: dataToSend }),
        }
      );

      if (response.ok) {
        setOrderStatus("Order submitted successfully!");
        setForm({
          name: '',
          quantity: '',
          quality: 'A1',
          delivery: '',
          contact: '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setOrderStatus("Failed to submit order. Please try again.");
      }
    } catch {
      setOrderStatus("Failed to submit order. Please try again.");
    }
    setIsSubmitting(false);
  };

  const getWhatsappLink = () => {
    const { name, quantity, quality, delivery, contact } = form;
    const message = `Hi! I'm interested in ordering lemons:%0A👤 Name: ${name}%0A📞 Contact: +91${contact}%0A📦 Quantity: ${quantity}kg%0A⭐ Quality: ${quality}%0A🏠 Address: ${delivery}%0A%0APlease confirm availability.`;
    return `https://wa.me/918500130926?text=${message}`;
  };

  const pricePerKg = {
    A1: 80,
    A2: 70,
    A3: 60,
  };
  const quantity = Number(form.quantity) || 0;
  const isBulk = quantity > 50;
  const basePrice = pricePerKg[form.quality] * quantity;
  const discount = isBulk ? 0.1 : 0;
  const totalPrice = basePrice * (1 - discount);

  return (
    <div className={styles.page}>
      <Head>
        <title>3 Lemons Traders – Buy Fresh Lemons Online</title>
        <meta
          name="description"
          content="Buy premium quality lemons at affordable prices across India. Direct farm to home delivery."
        />
        <meta property="og:title" content="Buy Fresh Lemons Online – 3 Lemons Traders" />
        <meta
          property="og:description"
          content="Get premium lemons delivered to your door at unbeatable prices. Farm fresh quality."
        />
        <meta property="og:image" content="/lemons-hero.jpg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://3lemons.in" />
      </Head>

      <main className={styles.container}>
        <section className={`${styles.hero} ${styles.fadeIn}`}>
          <img
            src="/lemons-hero.jpg"
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

        <section className={`${styles.lemonsSection} ${styles.fadeIn}`}>
          <h2 className={styles.sectionTitle}>Our Lemons</h2>
          <div className={styles.lemonsGrid}>
            {Array.isArray(lemons) &&
              lemons.map((lemon, index) => (
                <div key={index} className={styles.lemonCard}>
                  <Image
                    src={lemon['Image url']}
                    alt={lemon['Grade'] || 'Lemon'}
                    width={300}
                    height={200}
                    loading="lazy"
                    className={styles.cardImage}
                  />
                  <p className={styles.cardTitle}>
                    {lemon['Grade']} – ₹{lemon['Price Per Kg']}/kg
                  </p>
                  <p className={styles.cardDescription}>{lemon['Description']}</p>
                </div>
              ))}
          </div>
        </section>

        <section className={`${styles.testimonialSection} ${styles.fadeIn}`}>
          <h2 className={styles.sectionTitle}>What Our Customers Say</h2>
          <div className={styles.testimonialGrid}>
            <blockquote className={styles.testimonialCard}>
              “The lemons were incredibly fresh and juicy. Delivery was quick too!” – Priya S.
            </blockquote>
            <blockquote className={styles.testimonialCard}>
              “Best prices and reliable service. I’m ordering again!” – Rohit K.
            </blockquote>
            <blockquote className={styles.testimonialCard}>
              “I appreciated the bulk discount. Great for my restaurant.” – Neha D.
            </blockquote>
          </div>
        </section>

        <section id="buy-now" className={`${styles.formSection} ${styles.fadeIn}`}>
          <h2 className={styles.sectionTitle}>Buy Now</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGrid}>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your Name"
                required
                className={styles.input}
              />
              <input
                type="text"
                name="contact"
                value={form.contact}
                onChange={handleChange}
                placeholder="10-digit Mobile Number"
                maxLength={10}
                required
                className={styles.input}
              />
              <select
                name="quality"
                value={form.quality}
                onChange={handleChange}
                className={styles.input}
                required
              >
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="A3">A3</option>
              </select>
              <input
                type="text"
                name="delivery"
                value={form.delivery}
                onChange={handleChange}
                placeholder="Delivery Address"
                required
                className={`${styles.input} ${styles.inputFull}`}
              />
              <input
                type="number"
                min={1}
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="Quantity (kg)"
                required
                className={styles.input}
              />
            </div>

            <p className={styles.total}>
              Total Price: ₹{totalPrice.toFixed(2)}{' '}
              {isBulk && <span className={styles.discountNote}>(10% bulk discount applied)</span>}
            </p>

            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Ordering..." : "Place Order"}
              </button>

              <a
                href={getWhatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappButton}
                aria-label="Place Order on WhatsApp"
              >
                <svg
                  className={styles.icon}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.52 3.48a11.83 11.83 0 00-18.2 15.74l-1.5 5.5 5.67-1.49a11.82 11.82 0 0014.03-19.75zm-8.3 15.07a7.51 7.51 0 01-4.17-1.2l-.3-.18-2.47.65.66-2.4-.19-.3a7.53 7.53 0 0111.22-9.9 7.44 7.44 0 01-4.52 13.33z" />
                  <path d="M16.3 14.07c-.24-.12-1.42-.7-1.64-.77s-.38-.12-.54.12-.62.77-.75.93-.28.18-.52.06a6.6 6.6 0 01-1.94-1.2 7.33 7.33 0 01-1.37-1.7c-.15-.25 0-.38.11-.5l.13-.15c.05-.06.07-.12.11-.18a.4.4 0 000-.37c-.13-.25-.54-1.3-.74-1.8s-.39-.42-.54-.42-.4 0-.61 0a.97.97 0 00-.7.33 2.89 2.89 0 00-1 1.24 3.44 3.44 0 001.37 4.48 8.68 8.68 0 001.72 1.2 7.55 7.55 0 003.41 1.15 3.66 3.66 0 002.32-.77 2.3 2.3 0 00.7-1.68c.01-.13 0-.25-.17-.36z" />
                </svg>
                Place Order on WhatsApp
              </a>
            </div>
          </form>
        </section>
      </main>

      <footer className={styles.footer}>
        <div>
          <p>© 2025 3 Lemons Traders</p>
          <p>Contact: Pradeep Mamuduru</p>
          <p>
            <a
              href="https://instagram.com/3Lemons_Traders"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
              aria-label="Instagram"
            >
              <svg
                className={styles.iconSmall}
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 2A3.75 3.75 0 004 7.75v8.5A3.75 3.75 0 007.75 20h8.5A3.75 3.75 0 0020 16.25v-8.5A3.75 3.75 0 0016.25 4h-8.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6zm4.5-1.25a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z" />
              </svg>
              @3Lemons_Traders
            </a>{' '}
            |{' '}
            <a
              href="https://3lemons.in"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
              aria-label="Website"
            >
              <svg
                className={styles.iconSmall}
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a7.94 7.94 0 01-3.34-.7l8.64-8.63A7.94 7.94 0 0112 20zm6.12-2.3L9.48 16.5l6.48-6.48A7.96 7.96 0 0118.12 17.7zM4.25 12a7.96 7.96 0 012.78-5.99l8.55 8.55-2.78 2.78-8.55-8.55z" />
              </svg>
              3lemons.in
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
