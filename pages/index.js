import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { FaWhatsapp, FaStar } from 'react-icons/fa'; // Import both icons
import styles from '../styles/styles.module.css';

// --- getStaticProps: Fetches Lemon Product Data ---
// This function runs at build time (or revalidates) to fetch static data.
export async function getStaticProps() {
  try {
    const res = await fetch("https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Lemons"); // *** IMPORTANT: Verify your SheetDB sheet name for lemons here ***
    if (!res.ok) {
      throw new Error(`Failed to fetch lemons: ${res.status} ${res.statusText}`);
    }
    const lemons = await res.json();

    // Ensure fetched data is an array to prevent errors during mapping
    if (!Array.isArray(lemons)) {
        console.error("Fetched lemons data is not an array:", lemons);
        return { props: { lemons: [] }, revalidate: 3600 }; // Return empty array on malformed data
    }

    return {
      props: { lemons }, // Pass fetched lemons data as a prop to the Home component
      revalidate: 3600, // Revalidate data on the server every 3600 seconds (1 hour)
    };
  } catch (error) {
    console.error("Error in getStaticProps:", error);
    return { props: { lemons: [] }, revalidate: 3600 }; // Return empty array on any fetch error
  }
}

// --- Home Component ---
export default function Home({ lemons }) {
  // State for managing multiple order items (grade and quantity for each)
  const [orders, setOrders] = useState([{ grade: '', quantity: '' }]); // Initialize quantity as empty string for validation
  // State for personal contact form details
  const [form, setForm] = useState({ name: '', delivery: '', contact: '' });
  // State for the calculated total price
  const [total, setTotal] = useState(0);
  // State to manage submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State to display feedback messages to the user
  const [submissionMessage, setSubmissionMessage] = useState('');

  // SheetDB URL for submitting orders. *** IMPORTANT: Verify your SheetDB sheet name for orders here ***
  const ORDERS_SUBMISSION_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=orders'; 

  // Hardcoded customer reviews for the reviews section.
  // In a real application, you might fetch these dynamically from a backend/database.
  const customerReviews = [
    {
      id: 1,
      text: "The lemons from 3 Lemons Traders are incredibly fresh and juicy! Perfect for my restaurant.",
      name: "Chef Rahul S.",
      rating: 5,
    },
    {
      id: 2,
      text: "Excellent quality and timely delivery. Their A1 grade lemons are truly the best.",
      name: "Priya M.",
      rating: 5,
    },
    {
      id: 3,
      text: "Great prices for bulk orders. The team is very responsive and helpful.",
      name: "Kiran R.",
      rating: 4,
    },
     {
      id: 4,
      text: "Consistently good quality. My go-to for all lemon needs.",
      name: "Amit P.",
      rating: 5,
    },
     {
      id: 5,
      text: "Freshness guaranteed every time. Highly recommend!",
      name: "Sunita D.",
      rating: 5,
    },
  ];


  // Effect to recalculate total whenever 'orders' or 'lemons' data changes
  useEffect(() => {
    calculateTotal();
  }, [orders, lemons]);

  // Handler for changes in individual order items (grade or quantity)
  const handleOrderChange = (index, field, value) => {
    const updated = [...orders];
    if (field === 'quantity') {
      // Allow empty string to trigger HTML5 'required' validation visually
      // For calculation, parse to integer, ensuring a minimum of 1 if a number is entered
      value = value === '' ? '' : String(Math.max(1, parseInt(value) || 1)); // Convert back to string for input value
    }
    updated[index][field] = value;
    setOrders(updated);
  };

  // Handler to add a new empty variety row to the order
  const handleAddVariety = () => {
    setOrders([...orders, { grade: '', quantity: '' }]); // New item also starts with empty quantity
  };

  // Function to calculate the total price based on all order items and apply discounts
  const calculateTotal = () => {
    let totalPrice = 0;
    orders.forEach(order => {
      const lemon = lemons.find(l => l.Grade === order.grade); // Find matching lemon data
      if (lemon) { // Ensure lemon data is found
        const pricePerKg = parseFloat(lemon['Price Per Kg']); // Parse price, allows decimals
        const quantity = parseInt(order.quantity); // Parse quantity to integer

        // Only calculate if both price and quantity are valid numbers and quantity is positive
        if (!isNaN(pricePerKg) && !isNaN(quantity) && quantity > 0) {
          let itemPrice = pricePerKg * quantity;
          // Apply 10% discount if quantity for this specific item is over 50kg
          if (quantity > 50) {
            itemPrice *= 0.90; // 10% discount
          }
          totalPrice += itemPrice;
        }
      }
    });
    setTotal(totalPrice);
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior (page reload)
    setIsSubmitting(true); // Set submitting state to true
    setSubmissionMessage(''); // Clear any previous messages

    // --- Client-Side Form Validation ---
    // Validate personal details
    if (!form.name.trim() || !form.delivery.trim() || !form.contact.trim()) {
      setSubmissionMessage('Please fill in all your personal details (Name, Delivery Address, Contact).');
      setIsSubmitting(false);
      return;
    }
    // Validate 10-digit contact number
    if (!/^\d{10}$/.test(form.contact)) {
        setSubmissionMessage('Please enter a valid 10-digit contact number.');
        setIsSubmitting(false);
        return;
    }

    // Filter out invalid/empty order lines for submission
    const validOrders = orders.filter(order => order.grade && order.quantity && parseInt(order.quantity) > 0);
    
    // Check if at least one valid order item exists
    if (validOrders.length === 0) {
      setSubmissionMessage('Please add at least one lemon variety with a valid quantity (must be 1 or more).');
      setIsSubmitting(false);
      return;
    }

    // Check if any selected variety has an empty or invalid quantity
    const hasInvalidQuantity = orders.some(order => {
        // If a grade is selected but quantity is empty, not a number, or zero/negative
        return (order.grade && (order.quantity === '' || isNaN(parseInt(order.quantity)) || parseInt(order.quantity) <= 0));
    });

    if (hasInvalidQuantity) {
        setSubmissionMessage('Please ensure all selected varieties have a valid quantity (1 or more).');
        setIsSubmitting(false);
        return;
    }
    // --- End Client-Side Form Validation ---
    
    // Map valid order items to the structure required by SheetDB
    const rows = validOrders.map(order => {
        const lemon = lemons.find(l => l.Grade === order.grade);
        const pricePerKg = parseFloat(lemon?.['Price Per Kg'] || 0); // Get price, default to 0 if not found
        const quantity = parseInt(order.quantity);
        let itemCalculatedPrice = pricePerKg * quantity;
        const discountApplied = quantity > 50 ? '10%' : '0%';
        
        // Apply discount to this specific item's price for the sheet
        if (quantity > 50) {
            itemCalculatedPrice *= 0.90; 
        }
        
        return {
            name: form.name,
            quantity: quantity,
            quality: order.grade,
            'Price Per Kg': pricePerKg.toFixed(2), // Include original price per kg
            'Item Total Price': itemCalculatedPrice.toFixed(2), // Total for this specific line item
            delivery: form.delivery,
            contact: form.contact,
            discount: discountApplied,
            'Order Date': new Date().toLocaleString(), // Add timestamp for when the order was placed
            // You can add more fields here if your SheetDB has more columns
        };
    });

    // Send data to SheetDB
    try {
      const response = await fetch(ORDERS_SUBMISSION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }), // Send the array of rows to SheetDB
      });

      if (response.ok) {
        setSubmissionMessage('Order submitted successfully!');
        setOrders([{ grade: '', quantity: '' }]); // Reset order items
        setForm({ name: '', delivery: '', contact: '' }); // Reset personal details
        setTotal(0); // Reset total price
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top for success message visibility
      } else {
        const errorData = await response.json(); // Attempt to read specific error from SheetDB
        console.error('SheetDB submission error:', response.status, errorData);
        setSubmissionMessage(`Failed to submit order: ${errorData.message || 'Server error'}. Please try again.`);
      }
    } catch (err) {
      console.error('Network or submission error:', err);
      setSubmissionMessage('Failed to submit order. Please check your internet connection and try again.');
    }

    setIsSubmitting(false); // Reset submitting state
  };

  // Function to generate the WhatsApp deep link message
  const getWhatsappLink = () => {
    // Filter to ensure only valid order items are included in the message
    const validOrders = orders.filter(order => order.grade && order.quantity && parseInt(order.quantity) > 0);
    
    // Prevent creating a link if contact is missing or invalid, or no valid orders
    if (validOrders.length === 0 || !form.contact || !/^\d{10}$/.test(form.contact)) {
        return '#'; // Return a non-functional link if conditions aren't met
    }

    // Format each order item with its calculated price and discount note
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
    }).join(', '); // Join multiple items with a comma and space

    const whatsappContact = `91${form.contact}`; // Prefix with country code for India
      
    // Construct the full WhatsApp message
    const whatsappMessage = `Hi, I'm ${form.name}.\n\nI want to order: ${orderDetails}.\n\nDelivery Address: ${form.delivery}.\nContact: ${form.contact}\n\nTotal estimated price: ₹${total.toFixed(2)}\n\nPlease confirm availability and final amount.`;
    
    return `https://wa.me/${whatsappContact}?text=${encodeURIComponent(whatsappMessage)}`;
  };

  return (
    <div className={styles.page}>
      {/* Head section for SEO and metadata */}
      <Head>
        <title>3 Lemons Traders – Buy Fresh Lemons Online</title>
        <meta name="description" content="Buy premium quality lemons at affordable prices across India. Direct farm to home delivery. Discounts on bulk orders!" />
        <meta property="og:title" content="Buy Fresh Lemons Online – 3 Lemons Traders" />
        <meta property="og:description" content="Get premium lemons delivered to your door at unbeatable prices. Farm fresh quality. Offering discounts on bulk purchases!" />
        <meta property="og:image" content="/lemons-hero.jpg" /> {/* Ensure this image exists in your public folder */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://3lemons.in" /> {/* Update this if your main domain changes */}
        {/* Link to Inter font from Google Fonts for a modern look */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <main className={styles.container}> {/* Main content area */}
        {/* --- Hero Section --- */}
        <section className={styles.hero}>
          <img
            src="/lemons-hero.jpg" // Image for the hero section
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
            {/* Conditional rendering for lemons data */}
            {Array.isArray(lemons) && lemons.length > 0 ? (
              lemons.map((lemon, index) => (
                <div key={index} className={styles.lemonCard}>
                  {lemon['Image url'] && ( // Only render Image if URL exists
                    <Image
                      src={lemon['Image url']} // Image URL from SheetDB
                      alt={lemon['Grade'] || 'Lemon'}
                      width={300} // Set appropriate dimensions for Next.js Image optimization
                      height={200}
                      loading="lazy" // Lazy load images
                      className={styles.cardImage}
                    />
                  )}
                  <p className={styles.cardTitle}>
                    {lemon['Grade']} – ₹{parseFloat(lemon['Price Per Kg']).toFixed(2)}/kg {/* Display price */}
                  </p>
                  <p className={styles.cardDescription}>{lemon['Description']}</p>
                </div>
              ))
            ) : (
              // Message if no lemon data is available
              <p style={{textAlign: 'center', width: '100%', gridColumn: '1 / -1'}}>
                Loading lemons or no lemon data available. Please check your internet connection or SheetDB setup.
              </p>
            )}
          </div>
        </section>

        {/* --- Order Form Section --- */}
        <section id="buy-now" className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Place Your Order</h2>
          {submissionMessage && ( // Display submission feedback messages
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
                maxLength={10} // Enforce 10 digits
                pattern="[0-9]{10}" // Regex for 10 digits
                title="Please enter a 10-digit mobile number" // Tooltip for pattern
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
                  min="1" // Minimum quantity is 1
                  className={styles.input}
                  value={order.quantity}
                  onChange={(e) => handleOrderChange(index, 'quantity', e.target.value)}
                  placeholder="e.g., 10"
                  required // Quantity is required
                />
                 {/* Display discount note if quantity for this item is over 50 */}
                 {parseInt(order.quantity) > 50 && (
                    <span className={styles.discountNote}> (10% bulk discount)</span>
                )}
              </div>
            ))}

            <button type="button" onClick={handleAddVariety} className={styles.button}>
              ➕ Add Another Variety
            </button>

            <div className={styles.orderSummary}>
              <h3>Total: ₹{total.toFixed(2)}</h3> {/* Display total, formatted to 2 decimal places */}
            </div>

            <div className={styles.actions}> {/* Container for the action buttons */}
                <button type="submit" disabled={isSubmitting} className={styles.button}>
                {isSubmitting ? 'Ordering...' : '🛒 Place Order on Website'}
                </button>

                <a
                href={getWhatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.button} ${styles.whatsappButton}`}
                // Dynamic styling to visually "disable" WhatsApp button if conditions not met
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
                  {/* Render full stars */}
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <FaStar key={i} />
                  ))}
                  {/* Render faded empty stars for visual consistency */}
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
    </div>
  );
}
