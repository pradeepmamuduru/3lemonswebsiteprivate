import { useState, useEffect } from 'react';
import styles from '../styles/styles.module.css';

export default function Home() {
  const [lemons, setLemons] = useState([]);
  const [orders, setOrders] = useState([{ grade: '', quantity: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [total, setTotal] = useState(0);

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

  const handleAddVariety = () => {
    setOrders([...orders, { grade: '', quantity: 1 }]);
  };

  const getWhatsappLink = () => {
    const msg = orders
      .map(order => `${order.quantity} kg of ${order.grade}`)
      .join(', ');
    return `https://wa.me/919966886685?text=I want to order: ${msg} - Total: ₹${total}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = {
      orders: orders.map(o => `${o.quantity} kg of ${o.grade}`).join(', '),
      total,
    };

    try {
      await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      alert('Order placed successfully!');
      setOrders([{ grade: '', quantity: 1 }]);
    } catch (error) {
      console.error('Order failed', error);
      alert('Failed to place order.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <h1>🍋 3 Lemons Traders</h1>

      <form onSubmit={handleSubmit}>
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
        <a href={getWhatsappLink()} target="_blank" rel="noopener noreferrer" className={styles.button}>
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
