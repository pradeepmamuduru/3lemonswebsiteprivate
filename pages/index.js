import React, { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/styles.module.css'; // Make sure this import is present [cite: 2]
import { FaWhatsapp, FaStar, FaUserCircle, FaPlus, FaMinus, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaSpinner } from 'react-icons/fa'; // Updated icon imports
import { IoCloseCircleOutline, IoMenu } from 'react-icons/io5'; // IoMenu for hamburger, IoCloseCircleOutline for close buttons [cite: 4]

// SheetDB API URLs (REPLACE THESE WITH YOUR ACTUAL SHEETDB URLS)
// IMPORTANT: Verify these URLs against your SheetDB dashboard.
// If your SheetDB is not set up, these will fail. [cite: 5]
const LEMONS_DATA_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Lemons'; // Your Lemons data SheetDB URL [cite: 5, 6]
const ORDERS_SUBMISSION_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=orders'; // Your Orders submission SheetDB URL [cite: 6]
const SIGNUP_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=signup'; // Your Signup/Users SheetDB URL [cite: 7]
const ADDRESSES_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Addresses'; // Your Addresses SheetDB URL [cite: 7]
const FEEDBACK_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Feedback'; // Your Feedback SheetDB URL [cite: 7]

// --- Home Component ---
export default function Home({ lemons }) {
    // Order form states
    const [orders, setOrders] = useState([{ grade: '', quantity: '' }]); // [cite: 7]
    const [form, setForm] = useState({ name: '', delivery: '', contact: '' }); // [cite: 8]
    const [total, setTotal] = useState(0); // [cite: 8]
    const [isSubmitting, setIsSubmitting] = useState(false); // [cite: 9]

    // Consolidated Feedback State (for all messages: order, signup, login, logout, account)
    const [feedback, setFeedback] = useState({ message: '', type: '' }); // [cite: 9, 10]
    // type: 'success', 'error', 'info'

    // Modal states for order confirmation/success
    const [showConfirmModal, setShowConfirmModal] = useState(false); // [cite: 10]
    const [showSuccessModal, setShowSuccessModal] = useState(false); // [cite: 11]
    const [confirmedOrderDetails, setConfirmedOrderDetails] = useState(null); // [cite: 11]

    // User authentication/account states
    const [isLoggedIn, setIsLoggedIn] = useState(false); // [cite: 12]
    const [loggedInUser, setLoggedInUser] = useState(null); // Stores { name, phone, address, pincode } [cite: 12, 13]
    const [showSignUpPromptModal, setShowSignUpPromptModal] = useState(false); // "Please sign up to order" modal [cite: 13, 14]
    const [showSignUpModal, setShowSignUpModal] = useState(false); // Actual signup form modal [cite: 14, 15]
    const [signUpForm, setSignUpForm] = useState({ name: '', phone: '', address: '', pincode: '' }); // [cite: 15, 16]
    const [isSigningUp, setIsSigningUp] = useState(false); // [cite: 16]

    // NEW: Login Modal states
    const [showLoginModal, setShowLoginModal] = useState(false); // [cite: 16, 17]
    const [loginForm, setLoginForm] = useState({ name: '', phone: '' }); // [cite: 17]
    const [isLoggingIn, setIsLoggingIn] = useState(false); // [cite: 17, 18]

    // Account Sidebar states
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // [cite: 18]
    const [activeAccountTab, setActiveAccountTab] = useState('accountDetails'); // 'accountDetails', 'addresses', 'feedback' [cite: 18, 19]
    const [userAddresses, setUserAddresses] = useState([]); // Stores addresses fetched from SheetDB [cite: 19, 20]
    const [accountDetailsForm, setAccountDetailsForm] = useState({ name: '', phone: '', address: '', pincode: '' }); // For editing in sidebar [cite: 20, 21]
    const [isUpdatingAccount, setIsUpdatingAccount] = useState(false); // Loading state for account updates [cite: 21, 22]
    const [addressForm, setAddressForm] = useState({ id: null, addressName: '', fullAddress: '', pincode: '' }); // For adding/editing addresses [cite: 22, 23]
    const [showAddressForm, setShowAddressForm] = useState(false); // To show/hide add/edit address form [cite: 23, 24]
    const [isManagingAddresses, setIsManagingAddresses] = useState(false); // Loading state for address actions [cite: 24, 25]

    // Feedback specific states for the sidebar feedback tab
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [feedbackSubmittedMessage, setFeedbackSubmittedMessage] = useState(''); // To show 'Thank you' message specifically for feedback form

    // Hardcoded customer reviews
    const customerReviews = useMemo(() => [
        { id: 1, text: "The lemons from 3 Lemons Traders are incredibly fresh and juicy! Perfect for my restaurant.", name: "Chef Rahul S.", rating: 5 }, [cite: 25]
        { id: 2, text: "Excellent quality and timely delivery. Their A1 grade lemons are truly the best.", name: "Priya M.", rating: 5 },
        { id: 3, text: "Great prices for bulk orders. The team is very responsive and helpful.", name: "Kiran R.", rating: 4 }, [cite: 26]
        { id: 4, text: "Consistently good quality. My go-to for all lemon needs.", name: "Amit P.", rating: 5 },
        { id: 5, text: "Freshness guaranteed every time. Highly recommend!", name: "Sunita D.", rating: 5 },
    ], []); // [cite: 26]

    // --- Utility for showing temporary messages ---
    const showTemporaryFeedback = useCallback((message, type = 'info', duration = 5000) => {
        setFeedback({ message, type }); // [cite: 27]
        const timer = setTimeout(() => setFeedback({ message: '', type: '' }), duration); // [cite: 27]
        return () => clearTimeout(timer); // Cleanup on unmount or re-render [cite: 27]
    }, []);

    // --- Effects for loading/saving user data and calculating total ---
    useEffect(() => {
        calculateTotal(); // [cite: 28]
    }, [orders, lemons]); // [cite: 28]

    // Load account details from local storage on component mount
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('loggedInUser'); // [cite: 29]
            if (storedUser) {
                const user = JSON.parse(storedUser); // [cite: 29]
                setLoggedInUser(user); // [cite: 29]
                setIsLoggedIn(true); // [cite: 30]
                setAccountDetailsForm(user); // Initialize sidebar form with logged in user [cite: 30]
                // Auto-populate form with saved details if available [cite: 30]
                setForm(prevForm => ({
                    ...prevForm,
                    name: user.name || prevForm.name, // [cite: 31]
                    contact: user.phone || prevForm.contact, // [cite: 31]
                    delivery: user.address || prevForm.delivery, // [cite: 31]
                }));
                showTemporaryFeedback(`Welcome back, ${user.name}! 😊`, 'success'); // [cite: 31]
            }
        } catch (error) {
            console.error("Failed to parse loggedInUser from localStorage:", error); // [cite: 32]
            localStorage.removeItem('loggedInUser'); // Clear corrupted data [cite: 32]
            setIsLoggedIn(false); // [cite: 33]
            setLoggedInUser(null); // [cite: 33]
        }
    }, [showTemporaryFeedback]); // [cite: 34]

    // Effect to fetch addresses when user logs in or addresses change
    useEffect(() => {
        if (isLoggedIn && loggedInUser?.phone) {
            fetchUserAddresses(loggedInUser.phone); // This will correctly fetch and update userAddresses
        } else {
            setUserAddresses([]); // Clear addresses if logged out
        }
    }, [isLoggedIn, loggedInUser?.phone, fetchUserAddresses]); // Depend on login status, user phone, and fetchUserAddresses callback

    // --- Handlers for main order form changes ---
    const handleOrderChange = (index, field, value) => {
        const updated = [...orders]; // [cite: 35]

        if (field === 'quantity') { // [cite: 36]
            value = value === '' ? '' : String(Math.max(1, parseInt(value) || 1)); // [cite: 37]
        }

        // Handle unique variety selection
        if (field === 'grade') {
            const selectedGrades = updated.map((order, i) => (i === index ? value : order.grade));
            const isDuplicate = selectedGrades.filter(g => g === value && g !== '').length > 1;

            if (isDuplicate) {
                showTemporaryFeedback(`Variety "${value}" is already selected. Please choose a different one.`, 'error');
                return; // Prevent update if duplicate
            }
        }

        updated[index][field] = value; // [cite: 37]
        setOrders(updated); // [cite: 37]
    };

    const handleAddVariety = () => {
        // Prevent adding new variety if the last one is empty
        const lastOrder = orders[orders.length - 1];
        if (lastOrder.grade === '' || lastOrder.quantity === '') {
            showTemporaryFeedback('Please complete the current variety selection before adding a new one.', 'info');
            return;
        }

        setOrders([...orders, { grade: '', quantity: '' }]); // [cite: 38]
    };

    const handleRemoveVariety = (index) => {
        const updated = orders.filter((_, i) => i !== index); // [cite: 39]
        setOrders(updated.length > 0 ? updated : [{ grade: '', quantity: '' }]); // Ensure at least one row remains [cite: 40, 41]
        showTemporaryFeedback('Variety removed.', 'info'); // Add feedback for removal
    };

    const calculateTotal = useCallback(() => { // Wrapped in useCallback
        let totalPrice = 0; // [cite: 42]
        orders.forEach(order => { // [cite: 43]
            const lemon = lemons.find(l => l.Grade === order.grade); // [cite: 43]
            if (lemon) { // [cite: 43]
                const pricePerKg = parseFloat(lemon['Price Per Kg']); // [cite: 43]
                const quantity = parseInt(order.quantity); // [cite: 43]

                if (!isNaN(pricePerKg) && !isNaN(quantity) && quantity > 0) { // [cite: 43]
                    let itemPrice = pricePerKg * quantity; // [cite: 44]
                    if (quantity > 50) { // [cite: 44]
                        itemPrice *= 0.90; // 10% discount for quantity > 50 [cite: 44, 45]
                    }
                    totalPrice += itemPrice; // [cite: 45]
                }
            }
        });
        setTotal(totalPrice); // [cite: 46]
    }, [orders, lemons]); // Dependencies for useCallback

    // --- Main Order Submission Flow (now checks login status) ---
    const handleSubmit = async (e) => {
        e.preventDefault(); // [cite: 47]
        setFeedback({ message: '', type: '' }); // Clear any previous messages immediately [cite: 47]

        // --- Client-Side Form Validation ---
        if (!form.name.trim() || !form.delivery.trim() || !form.contact.trim()) {
            showTemporaryFeedback('Please fill in all your personal details (Name, Delivery Address, Contact).', 'error'); // [cite: 47, 48]
            return;
        }
        if (!/^\d{10}$/.test(form.contact)) {
            showTemporaryFeedback('Please enter a valid 10-digit contact number.', 'error'); // [cite: 48, 49]
            return;
        }

        const validOrders = orders.filter(order => order.grade && order.quantity && parseInt(order.quantity) > 0); // [cite: 49, 50]
        if (validOrders.length === 0) { // [cite: 50]
            showTemporaryFeedback('Please add at least one lemon variety with a valid quantity (must be 1 or more).', 'error'); // [cite: 50, 51]
            return;
        }
        const hasInvalidQuantity = orders.some(order => { // [cite: 51]
            return (order.grade && (order.quantity === '' || isNaN(parseInt(order.quantity)) || parseInt(order.quantity) <= 0)); // [cite: 51]
        });
        if (hasInvalidQuantity) { // [cite: 52]
            showTemporaryFeedback('Please ensure all selected varieties have a valid quantity (1 or more).', 'error'); // [cite: 52, 53]
            return;
        }
        // --- End Validation ---

        // --- Authentication Check (when ordering) ---
        // This is the existing flow for users who are not explicitly logged in via the login button,
        // but are attempting to order. [cite: 53, 54]
        if (!isLoggedIn) { // [cite: 54]
            setIsSubmitting(true); // Show loading state while checking user [cite: 54, 55]
            try {
                const checkRes = await fetch(`${SIGNUP_SHEET_URL}?searchField=phone&searchValue=${form.contact}`); // [cite: 55, 56]
                if (!checkRes.ok && checkRes.status !== 404 && checkRes.status !== 204) { // 404 and 204 mean no data, which is fine. Other non-ok statuses are errors. [cite: 56, 57]
                    throw new Error(`Failed to check existing users: ${checkRes.status} ${checkRes.statusText}`); // [cite: 57, 58]
                }

                let existingUsers = []; // [cite: 58]
                // Only attempt to parse JSON if content is expected [cite: 59]
                if (checkRes.status !== 204 && checkRes.status !== 404) { // [cite: 59]
                    existingUsers = await checkRes.json(); // [cite: 59, 60]
                }

                // Ensure existingUsers is an array [cite: 60]
                if (!Array.isArray(existingUsers)) { // [cite: 60]
                    existingUsers = []; // [cite: 61]
                }

                if (existingUsers.length > 0) { // [cite: 61]
                    // User exists, "log them in"
                    const user = existingUsers[0]; // [cite: 61, 62]
                    localStorage.setItem('loggedInUser', JSON.stringify(user)); // [cite: 62]
                    setLoggedInUser(user); // [cite: 62]
                    setIsLoggedIn(true); // [cite: 62]
                    setAccountDetailsForm(user); // Sync sidebar form [cite: 62]
                    showTemporaryFeedback(`Welcome back, ${user.name}! 😊`, 'success'); // [cite: 62, 63]
                    // Auto-fill order form (already done by useEffect, but ensure consistency) [cite: 63]
                    setForm(prevForm => ({
                        ...prevForm,
                        name: user.name || '', // [cite: 63, 64]
                        contact: user.phone || '', // [cite: 64]
                        delivery: user.address || '', // [cite: 64]
                    }));
                    setIsSubmitting(false); // [cite: 65]
                    // Now that user is logged in, proceed to show confirmation modal
                    // Re-call handleSubmit to trigger the confirmation modal logic
                    const dummyEvent = { preventDefault: () => { } }; // [cite: 65, 66]
                    handleSubmit(dummyEvent); // <--- Recursive call to proceed after login [cite: 66]
                    return; // Exit to prevent further execution in this call [cite: 66, 67]
                } else {
                    // User does not exist, prompt for signup [cite: 67]
                    setIsSubmitting(false); // [cite: 67]
                    setShowSignUpPromptModal(true); // <--- This should trigger the popup [cite: 68]
                    return; // [cite: 68, 69]
                }
            } catch (error) {
                console.error("Error checking user existence during order attempt:", error); // [cite: 69, 70]
                showTemporaryFeedback('Failed to verify user. Please try again.', 'error'); // [cite: 70]
                setIsSubmitting(false); // [cite: 70]
                return; // [cite: 71]
            }
        }

        // If logged in (or just logged in via the above block), proceed to show confirmation modal [cite: 71]
        const preparedOrderRows = validOrders.map(order => { // [cite: 71, 72]
            const lemon = lemons.find(l => l.Grade === order.grade); // [cite: 72]
            const pricePerKg = parseFloat(lemon?.['Price Per Kg'] || 0); // [cite: 72]
            const quantity = parseInt(order.quantity); // [cite: 72]

            let itemCalculatedPrice = pricePerKg * quantity; // [cite: 72]
            const discountApplied = quantity > 50 ? '10%' : '0%'; // [cite: 72]

            if (quantity > 50) { // [cite: 72]
                itemCalculatedPrice *= 0.90; // [cite: 72]
            }

            return {
                grade: order.grade, // [cite: 73]
                quantity: quantity, // [cite: 73]
                pricePerKg: pricePerKg.toFixed(2), // [cite: 73]
                itemTotalPrice: itemCalculatedPrice.toFixed(2), // [cite: 73]
                discount: discountApplied, // [cite: 73]
            };
        }); // [cite: 74]

        setConfirmedOrderDetails({ // [cite: 74]
            personal: form, // [cite: 74]
            items: preparedOrderRows, // [cite: 74]
            total: total.toFixed(2), // [cite: 74]
        });
        setShowConfirmModal(true); // Show the confirmation modal [cite: 75]
    };

    // --- Function to actually submit the order after confirmation ---
    const confirmAndSubmitOrder = async () => {
        setShowConfirmModal(false); // Close the confirmation modal immediately [cite: 76, 77]
        setIsSubmitting(true); // [cite: 77]
        setFeedback({ message: '', type: '' }); // Clear feedback [cite: 77, 78]

        if (!confirmedOrderDetails) { // [cite: 78]
            showTemporaryFeedback('Error: No order details to confirm.', 'error'); // [cite: 78, 79]
            setIsSubmitting(false); // [cite: 79]
            return;
        }

        const { personal, items } = confirmedOrderDetails; // [cite: 79, 80]
        const rows = items.map(item => ({ // [cite: 80]
            name: personal.name, // [cite: 80]
            quantity: item.quantity, // [cite: 80]
            quality: item.grade, // [cite: 80]
            'Price Per Kg': item.pricePerKg, // [cite: 80]
            'Item Total Price': item.itemTotalPrice, // [cite: 80]
            delivery: personal.delivery, // [cite: 80]
            contact: personal.contact, // [cite: 81]
            discount: item.discount, // [cite: 81]
            'Order Date': new Date().toLocaleString(), // [cite: 81]
        }));
        try { // [cite: 82]
            const response = await fetch(ORDERS_SUBMISSION_URL, { // [cite: 82]
                method: 'POST', // [cite: 82]
                headers: { 'Content-Type': 'application/json' }, // [cite: 82]
                body: JSON.stringify({ data: rows }), // [cite: 82]
            });
            if (response.ok) { // [cite: 83]
                setShowSuccessModal(true); // Show success modal [cite: 83, 84]
                showTemporaryFeedback('Order submitted successfully!', 'success'); // [cite: 84, 85]
                // Reset order form items, but keep personal details if logged in [cite: 85]
                setOrders([{ grade: '', quantity: '' }]); // [cite: 85, 86]
                setForm(prevForm => ({ // [cite: 86]
                    ...prevForm, // [cite: 86]
                    name: isLoggedIn ? loggedInUser.name : '', // [cite: 86]
                    contact: isLoggedIn ? loggedInUser.phone : '', // [cite: 86]
                    delivery: isLoggedIn ? loggedInUser.address : '', // [cite: 87]
                }));
                setTotal(0); // [cite: 87]
                setConfirmedOrderDetails(null); // [cite: 87, 88]
            } else {
                const errorData = await response.json(); // [cite: 88, 89]
                console.error('SheetDB submission error:', response.status, errorData); // [cite: 89]
                showTemporaryFeedback(`Failed to submit order: ${errorData.message || 'Server error'}. Please try again.`, 'error'); // [cite: 89, 90]
            }
        } catch (err) { // [cite: 90]
            console.error('Network or submission error:', err); // [cite: 91]
            showTemporaryFeedback('Failed to submit order. Please check your internet connection and try again.', 'error'); // [cite: 91, 92]
        } finally {
            setIsSubmitting(false); // [cite: 92]
        }
    };

    // --- Modal Closing Handlers ---
    const closeSuccessModal = () => {
        setShowSuccessModal(false); // [cite: 93]
        setFeedback({ message: '', type: '' }); // Clear feedback after closing success modal [cite: 94]
        window.scrollTo({ top: 0, behavior: 'smooth' }); // [cite: 94, 95]
    };

    const cancelConfirmation = () => {
        setShowConfirmModal(false); // [cite: 95]
        setConfirmedOrderDetails(null); // [cite: 95]
        showTemporaryFeedback('Order confirmation cancelled.', 'info'); // [cite: 95, 96]
    };

    const closeSignUpPromptModal = () => {
        setShowSignUpPromptModal(false); // [cite: 96]
        // If user cancels signup prompt, clear any related feedback [cite: 97]
        setFeedback({ message: '', type: '' }); // [cite: 97, 98]
    };

    const closeSignUpModal = () => {
        setShowSignUpModal(false); // [cite: 98]
        setFeedback({ message: '', type: '' }); // Clear signup messages [cite: 99]
        setSignUpForm({ name: '', phone: '', address: '', pincode: '' }); // Clear signup form [cite: 99, 100]
    };

    // --- Sign Up Form Handlers ---
    const handleSignUpFormChange = (e) => {
        const { name, value } = e.target; // [cite: 100]
        // Pincode validation [cite: 101]
        if (name === 'pincode') { // [cite: 101]
            if (!/^\d*$/.test(value) || value.length > 6) { // [cite: 101, 102]
                return; // [cite: 102]
            }
        }
        // Phone number validation for signup form [cite: 102]
        if (name === 'phone') { // [cite: 102]
            if (!/^\d*$/.test(value) || value.length > 10) { // [cite: 103]
                return; // [cite: 103]
            }
        }
        setSignUpForm(prevForm => ({ ...prevForm, [name]: value })); // [cite: 103, 104]
    };

    const handleSignUpSubmit = async (e) => {
        e.preventDefault();
        setIsSigningUp(true); // [cite: 104, 105]
        setFeedback({ message: '', type: '' }); // Clear signup messages [cite: 105]

        // Sign up form validation [cite: 105]
        const { name, phone, address, pincode } = signUpForm; // [cite: 106]
        if (!name.trim() || !phone.trim() || !address.trim() || !pincode.trim()) { // [cite: 106]
            showTemporaryFeedback('Please fill in all signup details.', 'error'); // [cite: 106, 107]
            setIsSigningUp(false); // [cite: 107]
            return;
        }
        if (!/^\d{10}$/.test(phone)) { // [cite: 107]
            showTemporaryFeedback('Please enter a valid 10-digit phone number.', 'error'); // [cite: 108]
            setIsSigningUp(false); // [cite: 108]
            return;
        }
        if (!/^\d{6}$/.test(pincode)) { // [cite: 108]
            showTemporaryFeedback('Please enter a valid 6-digit pincode.', 'error'); // [cite: 109]
            setIsSigningUp(false); // [cite: 109]
            return;
        }

        try {
            // --- Check for existing user (by phone number) before new signup --- [cite: 109]
            const checkRes = await fetch(`${SIGNUP_SHEET_URL}?searchField=phone&searchValue=${phone}`); // [cite: 109, 110]
            if (!checkRes.ok && checkRes.status !== 404 && checkRes.status !== 204) { // [cite: 110]
                throw new Error(`Failed to check existing users during signup: ${checkRes.status} ${checkRes.statusText}`); // [cite: 110, 111]
            }

            let existingUsers = []; // [cite: 111, 112]
            if (checkRes.status !== 204 && checkRes.status !== 404) { // [cite: 112]
                existingUsers = await checkRes.json(); // [cite: 112, 113]
            }

            if (!Array.isArray(existingUsers)) { // [cite: 113]
                existingUsers = []; // [cite: 114]
            }

            if (existingUsers.length > 0) { // [cite: 114]
                showTemporaryFeedback('An account with this phone number already exists. Please login or use a different number.', 'error'); // [cite: 114, 115]
                setIsSigningUp(false); // [cite: 115]
                return;
            }

            // --- Proceed with new user signup --- [cite: 115]
            const response = await fetch(SIGNUP_SHEET_URL, { // [cite: 115]
                method: 'POST', // [cite: 116]
                headers: { 'Content-Type': 'application/json' }, // [cite: 116]
                body: JSON.stringify({ // [cite: 116]
                    data: { // [cite: 116]
                        name: name.trim(), // [cite: 116]
                        phone: phone.trim(), // [cite: 116]
                        address: address.trim(), // [cite: 117]
                        pincode: pincode.trim(), // [cite: 117]
                        'Signup Date': new Date().toLocaleString(), // [cite: 117]
                    }
                }),
            });
            if (response.ok) { // [cite: 118]
                const newUser = { name: name.trim(), phone: phone.trim(), address: address.trim(), pincode: pincode.trim() }; // [cite: 118, 119]
                localStorage.setItem('loggedInUser', JSON.stringify(newUser)); // Store in local storage [cite: 119]
                setLoggedInUser(newUser); // [cite: 119, 120]
                setIsLoggedIn(true); // [cite: 120]
                setAccountDetailsForm(newUser); // Sync sidebar form [cite: 120]
                showTemporaryFeedback(`Thank you, ${newUser.name}, for signing up. Let's start ordering! 😊`, 'success'); // [cite: 120, 121]
                // Auto-fill order form [cite: 121]
                setForm(prevForm => ({
                    ...prevForm,
                    name: newUser.name, // [cite: 121]
                    contact: newUser.phone, // [cite: 122]
                    delivery: newUser.address, // [cite: 122]
                }));
                closeSignUpModal(); // Close signup form [cite: 123]
                closeSignUpPromptModal(); // Close prompt if it was open [cite: 123, 124]
                closeLoginModal(); // Ensure login modal is closed if it was open before signup [cite: 124, 125]

                // Immediately open the order confirmation modal after signup if there was an order pending
                if (orders.filter(o => o.grade && o.quantity && parseInt(o.quantity) > 0).length > 0) {
                    const dummyEvent = { preventDefault: () => { } }; // [cite: 125, 126]
                    handleSubmit(dummyEvent); // [cite: 126]
                }
            } else {
                const errorData = await response.json(); // [cite: 126, 127]
                console.error('SheetDB signup error:', response.status, errorData); // [cite: 127]
                showTemporaryFeedback(`Failed to create account: ${errorData.message || 'Server error'}. Please try again.`, 'error'); // [cite: 127, 128]
            }
        } catch (err) { // [cite: 128]
            console.error('Network or signup error:', err); // [cite: 129]
            showTemporaryFeedback('Failed to create account. Please check your internet connection and try again.', 'error'); // [cite: 129, 130]
        } finally {
            setIsSigningUp(false); // [cite: 130]
        }
    };

    // --- NEW: Login Modal Handlers ---
    const openLoginModal = () => {
        setShowLoginModal(true); // [cite: 131]
        setLoginForm({ name: '', phone: '' }); // Clear login form [cite: 132]
        setFeedback({ message: '', type: '' }); // Clear any general feedback [cite: 132, 133]
    };

    const closeLoginModal = () => {
        setShowLoginModal(false); // [cite: 133]
        setLoginForm({ name: '', phone: '' }); // [cite: 134]
        setFeedback({ message: '', type: '' }); // Clear login messages [cite: 134]
    };
    const handleLoginFormChange = (e) => {
        const { name, value } = e.target; // [cite: 135]
        if (name === 'phone') { // [cite: 136]
            if (!/^\d*$/.test(value) || value.length > 10) { // [cite: 136, 137]
                return; // [cite: 137]
            }
        }
        setLoginForm(prev => ({ ...prev, [name]: value })); // [cite: 137, 138]
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true); // [cite: 138, 139]
        setFeedback({ message: '', type: '' }); // Clear any previous login messages [cite: 139]

        const { name, phone } = loginForm; // [cite: 139, 140]
        // Basic validation [cite: 140]
        if (!name.trim() || !phone.trim()) { // [cite: 140]
            showTemporaryFeedback('Please enter both name and phone number.', 'error'); // [cite: 141]
            setIsLoggingIn(false); // [cite: 141]
            return;
        }
        if (!/^\d{10}$/.test(phone)) { // [cite: 141]
            showTemporaryFeedback('Please enter a valid 10-digit phone number.', 'error'); // [cite: 142]
            setIsLoggingIn(false); // [cite: 142]
            return;
        }

        try {
            const checkRes = await fetch(`${SIGNUP_SHEET_URL}?searchField=phone&searchValue=${phone}`); // [cite: 142, 143]
            if (!checkRes.ok && checkRes.status !== 404 && checkRes.status !== 204) { // [cite: 143]
                throw new Error(`Failed to check existing users during login: ${checkRes.status} ${checkRes.statusText}`); // [cite: 143, 144]
            }

            let existingUsers = []; // [cite: 144, 145]
            if (checkRes.status !== 204 && checkRes.status !== 404) { // [cite: 145]
                existingUsers = await checkRes.json(); // [cite: 145, 146]
            }

            if (!Array.isArray(existingUsers)) { // [cite: 146]
                existingUsers = []; // [cite: 147]
            }

            const foundUser = existingUsers.find(user => user.phone === phone && user.name.toLowerCase() === name.toLowerCase()); // [cite: 147, 148]
            if (foundUser) { // [cite: 148]
                localStorage.setItem('loggedInUser', JSON.stringify(foundUser)); // [cite: 148, 149]
                setLoggedInUser(foundUser); // [cite: 149]
                setIsLoggedIn(true); // [cite: 149]
                setAccountDetailsForm(foundUser); // Sync sidebar form [cite: 149]
                showTemporaryFeedback(`Welcome back, ${foundUser.name}! 😊`, 'success'); // [cite: 149, 150]
                // Auto-fill order form [cite: 150]
                setForm(prevForm => ({
                    ...prevForm,
                    name: foundUser.name, // [cite: 150, 151]
                    contact: foundUser.phone, // [cite: 151]
                    delivery: foundUser.address, // [cite: 151, 152]
                }));
                closeLoginModal(); // Close the login modal [cite: 152]
            } else {
                showTemporaryFeedback('Account not found with provided name and phone number. Please try again or sign up.', 'error'); // [cite: 152, 153]
                // Option to lead to signup: [cite: 153]
                // setShowSignUpModal(true); // Open signup modal directly [cite: 154]
                // closeLoginModal(); [cite: 154, 155]
            }
        } catch (error) { // [cite: 155]
            console.error("Error during login:", error); // [cite: 156]
            showTemporaryFeedback('Failed to log in. Please try again later.', 'error'); // [cite: 156]
        } finally {
            setIsLoggingIn(false); // [cite: 157]
        }
    };

    // --- Logout Function ---
    const handleLogout = () => {
        localStorage.removeItem('loggedInUser'); // [cite: 157, 158]
        setIsLoggedIn(false); // [cite: 158]
        setLoggedInUser(null); // [cite: 158]
        setUserAddresses([]); // Clear addresses on logout [cite: 158]
        setAccountDetailsForm({ name: '', phone: '', address: '', pincode: '' }); // Clear sidebar form [cite: 159]
        // Clear order form personal details [cite: 159]
        setForm({ name: '', delivery: '', contact: '' }); // [cite: 159, 160]
        showTemporaryFeedback('You have been logged out.', 'info'); // [cite: 160]
        setIsSidebarOpen(false); // Close sidebar on logout [cite: 160]
    };

    // --- Account Sidebar Handlers ---
    const toggleSidebar = () => { // [cite: 161]
        if (isLoggedIn) { // Only open sidebar if logged in [cite: 161]
            setIsSidebarOpen(!isSidebarOpen); // [cite: 161, 162]
            if (!isSidebarOpen) { // If opening, reset to default tab and clear messages [cite: 162]
                setActiveAccountTab('accountDetails'); // [cite: 162, 163]
                setFeedback({ message: '', type: '' }); // Clear any general feedback [cite: 163]
                // Ensure accountDetailsForm is synced with loggedInUser when opening [cite: 163]
                if (loggedInUser) { // [cite: 163]
                    setAccountDetailsForm(loggedInUser); // [cite: 164]
                }
                setShowAddressForm(false); // Hide address form in case it was open [cite: 164, 165]
                setAddressForm({ id: null, addressName: '', fullAddress: '', pincode: '' }); // Reset address form [cite: 165, 166]
            }
        } else {
            // If user tries to open sidebar without being logged in, prompt login [cite: 166]
            openLoginModal(); // [cite: 167]
            showTemporaryFeedback('Please log in to access your account.', 'info'); // [cite: 167]
        }
    };

    // The handleAccountDetailsFormChange, saveAccountDetails, handleAddressFormChange,
    // handleSaveAddress, handleDeleteAddress, handleEditAddress, getWhatsappLink
    // functions were mostly correct from the previous version and are re-included here.
    // Small adjustments were made for `feedback` state consistency.

    const handleAccountDetailsFormChange = (e) => { // [cite: 168]
        const { name, value } = e.target; // [cite: 169]
        if (name === 'pincode') { // [cite: 169]
            if (!/^\d*$/.test(value) || value.length > 6) { // Corrected regex here [cite: 169, 170]
                return; // [cite: 170]
            }
        }
        setAccountDetailsForm(prevForm => ({ ...prevForm, [name]: value })); // [cite: 170, 171]
    };

    const saveAccountDetails = async (e) => { // Added 'e' parameter [cite: 171]
        e.preventDefault(); // Prevent default form submission [cite: 172]
        if (!loggedInUser || !loggedInUser.phone) { // [cite: 172]
            showTemporaryFeedback('Please login to save account details.', 'error'); // [cite: 173]
            return;
        }
        setIsUpdatingAccount(true); // [cite: 173]
        setFeedback({ message: '', type: '' }); // [cite: 174]
        // Basic validation for account details before saving [cite: 174]
        const { name, address, pincode } = accountDetailsForm; // [cite: 174, 175]
        if (!name.trim() || !address.trim() || !pincode.trim()) { // [cite: 175]
            showTemporaryFeedback('Please fill in all account details.', 'error'); // [cite: 175, 176]
            setIsUpdatingAccount(false); // [cite: 176]
            return;
        }
        if (!/^\d{6}$/.test(pincode)) { // [cite: 176]
            showTemporaryFeedback('Please enter a valid 6-digit pincode.', 'error'); // [cite: 177]
            setIsUpdatingAccount(false); // [cite: 177]
            return;
        }

        try {
            const response = await fetch(`${SIGNUP_SHEET_URL}/phone/${loggedInUser.phone}`, { // Use PUT for updating by phone [cite: 177]
                method: 'PUT', // [cite: 178]
                headers: { 'Content-Type': 'application/json' }, // [cite: 178]
                body: JSON.stringify({ // [cite: 178]
                    data: { // [cite: 178]
                        name: name.trim(), // [cite: 178]
                        address: address.trim(), // [cite: 179]
                        pincode: pincode.trim(), // [cite: 179]
                    }
                }),
            });
            if (response.ok) { // [cite: 180]
                // Update loggedInUser state and localStorage [cite: 180]
                const updatedUser = { ...loggedInUser, name: name.trim(), address: address.trim(), pincode: pincode.trim() }; // [cite: 180, 181]
                localStorage.setItem('loggedInUser', JSON.stringify(updatedUser)); // [cite: 181]
                setLoggedInUser(updatedUser); // [cite: 181]
                showTemporaryFeedback('Account details updated successfully!', 'success'); // [cite: 181]
                // Also update the main order form fields if they are currently being edited [cite: 181]
                setForm(prevForm => ({
                    ...prevForm,
                    name: updatedUser.name, // [cite: 182]
                    delivery: updatedUser.address, // [cite: 182]
                }));
            } else {
                const errorData = await response.json(); // [cite: 183, 184]
                console.error('SheetDB account update error:', response.status, errorData); // [cite: 184]
                showTemporaryFeedback(`Failed to update: ${errorData.message || 'Server error'}.`, 'error'); // [cite: 184, 185]
            }
        } catch (error) { // [cite: 185]
            console.error('Network error updating account:', error); // [cite: 186]
            showTemporaryFeedback('Network error. Could not update account.', 'error'); // [cite: 186]
        } finally {
            setIsUpdatingAccount(false); // [cite: 187]
        }
    };

    // --- Address Management Handlers ---
    // useCallback for fetchUserAddresses to prevent unnecessary re-renders in useEffect
    const fetchUserAddresses = useCallback(async (userPhone) => { // [cite: 187]
        if (!userPhone) return;
        setIsManagingAddresses(true); // [cite: 188]
        setUserAddresses([]); // Clear previous addresses [cite: 188]
        try {
            const res = await fetch(`${ADDRESSES_SHEET_URL}?searchField=userPhone&searchValue=${userPhone}`); // [cite: 188]
            if (!res.ok && res.status !== 404 && res.status !== 204) { // [cite: 188]
                throw new Error(`Failed to fetch addresses: ${res.status} ${res.statusText}`); // [cite: 188]
            }
            let addresses = []; // [cite: 189]
            if (res.status !== 204 && res.status !== 404) { // [cite: 189]
                addresses = await res.json(); // [cite: 189]
            }

            if (Array.isArray(addresses)) { // [cite: 189]
                // SheetDB automatically assigns 'id' if you add it to the column headers.
                // If not, you might need to generate a temporary one for React keys.
                // Using a fallback for id with Date.now() if SheetDB doesn't return one immediately.
                setUserAddresses(addresses.map(addr => ({ ...addr, id: addr.id || Date.now() + Math.random() }))); // using Math.random() for uniqueness [cite: 190]
            } else {
                setUserAddresses([]); // [cite: 191]
            }
        } catch (error) {
            console.error("Error fetching user addresses:", error); // [cite: 191, 192]
            showTemporaryFeedback('Failed to load addresses.', 'error'); // [cite: 192]
        } finally {
            setIsManagingAddresses(false); // [cite: 193]
        }
    }, [showTemporaryFeedback]); // Dependency for useCallback

    const handleAddressFormChange = (e) => { // [cite: 193]
        const { name, value } = e.target; // [cite: 194]
        if (name === 'pincode') { // [cite: 194]
            if (!/^\d*$/.test(value) || value.length > 6) { // [cite: 194, 195]
                return; // [cite: 195]
            }
        }
        setAddressForm(prevForm => ({ ...prevForm, [name]: value })); // [cite: 195, 196]
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault(); // [cite: 197]
        if (!loggedInUser || !loggedInUser.phone) { // [cite: 197]
            showTemporaryFeedback('Please login to save addresses.', 'error'); // [cite: 198]
            return;
        }
        setIsManagingAddresses(true); // [cite: 198]
        setFeedback({ message: '', type: '' }); // [cite: 199]

        const { addressName, fullAddress, pincode, id } = addressForm; // [cite: 199]
        if (!addressName.trim() || !fullAddress.trim() || !pincode.trim()) { // [cite: 199]
            showTemporaryFeedback('Please fill all address fields.', 'error'); // [cite: 200]
            setIsManagingAddresses(false); // [cite: 200]
            return;
        }
        if (!/^\d{6}$/.test(pincode)) { // [cite: 200]
            showTemporaryFeedback('Please enter a valid 6-digit pincode.', 'error'); // [cite: 201]
            setIsManagingAddresses(false); // [cite: 201]
            return;
        }

        // Check address limit for new addresses [cite: 201]
        if (userAddresses.length >= 5 && !id) { // If adding new and limit reached [cite: 201, 202]
            showTemporaryFeedback('You can save a maximum of 5 addresses.', 'error'); // [cite: 202]
            setIsManagingAddresses(false); // [cite: 202]
            return;
        }

        const addressData = {
            userPhone: loggedInUser.phone, // Associate address with user's phone [cite: 202]
            addressName: addressName.trim(), // [cite: 203]
            fullAddress: fullAddress.trim(), // [cite: 203]
            pincode: pincode.trim(), // [cite: 203]
        };
        try { // [cite: 203]
            let response; // [cite: 204]
            if (id) { // Editing existing address [cite: 204]
                response = await fetch(`${ADDRESSES_SHEET_URL}/id/${id}`, { // Assuming 'id' is present in SheetDB [cite: 204]
                    method: 'PUT', // Use PUT for updating an existing row by ID [cite: 204, 205]
                    headers: { 'Content-Type': 'application/json' }, // [cite: 205]
                    body: JSON.stringify({ data: addressData }), // [cite: 205]
                });
            } else { // Truly new address [cite: 206]
                response = await fetch(ADDRESSES_SHEET_URL, { // [cite: 206]
                    method: 'POST', // [cite: 206]
                    headers: { 'Content-Type': 'application/json' }, // [cite: 206]
                    body: JSON.stringify({ data: addressData }), // [cite: 207]
                });
            }

            if (response.ok) { // [cite: 208]
                showTemporaryFeedback(`Address ${id ? 'updated' : 'added'} successfully!`, 'success'); // [cite: 208, 209]
                setShowAddressForm(false); // [cite: 209]
                setAddressForm({ id: null, addressName: '', fullAddress: '', pincode: '' }); // Reset form [cite: 209, 210]
                fetchUserAddresses(loggedInUser.phone); // Re-fetch to update list and get actual SheetDB ID [cite: 210, 211]
            } else {
                const errorData = await response.json(); // [cite: 211, 212]
                console.error('SheetDB address save error:', response.status, errorData); // [cite: 212]
                showTemporaryFeedback(`Failed to save address: ${errorData.message || 'Server error'}.`, 'error'); // [cite: 212, 213]
            }
        } catch (error) { // [cite: 213]
            console.error('Network error saving address:', error); // [cite: 214]
            showTemporaryFeedback('Network error. Could not save address.', 'error'); // [cite: 214]
        } finally {
            setIsManagingAddresses(false); // [cite: 215]
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return; // Simple confirm for now [cite: 215, 216]
        setIsManagingAddresses(true); // [cite: 216]
        setFeedback({ message: '', type: '' }); // [cite: 217]
        try { // [cite: 217]
            const response = await fetch(`${ADDRESSES_SHEET_URL}/id/${addressId}`, { // Assuming 'id' is unique [cite: 217]
                method: 'DELETE', // [cite: 218]
            });
            if (response.ok) { // [cite: 218]
                showTemporaryFeedback('Address deleted successfully!', 'success'); // [cite: 219]
                fetchUserAddresses(loggedInUser.phone); // Re-fetch to update list [cite: 219]
            } else {
                const errorData = await response.json(); // [cite: 220]
                console.error('SheetDB address delete error:', response.status, errorData); // [cite: 220]
                showTemporaryFeedback(`Failed to delete address: ${errorData.message || 'Server error'}.`, 'error'); // [cite: 220, 221]
            }
        } catch (error) { // [cite: 221]
            console.error('Network error deleting address:', error); // [cite: 222]
            showTemporaryFeedback('Network error. Could not delete address.', 'error'); // [cite: 222]
        } finally {
            setIsManagingAddresses(false); // [cite: 223]
        }
    };

    const handleEditAddress = (address) => { // [cite: 223]
        setAddressForm({ id: address.id, addressName: address.addressName, fullAddress: address.fullAddress, pincode: address.pincode }); // [cite: 224]
        setShowAddressForm(true); // [cite: 224]
    };

    const getWhatsappLink = () => { // [cite: 224]
        const validOrders = orders.filter(order => order.grade && order.quantity && parseInt(order.quantity) > 0); // [cite: 225]
        if (validOrders.length === 0 || !form.contact || !/^\d{10}$/.test(form.contact)) { // [cite: 225]
            return '#'; // Disable link if essential data is missing or invalid [cite: 226]
        }

        const orderDetails = validOrders.map(order => { // [cite: 226]
            const lemon = lemons.find(l => l.Grade === order.grade); // [cite: 227]
            const quantity = parseInt(order.quantity); // [cite: 227]
            const pricePerKg = parseFloat(lemon?.['Price Per Kg'] || 0); // [cite: 227]
            let itemPrice = pricePerKg * quantity; // [cite: 227]
            let discountMsg = ''; // [cite: 227]
            if (quantity > 50) { // [cite: 227]
                itemPrice *= 0.90; // [cite: 228]
                discountMsg = ` (10% bulk discount applied)`; // [cite: 228]
            }
            return `${quantity} kg of ${order.grade} (Approx. ₹${itemPrice.toFixed(2)})${discountMsg}`; // [cite: 228]
        }).join(', '); // [cite: 228]

        const whatsappContact = `91${form.contact}`; // Assuming Indian numbers for WhatsApp [cite: 229]
        const whatsappMessage = `Hi, I'm ${form.name}.\n\nI want to order: ${orderDetails}.\n\nDelivery Address: ${form.delivery}.\nContact: ${form.contact}\n\nTotal estimated price: ₹${total.toFixed(2)}\n\nPlease confirm availability and final amount.`; // [cite: 229, 230]
        return `https://wa.me/${whatsappContact}?text=${encodeURIComponent(whatsappMessage)}`; // [cite: 230]
    };

    return (
        <div className={styles.page}>
            <Head>
                <title>3 Lemons Traders – Buy Fresh Lemons Online</title>
                <meta name="description" content="Buy premium quality lemons at affordable prices across India. Direct farm to home delivery. Discounts on bulk orders!" /> [cite: 231]
                <meta property="og:title" content="Buy Fresh Lemons Online – 3 Lemons Traders" /> [cite: 231]
                <meta property="og:description" content="Get premium lemons delivered to your door at unbeatable prices. Farm fresh quality. Offering discounts on bulk purchases!" /> [cite: 231]
                <meta property="og:image" content="/lemons-hero.jpg" /> [cite: 231]
                <meta name="viewport" content="width=device-width, initial-scale=1" /> [cite: 231]
                <link rel="canonical" href="https://3lemons.in" /> [cite: 232]
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" /> [cite: 232]
            </Head>

            {/* --- NEW: Header with Login Button / Account Icon --- */}
            <header className={styles.header}>
                <h1 className={styles.headerTitle}>3 Lemons Traders</h1> [cite: 232, 233]
                <div className={styles.headerActions}> [cite: 233]
                    {isLoggedIn ? ( [cite: 233, 234]
                        <button className={styles.loginButton} onClick={toggleSidebar}> [cite: 234]
                            <FaUserCircle size={24} color="#333" /> {/* User icon if logged in */} [cite: 234]
                        </button>
                    ) : ( [cite: 235]
                        <button className={styles.loginButton} onClick={openLoginModal}> [cite: 235]
                            Login / Signup
                        </button>
                    )}
                    {/* Hamburger menu for small screens - can be shown/hidden via CSS media queries */} [cite: 236]
                    <IoMenu className={styles.hamburgerIcon} onClick={toggleSidebar} /> [cite: 236]
                </div>
            </header>

            <main className={styles.container}> [cite: 237]
                {/* Feedback Message Display */}
                {feedback.message && ( [cite: 237]
                    <div className={`${styles.feedbackMessage} ${styles[`feedback${feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}`]}`}> [cite: 237]
                        {feedback.type === 'success' && <FaCheckCircle style={{ marginRight: '8px' }} />} [cite: 238]
                        {feedback.type === 'error' && <FaExclamationCircle style={{ marginRight: '8px' }} />} [cite: 238]
                        {feedback.type === 'info' && <FaInfoCircle style={{ marginRight: '8px' }} />} [cite: 238]
                        {feedback.message} [cite: 238, 239]
                    </div>
                )}

                {/* --- Hero Section --- */}
                <section className={styles.hero}> [cite: 239]
                    {/* Using Image component for the hero image */}
                    <Image
                        src="/lemons-hero.jpg" // Assuming this is a local image in your public folder [cite: 240]
                        alt="Fresh Lemons" [cite: 240]
                        width={1200} // Set explicit width [cite: 241]
                        height={400} // Set explicit height [cite: 241]
                        priority // Load eagerly for LCP (Largest Contentful Paint) [cite: 241]
                        className={styles.heroImage} [cite: 242]
                    />
                    <div className={styles.heroOverlay}> [cite: 242]
                        <h1 className={styles.heroTitle}>3 Lemons Traders</h1> [cite: 242]
                        <p className={styles.heroSubtitle}>Buy fresh, farm-direct lemons delivered across India</p> [cite: 243]
                        <a href="#buy-now" className={styles.heroButton}> [cite: 243]
                            Order Now
                        </a>
                    </div>
                </section>

                {/* --- Lemons Products Section --- */}
                <section className={styles.lemonsSection}> [cite: 244]
                    <h2 className={styles.sectionTitle}>Our Lemons</h2> [cite: 244]
                    <div className={styles.lemonsGrid}> [cite: 245]
                        {Array.isArray(lemons) && lemons.length > 0 ? ( [cite: 245, 246]
                            lemons.map((lemon, index) => ( [cite: 246]
                                <div key={lemon.id || index} className={styles.lemonCard}> {/* Use lemon.id for key if available */}
                                    {lemon['Image url'] && ( [cite: 247]
                                        // CRITICAL FIX: Using next/image with width and height for external URLs
                                        <Image
                                            src={lemon['Image url']} [cite: 248]
                                            alt={lemon['Grade'] || 'Lemon'} [cite: 248, 249]
                                            width={300} // IMPORTANT: Provide an appropriate width [cite: 249]
                                            height={200} // IMPORTANT: Provide an appropriate height [cite: 249, 250]
                                            loading="lazy" // Load lazily for images not in the viewport initially [cite: 250]
                                            className={styles.cardImage} [cite: 251]
                                        />
                                    )}
                                    <p className={styles.cardTitle}>
                                        {lemon['Grade']} – ₹{parseFloat(lemon['Price Per Kg']).toFixed(2)}/kg [cite: 252]
                                    </p>
                                    <p className={styles.cardDescription}>{lemon['Description']}</p> [cite: 253]
                                </div>
                            ))
                        ) : ( [cite: 254]
                            <p style={{ textAlign: 'center', width: '100%', gridColumn: '1 / -1' }}>
                                Loading lemons or no lemon data available. Please check your internet connection or SheetDB setup. [cite: 254, 255]
                            </p>
                        )}
                    </div>
                </section>

                {/* --- Order Form Section --- */}
                <section id="buy-now" className={styles.formSection}> [cite: 256]
                    <h2 className={styles.sectionTitle}>Place Your Order</h2> [cite: 256]
                    <form onSubmit={handleSubmit} className={styles.form}> [cite: 256]
                        {/* Personal Details Inputs */}
                        <div className={styles.formGroup}> [cite: 257]
                            <label className={styles.label} htmlFor="name">Your Name</label> [cite: 257]
                            <input
                                id="name"
                                className={styles.input} [cite: 258]
                                required
                                value={form.name} [cite: 259]
                                onChange={(e) => setForm({ ...form, name: e.target.value })} [cite: 259]
                                readOnly={isLoggedIn} // Make read-only if logged in [cite: 259, 260]
                                style={isLoggedIn ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}} [cite: 260]
                            />
                        </div>

                        <div className={styles.formGroup}> [cite: 261]
                            <label className={styles.label} htmlFor="delivery">Delivery Address</label> [cite: 261]
                            {isLoggedIn && userAddresses.length > 0 ? ( [cite: 261, 262]
                                <select
                                    id="delivery"
                                    className={styles.select} [cite: 263]
                                    required
                                    value={form.delivery} [cite: 264]
                                    onChange={(e) => setForm({ ...form, delivery: e.target.value })} [cite: 264]
                                >
                                    <option value="">-- Select Saved Address or Enter New --</option> [cite: 264, 265]
                                    {userAddresses.map((addr) => ( [cite: 265]
                                        <option key={addr.id} value={addr.fullAddress}> [cite: 266]
                                            {addr.addressName} - {addr.fullAddress} [cite: 266]
                                        </option>
                                    ))}
                                    <option value="custom">-- Enter New Address --</option> [cite: 267]
                                </select>
                            ) : ( [cite: 267, 268]
                                <input
                                    id="delivery"
                                    className={styles.input} [cite: 269]
                                    required
                                    value={form.delivery} [cite: 270]
                                    onChange={(e) => setForm({ ...form, delivery: e.target.value })} [cite: 270]
                                    placeholder="Enter your full delivery address"
                                    readOnly={isLoggedIn && form.delivery !== 'custom'} // Read-only if logged in and not custom [cite: 270, 271]
                                    style={isLoggedIn && form.delivery !== 'custom' ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}} [cite: 272]
                                />
                            )}
                        </div>

                        <div className={styles.formGroup}> [cite: 273]
                            <label className={styles.label} htmlFor="contact">Contact Number</label> [cite: 273]
                            <input
                                id="contact" [cite: 274]
                                type="tel" [cite: 274]
                                className={styles.input} [cite: 275]
                                required
                                value={form.contact} [cite: 275]
                                onChange={(e) => setForm({ ...form, contact: e.target.value })} [cite: 275, 276]
                                maxLength={10} [cite: 276]
                                pattern="[0-9]{10}" [cite: 276]
                                title="Please enter a 10-digit mobile number" [cite: 277]
                                placeholder="e.g., 9876543210" [cite: 277]
                                readOnly={isLoggedIn} // Make read-only if logged in [cite: 277, 278]
                                style={isLoggedIn ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}} [cite: 278]
                            />
                        </div>

                        {/* Dynamic Order Varieties Inputs */}
                        {orders.map((order, index) => ( [cite: 279]
                            <Fragment key={index}> {/* Use Fragment here */} [cite: 279]
                                <div className={styles.formGroup}> [cite: 280]
                                    <label className={styles.label} htmlFor={`grade-${index}`}>Select Grade</label> [cite: 280]
                                    <select
                                        id={`grade-${index}`}
                                        className={styles.select} [cite: 281]
                                        value={order.grade} [cite: 282]
                                        onChange={(e) => handleOrderChange(index, 'grade', e.target.value)} [cite: 282]
                                        required
                                    >
                                        <option value="">-- Select --</option> [cite: 283]
                                        {lemons.map((lemon, idx) => ( [cite: 283, 284]
                                            <option key={idx} value={lemon.Grade}> [cite: 284]
                                                {lemon.Grade} – ₹{parseFloat(lemon['Price Per Kg']).toFixed(2)}/kg [cite: 284, 285]
                                            </option>
                                        ))}
                                    </select> [cite: 286]
                                </div>

                                <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}> {/* Flex for horizontal alignment */}
                                    <label className={styles.label} htmlFor={`quantity-${index}`} style={{flexGrow: 1}}>Quantity (kg)</label> [cite: 287]
                                    <input
                                        id={`quantity-${index}`}
                                        type="number" [cite: 288]
                                        min="1" [cite: 288]
                                        className={styles.input} [cite: 289]
                                        value={order.quantity} [cite: 289]
                                        onChange={(e) => handleOrderChange(index, 'quantity', e.target.value)} [cite: 289, 290]
                                        placeholder="e.g., 10" [cite: 290]
                                        required
                                        style={{flexGrow: 2}} /* Allow input to grow */
                                    />
                                    {parseInt(order.quantity) > 50 && ( [cite: 291]
                                        <span className={styles.discountNote}> (10% bulk discount)</span> [cite: 292]
                                    )}
                                    {orders.length > 1 && ( [cite: 292, 293]
                                        <button type="button" onClick={() => handleRemoveVariety(index)} className={styles.removeVarietyButton}> [cite: 293]
                                            <FaMinus /> [cite: 293, 294]
                                        </button>
                                    )}
                                </div>
                            </Fragment>
                        ))}

                        <button type="button" onClick={handleAddVariety} className={styles.addAddressButton}> {/* Using addAddressButton style as it's similar */}
                            <FaPlus /> Add Another Variety [cite: 295]
                        </button>

                        <div className={styles.orderSummary}> [cite: 296]
                            <h3>Total: ₹{total.toFixed(2)}</h3> [cite: 296]
                        </div>

                        <div className={styles.actions}> [cite: 296]
                            <button type="submit" disabled={isSubmitting} className={styles.button}> [cite: 297]
                                {isSubmitting ? 'Checking Order...' : '🛒 Place Order on Website'} [cite: 297, 298]
                            </button>

                            <a
                                href={getWhatsappLink()} [cite: 298, 299]
                                target="_blank" [cite: 299]
                                rel="noopener noreferrer" [cite: 299]
                                className={`${styles.button} ${styles.whatsappButton}`} [cite: 299]
                                style={{ pointerEvents: (!form.contact || orders.filter(o => o.grade && o.quantity && parseInt(o.quantity) > 0).length === 0) ? 'none' : 'auto', opacity: (!form.contact || orders.filter(o => o.grade && o.quantity && parseInt(o.quantity) > 0).length === 0) ? 0.6 : 1 }} [cite: 300, 301, 302]
                            >
                                <FaWhatsapp className={styles.whatsappIcon} /> Place Order on WhatsApp [cite: 302, 303]
                            </a>
                        </div>
                    </form>
                </section>

                {/* --- Customer Reviews Section --- */}
                <section className={styles.reviewsSection}> [cite: 303, 304]
                    <h2 className={styles.sectionTitle}>What Our Customers Say</h2> [cite: 304]
                    <div className={styles.reviewsGrid}> [cite: 304]
                        {customerReviews.map(review => ( [cite: 304]
                            <div key={review.id} className={styles.reviewCard}> [cite: 305]
                                <div className={styles.reviewerRating}> [cite: 305]
                                    {Array.from({ length: review.rating }).map((_, i) => ( [cite: 305, 306]
                                        <FaStar key={i} /> [cite: 306]
                                    ))}
                                    {Array.from({ length: 5 - review.rating }).map((_, i) => ( [cite: 306, 307]
                                        <FaStar key={i + review.rating} style={{ opacity: 0.3 }} /> [cite: 307, 308]
                                    ))}
                                </div>
                                <p className={styles.reviewText}>"{review.text}"</p> [cite: 308]
                                <p className={styles.reviewerName}>- {review.name}</p> [cite: 309]
                            </div>
                        ))}
                    </div>
                </section>

            </main>

            {/* --- Footer Section --- */}
            <div className={styles.footer}> [cite: 310]
                <p>Developed by Pradeep Mamuduru</p> [cite: 310]
                <p>
                    📸 <a href="https://www.instagram.com/3Lemons_Traders" target="_blank" rel="noopener noreferrer">3Lemons_Traders</a> | 🌐 <a href="https://3lemons.vercel.app" target="_blank" rel="noopener noreferrer">3lemons.vercel.app</a> [cite: 311]
                </p>
                <p>&copy; {new Date().getFullYear()} 3 Lemons Traders. All rights reserved.</p> [cite: 312]
            </div>

            {/* --- Order Confirmation Modal --- */}
            {showConfirmModal && confirmedOrderDetails && ( [cite: 312]
                <div className={`${styles.modalOverlay} ${showConfirmModal ? styles.visible : ''}`}> [cite: 313]
                    <div className={styles.modalContent}> [cite: 313]
                        <button className={styles.modalCloseButton} onClick={cancelConfirmation}> [cite: 313]
                            <IoCloseCircleOutline /> [cite: 314]
                        </button>
                        <h2 className={styles.modalTitle}>Confirm Your Order</h2> [cite: 314]
                        <div className={styles.modalText}> [cite: 314]
                            <p>Please review your order details before proceeding:</p> [cite: 315]
                            <p><strong>Name:</strong> {confirmedOrderDetails.personal.name}</p> [cite: 315]
                            <p><strong>Contact:</strong> {confirmedOrderDetails.personal.contact}</p> [cite: 315]
                            <p><strong>Delivery Address:</strong> {confirmedOrderDetails.personal.delivery}</p> [cite: 315]
                            <p><strong>Order Items:</strong></p> [cite: 315, 316]
                            <ul> [cite: 316]
                                {confirmedOrderDetails.items.map((item, index) => ( [cite: 316]
                                    <li key={index}> [cite: 317]
                                        {item.quantity} kg of {item.grade} (₹{item.itemTotalPrice}) [cite: 317]
                                        {item.discount === '10%' && <span className={styles.discountNote}> ({item.discount} discount applied)</span>} [cite: 317, 318]
                                    </li>
                                ))}
                            </ul>
                            <p><strong>Total Payable: ₹{confirmedOrderDetails.total}</strong></p> [cite: 319]
                        </div>
                        <div className={styles.modalButtons}> [cite: 319]
                            <button className={styles.modalButton} onClick={confirmAndSubmitOrder} disabled={isSubmitting}> [cite: 319, 320]
                                {isSubmitting ? 'Submitting...' : 'Proceed'} [cite: 320, 321]
                            </button>
                            <button className={`${styles.modalButton} ${styles.cancel}`} onClick={cancelConfirmation}> [cite: 321]
                                Cancel [cite: 322]
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Order Submitted Successfully Modal/Page --- */}
            {showSuccessModal && ( [cite: 323]
                <div className={`${styles.modalOverlay} ${showSuccessModal ? styles.visible : ''}`}> [cite: 323]
                    <div className={styles.modalContent}> [cite: 324]
                        <button className={styles.modalCloseButton} onClick={closeSuccessModal}> [cite: 324]
                            <IoCloseCircleOutline /> [cite: 324]
                        </button>
                        <h2 className={styles.successTitle}>Order Submitted Successfully!</h2> [cite: 324, 325]
                        <p className={styles.successMessage}> [cite: 325]
                            Thank you for your order. We have received your details and will contact you shortly to confirm. [cite: 326, 327]
                        </p>
                        <button className={styles.modalButton} onClick={closeSuccessModal}> [cite: 327]
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* --- Sign Up Prompt Modal --- */}
            {showSignUpPromptModal && ( [cite: 328]
                <div className={`${styles.modalOverlay} ${showSignUpPromptModal ? styles.visible : ''}`}> [cite: 328]
                    <div className={styles.modalContent}> [cite: 329]
                        <button className={styles.modalCloseButton} onClick={closeSignUpPromptModal}> [cite: 329]
                            <IoCloseCircleOutline />
                        </button>
                        <h2 className={styles.modalTitle}>Please Sign Up to Order</h2> [cite: 330]
                        <p className={styles.modalText}>
                            To place an order for fresh lemons, please sign up for an account. It's quick and easy! [cite: 330, 331]
                        </p>
                        <div className={styles.modalButtons}> [cite: 331]
                            <button
                                className={styles.modalButton} [cite: 332]
                                onClick={() => {
                                    setShowSignUpPromptModal(false); [cite: 332, 333]
                                    setShowSignUpModal(true); [cite: 333]
                                }}
                            >
                                Sign Up Now
                            </button>
                            <button className={`${styles.modalButton} ${styles.cancel}`} onClick={closeSignUpPromptModal}> [cite: 334]
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Sign Up Form Modal --- */}
            {showSignUpModal && ( [cite: 335, 336]
                <div className={`${styles.modalOverlay} ${showSignUpModal ? styles.visible : ''}`}> [cite: 336]
                    <div className={styles.modalContent}> [cite: 336]
                        <button className={styles.modalCloseButton} onClick={closeSignUpModal}> [cite: 336, 337]
                            <IoCloseCircleOutline /> [cite: 337]
                        </button>
                        <h2 className={styles.modalTitle}>Create Your Account</h2> [cite: 337]
                        {feedback.message && feedback.type === 'error' && ( [cite: 338]
                            <p className={`${styles.feedbackMessage} ${styles.feedbackError}`}>
                                {feedback.message} [cite: 338]
                            </p>
                        )}
                        <form onSubmit={handleSignUpSubmit}> [cite: 339]
                            <div className={styles.formGroup}> [cite: 339]
                                <label className={styles.label} htmlFor="signup-name">Your Name</label> [cite: 339, 340]
                                <input
                                    id="signup-name" [cite: 340]
                                    className={styles.input} [cite: 341]
                                    name="name" [cite: 341]
                                    required
                                    value={signUpForm.name} [cite: 342]
                                    onChange={handleSignUpFormChange} [cite: 342]
                                />
                            </div>
                            <div className={styles.formGroup}> [cite: 343]
                                <label className={styles.label} htmlFor="signup-phone">Phone Number</label> [cite: 343]
                                <input
                                    id="signup-phone" [cite: 344]
                                    type="tel" [cite: 344]
                                    className={styles.input} [cite: 345]
                                    name="phone" [cite: 345]
                                    required
                                    value={signUpForm.phone} [cite: 345, 346]
                                    onChange={handleSignUpFormChange} [cite: 346]
                                    maxLength={10} [cite: 346]
                                    pattern="[0-9]{10}" [cite: 347]
                                    title="Please enter a 10-digit mobile number" [cite: 347]
                                    placeholder="e.g., 9876543210" [cite: 348]
                                />
                            </div>
                            <div className={styles.formGroup}> [cite: 348]
                                <label className={styles.label} htmlFor="signup-address">Delivery Address</label> [cite: 349]
                                <input
                                    id="signup-address" [cite: 350]
                                    className={styles.input} [cite: 350]
                                    name="address" [cite: 351]
                                    required
                                    value={signUpForm.address} [cite: 351]
                                    onChange={handleSignUpFormChange} [cite: 351]
                                />
                            </div>
                            <div className={styles.formGroup}> [cite: 352]
                                <label className={styles.label} htmlFor="signup-pincode">Pincode</label> [cite: 352, 353]
                                <input
                                    id="signup-pincode" [cite: 353]
                                    type="text" // Use text to allow partial input without number validation issues [cite: 353, 354]
                                    className={styles.input} [cite: 354]
                                    name="pincode" [cite: 355]
                                    required
                                    value={signUpForm.pincode} [cite: 355]
                                    onChange={handleSignUpFormChange} [cite: 355]
                                    maxLength={6} [cite: 356]
                                    pattern="[0-9]{6}" [cite: 356]
                                    title="Please enter a 6-digit pincode" [cite: 357]
                                    placeholder="e.g., 123456" [cite: 357]
                                />
                            </div>
                            <div className={styles.modalButtons}> [cite: 358]
                                <button type="submit" className={styles.modalButton} disabled={isSigningUp}> [cite: 358]
                                    {isSigningUp ? (<><FaSpinner className={styles.spinner} /> Creating Account...</>) : 'Sign Up'} [cite: 359]
                                </button>
                                <button type="button" className={`${styles.modalButton} ${styles.cancel}`} onClick={closeSignUpModal}> [cite: 359, 360]
                                    Cancel [cite: 360]
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- NEW: Login Modal --- */}
            {showLoginModal && ( [cite: 361, 362]
                <div className={`${styles.modalOverlay} ${showLoginModal ? styles.visible : ''}`}> [cite: 362]
                    <div className={styles.modalContent}> [cite: 362]
                        <button className={styles.modalCloseButton} onClick={closeLoginModal}> [cite: 362, 363]
                            <IoCloseCircleOutline /> [cite: 363]
                        </button>
                        <h2 className={styles.modalTitle}>Login to Your Account</h2> [cite: 363]
                        {feedback.message && feedback.type === 'error' && ( [cite: 363, 364]
                            <p className={`${styles.feedbackMessage} ${styles.feedbackError}`}>
                                {feedback.message} [cite: 364]
                            </p>
                        )}
                        <form onSubmit={handleLoginSubmit}> [cite: 364]
                            <div className={styles.formGroup}> [cite: 365]
                                <label className={styles.label} htmlFor="login-name">Your Name</label> [cite: 365]
                                <input
                                    id="login-name" [cite: 366]
                                    className={styles.input} [cite: 366]
                                    name="name" [cite: 367]
                                    required
                                    value={loginForm.name} [cite: 367]
                                    onChange={handleLoginFormChange} [cite: 368]
                                />
                            </div>
                            <div className={styles.formGroup}> [cite: 368]
                                <label className={styles.label} htmlFor="login-phone">Phone Number</label> [cite: 369]
                                <input
                                    id="login-phone" [cite: 370]
                                    type="tel" [cite: 370]
                                    className={styles.input} [cite: 371]
                                    name="phone" [cite: 371]
                                    required
                                    value={loginForm.phone} [cite: 371, 372]
                                    onChange={handleLoginFormChange} [cite: 372]
                                    maxLength={10} [cite: 372]
                                    pattern="[0-9]{10}" [cite: 373]
                                    title="Please enter a 10-digit mobile number" [cite: 373]
                                    placeholder="e.g., 9876543210" [cite: 374]
                                />
                            </div>
                            <div className={styles.modalButtons}> [cite: 374]
                                <button type="submit" className={styles.modalButton} disabled={isLoggingIn}> [cite: 374, 375]
                                    {isLoggingIn ? 'Logging In...' : 'Login'} [cite: 375, 376]
                                </button>
                                <button type="button" className={`${styles.modalButton} ${styles.cancel}`} onClick={() => { [cite: 376, 377]
                                    closeLoginModal(); [cite: 377]
                                    setShowSignUpModal(true); // Offer signup if login fails [cite: 377, 378]
                                }}>
                                    New User? Sign Up [cite: 379]
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Account Sidebar (New) --- */}
            {isSidebarOpen && ( [cite: 380, 381]
                <div className={`${styles.accountSidebarOverlay} ${isSidebarOpen ? styles.visible : ''}`} onClick={() => setIsSidebarOpen(false)}> {/* Close sidebar on overlay click */} [cite: 381]
                    <div className={`${styles.accountSidebar} ${isSidebarOpen ? styles.open : ''}`} onClick={(e) => e.stopPropagation()}> {/* Prevent closing when clicking inside sidebar */} [cite: 381]
                        <div className={styles.sidebarHeader}> [cite: 381, 382]
                            <h3 className={styles.sidebarTitle}>My Account</h3> [cite: 382]
                            <button className={styles.sidebarCloseButton} onClick={() => setIsSidebarOpen(false)}> [cite: 382]
                                <IoCloseCircleOutline /> [cite: 383]
                            </button>
                        </div>
                        <div className={styles.sidebarTabs}> [cite: 383]
                            <button
                                className={`${styles.tabButton} ${activeAccountTab === 'accountDetails' ? styles.active : ''}`} [cite: 383, 384]
                                onClick={() => setActiveAccountTab('accountDetails')} [cite: 384]
                            >
                                Account Details [cite: 385]
                            </button>
                            <button
                                className={`${styles.tabButton} ${activeAccountTab === 'addresses' ? styles.active : ''}`} [cite: 385, 386]
                                onClick={() => setActiveAccountTab('addresses')} [cite: 386]
                            >
                                Addresses [cite: 387]
                            </button>
                            <button
                                className={`${styles.tabButton} ${activeAccountTab === 'feedback' ? styles.active : ''}`} [cite: 387, 388]
                                onClick={() => {
                                    setActiveAccountTab('feedback'); [cite: 388]
                                    setFeedbackSubmittedMessage(''); // Clear specific feedback message
                                    setFeedbackText(''); // Clear textarea
                                    setFeedback({message: '', type: ''}); // Clear general feedback
                                }}
                            >
                                Feedback [cite: 389]
                            </button>
                        </div>

                        <div className={styles.tabContent}> [cite: 389, 390]
                            {activeAccountTab === 'accountDetails' && ( [cite: 390]
                                <Fragment> [cite: 391]
                                    <h3>Your Profile</h3> [cite: 391]
                                    {feedback.message && (feedback.type === 'success' || feedback.type === 'error' || feedback.type === 'info') && ( // Added 'info' for feedback type [cite: 391]
                                        <p className={`${styles.feedbackMessage} ${styles[`feedback${feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}`]}`}>
                                            {feedback.message} [cite: 392]
                                        </p>
                                    )}
                                    {loggedInUser ? ( [cite: 393]
                                        <form className={styles.accountDetailsForm} onSubmit={saveAccountDetails}> [cite: 393, 394]
                                            <div className={styles.formGroup}> [cite: 394]
                                                <label className={styles.label} htmlFor="acc-name">Name</label> [cite: 394, 395]
                                                <input
                                                    id="acc-name" [cite: 395, 396]
                                                    className={styles.input} [cite: 396]
                                                    name="name" [cite: 397]
                                                    value={accountDetailsForm.name || ''} [cite: 397, 398]
                                                    onChange={handleAccountDetailsFormChange} [cite: 398]
                                                    required [cite: 399]
                                                />
                                            </div>
                                            <div className={styles.formGroup}> [cite: 400]
                                                <label className={styles.label} htmlFor="acc-phone">Phone Number</label> [cite: 400, 401]
                                                <input
                                                    id="acc-phone" [cite: 401, 402]
                                                    className={styles.input} [cite: 402]
                                                    name="phone" [cite: 403]
                                                    value={accountDetailsForm.phone || ''} [cite: 403, 404]
                                                    readOnly // Phone number should not be editable after signup (as it's the identifier) [cite: 404]
                                                    style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }} [cite: 405]
                                                />
                                            </div>
                                            <div className={styles.formGroup}> [cite: 406]
                                                <label className={styles.label} htmlFor="acc-address">Address</label> [cite: 407]
                                                <input
                                                    id="acc-address" [cite: 408]
                                                    className={styles.input} [cite: 408, 409]
                                                    name="address" [cite: 409]
                                                    value={accountDetailsForm.address || ''} [cite: 410]
                                                    onChange={handleAccountDetailsFormChange} [cite: 410]
                                                    required [cite: 411]
                                                />
                                            </div>
                                            <div className={styles.formGroup}> [cite: 412]
                                                <label className={styles.label} htmlFor="acc-pincode">Pincode</label> [cite: 412, 413]
                                                <input
                                                    id="acc-pincode" [cite: 413, 414]
                                                    className={styles.input} [cite: 414]
                                                    name="pincode" [cite: 415]
                                                    value={accountDetailsForm.pincode || ''} [cite: 415, 416]
                                                    onChange={handleAccountDetailsFormChange} [cite: 416]
                                                    maxLength={6} [cite: 417]
                                                    pattern="[0-9]{6}" [cite: 417, 418]
                                                    title="Please enter a 6-digit pincode" [cite: 418]
                                                    required [cite: 419]
                                                />
                                            </div>
                                            <button
                                                type="submit" [cite: 420]
                                                className={`${styles.button} ${styles.saveButton}`} [cite: 420, 421]
                                                disabled={isUpdatingAccount} [cite: 421]
                                            >
                                                {isUpdatingAccount ? 'Saving...' : 'Save Changes'} [cite: 422, 423]
                                            </button>
                                            <button
                                                type="button" [cite: 424]
                                                className={`${styles.button} ${styles.cancel}`} [cite: 424, 425]
                                                onClick={handleLogout} // Use logout for clearing session [cite: 425]
                                                style={{ marginTop: '10px' }} [cite: 426]
                                            >
                                                Logout [cite: 427]
                                            </button>
                                        </form>
                                    ) : ( [cite: 428]
                                        <p style={{ textAlign: 'center', marginTop: '20px' }}>Please log in to view and manage your account details.</p> [cite: 428]
                                    )}
                                </Fragment>
                            )}

                            {activeAccountTab === 'addresses' && ( [cite: 429, 430]
                                <Fragment> [cite: 430]
                                    <h3>Your Saved Addresses ({userAddresses.length}/5)</h3> [cite: 430]
                                    {feedback.message && (feedback.type === 'success' || feedback.type === 'error' || feedback.type === 'info') && ( // Added 'info' [cite: 431]
                                        <p className={`${styles.feedbackMessage} ${styles[`feedback${feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}`]}`}>
                                            {feedback.message} [cite: 432]
                                        </p>
                                    )}
                                    {isManagingAddresses && <p style={{ textAlign: 'center' }}>Loading addresses...</p>} [cite: 433]

                                    {loggedInUser ? ( [cite: 433, 434]
                                        <Fragment> [cite: 434]
                                            <div className={styles.addressList}> [cite: 435]
                                                {userAddresses.length > 0 ? ( [cite: 435]
                                                    <ul> [cite: 436]
                                                        {userAddresses.map(addr => ( [cite: 436, 437]
                                                            <li key={addr.id} className={styles.addressItem}> [cite: 437]
                                                                <strong>{addr.addressName}</strong> [cite: 438]
                                                                <p>{addr.fullAddress}</p> [cite: 438, 439]
                                                                <p>Pincode: {addr.pincode}</p> [cite: 439]
                                                                <div className={styles.addressActions}> [cite: 439, 440]
                                                                    <button
                                                                        type="button" [cite: 440, 441]
                                                                        onClick={() => handleEditAddress(addr)} [cite: 441]
                                                                        style={{ backgroundColor: '#00796b' }} // Green edit button [cite: 442, 443]
                                                                    >
                                                                        Edit [cite: 444]
                                                                    </button>
                                                                    <button type="button" onClick={() => handleDeleteAddress(addr.id)}> [cite: 445]
                                                                        Delete [cite: 446]
                                                                    </button>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : ( [cite: 449]
                                                    <p style={{ textAlign: 'center', marginBottom: '20px' }}>No addresses saved yet.</p> [cite: 450]
                                                )}
                                            </div>

                                            {userAddresses.length < 5 && !showAddressForm && ( [cite: 451, 452]
                                                <button
                                                    type="button" [cite: 452]
                                                    className={`${styles.button} ${styles.addAddressButton}`} [cite: 453]
                                                    onClick={() => {
                                                        setShowAddressForm(true); [cite: 454]
                                                        setAddressForm({ id: null, addressName: '', fullAddress: '', pincode: '' }); // Reset form for new address [cite: 455, 456]
                                                    }}
                                                >
                                                    <FaPlus /> Add New Address [cite: 457, 458]
                                                </button>
                                            )}

                                            {showAddressForm && ( [cite: 459]
                                                <form onSubmit={handleSaveAddress} className={styles.addressForm}> [cite: 459]
                                                    <h3>{addressForm.id ? 'Edit Address' : 'Add New Address'}</h3> [cite: 460]
                                                    <div className={styles.formGroup}> [cite: 461]
                                                        <label className={styles.label} htmlFor="addr-name">Address Name (e.g., Home, Work)</label> [cite: 461]
                                                        <input
                                                            id="addr-name" [cite: 462]
                                                            className={styles.input} [cite: 463]
                                                            name="addressName" [cite: 463]
                                                            required [cite: 464]
                                                            value={addressForm.addressName} [cite: 464, 465]
                                                            onChange={handleAddressFormChange} [cite: 465]
                                                        />
                                                    </div>
                                                    <div className={styles.formGroup}> [cite: 466, 467]
                                                        <label className={styles.label} htmlFor="addr-full">Full Address</label> [cite: 467]
                                                        <input
                                                            id="addr-full" [cite: 468]
                                                            className={styles.input} [cite: 469]
                                                            name="fullAddress" [cite: 469, 470]
                                                            required [cite: 470]
                                                            value={addressForm.fullAddress} [cite: 471]
                                                            onChange={handleAddressFormChange} [cite: 471, 472]
                                                        />
                                                    </div>
                                                    <div className={styles.formGroup}> [cite: 473]
                                                        <label className={styles.label} htmlFor="addr-pincode">Pincode</label> [cite: 473, 474]
                                                        <input
                                                            id="addr-pincode" [cite: 475]
                                                            type="text" [cite: 475]
                                                            className={styles.input} [cite: 476]
                                                            name="pincode" [cite: 476]
                                                            required [cite: 477]
                                                            value={addressForm.pincode} [cite: 478]
                                                            onChange={handleAddressFormChange} [cite: 478, 479]
                                                            maxLength={6} [cite: 479]
                                                            pattern="[0-9]{6}" [cite: 480]
                                                            title="Please enter a 6-digit pincode" [cite: 480]
                                                        />
                                                    </div>
                                                    <div className={styles.formButtons}> [cite: 482]
                                                        <button type="submit" className={styles.modalButton} disabled={isManagingAddresses}> [cite: 482, 483]
                                                            {isManagingAddresses ? 'Saving...' : 'Save Address'} [cite: 483, 484]
                                                        </button>
                                                        <button type="button" className={`${styles.modalButton} ${styles.cancel}`} onClick={() => { [cite: 485]
                                                            setShowAddressForm(false); [cite: 486]
                                                            setAddressForm({ id: null, addressName: '', fullAddress: '', pincode: '' }); // Clear form [cite: 486, 487]
                                                        }}>
                                                            Cancel [cite: 488]
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </Fragment>
                                    ) : ( [cite: 491]
                                        <p style={{ textAlign: 'center', marginTop: '20px' }}>Please log in to manage your addresses.</p> [cite: 491]
                                    )}
                                </Fragment>
                            )}

                            {activeAccountTab === 'feedback' && ( [cite: 492, 493]
                                <Fragment> [cite: 493]
                                    <h3>Send Us Your Feedback</h3>
                                    {feedbackSubmittedMessage ? (
                                        <p className={styles.feedbackSuccessMessage}>{feedbackSubmittedMessage}</p>
                                    ) : (
                                        loggedInUser ? (
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
                                                {feedback.message && feedback.type === 'error' && (
                                                    <p className={`${styles.feedbackMessage} ${styles.feedbackError}`}>
                                                        {feedback.message}
                                                    </p>
                                                )}
                                                <button type="submit" disabled={isSubmittingFeedback || !feedbackText.trim()}>
                                                    {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                                                </button>
                                            </form>
                                        ) : (
                                            <p style={{ textAlign: 'center', marginTop: '20px' }}>Please log in to submit your valuable feedback.</p>
                                        )
                                    )}
                                </Fragment>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- getStaticProps: Fetches Lemon Product Data ---
// This function runs at build time or on demand with ISR [cite: 496]
export async function getStaticProps() {
    try {
        const res = await fetch(LEMONS_DATA_URL); // Use the constant defined at the top [cite: 496, 497]
        if (!res.ok) { // [cite: 497]
            console.error(`Failed to fetch lemons: ${res.status} ${res.statusText}`); [cite: 497, 498]
            const errorBody = await res.text(); [cite: 498]
            console.error('Lemons API Response Body:', errorBody); [cite: 499]
            // Return empty array and revalidate to try again later [cite: 499]
            return { props: { lemons: [] }, revalidate: 30 }; // [cite: 499, 500]
        }
        const lemons = await res.json(); [cite: 500, 501]
        if (!Array.isArray(lemons)) { // [cite: 501]
            console.error("Fetched lemons data is not an array:", lemons); [cite: 501, 502]
            return { props: { lemons: [] }, revalidate: 30 }; // [cite: 502, 503]
        }

        return {
            props: { lemons }, // [cite: 503]
            revalidate: 30, // Revalidate every 30 seconds to get fresh data [cite: 504]
        };
    } catch (error) { // [cite: 504]
        console.error("Error in getStaticProps for lemons:", error); // [cite: 505]
        return { props: { lemons: [] }, revalidate: 30 }; // [cite: 505]
    }
}
