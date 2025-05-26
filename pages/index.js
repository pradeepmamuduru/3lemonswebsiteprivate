import { useState, useEffect } from 'react';
import styles from '../styles/styles.module.css';

export default function Home() {
  const [lemons, setLemons] = useState([]);
  const [orders, setOrders] = useState([{ grade: '', quantity: 1 }]);
  const [form, setForm] = useState({ name: '', delivery: '', contact: '' });
  const [total, setTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('https://sheetdb.io/api/v1/wm0oxtmmfkndt')
      .then(res => res.json())
      .then(data => setLemons(data));
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [orders]);

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
        totalPrice += parseInt(lemon['Price Per Kg']) * order.quantity;
      }
    });
    setTotal(totalPrice);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const rows = orders.map(order => ({
      name: form.name,
      quantity: order.quantity,
      quality: order.grade,
      delivery: form.delivery,
      contact: form.contact,
      discount: '0%',
    }));

    try {
      await fetch('https://sheetdb.io/api/v1/wm0oxtmmfkndt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      });
      alert('Order submitted successfully!');
      setOrders([{ grade: '', quantity: 1 }]);
      setForm({ name: '', delivery: '', contact: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to submit order.');
    }

    setIsSubmitting(false);
  };

  const getWhatsappLink = () => {
    const msg = orders
      .map(order => `${order.quantity} kg of ${order.grade}`)
      .join(', ');
    return `https://wa.me/91${form.contact}?text=Hi, I'm ${form.name}. I want to order: ${msg}. Delivery: ${form.delivery}. Total: ₹${total}`;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🍋 3 Lemons Traders</h1>
      <form onSubmit={handleSubmit}>
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
              min="0"
              className={styles.input}
              value={order.quantity}
              onChange={(e) => handleOrderChange(index, 'quantity', e.target.value)}
            />
          </div>
        ))}

        <button type="button" onClick={handleAddVariety} className={styles.button}>
          ➕ Add Another Variety
        </button>

        <div className={styles.orderSummary}>
          <h3>Total: ₹{total}</h3>
        </div>

        <button type="submit" disabled={isSubmitting} className={styles.button}>
          {isSubmitting ? 'Ordering...' : '🛒 Place Order on Website'}
        </button>

        <a
          href={getWhatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.button}
        >
          🟢 Place Order on WhatsApp
        </a>
      </form>

      <div className={styles.footer}>
        <p>Pradeep Mamuduru</p>
        <p>
          📸 <a href="https://www.instagram.com/3Lemons_Traders" target="_blank" rel="noopener noreferrer">3Lemons_Traders</a> | 🌐 <a href="https://3lemons.vercel.app">3lemons.vercel.app</a>
        </p>
      </div>
    </div>
  );
}
