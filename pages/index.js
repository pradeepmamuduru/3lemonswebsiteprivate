// pages/index.js
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from '../styles/styles.module.css'; // Correctly import styles.module.css as a CSS Module

// Dummy data for products and reviews
const lemonData = [
  { id: 1, Grade: 'Grade A Premium', 'Price per kg': 150, 'Image url': 'https://images.pexels.com/photos/4042801/pexels-photo-4042801.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', description: 'Our finest lemons, perfectly ripe and juicy, ideal for all culinary uses.' },
  { id: 2, Grade: 'Grade B Standard', 'Price per kg': 120, 'Image url': 'https://images.pexels.com/photos/10207386/pexels-photo-10207386.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', description: 'Good quality lemons, excellent for everyday cooking and beverages.' },
  { id: 3, Grade: 'Grade C Economy', 'Price per kg': 100, 'Image url': 'https://images.pexels.com/photos/3476686/pexels-photo-3476686.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', description: 'Economical option, great for large batches of lemonade or juice.' },
  { id: 4, Grade: 'Organic Lemons', 'Price per kg': 180, 'Image url': 'https://images.pexels.com/photos/6157053/pexels-photo-6157053.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', description: 'Certified organic, grown without pesticides for a natural taste.' },
  { id: 5, Grade: 'Meyer Lemons', 'Price per kg': 200, 'Image url': 'https://images.pexels.com/photos/14841793/pexels-photo-14841793/free-photo-of-lemons.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', description: 'Sweet and less acidic, perfect for desserts and gourmet dishes.' },
  { id: 6, Grade: 'Freshly Picked', 'Price per kg': 160, 'Image url': 'https://images.pexels.com/photos/4971844/pexels-photo-4971844.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', description: 'Hand-picked daily, ensuring maximum freshness and vibrant flavor.' },
];

const customerReviews = [
  { id: 1, rating: 5, text: 'Amazing quality lemons! Super fresh and juicy. Highly recommend!', name: 'Aisha K.' },
  { id: 2, rating: 4, text: 'Good service and reliable delivery. The lemons were perfect for my catering needs.', name: 'Ben S.' },
  { id: 3, rating: 5, text: 'Consistently excellent. Three Lemons is my go-to for all lemon supplies.', name: 'Chloe D.' },
  { id: 4, rating: 5, text: 'Fresh, tangy, and delivered right to my door. What more could I ask for?', name: 'David L.' },
  { id: 5, rating: 4, text: 'The organic lemons were a fantastic addition to my recipes. Will order again.', name: 'Eva M.' },
  { id: 6, rating: 5, text: 'Never disappointed with the quality. Great value for money!', name: 'Frank P.' },
];

const grades = lemonData.map(lemon => lemon.Grade);

export default function Home() {
  const [orderVarieties, setOrderVarieties] = useState([{ grade: '', quantity: '' }]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({}); // { title, text, type, list, buttons }
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('account'); // 'account' or 'addresses'
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [feedbackType, setFeedbackType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dummy account details & addresses for sidebar
  const [accountDetails, setAccountDetails] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '123-456-7890'
  });
  const [userAddresses, setUserAddresses] = useState([
    { id: 1, street: '123 Lemon Ave', city: 'Citrusville', state: 'CA', zip: '90210' },
    { id: 2, street: '456 Zest St', city: 'Tangytown', state: 'FL', zip: '33101' },
  ]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ street: '', city: '', state: '', zip: '' });
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);


  const calculateTotal = () => {
    let sum = 0;
    orderVarieties.forEach(item => {
      const lemon = lemonData.find(l => l.Grade === item.grade);
      if (lemon && item.quantity) {
        sum += lemon['Price per kg'] * parseFloat(item.quantity);
      }
    });
    setTotalAmount(sum);
  };

  useEffect(() => {
    calculateTotal();
  }, [orderVarieties]);

  const handleAddVariety = () => {
    setOrderVarieties([...orderVarieties, { grade: '', quantity: '' }]);
  };

  const handleRemoveVariety = (index) => {
    const newVarieties = orderVarieties.filter((_, i) => i !== index);
    setOrderVarieties(newVarieties);
  };

  const handleVarietyChange = (index, field, value) => {
    const newVarieties = [...orderVarieties];
    newVarieties[index][field] = value;
    setOrderVarieties(newVarieties);
  };

  const showFeedback = (message, type = 'info') => {
    setFeedbackMessage(message);
    setFeedbackType(type);
    const timer = setTimeout(() => {
      setFeedbackMessage(null);
      setFeedbackType('');
    }, 5000); // Message disappears after 5 seconds
    return () => clearTimeout(timer);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Basic validation
    const isValid = orderVarieties.every(item => item.grade && item.quantity && parseFloat(item.quantity) > 0);
    if (!isValid) {
      showFeedback('Please ensure all selected varieties have a grade and a valid quantity.', 'error');
      setIsSubmitting(false);
      return;
    }

    const orderDetails = orderVarieties.map(item => {
      const lemon = lemonData.find(l => l.Grade === item.grade);
      return `${item.grade} (${item.quantity} kg) - ₹${(lemon['Price per kg'] * parseFloat(item.quantity)).toFixed(2)}`;
    }).join('\n');

    const whatsappMessage = `Hello Three Lemons, I'd like to place an order:\n\n${orderDetails}\n\nTotal: ₹${totalAmount.toFixed(2)}`;
    const whatsappLink = `https://wa.me/YOUR_WHATSAPP_NUMBER?text=${encodeURIComponent(whatsappMessage)}`; // REPLACE WITH YOUR WHATSAPP NUMBER

    try {
      // Simulate API call for order submission if needed
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

      window.open(whatsappLink, '_blank'); // Open WhatsApp link in a new tab
      showFeedback('Order initiated! Please complete your order on WhatsApp.', 'success');
      setOrderVarieties([{ grade: '', quantity: '' }]); // Reset form
      setTotalAmount(0);
    } catch (error) {
      console.error('Order submission failed:', error);
      showFeedback('Failed to submit order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openInfoModal = () => {
    setModalContent({
      title: 'Our Lemons',
      text: 'We offer a variety of high-quality lemons sourced directly from our farms. Our commitment to freshness ensures you receive the best produce. Choose from different grades to suit your needs, from premium culinary lemons to economical options for bulk processing.',
      type: 'info',
      list: [
        'Grade A Premium: Perfect, unblemished for presentation.',
        'Grade B Standard: Great for juice and cooking, minor blemishes.',
        'Grade C Economy: Best for large-scale juice extraction.',
        'Organic Lemons: Grown naturally, chemical-free.',
        'Meyer Lemons: Sweet and less acidic, perfect for desserts.',
        'Freshly Picked: Hand-picked daily for maximum freshness.',
      ],
      buttons: [{ text: 'Got it!', action: closeModal }],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalContent({});
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleSidebarTabClick = (tab) => {
    setActiveSidebarTab(tab);
  };

  const handleAccountDetailChange = (e) => {
    const { name, value } = e.target;
    setAccountDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveAccountDetails = async (e) => {
    e.preventDefault();
    setIsSavingAccount(true);
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showFeedback('Account details saved successfully!', 'success');
    } catch (error) {
      showFeedback('Failed to save account details.', 'error');
    } finally {
      setIsSavingAccount(false);
      toggleSidebar(); // Close sidebar after saving
    }
  };

  const handleNewAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setIsSavingAddress(true);
    // Basic validation for new address
    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zip) {
      showFeedback('Please fill all address fields.', 'error');
      setIsSavingAddress(false);
      return;
    }

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUserAddresses(prev => [...prev, { ...newAddress, id: Date.now() }]);
      setNewAddress({ street: '', city: '', state: '', zip: '' });
      setIsAddingAddress(false);
      showFeedback('Address added successfully!', 'success');
    } catch (error) {
      showFeedback('Failed to add address.', 'error');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      // Simulate API call
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setUserAddresses(prev => prev.filter(addr => addr.id !== id));
        showFeedback('Address deleted successfully!', 'success');
      } catch (error) {
        showFeedback('Failed to delete address.', 'error');
      }
    }
  };

  return (
    <div className={styles.page}> {/* Apply .page from styles.module.css */}
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Three Lemons</h1>
        <div className={styles.headerActions}>
          <button onClick={toggleSidebar} className={styles.loginButton}>
            <span className="user-icon">👤</span> {/* User icon */}
            My Account
          </button>
          <div className="hamburger-icon" onClick={toggleSidebar}>☰</div> {/* Hamburger icon */}
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <Image
          src="/lemon-hero.jpg" // Ensure this image is in your public folder
          alt="Fresh Lemons"
          layout="fill"
          objectFit="cover"
          priority
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay}>
          <h2 className={styles.heroTitle}>Fresh Lemons, Direct to You</h2>
          <p className={styles.heroSubtitle}>Quality citrus, delivered with care, from our farms to your home or business.</p>
          <button onClick={() => document.getElementById('order-form').scrollIntoView({ behavior: 'smooth' })} className={styles.heroButton}>
            Order Now!
          </button>
        </div>
      </section>

      <main className={styles.container}> {/* Apply .container from styles.module.css */}
        {/* Lemons Products Section */}
        <section className={styles.lemonsProducts}>
          <h2 className={styles.sectionTitle}>Our Lemon Varieties</h2>
          <div className={styles.lemonsSection}>
            {lemonData.map(lemon => (
              <div key={lemon.id} className={styles.lemonCard}>
                <Image
                  src={lemon['Image url']}
                  alt={lemon['Grade'] || 'Lemon'}
                  width={300} // Actual width for the image in the card
                  height={200} // Actual height for the image in the card
                  layout="responsive" // Makes image scale within parent (use with width/height)
                  objectFit="cover"
                  loading="lazy"
                  className={styles.cardImage}
                />
                <h3 className={styles.cardTitle}>{lemon.Grade}</h3>
                <p className={styles.cardDescription}>{lemon.description}</p>
                <p className={styles.cardPrice}>₹{lemon['Price per kg']} / kg</p>
              </div>
            ))}
          </div>
        </section>

        {/* Order Form Section */}
        <section id="order-form" className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Place Your Order</h2>
          {feedbackMessage && (
            <div className={`${styles.feedbackMessage} ${styles[`feedback${feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1)}`]}`}>
              {feedbackMessage}
            </div>
          )}
          <form onSubmit={handleSubmitOrder} className={styles.form}>
            {orderVarieties.map((item, index) => (
              <div key={index} className={styles.orderVarietyRow}>
                <div className={styles.formGroup}>
                  <label htmlFor={`grade-${index}`} className={styles.label}>Lemon Grade</label>
                  <select
                    id={`grade-${index}`}
                    className={styles.select}
                    value={item.grade}
                    onChange={(e) => handleVarietyChange(index, 'grade', e.target.value)}
                    required
                  >
                    <option value="">Select a Grade</option>
                    {grades.map((grade, i) => (
                      <option key={i} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor={`quantity-${index}`} className={styles.label}>Quantity (kg)</label>
                  <input
                    type="number"
                    id={`quantity-${index}`}
                    className={styles.input}
                    value={item.quantity}
                    onChange={(e) => handleVarietyChange(index, 'quantity', e.target.value)}
                    min="0.1"
                    step="0.1"
                    required
                  />
                </div>
                {orderVarieties.length > 1 && (
                  <button type="button" onClick={() => handleRemoveVariety(index)} className={styles.removeVarietyBtn}>
                    <span className="trash-icon">🗑️</span> {/* Trash icon */}
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={handleAddVariety} className={styles.button}>
              <span className="plus-icon">+</span> Add Another Variety
            </button>

            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="customer-name" className={styles.label}>Your Name</label>
              <input type="text" id="customer-name" className={styles.input} required />
            </div>
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="customer-phone" className={styles.label}>Phone Number</label>
              <input type="tel" id="customer-phone" className={styles.input} required />
            </div>

            <div className={styles.orderSummary}>
              Total Amount: ₹{totalAmount.toFixed(2)}
              {totalAmount >= 500 && <span className={styles.discountNote}> (Eligible for special discount!)</span>}
            </div>

            <div className={styles.actions}>
              <button type="submit" className={`${styles.button} ${styles.whatsappButton}`} disabled={isSubmitting}>
                {isSubmitting ? <span className="spinner"></span> : <span className="whatsapp-icon">📞</span>} {/* Spinner or WhatsApp icon */}
                {isSubmitting ? 'Sending...' : 'Order via WhatsApp'}
              </button>
              <button type="button" onClick={openInfoModal} className={styles.button}>
                Learn More About Our Lemons
              </button>
            </div>
          </form>
        </section>

        {/* Customer Reviews Section */}
        <section className={styles.reviewsSection}>
          <h2 className={styles.sectionTitle}>What Our Customers Say</h2>
          <div className={styles.reviewsGrid}>
            {customerReviews.map(review => (
              <div key={review.id} className={styles.reviewCard}>
                <div className="star-rating"> {/* Star rating class */}
                  {/* Stars handled by CSS :before pseudo-element in globals.css */}
                </div>
                <p className={styles.reviewText}>"{review.text}"</p>
                <p className={styles.reviewerName}>- {review.name}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Three Lemons. All rights reserved.</p>
        <p>
          <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a>
        </p>
      </footer>

      {/* Modal Overlay */}
      <div className={`${styles.modalOverlay} ${showModal ? styles.visible : ''}`} onClick={closeModal}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <button onClick={closeModal} className="close-button">
            &times; {/* Close icon */}
          </button>
          <h3 className={styles.modalTitle}>{modalContent.title}</h3>
          <p className={styles.modalText}>{modalContent.text}</p>
          {modalContent.list && (
            <ul className={styles.modalText}>
              {modalContent.list.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
          {modalContent.buttons && (
            <div className={styles.modalButtons}>
              {modalContent.buttons.map((button, index) => (
                <button
                  key={index}
                  onClick={button.action}
                  className={`${styles.modalButton} ${button.className || ''}`}
                >
                  {button.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Account Sidebar Overlay */}
      <div className={`${styles.accountSidebarOverlay} ${showSidebar ? styles.visible : ''}`} onClick={toggleSidebar}>
        <div className={styles.accountSidebar} onClick={(e) => e.stopPropagation()}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>My Account</h2>
            <button onClick={toggleSidebar} className="close-button" style={{color: 'white'}}>
              &times; {/* Close icon */}
            </button>
          </div>
          <div className={styles.sidebarTabs}>
            <button
              className={`${styles.tabButton} ${activeSidebarTab === 'account' ? styles.active : ''}`}
              onClick={() => handleSidebarTabClick('account')}
            >
              <span className="user-icon">👤</span> Account Details
            </button>
            <button
              className={`${styles.tabButton} ${activeSidebarTab === 'addresses' ? styles.active : ''}`}
              onClick={() => handleSidebarTabClick('addresses')}
            >
              <span className="map-icon">📍</span> My Addresses
            </button>
          </div>
          <div className={styles.tabContent}>
            {activeSidebarTab === 'account' && (
              <div>
                <h3>Personal Information</h3>
                <form onSubmit={handleSaveAccountDetails} className={styles.accountDetailsForm}>
                  <div className={styles.formGroup}>
                    <label htmlFor="account-name" className={styles.label}>Name</label>
                    <input
                      type="text"
                      id="account-name"
                      name="name"
                      className={styles.input}
                      value={accountDetails.name}
                      onChange={handleAccountDetailChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="account-email" className={styles.label}>Email</label>
                    <input
                      type="email"
                      id="account-email"
                      name="email"
                      className={styles.input}
                      value={accountDetails.email}
                      onChange={handleAccountDetailChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="account-phone" className={styles.label}>Phone</label>
                    <input
                      type="tel"
                      id="account-phone"
                      name="phone"
                      className={styles.input}
                      value={accountDetails.phone}
                      onChange={handleAccountDetailChange}
                      required
                    />
                  </div>
                  <button type="submit" className={`${styles.button} ${styles.saveButton}`} disabled={isSavingAccount}>
                    {isSavingAccount ? <span className="spinner"></span> : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {activeSidebarTab === 'addresses' && (
              <div>
                <h3>Your Delivery Addresses</h3>
                <div className={styles.addressList}>
                  {userAddresses.length === 0 ? (
                    <p>No addresses added yet.</p>
                  ) : (
                    <ul>
                      {userAddresses.map(address => (
                        <li key={address.id} className={styles.addressItem}>
                          <strong>Address {address.id}:</strong>
                          <p>{address.street}</p>
                          <p>{address.city}, {address.state} {address.zip}</p>
                          <div className={styles.addressActions}>
                            <button onClick={() => handleDeleteAddress(address.id)}>Delete</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {isAddingAddress ? (
                  <form onSubmit={handleAddAddress} className={styles.addressForm}>
                    <h4>Add New Address</h4>
                    <div className={styles.formGroup}>
                      <label htmlFor="new-street" className={styles.label}>Street</label>
                      <input type="text" id="new-street" name="street" className={styles.input} value={newAddress.street} onChange={handleNewAddressChange} required />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="new-city" className={styles.label}>City</label>
                      <input type="text" id="new-city" name="city" className={styles.input} value={newAddress.city} onChange={handleNewAddressChange} required />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="new-state" className={styles.label}>State</label>
                      <input type="text" id="new-state" name="state" className={styles.input} value={newAddress.state} onChange={handleNewAddressChange} required />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="new-zip" className={styles.label}>Zip Code</label>
                      <input type="text" id="new-zip" name="zip" className={styles.input} value={newAddress.zip} onChange={handleNewAddressChange} required />
                    </div>
                    <div className={styles.formButtons}>
                      <button type="submit" className={styles.button} disabled={isSavingAddress}>
                        {isSavingAddress ? <span className="spinner"></span> : 'Save Address'}
                      </button>
                      <button type="button" onClick={() => setIsAddingAddress(false)} className={`${styles.button} ${styles.modalButton.cancel}`}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => setIsAddingAddress(true)} className={`${styles.button} ${styles.addAddressButton}`}>
                    <span className="plus-icon">+</span> Add New Address
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
