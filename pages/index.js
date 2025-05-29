import { useState, useEffect, useContext, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/styles.module.css';
import { AuthContext } from '../pages/_app'; // Adjust path if _app.js is not directly in pages
import { FaShoppingCart, FaUserCircle, FaBars, FaTimes, FaWhatsapp, FaPlusCircle, FaMinusCircle, FaSpinner, FaMapMarkerAlt, FaPencilAlt, FaTrash, FaPlus, FaBox, FaStar } from 'react-icons/fa';

// SheetDB URLs
const LEMONS_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Lemons';
const SIGNUP_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Users';
const ADDRESS_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Addresses';
const FEEDBACK_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Feedback';
const ORDERS_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Orders'; // Sheet for Orders

// Helper for temporary feedback messages
const useTemporaryFeedback = () => {
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const feedbackTimeoutRef = useRef(null);

    const showTemporaryFeedback = (message, type, duration = 3000) => {
        setFeedback({ message, type });
        if (feedbackTimeoutRef.current) {
            clearTimeout(feedbackTimeoutRef.current);
        }
        feedbackTimeoutRef.current = setTimeout(() => {
            setFeedback({ message: '', type: '' });
        }, duration);
    };

    return [feedback, showTemporaryFeedback];
};

export default function Home({ lemons }) {
    const { isLoggedIn, currentUser, login, logout, setCurrentUser } = useContext(AuthContext);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSignUpModal, setShowSignUpModal] = useState(false);
    const [loginForm, setLoginForm] = useState({ name: '', phone: '' });
    const [signUpForm, setSignUpForm] = useState({ name: '', phone: '', address: '', pincode: '' });
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [feedback, showTemporaryFeedback] = useTemporaryFeedback();

    const [activeAccountTab, setActiveAccountTab] = useState('accountDetails');
    const [userAddresses, setUserAddresses] = useState([]);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [currentAddress, setCurrentAddress] = useState(null); // For editing existing address
    const [addressForm, setAddressForm] = useState({
        name: '',
        phone: '',
        houseNumber: '',
        street: '',
        landmark: '',
        pincode: '',
        city: '',
        state: ''
    });
    const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
    const [feedbackText, setFeedbackText] = useState(''); // For user feedback form
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    // New state for orders
    const [orders, setOrders] = useState([{ grade: '', quantity: '' }]);
    const [total, setTotal] = useState(0);

    // New state for user orders (fetched from SheetDB)
    const [userOrders, setUserOrders] = useState([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);


    // --- Effect to load user addresses when logged in and tab changes ---
    useEffect(() => {
        if (isLoggedIn && currentUser && activeAccountTab === 'addresses') {
            fetchUserAddresses();
        }
    }, [isLoggedIn, currentUser, activeAccountTab]);

    // --- Effect to load user orders when logged in and tab changes ---
    useEffect(() => {
        if (isLoggedIn && currentUser && activeAccountTab === 'yourOrders') {
            fetchUserOrders();
        }
    }, [isLoggedIn, currentUser, activeAccountTab]);

    // --- Functions for Login Modal ---
    const openLoginModal = () => {
        setShowLoginModal(true);
        setLoginForm({ name: '', phone: '' }); // Clear login form fields on open
        setFeedback({ message: '', type: '' });
    };

    const closeLoginModal = () => {
        setShowLoginModal(false);
        setLoginForm({ name: '', phone: '' }); // Clear login form fields on close
        setFeedback({ message: '', type: '' });
    };

    const handleLoginFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            if (!/^\d*$/.test(value) || value.length > 10) {
                return;
            }
        }
        setLoginForm(prev => ({ ...prev, [name]: value }));
    };

    // **FIXED: handleLoginSubmit function definition**
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setFeedback({ message: '', type: '' });

        const { name, phone } = loginForm;
        const trimmedName = name.trim();
        const trimmedPhone = phone.trim();

        if (!trimmedName || !trimmedPhone) {
            showTemporaryFeedback('Please enter both your name and phone number to log in.', 'error');
            setIsLoggingIn(false);
            return;
        }

        if (!/^\d{10}$/.test(trimmedPhone)) {
            showTemporaryFeedback('Please enter a valid 10-digit mobile number.', 'error');
            setIsLoggingIn(false);
            return;
        }

        try {
            const res = await fetch(`${SIGNUP_SHEET_URL}?searchField=phone&searchValue=${trimmedPhone}`);
            if (!res.ok && res.status !== 404 && res.status !== 204) {
                throw new Error(`Failed to verify user during login: ${res.status} ${res.statusText}`);
            }

            let users = [];
            if (res.status !== 204 && res.status !== 404) {
                users = await res.json();
            }

            if (!Array.isArray(users)) {
                users = [];
            }

            const foundUser = users.find(user =>
                user.phone === trimmedPhone && user.name.toLowerCase() === trimmedName.toLowerCase()
            );

            if (foundUser) {
                login(foundUser); // Use login from AuthContext
                showTemporaryFeedback(`Welcome back, ${foundUser.name}! 😊`, 'success');
                closeLoginModal();
            } else {
                showTemporaryFeedback('Invalid name or phone number. Please check your credentials or sign up.', 'error');
            }
        } catch (error) {
            console.error('Login process error:', error);
            showTemporaryFeedback('An error occurred during login. Please try again.', 'error');
        } finally {
            setIsLoggingIn(false);
        }
    };


    // --- Functions for Sign Up Modal ---
    const openSignUpModal = () => {
        setShowSignUpModal(true);
        setSignUpForm({ name: '', phone: '', address: '', pincode: '' }); // Clear signup form fields on open
        setFeedback({ message: '', type: '' });
    };

    const closeSignUpModal = () => {
        setShowSignUpModal(false);
        setSignUpForm({ name: '', phone: '', address: '', pincode: '' }); // Clear signup form fields on close
        setFeedback({ message: '', type: '' });
    };

    const handleSignUpFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            if (!/^\d*$/.test(value) || value.length > 10) {
                return;
            }
        }
        setSignUpForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSignUpSubmit = async (e) => {
        e.preventDefault();
        setIsSigningUp(true);
        setFeedback({ message: '', type: '' });

        const { name, phone, address, pincode } = signUpForm;
        const trimmedName = name.trim();
        const trimmedPhone = phone.trim();
        const trimmedAddress = address.trim();
        const trimmedPincode = pincode.trim();

        if (!trimmedName || !trimmedPhone || !trimmedAddress || !trimmedPincode) {
            showTemporaryFeedback('All sign-up fields are required.', 'error');
            setIsSigningUp(false);
            return;
        }

        if (!/^\d{10}$/.test(trimmedPhone)) {
            showTemporaryFeedback('Please enter a valid 10-digit mobile number.', 'error');
            setIsSigningUp(false);
            return;
        }

        if (!/^\d{6}$/.test(trimmedPincode)) {
            showTemporaryFeedback('Please enter a valid 6-digit pincode.', 'error');
            setIsSigningUp(false);
            return;
        }

        try {
            // Check if user already exists
            const existingUserRes = await fetch(`${SIGNUP_SHEET_URL}?searchField=phone&searchValue=${trimmedPhone}`);
            let existingUsers = [];
            if (existingUserRes.ok && existingUserRes.status !== 204) {
                existingUsers = await existingUserRes.json();
                if (!Array.isArray(existingUsers)) existingUsers = [];
            }

            if (existingUsers.length > 0) {
                showTemporaryFeedback('A user with this phone number already exists. Please log in.', 'error');
                setIsSigningUp(false);
                return;
            }

            // Add new user
            const res = await fetch(SIGNUP_SHEURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        Name: trimmedName,
                        Phone: trimmedPhone,
                        Address: trimmedAddress,
                        Pincode: trimmedPincode,
                    },
                }),
            });

            if (res.ok) {
                const newUser = {
                    name: trimmedName,
                    phone: trimmedPhone,
                    address: trimmedAddress,
                    pincode: trimmedPincode
                };
                login(newUser); // Log in the new user immediately
                showTemporaryFeedback('Account created successfully! Welcome! 🎉', 'success');
                closeSignUpModal();
            } else {
                showTemporaryFeedback('Failed to create account. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Sign up error:', error);
            showTemporaryFeedback('An error occurred during sign up. Please try again.', 'error');
        } finally {
            setIsSigningUp(false);
        }
    };

    // --- Logout Function ---
    const handleLogout = () => {
        logout(); // Use logout from AuthContext
        setUserAddresses([]); // Clear addresses on logout
        setUserOrders([]); // Clear orders on logout
        setOrders([{ grade: '', quantity: '' }]); // Reset orders as well
        setTotal(0); // Reset total
        showTemporaryFeedback('You have been logged out.', 'info');
        setIsSidebarOpen(false); // Close sidebar on logout
    };

    // --- Account Details Update ---
    const handleAccountDetailChange = (e) => {
        const { name, value } = e.target;
        setCurrentUser(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateAccountDetails = async (e) => {
        e.preventDefault();
        if (!currentUser || !currentUser.phone) {
            showTemporaryFeedback('No user logged in to update.', 'error');
            return;
        }
        if (!currentUser.name || !currentUser.address || !currentUser.pincode) {
            showTemporaryFeedback('Name, Address, and Pincode cannot be empty.', 'error');
            return;
        }

        try {
            const res = await fetch(`${SIGNUP_SHEET_URL}/phone/${currentUser.phone}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        Name: currentUser.name,
                        Address: currentUser.address,
                        Pincode: currentUser.pincode,
                    },
                }),
            });

            if (res.ok) {
                // Update localStorage via useEffect in _app.js (already handled)
                showTemporaryFeedback('Account details updated successfully! ✅', 'success');
            } else {
                showTemporaryFeedback('Failed to update account details. Try again.', 'error');
            }
        } catch (error) {
            console.error('Error updating account details:', error);
            showTemporaryFeedback('An error occurred while updating details.', 'error');
        }
    };


    // --- Address Management Functions ---
    const fetchUserAddresses = async () => {
        if (!currentUser || !currentUser.phone) return;
        try {
            const res = await fetch(`${ADDRESS_SHEET_URL}?searchField=UserPhone&searchValue=${currentUser.phone}`);
            if (res.ok && res.status !== 204) {
                const addresses = await res.json();
                if (Array.isArray(addresses)) {
                    setUserAddresses(addresses);
                } else {
                    setUserAddresses([]);
                }
            } else {
                setUserAddresses([]);
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
            showTemporaryFeedback('Failed to load addresses.', 'error');
            setUserAddresses([]);
        }
    };

    const openAddressForm = (address = null) => {
        setShowAddressForm(true);
        setCurrentAddress(address); // Set address if editing
        if (address) {
            setAddressForm({
                name: address.Name || '',
                phone: address.Phone || '',
                houseNumber: address.HouseNumber || '',
                street: address.Street || '',
                landmark: address.Landmark || '',
                pincode: address.Pincode || '',
                city: address.City || '',
                state: address.State || ''
            });
        } else {
            // Pre-fill name and phone from currentUser for new address
            setAddressForm({
                name: currentUser?.name || '',
                phone: currentUser?.phone || '',
                houseNumber: '', street: '', landmark: '', pincode: '', city: '', state: ''
            });
        }
        setFeedback({ message: '', type: '' });
    };

    const closeAddressForm = () => {
        setShowAddressForm(false);
        setCurrentAddress(null);
        setAddressForm({ name: '', phone: '', houseNumber: '', street: '', landmark: '', pincode: '', city: '', state: '' });
        setFeedback({ message: '', type: '' });
    };

    const handleAddressFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone' || name === 'pincode') {
            if (!/^\d*$/.test(value)) return; // Only allow digits
            if (name === 'phone' && value.length > 10) return;
            if (name === 'pincode' && value.length > 6) return;
        }
        setAddressForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setIsSubmittingAddress(true);
        setFeedback({ message: '', type: '' });

        const requiredFields = ['name', 'phone', 'houseNumber', 'street', 'pincode', 'city', 'state'];
        for (const field of requiredFields) {
            if (!addressForm[field].trim()) {
                showTemporaryFeedback(`Please fill in the ${field} field.`, 'error');
                setIsSubmittingAddress(false);
                return;
            }
        }

        if (!/^\d{10}$/.test(addressForm.phone)) {
            showTemporaryFeedback('Please enter a valid 10-digit phone number for the address.', 'error');
            setIsSubmittingAddress(false);
            return;
        }
        if (!/^\d{6}$/.test(addressForm.pincode)) {
            showTemporaryFeedback('Please enter a valid 6-digit pincode for the address.', 'error');
            setIsSubmittingAddress(false);
            return;
        }

        const addressData = {
            UserPhone: currentUser.phone, // Link to logged-in user
            Name: addressForm.name.trim(),
            Phone: addressForm.phone.trim(),
            HouseNumber: addressForm.houseNumber.trim(),
            Street: addressForm.street.trim(),
            Landmark: addressForm.landmark.trim(),
            Pincode: addressForm.pincode.trim(),
            City: addressForm.city.trim(),
            State: addressForm.state.trim()
        };

        try {
            let res;
            if (currentAddress) {
                // Update existing address
                res = await fetch(`${ADDRESS_SHEET_URL}/id/${currentAddress.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: addressData }),
                });
            } else {
                // Add new address
                res = await fetch(ADDRESS_SHEET_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: addressData }),
                });
            }

            if (res.ok) {
                showTemporaryFeedback(`Address ${currentAddress ? 'updated' : 'added'} successfully!`, 'success');
                fetchUserAddresses(); // Refresh list
                closeAddressForm();
            } else {
                showTemporaryFeedback(`Failed to ${currentAddress ? 'update' : 'add'} address.`, 'error');
            }
        } catch (error) {
            console.error('Error saving address:', error);
            showTemporaryFeedback('An error occurred while saving the address.', 'error');
        } finally {
            setIsSubmittingAddress(false);
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!confirm('Are you sure you want to delete this address?')) return;
        try {
            const res = await fetch(`${ADDRESS_SHEET_URL}/id/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                showTemporaryFeedback('Address deleted successfully!', 'success');
                fetchUserAddresses(); // Refresh list
            } else {
                showTemporaryFeedback('Failed to delete address.', 'error');
            }
        } catch (error) {
            console.error('Error deleting address:', error);
            showTemporaryFeedback('An error occurred while deleting the address.', 'error');
        }
    };

    // --- Feedback Submission ---
    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        setIsSubmittingFeedback(true);
        setFeedback({ message: '', type: '' });

        if (!feedbackText.trim()) {
            showTemporaryFeedback('Please enter your feedback before submitting.', 'error');
            setIsSubmittingFeedback(false);
            return;
        }

        if (!isLoggedIn || !currentUser) {
            showTemporaryFeedback('Please log in to submit feedback.', 'error');
            setIsSubmittingFeedback(false);
            return;
        }

        const feedbackData = {
            Name: currentUser.name,
            Phone: currentUser.phone,
            Address: currentUser.address, // Assuming currentUser has an address
            Feedback: feedbackText.trim()
        };

        try {
            const res = await fetch(FEEDBACK_SHEET_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: feedbackData }),
            });

            if (res.ok) {
                showTemporaryFeedback('Feedback submitted successfully! Thank you!', 'success');
                setFeedbackText('');
            } else {
                showTemporaryFeedback('Failed to submit feedback. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            showTemporaryFeedback('An error occurred while submitting feedback.', 'error');
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    // --- Order Form and Calculation Logic ---
    const handleOrderChange = (index, field, value) => {
        const updated = [...orders];

        // Handle unique variety selection
        if (field === 'grade') {
            const selectedGrades = updated.map((order, i) => (i === index ? value : order.grade));
            const isDuplicate = selectedGrades.filter(g => g === value && g !== '').length > 1;
            if (isDuplicate) {
                showTemporaryFeedback(`${currentUser?.name || 'You'}, are selecting the same variant again! 🧐`, 'error');
                return; // Prevent update if duplicate
            }
        }

        updated[index][field] = value;
        setOrders(updated);
        calculateTotal(updated);
    };

    const addAnotherVariety = () => {
        setOrders([...orders, { grade: '', quantity: '' }]);
    };

    const removeVariety = (indexToRemove) => {
        const updated = orders.filter((_, index) => index !== indexToRemove);
        setOrders(updated);
        calculateTotal(updated);
    };

    const calculateTotal = (currentOrders) => {
        let currentTotal = 0;
        currentOrders.forEach(order => {
            const lemon = lemons.find(l => l.Grade === order.grade);
            if (lemon && order.quantity) {
                currentTotal += parseFloat(lemon.Price) * parseInt(order.quantity);
            }
        });
        setTotal(currentTotal);
    };

    const handlePlaceOrder = async (orderType) => {
        if (!isLoggedIn || !currentUser) {
            showTemporaryFeedback('Please log in to place an order.', 'error');
            return;
        }

        if (orders.some(order => !order.grade || !order.quantity || parseInt(order.quantity) <= 0)) {
            showTemporaryFeedback('Please ensure all varieties have a selected grade and valid quantity.', 'error');
            return;
        }

        if (total === 0) {
            showTemporaryFeedback('Your order total is zero. Please add items to your cart.', 'error');
            return;
        }

        // Prepare order details for SheetDB
        const orderDetails = orders.map(order => {
            const lemon = lemons.find(l => l.Grade === order.grade);
            return `${lemon.Grade} x ${order.quantity}kg (₹${lemon.Price * order.quantity})`;
        }).join(', ');

        const orderData = {
            Name: currentUser.name,
            Phone: currentUser.phone,
            Address: currentUser.address || 'N/A', // Use existing address or N/A
            Pincode: currentUser.pincode || 'N/A', // Use existing pincode or N/A
            OrderDetails: orderDetails,
            TotalAmount: total,
            Timestamp: new Date().toLocaleString(),
            OrderType: orderType // 'Website' or 'WhatsApp'
        };

        try {
            const res = await fetch(ORDERS_SHEET_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: orderData }),
            });

            if (res.ok) {
                showTemporaryFeedback('Order placed successfully! We will contact you soon.', 'success');
                // Reset order form
                setOrders([{ grade: '', quantity: '' }]);
                setTotal(0);
            } else {
                showTemporaryFeedback('Failed to place order. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            showTemporaryFeedback('An error occurred while placing your order. Please try again.', 'error');
        }
    };

    // --- Fetch User Orders from SheetDB ---
    const fetchUserOrders = async () => {
        if (!currentUser || !currentUser.phone) {
            setUserOrders([]);
            return;
        }
        setIsLoadingOrders(true);
        try {
            const res = await fetch(`${ORDERS_SHEET_URL}?searchField=Phone&searchValue=${currentUser.phone}`);
            if (res.ok && res.status !== 204) {
                const ordersData = await res.json();
                if (Array.isArray(ordersData)) {
                    // Group orders by timestamp or order ID if available (assuming Timestamp is unique enough for grouping)
                    const groupedOrders = ordersData.reduce((acc, order) => {
                        const dateKey = order.Timestamp.split(',')[0].trim(); // Group by date
                        if (!acc[dateKey]) {
                            acc[dateKey] = [];
                        }
                        acc[dateKey].push(order);
                        return acc;
                    }, {});
                    setUserOrders(groupedOrders);
                } else {
                    setUserOrders({}); // No orders found
                }
            } else {
                setUserOrders({}); // No orders found or error
            }
        } catch (error) {
            console.error('Error fetching user orders:', error);
            showTemporaryFeedback('Failed to load your orders.', 'error');
            setUserOrders({});
        } finally {
            setIsLoadingOrders(false);
        }
    };

    // --- WhatsApp Link Generation ---
    const generateWhatsAppLink = () => {
        const phoneNumber = '919539304300'; // Your WhatsApp Business number
        let message = `Hello! I'd like to place an order from your website.\n\n`;

        if (isLoggedIn && currentUser) {
            message += `User Name: ${currentUser.name}\n`;
            message += `User Phone: ${currentUser.phone}\n`;
            message += `User Address: ${currentUser.address || 'Not provided'}\n`;
            message += `User Pincode: ${currentUser.pincode || 'Not provided'}\n\n`;
        } else {
            message += `(Please provide your name, phone, and address in the chat)\n\n`;
        }

        if (orders.some(order => order.grade && order.quantity)) {
            message += `My Order:\n`;
            orders.forEach((order, index) => {
                const lemon = lemons.find(l => l.Grade === order.grade);
                if (lemon && order.quantity) {
                    message += `- ${lemon.Grade} - ${order.quantity}kg (₹${lemon.Price * order.quantity})\n`;
                }
            });
            message += `\nTotal: ₹${total}\n\n`;
        } else {
            message += `(No specific items selected on the form. Please mention your desired items.)\n\n`;
        }

        message += `Thank you!`;
        return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    };

    // --- Main Render ---
    return (
        <div className={styles.page}>
            <Head>
                <title>3 Lemons - Fresh from Our Farm</title>
                <meta name="description" content="Get the freshest lemons directly from the farm." />
                <link rel="icon" href="/favicon.ico" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
            </Head>

            {/* Header */}
            <header className={styles.header}>
                <h1 className={styles.headerTitle}>3 Lemons</h1>
                <div className={styles.headerActions}>
                    {isLoggedIn ? (
                        <button className={styles.loginButton} onClick={() => setIsSidebarOpen(true)}>
                            <FaUserCircle /> Hello, {currentUser?.name || 'User'}
                        </button>
                    ) : (
                        <button className={styles.loginButton} onClick={openLoginModal}>
                            <FaUserCircle /> Login
                        </button>
                    )}
                    <div className={styles.hamburgerIcon} onClick={() => setIsSidebarOpen(true)}>
                        <FaBars />
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className={styles.hero}>
                <Image
                    src="/hero-lemons.jpg"
                    alt="Fresh Lemons"
                    layout="fill"
                    objectFit="cover"
                    priority
                    className={styles.heroImage}
                />
                <div className={styles.heroOverlay}>
                    <h2 className={styles.heroTitle}>Farm Fresh Lemons Delivered</h2>
                    <p className={styles.heroSubtitle}>Experience the tang and zest of our finest lemons, picked just for you!</p>
                    <a href="#order-now" className={styles.heroButton}>Order Now</a>
                </div>
            </section>

            {/* Main Content Container */}
            <main className={styles.container}>
                {feedback.message && (
                    <div className={`${styles.feedbackMessage} ${styles[`feedback${feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}`]}`}>
                        {feedback.message}
                    </div>
                )}

                {/* Lemon Products Section */}
                <section id="lemons" className={styles.lemonsSection}>
                    <h2 className={styles.sectionTitle}>Our Varieties</h2>
                    <div className={styles.lemonsGrid}>
                        {lemons.map((lemon) => (
                            <div key={lemon.id} className={styles.lemonCard}>
                                <Image
                                    src={`/${lemon.Image}`} // Assuming image paths are in public folder
                                    alt={lemon.Grade}
                                    width={300}
                                    height={220}
                                    className={styles.cardImage}
                                />
                                <h3 className={styles.cardTitle}>{lemon.Grade} Lemons</h3>
                                <p className={styles.cardDescription}>{lemon.Description}</p>
                                <p className={styles.cardDescription}>Price: ₹{lemon.Price}/kg</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Order Form Section */}
                <section id="order-now" className={styles.formSection}>
                    <h2 className={styles.sectionTitle}>Place Your Order</h2>
                    <form className={styles.form}>
                        {orders.map((order, index) => (
                            <div key={index} className={styles.inputGrid}>
                                <div className={styles.formGroup}>
                                    <label htmlFor={`grade-${index}`} className={styles.label}>Variety</label>
                                    <select
                                        id={`grade-${index}`}
                                        name="grade"
                                        className={styles.select}
                                        value={order.grade}
                                        onChange={(e) => handleOrderChange(index, 'grade', e.target.value)}
                                        required
                                    >
                                        <option value="">Select a Variety</option>
                                        {lemons.map(lemon => (
                                            <option key={lemon.id} value={lemon.Grade}>{lemon.Grade}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor={`quantity-${index}`} className={styles.label}>Quantity (kg)</label>
                                    <input
                                        type="number"
                                        id={`quantity-${index}`}
                                        name="quantity"
                                        className={styles.input}
                                        value={order.quantity}
                                        onChange={(e) => handleOrderChange(index, 'quantity', e.target.value)}
                                        min="0.5"
                                        step="0.5"
                                        required
                                    />
                                </div>
                                {orders.length > 1 && (
                                    <button
                                        type="button"
                                        className={styles.removeVarietyButton}
                                        onClick={() => removeVariety(index)}
                                    >
                                        <FaMinusCircle />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" className={styles.addVarietyButton} onClick={addAnotherVariety}>
                            <FaPlusCircle style={{ marginRight: '8px' }} /> Add Another Variety
                        </button>
                        <div className={styles.orderSummary}>
                            <h3>Total: ₹{total.toFixed(2)}</h3>
                        </div>

                        <button type="button" className={styles.button} onClick={() => handlePlaceOrder('Website')}>
                            Place Order on Website
                        </button>
                        <a href={generateWhatsAppLink()} target="_blank" rel="noopener noreferrer" className={`${styles.button} ${styles.whatsappButton}`} onClick={() => handlePlaceOrder('WhatsApp')}>
                            <FaWhatsapp className={styles.whatsappIcon} /> Place Order on WhatsApp
                        </a>
                    </form>
                </section>

                {/* Customer Reviews Section */}
                <section id="reviews" className={styles.reviewsSection}>
                    <h2 className={styles.sectionTitle}>What Our Customers Say</h2>
                    <div className={styles.reviewsGrid}>
                        <div className={styles.reviewCard}>
                            <div className={styles.reviewerRating}>
                                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                            </div>
                            <p className={styles.reviewText}>&quot;The freshest lemons I&apos;ve ever tasted! Perfect for my morning lemonade. Delivery was super fast too.&quot;</p>
                            <p className={styles.reviewerName}>- Priya Sharma</p>
                        </div>
                        <div className={styles.reviewCard}>
                            <div className={styles.reviewerRating}>
                                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                            </div>
                            <p className={styles.reviewText}>&quot;Excellent quality and consistent supply. My restaurant relies on these lemons. Highly recommended!&quot;</p>
                            <p className={styles.reviewerName}>- Chef Anand Rao</p>
                        </div>
                        <div className={styles.reviewCard}>
                            <div className={styles.reviewerRating}>
                                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                            </div>
                            <p className={styles.reviewText}>&quot;So convenient to get fresh lemons delivered home. They truly are farm fresh. My family loves them!&quot;</p>
                            <p className={styles.reviewerName}>- Rajesh Kumar</p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className={styles.footer}>
                <p>&copy; {new Date().getFullYear()} 3 Lemons. All rights reserved.</p>
                <p>Designed with <span role="img" aria-label="heart">❤️</span> by Your Name/Company</p>
                <p><a href="mailto:support@3lemons.com">support@3lemons.com</a></p>
            </footer>

            {/* Login Modal */}
            <div className={`${styles.modalOverlay} ${showLoginModal ? styles.visible : ''}`}>
                <div className={styles.modalContent}>
                    <button className={styles.modalCloseButton} onClick={closeLoginModal}><FaTimes /></button>
                    <h2 className={styles.modalTitle}>Login</h2>
                    {feedback.message && (
                        <div className={`${styles.feedbackMessage} ${styles[`feedback${feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}`]}`}>
                            {feedback.message}
                        </div>
                    )}
                    <form onSubmit={handleLoginSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="loginName" className={styles.label}>Name</label>
                            <input
                                type="text"
                                id="loginName"
                                name="name"
                                className={styles.input}
                                value={loginForm.name}
                                onChange={handleLoginFormChange}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="loginPhone" className={styles.label}>Phone Number</label>
                            <input
                                type="tel"
                                id="loginPhone"
                                name="phone"
                                className={styles.input}
                                value={loginForm.phone}
                                onChange={handleLoginFormChange}
                                required
                                maxLength="10"
                                pattern="\d{10}"
                                title="Please enter a 10-digit phone number"
                            />
                        </div>
                        <div className={styles.modalButtons}>
                            <button type="submit" className={styles.modalButton} disabled={isLoggingIn}>
                                {isLoggingIn ? <FaSpinner className={styles.spinner} /> : 'Login'}
                            </button>
                            <button type="button" className={`${styles.modalButton} ${styles.cancel}`} onClick={closeLoginModal}>
                                Cancel
                            </button>
                        </div>
                    </form>
                    <p className={styles.modalText} style={{ textAlign: 'center', marginTop: '20px' }}>
                        Don&apos;t have an account? <a href="#" onClick={() => { closeLoginModal(); openSignUpModal(); }}>Sign Up Here</a>
                    </p>
                </div>
            </div>

            {/* Sign Up Modal */}
            <div className={`${styles.modalOverlay} ${showSignUpModal ? styles.visible : ''}`}>
                <div className={styles.modalContent}>
                    <button className={styles.modalCloseButton} onClick={closeSignUpModal}><FaTimes /></button>
                    <h2 className={styles.modalTitle}>Sign Up</h2>
                    {feedback.message && (
                        <div className={`${styles.feedbackMessage} ${styles[`feedback${feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}`]}`}>
                            {feedback.message}
                        </div>
                    )}
                    <form onSubmit={handleSignUpSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="signUpName" className={styles.label}>Name</label>
                            <input
                                type="text"
                                id="signUpName"
                                name="name"
                                className={styles.input}
                                value={signUpForm.name}
                                onChange={handleSignUpFormChange}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="signUpPhone" className={styles.label}>Phone Number</label>
                            <input
                                type="tel"
                                id="signUpPhone"
                                name="phone"
                                className={styles.input}
                                value={signUpForm.phone}
                                onChange={handleSignUpFormChange}
                                required
                                maxLength="10"
                                pattern="\d{10}"
                                title="Please enter a 10-digit phone number"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="signUpAddress" className={styles.label}>Address</label>
                            <textarea
                                id="signUpAddress"
                                name="address"
                                className={styles.input}
                                value={signUpForm.address}
                                onChange={handleSignUpFormChange}
                                required
                                rows="3"
                            ></textarea>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="signUpPincode" className={styles.label}>Pincode</label>
                            <input
                                type="text"
                                id="signUpPincode"
                                name="pincode"
                                className={styles.input}
                                value={signUpForm.pincode}
                                onChange={handleSignUpFormChange}
                                required
                                maxLength="6"
                                pattern="\d{6}"
                                title="Please enter a 6-digit pincode"
                            />
                        </div>
                        <div className={styles.modalButtons}>
                            <button type="submit" className={styles.modalButton} disabled={isSigningUp}>
                                {isSigningUp ? <FaSpinner className={styles.spinner} /> : 'Sign Up'}
                            </button>
                            <button type="button" className={`${styles.modalButton} ${styles.cancel}`} onClick={closeSignUpModal}>
                                Cancel
                            </button>
                        </div>
                    </form>
                    <p className={styles.modalText} style={{ textAlign: 'center', marginTop: '20px' }}>
                        Already have an account? <a href="#" onClick={() => { closeSignUpModal(); openLoginModal(); }}>Login Here</a>
                    </p>
                </div>
            </div>

            {/* Account Sidebar */}
            <div className={`${styles.accountSidebarOverlay} ${isSidebarOpen ? styles.visible : ''}`} onClick={() => setIsSidebarOpen(false)}>
                <div className={`${styles.accountSidebar} ${isSidebarOpen ? styles.open : ''}`} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.sidebarHeader}>
                        <h2 className={styles.sidebarTitle}>My Account</h2>
                        <button className={styles.sidebarCloseButton} onClick={() => setIsSidebarOpen(false)}><FaTimes /></button>
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
                                {feedback.message && (
                                    <div className={`${styles.feedbackMessage} ${styles[`feedback${feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}`]}`}>
                                        {feedback.message}
                                    </div>
                                )}

                                {activeAccountTab === 'accountDetails' && currentUser && (
                                    <form className={styles.accountDetailsForm} onSubmit={handleUpdateAccountDetails}>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="userName" className={styles.label}>Name</label>
                                            <input
                                                type="text"
                                                id="userName"
                                                name="name"
                                                className={styles.input}
                                                value={currentUser.name || ''}
                                                onChange={handleAccountDetailChange}
                                                required
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="userPhone" className={styles.label}>Phone Number</label>
                                            <input
                                                type="tel"
                                                id="userPhone"
                                                name="phone"
                                                className={styles.input}
                                                value={currentUser.phone || ''}
                                                onChange={handleAccountDetailChange}
                                                maxLength="10"
                                                pattern="\d{10}"
                                                title="Please enter a 10-digit phone number"
                                                disabled // Phone number usually not editable for account key
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="userAddress" className={styles.label}>Address</label>
                                            <textarea
                                                id="userAddress"
                                                name="address"
                                                className={styles.input}
                                                value={currentUser.address || ''}
                                                onChange={handleAccountDetailChange}
                                                required
                                                rows="3"
                                            ></textarea>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="userPincode" className={styles.label}>Pincode</label>
                                            <input
                                                type="text"
                                                id="userPincode"
                                                name="pincode"
                                                className={styles.input}
                                                value={currentUser.pincode || ''}
                                                onChange={handleAccountDetailChange}
                                                required
                                                maxLength="6"
                                                pattern="\d{6}"
                                                title="Please enter a 6-digit pincode"
                                            />
                                        </div>
                                        <button type="submit" className={styles.button}>Update Details</button>
                                        <button type="button" className={`${styles.button} ${styles.cancel}`} onClick={handleLogout}>Logout</button>
                                    </form>
                                )}

                                {activeAccountTab === 'addresses' && (
                                    <>
                                        <h3>Your Saved Addresses</h3>
                                        {userAddresses.length === 0 && !showAddressForm && <p>No addresses saved yet. Add one!</p>}
                                        <div className={styles.addressList}>
                                            <ul>
                                                {userAddresses.map(address => (
                                                    <li key={address.id} className={styles.addressItem}>
                                                        <strong>{address.Name}</strong>
                                                        <p>{address.HouseNumber}, {address.Street}</p>
                                                        <p>{address.Landmark && `${address.Landmark}, `}{address.City}, {address.State} - {address.Pincode}</p>
                                                        <p>Phone: {address.Phone}</p>
                                                        <div className={styles.addressActions}>
                                                            <button onClick={() => openAddressForm(address)}><FaPencilAlt /> Edit</button>
                                                            <button onClick={() => handleDeleteAddress(address.id)}><FaTrash /> Delete</button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <button className={styles.addAddressButton} onClick={() => openAddressForm()}>
                                            <FaPlus /> Add New Address
                                        </button>

                                        {showAddressForm && (
                                            <form className={styles.addressForm} onSubmit={handleSaveAddress}>
                                                <h4>{currentAddress ? 'Edit Address' : 'Add New Address'}</h4>
                                                <div className={styles.formGroup}>
                                                    <label htmlFor="addressName" className={styles.label}>Name</label>
                                                    <input type="text" id="addressName" name="name" className={styles.input} value={addressForm.name} onChange={handleAddressFormChange} required />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label htmlFor="addressPhone" className={styles.label}>Phone Number</label>
                                                    <input type="tel" id="addressPhone" name="phone" className={styles.input} value={addressForm.phone} onChange={handleAddressFormChange} required maxLength="10" />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label htmlFor="houseNumber" className={styles.label}>House Number</label>
                                                    <input type="text" id="houseNumber" name="houseNumber" className={styles.input} value={addressForm.houseNumber} onChange={handleAddressFormChange} required />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label htmlFor="street" className={styles.label}>Street</label>
                                                    <input type="text" id="street" name="street" className={styles.input} value={addressForm.street} onChange={handleAddressFormChange} required />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label htmlFor="landmark" className={styles.label}>Landmark (Optional)</label>
                                                    <input type="text" id="landmark" name="landmark" className={styles.input} value={addressForm.landmark} onChange={handleAddressFormChange} />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label htmlFor="pincode" className={styles.label}>Pincode</label>
                                                    <input type="text" id="pincode" name="pincode" className={styles.input} value={addressForm.pincode} onChange={handleAddressFormChange} required maxLength="6" />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label htmlFor="city" className={styles.label}>City</label>
                                                    <input type="text" id="city" name="city" className={styles.input} value={addressForm.city} onChange={handleAddressFormChange} required />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label htmlFor="state" className={styles.label}>State</label>
                                                    <input type="text" id="state" name="state" className={styles.input} value={addressForm.state} onChange={handleAddressFormChange} required />
                                                </div>
                                                <div className={styles.formButtons}>
                                                    <button type="button" className={`${styles.button} ${styles.cancel}`} onClick={closeAddressForm}>Cancel</button>
                                                    <button type="submit" className={styles.button} disabled={isSubmittingAddress}>
                                                        {isSubmittingAddress ? <FaSpinner className={styles.spinner} /> : (currentAddress ? 'Update Address' : 'Save Address')}
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </>
                                )}

                                {activeAccountTab === 'yourOrders' && (
                                    <>
                                        <h3>Your Orders</h3>
                                        {isLoadingOrders ? (
                                            <p><FaSpinner className={styles.spinner} /> Loading your orders...</p>
                                        ) : Object.keys(userOrders).length === 0 ? (
                                            <p>You haven&apos;t placed any orders yet.</p>
                                        ) : (
                                            <div className={styles.ordersList}>
                                                {Object.keys(userOrders).sort((a,b) => new Date(b) - new Date(a)).map(date => (
                                                    <div key={date} className={styles.orderGroup}>
                                                        <h4>Orders on {date}</h4>
                                                        {userOrders[date].map((order, index) => (
                                                            <div key={`${order.Timestamp}-${index}`} className={styles.orderCard}>
                                                                <p><strong>Order Time:</strong> {order.Timestamp.split(',')[1].trim()}</p>
                                                                <p><strong>Order Details:</strong></p>
                                                                <ul>
                                                                    {order.OrderDetails.split(', ').map((item, i) => (
                                                                        <li key={i}>{item}</li>
                                                                    ))}
                                                                </ul>
                                                                <p className={styles.totalPrice}><strong>Total:</strong> ₹{parseFloat(order.TotalAmount).toFixed(2)}</p>
                                                                <p><strong>Status:</strong> Pending (Contact us for updates)</p>
                                                                <p><strong>Ordered Via:</strong> {order.OrderType}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}


                                {activeAccountTab === 'feedback' && (
                                    <>
                                        <h3>Give Us Feedback</h3>
                                        <form className={styles.feedbackForm} onSubmit={handleSubmitFeedback}>
                                            <label htmlFor="feedbackText" className={styles.label}>Your Message</label>
                                            <textarea
                                                id="feedbackText"
                                                value={feedbackText}
                                                onChange={(e) => setFeedbackText(e.target.value)}
                                                placeholder="Share your thoughts on our lemons, service, or website..."
                                                required
                                            ></textarea>
                                            <button type="submit" disabled={isSubmittingFeedback}>
                                                {isSubmittingFeedback ? <FaSpinner className={styles.spinner} /> : 'Submit Feedback'}
                                            </button>
                                        </form>
                                    </>
                                )}
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                                <p>Please log in to manage your account.</p>
                                <button className={styles.button} onClick={() => { setIsSidebarOpen(false); openLoginModal(); }}>
                                    Login Now
                                </button>
                                <p style={{ marginTop: '20px' }}>Don&apos;t have an account? <a href="#" onClick={() => { setIsSidebarOpen(false); openSignUpModal(); }}>Sign Up Here</a></p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export async function getStaticProps() {
    let lemons = [];
    try {
        const res = await fetch(LEMONS_SHEET_URL);
        if (res.ok && res.status !== 204) {
            lemons = await res.json();
            if (!Array.isArray(lemons)) {
                console.error("Fetched data is not an array:", lemons);
                lemons = [];
            }
        } else {
            console.warn(`Failed to fetch lemons: ${res.status} ${res.statusText}`);
            // Fallback for empty or error response
            lemons = [];
        }
    } catch (error) {
        console.error('Error fetching lemons from SheetDB:', error);
        lemons = []; // Ensure lemons is an array even on error
    }

    // Fallback data if SheetDB fetch fails or returns empty
    if (lemons.length === 0) {
        console.log("Using fallback lemon data.");
        lemons = [
            { id: 1, Grade: 'Eureka', Description: 'Juicy and highly acidic, perfect for lemonade and cooking.', Price: '80', Image: 'lemon-eureka.jpg' },
            { id: 2, Grade: 'Meyer', Description: 'Sweeter and less acidic with a hint of orange. Great for desserts.', Price: '120', Image: 'lemon-meyer.jpg' },
            { id: 3, Grade: 'Lisbon', Description: 'Classic tart lemon, robust and versatile for all culinary uses.', Price: '75', Image: 'lemon-lisbon.jpg' },
        ];
    }

    return {
        props: {
            lemons,
        },
        revalidate: 30, // Re-generate page every 30 seconds
    };
}
