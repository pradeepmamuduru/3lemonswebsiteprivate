import { useState } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import styles from '../styles/styles.module.css';

export async function getStaticProps() {
  const res = await fetch("https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Lemons");
  const lemons = await res.json();
  return { props: { lemons }, revalidate: 3600 };
}

export default function Home({ lemons }) {
  const [form, setForm] = useState({
    name: '',
    contact: '',
    delivery: '',
    items: lemons.map(lemon => ({ grade: lemon['Grade'], quantity: '' })),
  });
  const [orderStatus, setOrderStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const priceMap = lemons.reduce((map, lemon) => {
    map[lemon['Grade']] = parseInt(lemon['Price Per Kg'], 10);
    return map;
  }, {});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contact' && (!/^\d*$/.test(value) || value.length > 10)) return;
    setForm({ ...form, [name]: value });
  };

  const handleItemChange = (index, value) => {
    const newItems = [...form.items];
    if (!/^\d*$/.test(value)) return;
    newItems[index].quantity = value;
    setForm({ ...form, items: newItems });
  };

  const totalPrice = form.items.reduce((sum, item) => {
    const qty = parseInt(item.quantity, 10) || 0;
    const price = priceMap[item.grade] || 0;
    return sum + qty * price;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setOrderStatus('Submitting...');

    if (!/^\d{10}$/.test(form.contact)) {
      setOrderStatus('Please enter a valid 10-digit mobile number.');
      setIsSubmitting(false);
      return;
    }

    const orderData = {
      name: form.name,
      contact: `+91${form.contact}`,
      delivery: form.delivery,
      items: form.items.filter(item => parseInt(item.quantity, 10) > 0),
    };

    if (orderData.items.length === 0) {
      setOrderStatus('Please enter quantity for at least one grade.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(
        'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: orderData }),
        }
      );
      if (response.ok) {
        setOrderStatus('Order submitted successfully!');
        setForm({
          name: '',
          contact: '',
          delivery: '',
          items: lemons.map(lemon => ({ grade: lemon['Grade'], quantity: '' })),
        });
      } else {
        setOrderStatus('Failed to submit order.');
      }
    } catch {
      setOrderStatus('Network error. Try again.');
    }
    setIsSubmitting(false);
  };

  const getWhatsappLink = () => {
    const message = `Hi! I'd like to place an order:
👤 Name: ${form.name}
📞 Contact: +91${form.contact}
🏠 Address: ${form.delivery}
🛒 Items:
${form.items.filter(i => parseInt(i.quantity, 10) > 0).map(i => `- ${i.grade}: ${i.quantity}kg`).join('\n')}
Total: ₹${totalPrice}`;
    return `https://wa.me/918500130926?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>3 Lemons Traders – Buy Fresh Lemons Online</title>
        <meta name="description" content="Farm fresh lemons at best prices. Buy online from 3 Lemons Traders." />
        <meta property="og:image" content="/lemons-hero.jpg" />
        <link rel="canonical" href="https://3lemons.in" />
      </Head>

      <main className={styles.container}>
        <section className={styles.hero}>
          <img src="/lemons-hero.jpg" className={styles.heroImage} alt="Lemons" />
          <div className={styles.heroOverlay}>
            <h1>3 Lemons Traders</h1>
            <p>Buy farm-direct, fresh lemons across India</p>
            <a href="#order" className={styles.heroButton}>Order Now</a>
          </div>
        </section>

        <section className={styles.lemonsSection}>
          <h2>Our Lemons</h2>
          <div className={styles.lemonsGrid}>
            {lemons.map((lemon, i) => (
              <div className={styles.lemonCard} key={i}>
                <Image src={lemon['Image url']} alt={lemon['Grade']} width={300} height={200} />
                <h3>{lemon['Grade']} – ₹{lemon['Price Per Kg']}/kg</h3>
                <p>{lemon['Description']}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="order" className={styles.formSection}>
          <h2>Place Your Order</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <input type="text" name="name" value={form.name} onChange={handleInputChange} placeholder="Your Name" required />
            <input type="text" name="contact" value={form.contact} onChange={handleInputChange} placeholder="10-digit Mobile Number" maxLength={10} required />
            <input type="text" name="delivery" value={form.delivery} onChange={handleInputChange} placeholder="Delivery Address" required />

            {form.items.map((item, i) => (
              <div key={i} className={styles.itemRow}>
                <label>{item.grade}</label>
                <input type="number" min={0} value={item.quantity} onChange={(e) => handleItemChange(i, e.target.value)} placeholder="Quantity (kg)" />
              </div>
            ))}

            <p className={styles.total}>Total Price: ₹{totalPrice}</p>

            <div className={styles.buttonRow}>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Ordering...' : 'Place Order on Website'}
              </button>
              <a href={getWhatsappLink()} target="_blank" rel="noopener noreferrer" className={styles.whatsapp}>
                🟢 Place Order on WhatsApp
              </a>
            </div>
            {orderStatus && <p className={styles.status}>{orderStatus}</p>}
          </form>
        </section>

        <footer className={styles.footer}>
          <p>👨‍🌾 Pradeep Mamuduru</p>
          <p>📷 <a href="https://instagram.com/3Lemons_Traders" target="_blank">@3Lemons_Traders</a></p>
          <p>🌐 <a href="https://3lemons.in" target="_blank">3lemons.in</a></p>
        </footer>
      </main>
    </div>
  );
}
