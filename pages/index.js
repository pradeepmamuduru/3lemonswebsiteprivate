import React, { useState, useEffect, useCallback, useMemo, Fragment, useContext, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/styles.module.css';
import { AuthContext } from '../pages/_app'; // Assuming _app.js is in the pages directory

// Import all necessary icons
import { FaWhatsapp, FaStar, FaUserCircle, FaPlus, FaMinus, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaSpinner, FaBox, FaTimes, FaBars, FaPlusCircle, FaMinusCircle, FaMapMarkerAlt, FaPencilAlt, FaTrash } from 'react-icons/fa';


// SheetDB API URLs (Using your provided URLs)
const LEMONS_DATA_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Lemons';
const SIGNUP_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Signup'; // Corrected base URL for Signup sheet
const ORDERS_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Orders';
const ADDRESSES_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Addresses';
const FEEDBACK_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Feedback';

// Helper for showing temporary feedback messages
const useTemporaryFeedback = () => {
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const feedbackTimeoutRef = useRef(null);

    const showTemporaryFeedback = useCallback((message, type = 'info', duration = 3000) => {
        setFeedback({ message, type });
        if (feedbackTimeoutRef.current) {
            clearTimeout(feedbackTimeoutRef.current);
        }
        feedbackTimeoutRef.current = setTimeout(() => {
            setFeedback({ message: '', type: '' });
        }, duration);
    }, []); // Empty dependency array means this function is created once

    return [feedback, showTemporaryFeedback];
};


// --- Home Component ---
export default function Home({ lemons }) {
    // Access AuthContext for global user state
    const { isLoggedIn, currentUser, login, logout, setCurrentUser } = useContext(AuthContext);

    // Order form states
    const [orders, setOrders] = useState([{ grade: '', quantity: '' }]);
    const [form, setForm] = useState({ name: '', delivery: '', contact: '' }); // <-- RE-INTRODUCED FORM STATE HERE
    const [total, setTotal] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Consolidated Feedback State (for all messages: order, signup, login, logout, account)
    const [feedback, showTemporaryFeedback] = useTemporaryFeedback();

    // Modal states for order confirmation/success (from previous code, but not directly used in the new flow)
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmedOrderDetails, setConfirmedOrderDetails] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false); // Used for general order success

    // User authentication/account states
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginForm, setLoginForm] = useState({ name: '', phone: '' });
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const [showSignUpModal, setShowSignUpModal] = useState(false);
    const [signUpForm, setSignUpForm] = useState({ name: '', phone: '', address: '', pincode: '' });
    const [isSigningUp, setIsSigningUp] = useState(false);

    // Account Sidebar states
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeAccountTab, setActiveAccountTab] = useState('accountDetails'); // 'accountDetails', 'addresses', 'yourOrders', 'feedback'
    const [userAddresses, setUserAddresses] = useState([]);
    const [isManagingAddresses, setIsManagingAddresses] = useState(false); // Loading state for address actions
    const [addressForm, setAddressForm] = useState({ id: null, addressName: '', fullAddress: '', pincode: '' }); // For adding/editing addresses
    const [showAddressForm, setShowAddressForm] = useState(false); // To show/hide add/edit address form

    // Feedback specific states for the sidebar feedback tab
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    // New state for user orders (fetched from SheetDB)
    const [userOrders, setUserOrders] = useState([]);
    const [isFetchingOrders, setIsFetchingOrders] = useState(false);


    // --- Effects for loading user data from AuthContext to forms ---
    useEffect(() => {
        // Sync account details form with currentUser from AuthContext
        if (currentUser) {
            setAccountDetailsForm({
                name: currentUser.name || '',
                phone: currentUser.phone || '',
                address: currentUser.address || '',
                pincode: currentUser.pincode || ''
            });
            // Also sync initial order form contact/address if needed
            setForm(prevForm => ({
                ...prevForm,
                name: currentUser.name || prevForm.name,
                contact: currentUser.phone || prevForm.contact,
                delivery: currentUser.address || prevForm.delivery,
            }));
        } else {
            // If logged out, clear forms
            setAccountDetailsForm({ name: '', phone: '', address: '', pincode: '' });
            setForm({ name: '', delivery: '', contact: '' });
        }
    }, [currentUser]);


    // --- Effect to fetch addresses when user logs in or currentUser changes ---
    const fetchUserAddresses = useCallback(async () => {
        if (!currentUser || !currentUser.phone) {
            setUserAddresses([]);
            return;
        }
        setIsManagingAddresses(true);
        try {
            // CORRECTED URL for SheetDB search
            const searchUrl = `https://sheetdb.io/api/v1/wm0oxtmmfkndt/search?sheet=Addresses&search={"UserPhone":"${currentUser.phone}"}`;
            const res = await fetch(searchUrl);

            if (!res.ok && res.status !== 404 && res.status !== 204) {
                throw new Error(`Failed to fetch addresses: ${res.status} ${res.statusText}`);
            }
            let addresses = [];
            if (res.status !== 204 && res.status !== 404) {
                addresses = await res.json();
            }

            if (Array.isArray(addresses)) {
                // Assign a unique ID if not present, useful for React keys
                setUserAddresses(addresses.map(addr => ({ ...addr, id: addr.id || Date.now() + Math.random() })));
            } else {
                setUserAddresses([]);
            }
        } catch (error) {
            console.error("Error fetching user addresses:", error);
            showTemporaryFeedback('Failed to load addresses.', 'error');
            setUserAddresses([]); // Ensure it's an array on error
        } finally {
            setIsManagingAddresses(false);
        }
    }, [currentUser, showTemporaryFeedback]);

    useEffect(() => {
        if (isLoggedIn && currentUser?.phone && activeAccountTab === 'addresses') {
            fetchUserAddresses();
        } else if (activeAccountTab !== 'addresses') {
            setUserAddresses([]); // Clear addresses if not on tab or logged out
        }
    }, [isLoggedIn, currentUser?.phone, activeAccountTab, fetchUserAddresses]);


    // --- Effect to fetch orders when user logs in and tab changes ---
    const fetchUserOrders = useCallback(async () => {
        if (!currentUser || !currentUser.phone) {
            setUserOrders([]);
            return;
        }
        setIsFetchingOrders(true);
        try {
            // CORRECTED URL for SheetDB search
            const searchUrl = `https://sheetdb.io/api/v1/wm0oxtmmfkndt/search?sheet=Orders&search={"Phone":"${currentUser.phone}"}`;
            const res = await fetch(searchUrl);

            if (!res.ok && res.status !== 404 && res.status !== 204) {
                throw new Error(`Failed to fetch orders: ${res.status} ${res.statusText}`);
            }
            let ordersData = [];
            if (res.status !== 204 && res.status !== 404) {
                ordersData = await res.json();
            }

            if (!Array.isArray(ordersData)) {
                ordersData = [];
            }

            // Group orders by a unique identifier (e.g., Timestamp if precise enough)
            // Assuming each row in SheetDB "Orders" is a distinct order
            // If multiple rows make up one order, you'd need a dedicated OrderID column
            const groupedOrders = ordersData.reduce((acc, item) => {
                const orderKey = item.Timestamp; // Assuming Timestamp is unique per order
                if (!acc[orderKey]) {
                    acc[orderKey] = {
                        id: orderKey, // Use timestamp as a temporary unique ID for grouping
                        name: item.Name,
                        phone: item.Phone,
                        address: item.Address,
                        pincode: item.Pincode,
                        orderDetails: item.OrderDetails, // This is already a string of items
                        totalAmount: parseFloat(item.TotalAmount),
                        timestamp: item.Timestamp,
                        orderType: item.OrderType
                    };
                }
                return acc;
            }, {});

            // Convert grouped object back to array and sort by date descending
            setUserOrders(Object.values(groupedOrders).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        } catch (error) {
            console.error("Error fetching user orders:", error);
            showTemporaryFeedback('Failed to load your orders.', 'error');
            setUserOrders([]);
        } finally {
            setIsFetchingOrders(false);
        }
    }, [currentUser, showTemporaryFeedback]);

    useEffect(() => {
        if (isLoggedIn && currentUser?.phone && activeAccountTab === 'yourOrders') {
            fetchUserOrders();
        } else if (activeAccountTab !== 'yourOrders') {
            setUserOrders([]); // Clear orders if not on tab or logged out
        }
    }, [isLoggedIn, currentUser?.phone, activeAccountTab, fetchUserOrders]);

    // Added Hardcoded customer reviews - keep it here as it's static data
    const customerReviews = useMemo(() => [
        { id: 1, text: "The freshest lemons I've ever tasted! Perfect for my morning lemonade. Delivery was super fast too.", name: "Priya Sharma", rating: 5 },
        { id: 2, text: "Excellent quality and consistent supply. My restaurant relies on these lemons. Highly recommended!", name: "Chef Anand Rao", rating: 5 },
        { id: 3, text: "So convenient to get fresh lemons delivered home. They truly are farm fresh. My family loves them!", name: "Rajesh Kumar", rating: 5 },
    ], []);


    // --- Handlers for main order form changes ---
    const calculateTotal = useCallback(() => {
        let totalPrice = 0;
        orders.forEach(order => {
            const lemon = lemons.find(l => l.Grade === order.grade);
            if (lemon) {
                const pricePerKg = parseFloat(lemon['Price Per Kg'] || lemon.Price); // Use 'Price' if 'Price Per Kg' not found, or vice-versa
                const quantity = parseFloat(order.quantity);

                if (!isNaN(pricePerKg) && !isNaN(quantity) && quantity > 0) {
                    let itemPrice = pricePerKg * quantity;
                    if (quantity > 50) {
                        itemPrice *= 0.90; // 10% discount for quantity > 50
                    }
                    totalPrice += itemPrice;
                }
            }
        });
        setTotal(totalPrice);
    }, [orders, lemons]);

    useEffect(() => {
        calculateTotal();
    }, [orders, lemons, calculateTotal]);


    const handleOrderChange = (index, field, value) => {
        const updated = [...orders];
        if (field === 'quantity') {
            // Ensure quantity is at least 0.5, or empty string if cleared
            value = value === '' ? '' : String(Math.max(0.5, parseFloat(value) || 0.5));
        }

        // Handle unique variety selection
        if (field === 'grade') {
            const selectedGrades = updated.map((order, i) => (i === index ? value : order.grade));
            // Check if the new value is a duplicate among other selected grades
            const isDuplicate = selectedGrades.filter(g => g === value && g !== '').length > 1;
            if (isDuplicate) {
                // Show toast message for duplicate selection
                showTemporaryFeedback(`${currentUser?.name || 'You'}, are selecting the same variety again! 🧐`, 'error');
                return; // Prevent update if duplicate
            }
        }

        updated[index][field] = value;
        setOrders(updated);
        // calculateTotal is called via useEffect based on orders dependency
    };

    const addAnotherVariety = () => {
        // Prevent adding new variety if the last one is empty
        const lastOrder = orders[orders.length - 1];
        if (orders.length > 0 && (lastOrder.grade === '' || lastOrder.quantity === '')) {
            showTemporaryFeedback('Please complete the current variety selection before adding a new one.', 'info');
            return;
        }

        setOrders([...orders, { grade: '', quantity: '' }]);
    };
    const removeVariety = (index) => {
        const updated = orders.filter((_, i) => i !== index);
        setOrders(updated.length > 0 ? updated : [{ grade: '', quantity: '' }]); // Ensure at least one row remains
        showTemporaryFeedback('Variety removed.', 'info');
        // calculateTotal is called via useEffect based on orders dependency
    };


    // --- Main Order Submission Flow ---
    const handlePlaceOrder = async (orderType) => {
        if (!isLoggedIn) {
            showTemporaryFeedback('Please log in to place an order.', 'error');
            openLoginModal(); // Prompt user to log in
            return;
        }

        // Validate order items
        const validOrders = orders.filter(order => order.grade && order.quantity && parseFloat(order.quantity) > 0);
        if (validOrders.length === 0) {
            showTemporaryFeedback('Please add at least one lemon variety with a valid quantity (must be 0.5kg or more).', 'error');
            return;
        }

        const hasInvalidQuantity = orders.some(order => {
            return (order.grade && (order.quantity === '' || isNaN(parseFloat(order.quantity)) || parseFloat(order.quantity) <= 0));
        });
        if (hasInvalidQuantity) {
            showTemporaryFeedback('Please ensure all selected varieties have a valid quantity (0.5kg or more).', 'error');
            return;
        }

        if (total === 0) {
            showTemporaryFeedback('Your order total is zero. Please add items to your cart.', 'error');
            return;
        }


        // Prepare order details for SheetDB
        const orderDetails = validOrders.map(order => {
            const lemon = lemons.find(l => l.Grade === order.grade);
            const quantity = parseFloat(order.quantity);
            const pricePerKg = parseFloat(lemon?.['Price Per Kg'] || lemon.Price || 0);
            let itemPrice = pricePerKg * quantity;
            let discountMsg = '';
            if (quantity > 50) {
                itemPrice *= 0.90; // 10% discount for quantity > 50
                discountMsg = ` (10% bulk discount applied)`;
            }
            return `${quantity} kg of ${order.grade} (Approx. ₹${itemPrice.toFixed(2)})${discountMsg}`;
        }).join('; '); // Use semicolon to separate items for easier parsing in SheetDB

        const orderData = {
            Name: currentUser.name,
            Phone: currentUser.phone,
            Address: currentUser.address || 'N/A', // Use existing address or N/A
            Pincode: currentUser.pincode || 'N/A', // Use existing pincode or N/A
            OrderDetails: orderDetails, // Store as a single string
            TotalAmount: total.toFixed(2),
            Timestamp: new Date().toLocaleString(),
            OrderType: orderType // 'Website' or 'WhatsApp'
        };

        setIsSubmitting(true);
        try {
            const res = await fetch(ORDERS_SHEET_URL, { // ORDERS_SHEET_URL is correct for POST
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: orderData }),
            });

            if (res.ok) {
                showTemporaryFeedback('Order placed successfully! We will contact you soon.', 'success');
                setShowSuccessModal(true); // Show success modal
                // Reset order form
                setOrders([{ grade: '', quantity: '' }]);
                setTotal(0);
                // Optionally refetch orders for the sidebar if it's open and on the right tab
                if (activeAccountTab === 'yourOrders' && isLoggedIn) {
                    fetchUserOrders();
                }
            } else {
                const errorData = await res.json();
                console.error('SheetDB order submission error:', res.status, errorData);
                showTemporaryFeedback('Failed to place order. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            showTemporaryFeedback('An error occurred while placing your order. Please check your internet connection.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- WhatsApp Link Generation ---
    const generateWhatsAppLink = () => {
        const whatsappPhoneNumber = '919539304300'; // Replace with your actual WhatsApp Business number

        let message = `Hello! I'd like to place an order from 3 Lemons Traders.\n\n`;

        // Add user details if logged in
        if (isLoggedIn && currentUser) {
            message += `Name: ${currentUser.name}\n`;
            message += `Phone: ${currentUser.phone}\n`;
            message += `Delivery Address: ${currentUser.address || 'Not provided'}\n`;
            message += `Pincode: ${currentUser.pincode || 'Not provided'}\n\n`;
        } else {
            message += `(Please provide your Name, Phone Number, Delivery Address, and Pincode in the chat)\n\n`;
        }

        // Add order details
        const validOrders = orders.filter(order => order.grade && order.quantity && parseFloat(order.quantity) > 0);
        if (validOrders.length > 0) {
            message += `My Order Details:\n`;
            validOrders.forEach((order) => {
                const lemon = lemons.find(l => l.Grade === order.grade);
                if (lemon) {
                    const quantity = parseFloat(order.quantity);
                    const pricePerKg = parseFloat(lemon['Price Per Kg'] || lemon.Price || 0);
                    let itemCalculatedPrice = pricePerKg * quantity;
                    if (quantity > 50) {
                        itemCalculatedPrice *= 0.90; // Apply discount for message
                        message += `- ${quantity} kg of ${order.grade} (with 10% bulk discount) - Approx. ₹${itemCalculatedPrice.toFixed(2)}\n`;
                    } else {
                        message += `- ${quantity} kg of ${order.grade} - Approx. ₹${itemCalculatedPrice.toFixed(2)}\n`;
                    }
                }
            });
            message += `\nTotal Estimated Price: ₹${total.toFixed(2)}\n\n`;
            message += `Please confirm availability and final amount.`;
        } else {
            message += `I'm interested in knowing more about your lemons.`;
        }

        return `https://wa.me/${whatsappPhoneNumber}?text=${encodeURIComponent(message)}`;
    };


    // --- Main Render ---
    return (
        <div className={styles.page}>
            <Head>
                <title>3 Lemons Traders – Buy Fresh Lemons Online</title>
                <meta name="description" content="Buy premium quality lemons at affordable prices across India. Direct farm to home delivery. Discounts on bulk orders!" />
                <meta property="og:title" content="Buy Fresh Lemons Online – 3 Lemons Traders" />
                <meta property="og:description" content="Get premium lemons delivered to your door at unbeatable prices. Farm fresh quality. Offering discounts on bulk purchases!" />
                {/* Image paths should be relative to the public folder */}
                <meta property="og:image" content="/lemons-hero.jpg" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="canonical" href="https://3lemons.in" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
            </Head>

            {/* --- Header with Login Button / Account Icon --- */}
            <header className={styles.header}>
                <h1 className={styles.headerTitle}>3 Lemons Traders</h1>
                <div className={styles.headerActions}>
                    {isLoggedIn ? (
                        <button className={styles.loginButton} onClick={toggleSidebar}>
                            <FaUserCircle size={24} color="#333" /> Hello, {currentUser?.name}
                        </button>
                    ) : (
                        <button className={styles.loginButton} onClick={openLoginModal}>
                            Login / Signup
                        </button>
                    )}
                    {/* Hamburger menu for small screens - can be shown/hidden via CSS media queries */}
                    {/* <FaBars className={styles.hamburgerIcon} onClick={toggleSidebar} /> */} {/* Changed to FaBars if needed */}
                </div>
            </header>

            <main className={styles.container}>
                {/* Feedback Message Display */}
                {feedback.message && (
                    <div className={`${styles.feedbackMessage} ${styles[`feedback${feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}`]}`}>
                        {feedback.message}
                    </div>
                )}

                {/* --- Hero Section --- */}
                <section className={styles.hero}>
                    <Image
                        src="/lemons-hero.jpg" // Assuming this is a local image in your public folder
                        alt="Fresh Lemons"
                        layout="fill" // Use layout="fill" for background images in hero
                        objectFit="cover"
                        priority // Load eagerly for LCP (Largest Contentful Paint)
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
                                <div key={lemon.id || lemon.Grade || index} className={styles.lemonCard}>
                                    {/* Ensure image src matches what's in your public folder or accessible path */}
                                    {lemon.Image && (
                                        <Image
                                            src={`/${lemon.Image}`} // Assuming images like 'lemon-eureka.jpg' are in public/
                                            alt={lemon.Grade || 'Lemon'}
                                            width={300}
                                            height={220}
                                            loading="lazy"
                                            className={styles.cardImage}
                                        />
                                    )}
                                    <p className={styles.cardTitle}>
                                        {lemon.Grade} – ₹{parseFloat(lemon['Price Per Kg'] || lemon.Price).toFixed(2)}/kg
                                    </p>
                                    <p className={styles.cardDescription}>{lemon.Description}</p>
                                </div>
                            ))
                        ) : (
                            <p style={{ textAlign: 'center', width: '100%', gridColumn: '1 / -1' }}>
                                Loading lemons or no lemon data available. Please check your internet connection or SheetDB setup.
                            </p>
                        )}
                    </div>
                </section>

                {/* --- Order Form Section --- */}
                <section id="buy-now" className={styles.formSection}>
                    <h2 className={styles.sectionTitle}>Place Your Order</h2>
                    <form onSubmit={(e) => e.preventDefault()} className={styles.form}> {/* Prevent default form submission directly here */}
                        {/* Personal Details Inputs (pre-filled if logged in) */}
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="name">Your Name</label>
                            <input
                                id="name"
                                className={styles.input}
                                required
                                value={currentUser?.name || ''} // Use currentUser.name
                                readOnly={isLoggedIn} // Make read-only if logged in
                                style={isLoggedIn ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                                placeholder="Enter your name"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="delivery">Delivery Address</label>
                            {isLoggedIn && currentUser?.address ? (
                                <input
                                    id="delivery"
                                    className={styles.input}
                                    required
                                    value={currentUser.address || ''} // Use currentUser.address
                                    readOnly={true} // Read-only if logged in
                                    style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                                />
                            ) : (
                                <input
                                    id="delivery"
                                    className={styles.input}
                                    required
                                    value={form.delivery} // Use form.delivery for non-logged-in
                                    onChange={(e) => setForm({ ...form, delivery: e.target.value })}
                                    placeholder="Enter your full delivery address"
                                />
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="contact">Contact Number</label>
                            <input
                                id="contact"
                                type="tel"
                                className={styles.input}
                                required
                                value={currentUser?.phone || ''} // Use currentUser.phone
                                readOnly={isLoggedIn} // Read-only if logged in
                                style={isLoggedIn ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                                maxLength={10}
                                pattern="[0-9]{10}"
                                title="Please enter a 10-digit mobile number"
                                placeholder="e.g., 9876543210"
                            />
                        </div>

                        {/* Dynamic Order Varieties Inputs */}
                        {orders.map((order, index) => (
                            <Fragment key={index}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label} htmlFor={`grade-${index}`}>Select Variety</label>
                                    <select
                                        id={`grade-${index}`}
                                        className={styles.select}
                                        value={order.grade}
                                        onChange={(e) => handleOrderChange(index, 'grade', e.target.value)}
                                        required
                                    >
                                        <option value="">-- Select --</option>
                                        {lemons.map((lemon, idx) => (
                                            <option
                                                key={idx}
                                                value={lemon.Grade}
                                                // Disable already selected grades, except for the current row
                                                disabled={orders.some(o => o.grade === lemon.Grade && orders.indexOf(order) !== index)}
                                            >
                                                {lemon.Grade} – ₹{parseFloat(lemon['Price Per Kg'] || lemon.Price).toFixed(2)}/kg
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <label className={styles.label} htmlFor={`quantity-${index}`} style={{ flexGrow: 1 }}>Quantity (kg)</label>
                                    <input
                                        id={`quantity-${index}`}
                                        type="number"
                                        min="0.5"
                                        step="0.5"
                                        className={styles.input}
                                        value={order.quantity}
                                        onChange={(e) => handleOrderChange(index, 'quantity', e.target.value)}
                                        placeholder="e.g., 10"
                                        required
                                        style={{ flexGrow: 2 }}
                                    />
                                    {parseFloat(order.quantity) > 50 && (
                                        <span className={styles.discountNote}> (10% bulk discount)</span>
                                    )}
                                    {orders.length > 1 && (
                                        <button type="button" onClick={() => removeVariety(index)} className={styles.removeVarietyButton}>
                                            <FaMinus />
                                        </button>
                                    )}
                                </div>
                            </Fragment>
                        ))}

                        <button type="button" onClick={addAnotherVariety} className={styles.addVarietyButton}>
                            <FaPlus /> Add Another Variety
                        </button>

                        <div className={styles.orderSummary}>
                            <h3>Total: ₹{total.toFixed(2)}</h3>
                        </div>

                        <div className={styles.actions}>
                            <button
                                type="button"
                                onClick={() => handlePlaceOrder('Website')}
                                disabled={isSubmitting}
                                className={styles.button}
                            >
                                {isSubmitting ? (<><FaSpinner className={styles.spinner} /> Placing Order...</>) : '🛒 Place Order on Website'}
                            </button>

                            <a
                                href={generateWhatsAppLink()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${styles.button} ${styles.whatsappButton}`}
                                // Disable WhatsApp button if validation fails or data missing
                                style={{
                                    pointerEvents: (orders.filter(o => o.grade && o.quantity && parseFloat(o.quantity) > 0).length === 0) ? 'none' : 'auto',
                                    opacity: (orders.filter(o => o.grade && o.quantity && parseFloat(o.quantity) > 0).length === 0) ? 0.6 : 1
                                }}
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
                    📸 <a href="https://www.instagram.com/3Lemons_Traders" target="_blank" rel="noopener noreferrer">3Lemons_Traders</a> |
                    🌐 <a href="https://3lemons.vercel.app" target="_blank" rel="noopener noreferrer">3lemons.vercel.app</a>
                </p>
                <p>&copy;{new Date().getFullYear()} 3 Lemons Traders. All rights reserved.</p>
            </div>

            {/* --- Order Confirmation Modal (can be repurposed or removed) --- */}
            {/* Keeping it for now, but confirmAndSubmitOrder is not directly called from main flow */}
            {showConfirmModal && confirmedOrderDetails && (
                <div className={`${styles.modalOverlay} ${showConfirmModal ? styles.visible : ''}`}>
                    <div className={styles.modalContent}>
                        <button className={styles.modalCloseButton} onClick={() => setShowConfirmModal(false)}>
                            <FaTimes />
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
                            <button className={styles.modalButton} onClick={() => console.log('Proceeding with order...')} disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Proceed'}
                            </button>
                            <button className={`${styles.modalButton} ${styles.cancel}`} onClick={() => setShowConfirmModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Order Submitted Successfully Modal --- */}
            {showSuccessModal && (
                <div className={`${styles.modalOverlay} ${showSuccessModal ? styles.visible : ''}`}>
                    <div className={styles.modalContent}>
                        <button className={styles.modalCloseButton} onClick={() => setShowSuccessModal(false)}>
                            <FaTimes />
                        </button>
                        <h2 className={styles.successTitle}>Order Submitted Successfully!</h2>
                        <p className={styles.successMessage}>
                            Thank you for your order. We have received your details and will contact you shortly to confirm.
                        </p>
                        <button className={styles.modalButton} onClick={() => setShowSuccessModal(false)}>
                            Close
                        </button>
                    </div>
                </div>
            )}


            {/* --- Sign Up Form Modal --- */}
            {showSignUpModal && (
                <div className={`${styles.modalOverlay} ${showSignUpModal ? styles.visible : ''}`}>
                    <div className={styles.modalContent}>
                        <button className={styles.modalCloseButton} onClick={closeSignUpModal}>
                            <FaTimes />
                        </button>
                        <h2 className={styles.modalTitle}>Create Your Account</h2>
                        {feedback.message && feedback.type === 'error' && (
                            <p className={`${styles.feedbackMessage} ${styles.feedbackError}`}>
                                {feedback.message}
                            </p>
                        )}
                        <form onSubmit={handleSignUpSubmit}>
                            <div className={styles.formGroup}>
                                <label className={styles.label} htmlFor="signup-name">Your Name</label>
                                <input
                                    id="signup-name"
                                    className={styles.input}
                                    name="name"
                                    required
                                    value={signUpForm.name}
                                    onChange={handleSignUpFormChange}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label} htmlFor="signup-phone">Phone Number</label>
                                <input
                                    id="signup-phone"
                                    type="tel"
                                    className={styles.input}
                                    name="phone"
                                    required
                                    value={signUpForm.phone}
                                    onChange={handleSignUpFormChange}
                                    maxLength={10}
                                    pattern="[0-9]{10}"
                                    title="Please enter a 10-digit mobile number"
                                    placeholder="e.g., 9876543210"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label} htmlFor="signup-address">Delivery Address</label>
                                <input
                                    id="signup-address"
                                    className={styles.input}
                                    name="address"
                                    required
                                    value={signUpForm.address}
                                    onChange={handleSignUpFormChange}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label} htmlFor="signup-pincode">Pincode</label>
                                <input
                                    id="signup-pincode"
                                    type="text"
                                    className={styles.input}
                                    name="pincode"
                                    required
                                    value={signUpForm.pincode}
                                    onChange={handleSignUpFormChange}
                                    maxLength={6}
                                    pattern="[0-9]{6}"
                                    title="Please enter a 6-digit pincode"
                                    placeholder="e.g., 123456"
                                />
                            </div>
                            <div className={styles.modalButtons}>
                                <button type="submit" className={styles.modalButton} disabled={isSigningUp}>
                                    {isSigningUp ? (<><FaSpinner className={styles.spinner} /> Creating Account...</>) : 'Sign Up'}
                                </button>
                                <button type="button" className={`${styles.modalButton} ${styles.cancel}`} onClick={closeSignUpModal}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Login Modal --- */}
            {showLoginModal && (
                <div className={`${styles.modalOverlay} ${showLoginModal ? styles.visible : ''}`}>
                    <div className={styles.modalContent}>
                        <button className={styles.modalCloseButton} onClick={closeLoginModal}>
                            <FaTimes />
                        </button>
                        <h2 className={styles.modalTitle}>Login to Your Account</h2>
                        {feedback.message && feedback.type === 'error' && (
                            <p className={`${styles.feedbackMessage} ${styles.feedbackError}`}>
                                {feedback.message}
                            </p>
                        )}
                        <form onSubmit={handleLoginSubmit}>
                            <div className={styles.formGroup}>
                                <label className={styles.label} htmlFor="login-name">Your Name</label>
                                <input
                                    id="login-name"
                                    className={styles.input}
                                    name="name"
                                    required
                                    value={loginForm.name}
                                    onChange={handleLoginFormChange}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label} htmlFor="login-phone">Phone Number</label>
                                <input
                                    id="login-phone"
                                    type="tel"
                                    className={styles.input}
                                    name="phone"
                                    required
                                    value={loginForm.phone}
                                    onChange={handleLoginFormChange}
                                    maxLength={10}
                                    pattern="[0-9]{10}"
                                    title="Please enter a 10-digit mobile number"
                                    placeholder="e.g., 9876543210"
                                />
                            </div>
                            <div className={styles.modalButtons}>
                                <button type="submit" className={styles.modalButton} disabled={isLoggingIn}>
                                    {isLoggingIn ? (<><FaSpinner className={styles.spinner} /> Logging In...</>) : 'Login'}
                                </button>
                                <button type="button" className={`${styles.modalButton} ${styles.cancel}`} onClick={() => {
                                    closeLoginModal();
                                    openSignUpModal(); // Offer signup if login fails
                                }}>
                                    New User? Sign Up
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Account Sidebar (New) --- */}
            {isSidebarOpen && (
                <div className={`${styles.accountSidebarOverlay} ${isSidebarOpen ? styles.visible : ''}`} onClick={() => setIsSidebarOpen(false)}>
                    <div className={`${styles.accountSidebar} ${isSidebarOpen ? styles.open : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.sidebarHeader}>
                            <h3 className={styles.sidebarTitle}>My Account</h3>
                            <button className={styles.sidebarCloseButton} onClick={() => setIsSidebarOpen(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className={styles.sidebarTabs}>
                            <button
                                className={`${styles.tabButton} ${activeAccountTab === 'accountDetails' ? styles.active : ''}`}
                                onClick={() => setActiveAccountTab('accountDetails')}
                            >
                                <FaUserCircle /> Account Details
                            </button>
                            <button
                                className={`${styles.tabButton} ${activeAccountTab === 'addresses' ? styles.active : ''}`}
                                onClick={() => setActiveAccountTab('addresses')}
                            >
                                <FaMapMarkerAlt /> Addresses
                            </button>
                            <button
                                className={`${styles.tabButton} ${activeAccountTab === 'yourOrders' ? styles.active : ''}`}
                                onClick={() => setActiveAccountTab('yourOrders')}
                            >
                                <FaBox /> Your Orders
                            </button>
                            <button
                                className={`${styles.tabButton} ${activeAccountTab === 'feedback' ? styles.active : ''}`}
                                onClick={() => setActiveAccountTab('feedback')}
                            >
                                Feedback
                            </button>
                        </div>

                        <div className={styles.tabContent}>
                            {isLoggedIn ? (
                                <>
                                    {feedback.message && (feedback.type === 'success' || feedback.type === 'error' || feedback.type === 'info') && (
                                        <p className={`${styles.feedbackMessage} ${styles[`feedback${feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}`]}`}>
                                            {feedback.message}
                                        </p>
                                    )}

                                    {activeAccountTab === 'accountDetails' && currentUser && (
                                        <form className={styles.accountDetailsForm} onSubmit={handleUpdateAccountDetails}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label} htmlFor="acc-name">Name</label>
                                                <input
                                                    id="acc-name"
                                                    className={styles.input}
                                                    name="name"
                                                    value={accountDetailsForm.name || ''}
                                                    onChange={handleAccountDetailChange}
                                                    required
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label} htmlFor="acc-phone">Phone Number</label>
                                                <input
                                                    id="acc-phone"
                                                    className={styles.input}
                                                    name="phone"
                                                    value={accountDetailsForm.phone || ''}
                                                    readOnly
                                                    style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label} htmlFor="acc-address">Address</label>
                                                <input
                                                    id="acc-address"
                                                    className={styles.input}
                                                    name="address"
                                                    value={accountDetailsForm.address || ''}
                                                    onChange={handleAccountDetailChange}
                                                    required
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label} htmlFor="acc-pincode">Pincode</label>
                                                <input
                                                    id="acc-pincode"
                                                    type="text"
                                                    className={styles.input}
                                                    name="pincode"
                                                    value={accountDetailsForm.pincode || ''}
                                                    onChange={handleAccountDetailChange}
                                                    maxLength={6}
                                                    pattern="[0-9]{6}"
                                                    title="Please enter a 6-digit pincode"
                                                    required
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className={`${styles.button} ${styles.saveButton}`}
                                                disabled={isUpdatingAccount}
                                            >
                                                {isUpdatingAccount ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.button} ${styles.cancel}`}
                                                onClick={handleLogout}
                                                style={{ marginTop: '10px' }}
                                            >
                                                Logout
                                            </button>
                                        </form>
                                    )}

                                    {activeAccountTab === 'addresses' && (
                                        <>
                                            <h3>Your Saved Addresses ({userAddresses.length}/5)</h3>
                                            {isManagingAddresses && <p style={{ textAlign: 'center' }}><FaSpinner className={styles.spinner} /> Loading addresses...</p>}

                                            <div className={styles.addressList}>
                                                {userAddresses.length > 0 ? (
                                                    <ul>
                                                        {userAddresses.map(addr => (
                                                            <li key={addr.id} className={styles.addressItem}>
                                                                <strong>{addr.AddressName}</strong>
                                                                <p>{addr.FullAddress}</p>
                                                                <p>Pincode: {addr.Pincode}</p>
                                                                <div className={styles.addressActions}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleEditAddress(addr)}
                                                                        style={{ backgroundColor: '#00796b' }}
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button type="button" onClick={() => handleDeleteAddress(addr.id)}>
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    !isManagingAddresses && <p style={{ textAlign: 'center', marginBottom: '20px' }}>No addresses saved yet.</p>
                                                )}
                                            </div>

                                            {userAddresses.length < 5 && !showAddressForm && (
                                                <button
                                                    type="button"
                                                    className={`${styles.button} ${styles.addAddressButton}`}
                                                    onClick={() => {
                                                        setAddressForm({ id: null, addressName: '', fullAddress: '', pincode: '' }); // Clear for new
                                                        setShowAddressForm(true);
                                                    }}
                                                >
                                                    <FaPlus /> Add New Address
                                                </button>
                                            )}

                                            {showAddressForm && (
                                                <form onSubmit={handleSaveAddress} className={styles.addressForm}>
                                                    <h3>{addressForm.id ? 'Edit Address' : 'Add New Address'}</h3>
                                                    <div className={styles.formGroup}>
                                                        <label className={styles.label} htmlFor="addr-name">Address Name (e.g., Home, Work)</label>
                                                        <input
                                                            id="addr-name"
                                                            className={styles.input}
                                                            name="addressName"
                                                            required
                                                            value={addressForm.addressName}
                                                            onChange={handleAddressFormChange}
                                                        />
                                                    </div>
                                                    <div className={styles.formGroup}>
                                                        <label className={styles.label} htmlFor="addr-full">Full Address</label>
                                                        <input
                                                            id="addr-full"
                                                            className={styles.input}
                                                            name="fullAddress"
                                                            required
                                                            value={addressForm.fullAddress}
                                                            onChange={handleAddressFormChange}
                                                        />
                                                    </div>
                                                    <div className={styles.formGroup}>
                                                        <label className={styles.label} htmlFor="addr-pincode">Pincode</label>
                                                        <input
                                                            id="addr-pincode"
                                                            type="text"
                                                            className={styles.input}
                                                            name="pincode"
                                                            required
                                                            value={addressForm.pincode}
                                                            onChange={handleAddressFormChange}
                                                            maxLength={6}
                                                            pattern="[0-9]{6}"
                                                            title="Please enter a 6-digit pincode"
                                                        />
                                                    </div>
                                                    <div className={styles.formButtons}>
                                                        <button type="submit" className={styles.modalButton} disabled={isManagingAddresses}>
                                                            {isManagingAddresses ? 'Saving...' : 'Save Address'}
                                                        </button>
                                                        <button type="button" className={`${styles.modalButton} ${styles.cancel}`} onClick={() => {
                                                            setShowAddressForm(false);
                                                            setAddressForm({ id: null, addressName: '', fullAddress: '', pincode: '' });
                                                        }}>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </>
                                    )}

                                    {activeAccountTab === 'yourOrders' && ( // Your Orders Tab Content
                                        <>
                                            <h3>Your Recent Orders</h3>
                                            {isFetchingOrders ? (
                                                <p style={{ textAlign: 'center' }}><FaSpinner className={styles.spinner} /> Loading orders...</p>
                                            ) : Object.keys(userOrders).length > 0 ? (
                                                <div className={styles.ordersList}>
                                                    {Object.keys(userOrders).sort((a, b) => new Date(b) - new Date(a)).map(dateKey => (
                                                        <div key={dateKey} className={styles.orderGroup}>
                                                            <h4>Order Date: {new Date(dateKey).toLocaleDateString()}</h4> {/* Display date for grouping */}
                                                            {/* If orders are grouped by a unique ID, loop through that ID */}
                                                            {/* Assuming userOrders[dateKey] is an array of orders from that date */}
                                                            {userOrders[dateKey] && Array.isArray(userOrders[dateKey]) ? (
                                                                userOrders[dateKey].map((order, orderIndex) => (
                                                                    <div key={`${order.timestamp}-${orderIndex}`} className={styles.orderCard}>
                                                                        <p><strong>Order Time:</strong> {new Date(order.timestamp).toLocaleTimeString()}</p>
                                                                        <p><strong>Delivery Address:</strong> {order.address || 'N/A'}</p>
                                                                        <p><strong>Order Details:</strong> {order.orderDetails}</p>
                                                                        <p className={styles.totalPrice}>Total: ₹{parseFloat(order.totalAmount).toFixed(2)}</p>
                                                                        <p><strong>Ordered Via:</strong> {order.orderType}</p>
                                                                    </div>
                                                                ))
                                                            ) : ( // Fallback if userOrders[dateKey] is not an array (e.g., if it's the grouped object itself)
                                                                <div key={userOrders[dateKey].id} className={styles.orderCard}>
                                                                    <p><strong>Order Time:</strong> {new Date(userOrders[dateKey].timestamp).toLocaleTimeString()}</p>
                                                                    <p><strong>Delivery Address:</strong> {userOrders[dateKey].address || 'N/A'}</p>
                                                                    <p><strong>Order Details:</strong> {userOrders[dateKey].orderDetails}</p>
                                                                    <p className={styles.totalPrice}>Total: ₹{parseFloat(userOrders[dateKey].totalAmount).toFixed(2)}</p>
                                                                    <p><strong>Ordered Via:</strong> {userOrders[dateKey].orderType}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ textAlign: 'center', marginBottom: '20px' }}>No orders found for your account.</p>
                                            )}
                                        </>
                                    )}

                                    {activeAccountTab === 'feedback' && (
                                        <>
                                            <h3>Send Us Your Feedback</h3>
                                            <form onSubmit={handleSubmitFeedback} className={styles.feedbackForm}>
                                                <div className={styles.formGroup}>
                                                    <label className={styles.label} htmlFor="feedback-text">Your Feedback</label>
                                                    <textarea
                                                        id="feedback-text"
                                                        value={feedbackText}
                                                        onChange={handleFeedbackTextChange}
                                                        placeholder="Share your thoughts with us..."
                                                        required
                                                        disabled={isSubmittingFeedback}
                                                    ></textarea>
                                                </div>
                                                <button type="submit" disabled={isSubmittingFeedback || !feedbackText.trim()}>
                                                    {isSubmittingFeedback ? (<><FaSpinner className={styles.spinner} /> Submitting...</>) : 'Submit Feedback'}
                                                </button>
                                            </form>
                                        </>
                                    )}
                                </>
                            ) : (
                                <p style={{ textAlign: 'center', marginTop: '20px' }}>Please log in to view and manage your account details.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- getStaticProps: Fetches Lemon Product Data ---
export async function getStaticProps() {
    let lemons = [];
    try {
        const res = await fetch(LEMONS_DATA_URL);
        if (res.ok && res.status !== 204) {
            lemons = await res.json();
            if (!Array.isArray(lemons)) {
                console.error("Fetched data is not an array:", lemons);
                lemons = [];
            }
        } else {
            console.warn(`Failed to fetch lemons: ${res.status} ${res.statusText}`);
            lemons = []; // Ensure lemons is an array even on error or empty response
        }
    } catch (error) {
        console.error('Error fetching lemons from SheetDB:', error);
        lemons = []; // Ensure lemons is an array even on network error
    }

    // Fallback data if SheetDB fetch fails or returns empty
    if (lemons.length === 0) {
        console.log("Using fallback lemon data.");
        lemons = [
            { id: 1, Grade: 'Eureka Lemon', 'Price Per Kg': 1.50, 'Image': 'lemon-with-leaves.jpg', Description: 'Classic juicy lemons, perfect for beverages.' },
            { id: 2, Grade: 'Meyer Lemon', 'Price Per Kg': 2.00, 'Image': 'sliced-lemon.jpeg', Description: 'Sweeter, less acidic, ideal for desserts and garnishes.' },
            { id: 3, Grade: 'Lisbon Lemon', 'Price Per Kg': 1.75, 'Image': 'basket-of-lemons.jpeg', Description: 'Tart and tangy, great for cooking and zest.' },
            { id: 4, Grade: 'Verna Lemon', 'Price Per Kg': 1.80, 'Image': 'lemon-tree.jpeg', Description: 'Large and flavorful, excellent for juicing.' },
        ];
    }

    // Ensure 'Price Per Kg' is consistent, if some data uses 'Price'
    // This loop ensures that the 'Price Per Kg' property always exists for consistency
    lemons = lemons.map(lemon => ({
        ...lemon,
        'Price Per Kg': parseFloat(lemon['Price Per Kg'] || lemon.Price || 0) // Prioritize 'Price Per Kg', fallback to 'Price'
    }));


    return {
        props: {
            lemons,
        },
        revalidate: 30, // Re-generate page every 30 seconds
    };
}
