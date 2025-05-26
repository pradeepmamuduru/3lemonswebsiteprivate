import { useState, useEffect, Fragment } from 'react'; // Import Fragment
import Head from 'next/head';
import Image from 'next/image';
import { FaWhatsapp, FaStar } from 'react-icons/fa';
import { IoCloseCircleOutline } from 'react-icons/io5'; // New icon for close button
import styles from '../styles/styles.module.css';

// --- getStaticProps: Fetches Lemon Product Data ---
export async function getStaticProps() {
  try {
    const res = await fetch("https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Lemons"); // *** IMPORTANT: Verify your SheetDB sheet name for lemons here ***
    if (!res.ok) {
      throw new Error(`Failed to fetch lemons: ${res.status} ${res.statusText}`);
    }
    const lemons = await res.json();

    if (!Array.isArray(lemons)) {
        console.error("Fetched lemons data is not an array:", lemons);
        return { props: { lemons: [] }, revalidate: 3600 };
    }

    return {
      props: { lemons },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Error in getStaticProps:", error);
    return { props: { lemons: [] }, revalidate: 3600 };
  }
}

// --- Home Component ---
export default function Home({ lemons }) {
  const [orders, setOrders] = useState([{ grade: '', quantity: '' }]);
  const [form, setForm] = useState({ name: '', delivery: '', contact: '' });
  const [total, setTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');

  // New states for modal visibility
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // State to store order details for confirmation modal
  const [confirmedOrderDetails, setConfirmedOrderDetails] = useState(null);

  const ORDERS_SUBMISSION_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=orders'; 

  const customerReviews = [
    { id: 1, text: "The lemons from 3 Lemons Traders are incredibly fresh and juicy! Perfect for my restaurant.", name: "Chef Rahul S.", rating: 5, },
    { id: 2, text: "Excellent quality and timely delivery. Their A1 grade lemons are truly the best.", name: "Priya M.", rating: 5, },
    { id: 3, text: "Great prices for bulk orders. The team is very responsive and helpful.", name: "Kiran R.", rating: 4, },
    { id: 4, text: "Consistently good quality. My go-to for all lemon needs.", name: "Amit P.", rating: 5, },
    { id: 5, text: "Freshness guaranteed every time. Highly recommend!", name: "Sunita D.", rating: 5, },
  ];

  useEffect(() => {
    calculateTotal();
  }, [orders, lemons]);

  const handleOrderChange = (index, field, value) => {
    const updated = [...orders];
    if (field === 'quantity') {
      value = value === '' ? '' : String(Math.max(1, parseInt(value) || 1));
    }
    updated[index][field] = value;
    setOrders(updated);
  };

  const handleAddVariety = () => {
    setOrders([...orders, { grade: '', quantity: '' }]);
  };

  const calculateTotal = () => {
    let totalPrice = 0;
    orders.forEach(order => {
      const lemon = lemons.find(l => l.Grade === order.grade);
      if (lemon) {
        const pricePerKg = parseFloat(lemon['Price Per Kg']);
        const quantity = parseInt(order.quantity);

        if (!isNaN(pricePerKg) && !isNaN(quantity) && quantity > 0) {
          let itemPrice = pricePerKg * quantity;
          if (quantity > 50) {
            itemPrice *= 0.90;
          }
          totalPrice += itemPrice;
        }
      }
    });
    setTotal(totalPrice);
  };

  // --- NEW: Function to prepare data and show confirmation modal ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionMessage(''); // Clear any previous messages

    // --- Client-Side Form Validation (Same as before) ---
    if (!form.name.trim() || !form.delivery.trim() || !form.contact.trim()) {
      setSubmissionMessage('Please fill in all your personal details (Name, Delivery Address, Contact).');
      return;
    }
    if (!/^\d{10}$/.test(form.contact)) {
        setSubmissionMessage('Please enter a valid 10-digit contact number.');
        return;
    }

    const validOrders = orders.filter(order => order.grade && order.quantity && parseInt(order.quantity) > 0);
    if (validOrders.length === 0) {
      setSubmissionMessage('Please add at least one lemon variety with a valid quantity (must be 1 or more).');
      return;
    }
    const hasInvalidQuantity = orders.some(order => {
        return (order.grade && (order.quantity === '' || isNaN(parseInt(order.quantity)) || parseInt(order.quantity) <= 0));
    });
    if (hasInvalidQuantity) {
        setSubmissionMessage('Please ensure all selected varieties have a valid quantity (1 or more).');
        return;
    }
    // --- End Validation ---

    // Prepare data for the confirmation modal
    const preparedOrderRows = validOrders.map(order => {
        const lemon = lemons.find(l => l.Grade === order.grade);
        const pricePerKg = parseFloat(lemon?.['Price Per Kg'] || 0);
        const quantity = parseInt(order.quantity);
        let itemCalculatedPrice = pricePerKg * quantity;
        const discountApplied = quantity > 50 ? '10%' : '0%';
        
        if (quantity > 50) {
            itemCalculatedPrice *= 0.90; 
        }
        
        return {
            grade: order.grade,
            quantity: quantity,
            pricePerKg: pricePerKg.toFixed(2),
            itemTotalPrice: itemCalculatedPrice.toFixed(2),
            discount: discountApplied,
        };
    });

    setConfirmedOrderDetails({
        personal: form,
        items: preparedOrderRows,
        total: total.toFixed(2),
    });
    setShowConfirmModal(true); // Show the confirmation modal
  };

  // --- NEW: Function to actually submit the order after confirmation ---
  const confirmAndSubmitOrder = async () => {
    setShowConfirmModal(false); // Close the confirmation modal immediately
    setIsSubmitting(true);
    setSubmissionMessage('');

    if (!confirmedOrderDetails) { // Should not happen if flow is correct
        setSubmissionMessage('Error: No order details to confirm.');
        setIsSubmitting(false);
        return;
    }

    const { personal, items } = confirmedOrderDetails;

    // Map confirmed items to the format required by SheetDB
    const rows = items.map(item => ({
        name: personal.name,
        quantity: item.quantity,
        quality: item.grade,
        'Price Per Kg': item.pricePerKg,
        'Item Total Price': item.itemTotalPrice,
        delivery: personal.delivery,
        contact: personal.contact,
        discount: item.discount,
        'Order Date': new Date().toLocaleString(),
    }));

    try {
      const response = await fetch(ORDERS_SUBMISSION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      });

      if (response.ok) {
        // Successfully submitted, show success modal
        setShowSuccessModal(true);
        // Reset form and orders on main page
        setOrders([{ grade: '', quantity: '' }]);
        setForm({ name: '', delivery: '', contact: '' });
        setTotal(0);
        setConfirmedOrderDetails(null); // Clear confirmed details
      } else {
        const errorData = await response.json();
        console.error('SheetDB submission error:', response.status, errorData);
        setSubmissionMessage(`Failed to submit order: ${errorData.message || 'Server error'}. Please try again.`);
      }
    } catch (err) {
      console.error('Network or submission error:', err);
      setSubmissionMessage('Failed to submit order. Please check your internet connection and try again.');
    }

    setIsSubmitting(false);
  };

  // --- NEW: Function to close the success modal and return to main page ---
  const closeSuccessModal = () => {
      setShowSuccessModal(false);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top
  };

  // --- NEW: Function to cancel confirmation and go back to form ---
  const cancelConfirmation = () => {
      setShowConfirmModal(false);
      setConfirmedOrderDetails(null); // Clear details
      // You can keep previous submission message or clear it
  };

  const getWhatsappLink = () => {
    const validOrders = orders.filter(order => order.grade && order.quantity && parseInt(order.quantity) > 0);
    if (validOrders.length === 0 || !form.contact || !/^\d{10}$/.test(form.contact)) {
        return '#';
    }

    const orderDetails = validOrders.map(order => {
        const lemon = lemons.find(l => l.Grade === order.grade);
        const quantity = parseInt(order.quantity);
        const pricePerKg = parseFloat(lemon?.['Price Per Kg'] || 0);
        let itemPrice = pricePerKg * quantity;
        let discountMsg = '';
        if (quantity > 50) {
            itemPrice *= 0.90;
            discountMsg = ` (10% bulk discount applied)`;
        }
        return `${quantity} kg of ${order.grade} (Approx. ₹${itemPrice.toFixed(2)})${discountMsg}`;
    }).join(', ');

    const whatsappContact = `91${form.contact}`;
    const whatsappMessage = `Hi, I'm ${form.name}.\n\nI want to order: ${orderDetails}.\n\nDelivery Address: ${form.delivery}.\nContact: ${form.contact}\n\nTotal estimated price: ₹${total.toFixed(2)}\n\nPlease confirm availability and final amount.`;
    
    return `https://wa.me/${whatsappContact}?text=${encodeURIComponent(whatsappMessage)}`;
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>3 Lemons Traders – Buy Fresh Lemons Online</title>
        <meta name="description" content="Buy premium quality lemons at affordable prices across India. Direct farm to home delivery. Discounts on bulk orders!" />
        <meta property="og:title" content="Buy Fresh Lemons Online – 3 Lemons Traders" />
        <meta property="og:description" content="Get premium lemons delivered to your door at unbeatable prices. Farm fresh quality. Offering discounts on bulk purchases!" />
        <meta property="og:image" content="/lemons-hero.jpg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://3lemons.in" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <main className={styles.container}>
        {/* --- Hero Section --- */}
        <section className={styles.hero}>
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

        {/* --- Lemons Products Section --- */}
        <section className={styles.lemonsSection}>
          <h2 className={styles.sectionTitle}>Our Lemons</h2>
          <div className={styles.lemonsGrid}>
            {Array.isArray(lemons) && lemons.length > 0 ? (
              lemons.map((lemon, index) => (
                <div key={index} className={styles.lemonCard}>
                  {lemon['Image url'] && (
                    <Image
                      src={lemon['Image url']}
                      alt={lemon['Grade'] || 'Lemon'}
                      width={300}
                      height={200}
                      loading="lazy"
                      className={styles.cardImage}
                    />
                  )}
                  <p className={styles.cardTitle}>
                    {lemon['Grade']} – ₹{parseFloat(lemon['Price Per Kg']).toFixed(2)}/kg
                  </p>
                  <p className={styles.cardDescription}>{lemon['Description']}</p>
                </div>
              ))
            ) : (
              <p style={{textAlign: 'center', width: '100%', gridColumn: '1 / -1'}}>
                Loading lemons or no lemon data available. Please check your internet connection or SheetDB setup.
              </p>
            )}
          </div>
        </section>

        {/* --- Order Form Section --- */}
        <section id="buy-now" className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Place Your Order</h2>
          {submissionMessage && (
            <p className={styles.statusMessage} style={{ color: submissionMessage.includes('successfully') ? 'green' : 'red' }}>
              {submissionMessage}
            </p>
          )}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Personal Details Inputs */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="name">Your Name</label>
              <input
                id="name"
                className={styles.input}
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="delivery">Delivery Address</label>
              <input
                id="delivery"
                className={styles.input}
                required
                value={form.delivery}
                onChange={(e) => setForm({ ...form, delivery: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="contact">Contact Number</label>
              <input
                id="contact"
                type="tel"
                className={styles.input}
                required
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                maxLength={10}
                pattern="[0-9]{10}"
                title="Please enter a 10-digit mobile number"
                placeholder="e.g., 9876543210"
              />
            </div>

            {/* Dynamic Order Varieties Inputs */}
            {orders.map((order, index) => (
              <div className={styles.formGroup} key={index}>
                <label className={styles.label} htmlFor={`grade-${index}`}>Select Grade</label>
                <select
                  id={`grade-${index}`}
                  className={styles.select}
                  value={order.grade}
                  onChange={(e) => handleOrderChange(index, 'grade', e.target.value)}
                  required
                >
                  <option value="">-- Select --</option>
                  {lemons.map((lemon, idx) => (
                    <option key={idx} value={lemon.Grade}>
                      {lemon.Grade} – ₹{parseFloat(lemon['Price Per Kg']).toFixed(2)}/kg
                    </option>
                  ))}
                </select>

                <label className={styles.label} htmlFor={`quantity-${index}`}>Quantity (kg)</label>
                <input
                  id={`quantity-${index}`}
                  type="number"
                  min="1"
                  className={styles.input}
                  value={order.quantity}
                  onChange={(e) => handleOrderChange(index, 'quantity', e.target.value)}
                  placeholder="e.g., 10"
                  required
                />
                 {parseInt(order.quantity) > 50 && (
                    <span className={styles.discountNote}> (10% bulk discount)</span>
                )}
              </div>
            ))}

            <button type="button" onClick={handleAddVariety} className={styles.button}>
              ➕ Add Another Variety
            </button>

            <div className={styles.orderSummary}>
              <h3>Total: ₹{total.toFixed(2)}</h3>
            </div>

            <div className={styles.actions}>
                <button type="submit" disabled={isSubmitting} className={styles.button}>
                {isSubmitting ? 'Checking Order...' : '🛒 Place Order on Website'}
                </button>

                <a
                href={getWhatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.button} ${styles.whatsappButton}`}
                style={{ pointerEvents: (!form.contact || orders.filter(o => o.grade && o.quantity && parseInt(o.quantity) > 0).length === 0) ? 'none' : 'auto', opacity: (!form.contact || orders.filter(o => o.grade && o.quantity && parseInt(o.quantity) > 0).length === 0) ? 0.6 : 1 }}
                >
                <FaWhatsapp className={styles.whatsappIcon} /> Place Order on WhatsApp
                </a>
            </div>
          </form>
        </section>

        {/* --- Customer Reviews Section --- */}
        <section className={styles.reviewsSection}>
          <h2 className={styles.sectionTitle}>What Our Customers Say</h2>
          <div className={styles.reviewsGrid}>
            {customerReviews.map(review => (
              <div key={review.id} className={styles.reviewCard}>
                <div className={styles.reviewerRating}>
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <FaStar key={i} />
                  ))}
                  {Array.from({ length: 5 - review.rating }).map((_, i) => (
                    <FaStar key={i + review.rating} style={{ opacity: 0.3 }} />
                  ))}
                </div>
                <p className={styles.reviewText}>"{review.text}"</p>
                <p className={styles.reviewerName}>- {review.name}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* --- Footer Section --- */}
      <div className={styles.footer}>
        <p>Developed by Pradeep Mamuduru</p>
        <p>
          📸 <a href="https://www.instagram.com/3Lemons_Traders" target="_blank" rel="noopener noreferrer">3Lemons_Traders</a> | 🌐 <a href="https://3lemons.vercel.app">3lemons.vercel.app</a>
        </p>
        <p>&copy; {new Date().getFullYear()} 3 Lemons Traders. All rights reserved.</p>
      </div>

      {/* --- Order Confirmation Modal --- */}
      {showConfirmModal && confirmedOrderDetails && (
        <div className={`${styles.modalOverlay} ${showConfirmModal ? styles.visible : ''}`}>
          <div className={styles.modalContent}>
            <button className={styles.modalCloseButton} onClick={cancelConfirmation}>
                <IoCloseCircleOutline />
            </button>
            <h2 className={styles.modalTitle}>Confirm Your Order</h2>
            <div className={styles.modalText}>
              <p>Please review your order details before proceeding:</p>
              <p><strong>Name:</strong> {confirmedOrderDetails.personal.name}</p>
              <p><strong>Contact:</strong> {confirmedOrderDetails.personal.contact}</p>
              <p><strong>Delivery Address:</strong> {confirmedOrderDetails.personal.delivery}</p>
              <p><strong>Order Items:</strong></p>
              <ul>
                {confirmedOrderDetails.items.map((item, index) => (
                  <li key={index}>
                    {item.quantity} kg of {item.grade} (₹{item.itemTotalPrice})
                    {item.discount === '10%' && <span className={styles.discountNote}> ({item.discount} discount applied)</span>}
                  </li>
                ))}
              </ul>
              <p><strong>Total Payable: ₹{confirmedOrderDetails.total}</strong></p>
            </div>
            <div className={styles.modalButtons}>
              <button className={styles.modalButton} onClick={confirmAndSubmitOrder} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Proceed'}
              </button>
              <button className={`${styles.modalButton} ${styles.cancel}`} onClick={cancelConfirmation}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Order Submitted Successfully Modal/Page --- */}
      {showSuccessModal && (
        <div className={`${styles.modalOverlay} ${showSuccessModal ? styles.visible : ''}`}>
            <div className={`${styles.modalContent} ${styles.successPage}`}>
                <button className={styles.modalCloseButton} onClick={closeSuccessModal}>
                    <IoCloseCircleOutline />
                </button>
                <h2 className={styles.successTitle}>Order Submitted Successfully!</h2>
                <p className={styles.successMessage}>
                    Thank you for your order. We have received your details and will contact you shortly to confirm.
                </p>
                <button className={styles.modalButton} onClick={closeSuccessModal}>
                    Close
                </button>
            </div>
        </div>
      )}
    </div>
  );
}
