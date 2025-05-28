import React, { useState, useEffect, useCallback, useMemo, Fragment, useContext } from 'react'; // Added useContext
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/styles.module.css'; // Make sure this import is present
import { FaWhatsapp, FaStar, FaUserCircle, FaPlus, FaMinus, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaSpinner } from 'react-icons/fa'; // Updated icon imports
import { IoCloseCircleOutline, IoMenu } from 'react-icons/io5'; // IoMenu for hamburger, IoCloseCircleOutline for close buttons
import { AuthContext } from './_app'; // Import AuthContext

// SheetDB API URLs (REPLACE THESE WITH YOUR ACTUAL SHEETDB URLS)
// IMPORTANT: Verify these URLs against your SheetDB dashboard.
const LEMONS_DATA_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Lemons';
const ORDERS_SUBMISSION_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=orders';
const SIGNUP_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=signup';
const ADDRESSES_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Addresses';
const FEEDBACK_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Feedback';

// --- Home Component ---
export default function Home({ lemons }) {
    // Access AuthContext
    const { isLoggedIn, currentUser, login, logout, setCurrentUser } = useContext(AuthContext);

    // Order form states
    const [orders, setOrders] = useState([{ grade: '', quantity: '' }]);
    const [form, setForm] = useState({ name: '', delivery: '', contact: '' });
    const [total, setTotal] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Consolidated Feedback State (for all messages: order, signup, login, logout, account)
    const [feedback, setFeedback] = useState({ message: '', type: '' }); // type: 'success', 'error', 'info'

    // Modal states for order confirmation/success
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [confirmedOrderDetails, setConfirmedOrderDetails] = useState(null);

    // User authentication/account states (managed by AuthContext now for global state)
    // Removed local isLoggedIn and loggedInUser states, now using AuthContext's
    const [showSignUpPromptModal, setShowSignUpPromptModal] = useState(false); // "Please sign up to order" modal
    const [showSignUpModal, setShowSignUpModal] = useState(false); // Actual signup form modal
    const [signUpForm, setSignUpForm] = useState({ name: '', phone: '', address: '', pincode: '' });
    const [isSigningUp, setIsSigningUp] = useState(false);

    // Login Modal states
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginForm, setLoginForm] = useState({ name: '', phone: '' });
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Account Sidebar states
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeAccountTab, setActiveAccountTab] = useState('accountDetails'); // 'accountDetails', 'addresses', 'feedback'
    const [userAddresses, setUserAddresses] = useState([]); // Stores addresses fetched from SheetDB
    const [accountDetailsForm, setAccountDetailsForm] = useState({ name: '', phone: '', address: '', pincode: '' }); // For editing in sidebar
    const [isUpdatingAccount, setIsUpdatingAccount] = useState(false); // Loading state for account updates
    const [addressForm, setAddressForm] = useState({ id: null, addressName: '', fullAddress: '', pincode: '' }); // For adding/editing addresses
    const [showAddressForm, setShowAddressForm] = useState(false); // To show/hide add/edit address form
    const [isManagingAddresses, setIsManagingAddresses] = useState(false); // Loading state for address actions

    // Feedback specific states for the sidebar feedback tab
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [feedbackSubmittedMessage, setFeedbackSubmittedMessage] = useState(''); // To show 'Thank you' message specifically for feedback form

    // Hardcoded customer reviews
    const customerReviews = useMemo(() => [
        { id: 1, text: "The lemons from 3 Lemons Traders are incredibly fresh and juicy! Perfect for my restaurant.", name: "Chef Rahul S.", rating: 5 },
        { id: 2, text: "Excellent quality and timely delivery. Their A1 grade lemons are truly the best.", name: "Priya M.", rating: 5 },
        { id: 3, text: "Great prices for bulk orders. The team is very responsive and helpful.", name: "Kiran R.", rating: 4 },
        { id: 4, text: "Consistently good quality. My go-to for all lemon needs.", name: "Amit P.", rating: 5 },
        { id: 5, text: "Freshness guaranteed every time. Highly recommend!", name: "Sunita D.", rating: 5 },
    ], []);

    // --- Utility for showing temporary messages ---
    const showTemporaryFeedback = useCallback((message, type = 'info', duration = 5000) => {
        setFeedback({ message, type });
        const timer = setTimeout(() => setFeedback({ message: '', type: '' }), duration);
        return () => clearTimeout(timer); // Cleanup on unmount or re-render
    }, []);

    // --- Effects for loading/saving user data and calculating total ---
    useEffect(() => {
        calculateTotal();
    }, [orders, lemons, calculateTotal]); // Added calculateTotal to dependency array

    // Load account details from local storage on component mount and sync with AuthContext
    useEffect(() => {
        if (currentUser) {
            setAccountDetailsForm(currentUser); // Initialize sidebar form with logged in user
            // Auto-populate form with saved details if available
            setForm(prevForm => ({
                ...prevForm,
                name: currentUser.name || prevForm.name,
                contact: currentUser.phone || prevForm.contact,
                delivery: currentUser.address || prevForm.delivery,
            }));
        } else {
            // If logged out, clear the order form personal details
            setForm({ name: '', delivery: '', contact: '' });
            setAccountDetailsForm({ name: '', phone: '', address: '', pincode: '' });
        }
    }, [currentUser]); // Depend on currentUser from AuthContext

    // Effect to fetch addresses when user logs in or addresses change
    const fetchUserAddresses = useCallback(async (userPhone) => {
        if (!userPhone) return;
        setIsManagingAddresses(true);
        setUserAddresses([]); // Clear previous addresses
        try {
            const res = await fetch(`${ADDRESSES_SHEET_URL}?searchField=userPhone&searchValue=${userPhone}`);
            if (!res.ok && res.status !== 404 && res.status !== 204) {
                throw new Error(`Failed to fetch addresses: ${res.status} ${res.statusText}`);
            }
            let addresses = [];
            if (res.status !== 204 && res.status !== 404) {
                addresses = await res.json();
            }

            if (Array.isArray(addresses)) {
                setUserAddresses(addresses.map(addr => ({ ...addr, id: addr.id || Date.now() + Math.random() }))); // using Math.random() for uniqueness if ID not present
            } else {
                setUserAddresses([]);
            }
        } catch (error) {
            console.error("Error fetching user addresses:", error);
            showTemporaryFeedback('Failed to load addresses.', 'error');
        } finally {
            setIsManagingAddresses(false);
        }
    }, [showTemporaryFeedback]);

    useEffect(() => {
        if (isLoggedIn && currentUser?.phone) {
            fetchUserAddresses(currentUser.phone);
        } else {
            setUserAddresses([]); // Clear addresses if logged out
        }
    }, [isLoggedIn, currentUser?.phone, fetchUserAddresses]); // Depend on login status, user phone, and fetchUserAddresses callback


    // --- Handlers for main order form changes ---
    const handleOrderChange = (index, field, value) => {
        const updated = [...orders];

        if (field === 'quantity') {
            value = value === '' ? '' : String(Math.max(1, parseInt(value) || 1));
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

        updated[index][field] = value;
        setOrders(updated);
    };

    const handleAddVariety = () => {
        // Prevent adding new variety if the last one is empty
        const lastOrder = orders[orders.length - 1];
        if (orders.length > 0 && (lastOrder.grade === '' || lastOrder.quantity === '')) {
            showTemporaryFeedback('Please complete the current variety selection before adding a new one.', 'info');
            return;
        }

        setOrders([...orders, { grade: '', quantity: '' }]);
    };

    const handleRemoveVariety = (index) => {
        const updated = orders.filter((_, i) => i !== index);
        setOrders(updated.length > 0 ? updated : [{ grade: '', quantity: '' }]); // Ensure at least one row remains
        showTemporaryFeedback('Variety removed.', 'info'); // Add feedback for removal
    };

    const calculateTotal = useCallback(() => {
        let totalPrice = 0;
        orders.forEach(order => {
            const lemon = lemons.find(l => l.Grade === order.grade);
            if (lemon) {
                const pricePerKg = parseFloat(lemon['Price Per Kg']);
                const quantity = parseInt(order.quantity);

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

    // --- Main Order Submission Flow (now checks login status) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ message: '', type: '' }); // Clear any previous messages immediately

        // --- Client-Side Form Validation ---
        if (!form.name.trim() || !form.delivery.trim() || !form.contact.trim()) {
            showTemporaryFeedback('Please fill in all your personal details (Name, Delivery Address, Contact).', 'error');
            return;
        }
        if (!/^\d{10}$/.test(form.contact)) {
            showTemporaryFeedback('Please enter a valid 10-digit contact number.', 'error');
            return;
        }

        const validOrders = orders.filter(order => order.grade && order.quantity && parseInt(order.quantity) > 0);
        if (validOrders.length === 0) {
            showTemporaryFeedback('Please add at least one lemon variety with a valid quantity (must be 1 or more).', 'error');
            return;
        }
        const hasInvalidQuantity = orders.some(order => {
            return (order.grade && (order.quantity === '' || isNaN(parseInt(order.quantity)) || parseInt(order.quantity) <= 0));
        });
        if (hasInvalidQuantity) {
            showTemporaryFeedback('Please ensure all selected varieties have a valid quantity (1 or more).', 'error');
            return;
        }
        // --- End Validation ---

        // --- Authentication Check (when ordering) ---
        if (!isLoggedIn) {
            setIsSubmitting(true); // Show loading state while checking user
            try {
                const checkRes = await fetch(`${SIGNUP_SHEET_URL}?searchField=phone&searchValue=${form.contact}`);
                if (!checkRes.ok && checkRes.status !== 404 && checkRes.status !== 204) {
                    throw new Error(`Failed to check existing users: ${checkRes.status} ${checkRes.statusText}`);
                }

                let existingUsers = [];
                if (checkRes.status !== 204 && checkRes.status !== 404) {
                    existingUsers = await checkRes.json();
                }

                if (!Array.isArray(existingUsers)) {
                    existingUsers = [];
                }

                if (existingUsers.length > 0) {
                    // User exists, "log them in" via AuthContext
                    const user = existingUsers[0];
                    login(user); // Use login from AuthContext
                    showTemporaryFeedback(`Welcome back, ${user.name}! 😊`, 'success');
                    // Auto-fill order form (done by useEffect, but ensure consistency)
                    setForm(prevForm => ({
                        ...prevForm,
                        name: user.name || '',
                        contact: user.phone || '',
                        delivery: user.address || '',
                    }));
                    setIsSubmitting(false);
                    // Now that user is logged in, proceed to show confirmation modal
                    const dummyEvent = { preventDefault: () => { } };
                    handleSubmit(dummyEvent); // Recursive call to proceed after login
                    return;
                } else {
                    // User does not exist, prompt for signup
                    setIsSubmitting(false);
                    setShowSignUpPromptModal(true);
                    return;
                }
            } catch (error) {
                console.error("Error checking user existence during order attempt:", error);
                showTemporaryFeedback('Failed to verify user. Please try again.', 'error');
                setIsSubmitting(false);
                return;
            }
        }

        // If logged in (or just logged in via the above block), proceed to show confirmation modal
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

    // --- Function to actually submit the order after confirmation ---
    const confirmAndSubmitOrder = async () => {
        setShowConfirmModal(false); // Close the confirmation modal immediately
        setIsSubmitting(true);
        setFeedback({ message: '', type: '' });

        if (!confirmedOrderDetails) {
            showTemporaryFeedback('Error: No order details to confirm.', 'error');
            setIsSubmitting(false);
            return;
        }

        const { personal, items } = confirmedOrderDetails;
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
                setShowSuccessModal(true); // Show success modal
                showTemporaryFeedback('Order submitted successfully!', 'success');
                // Reset order form items, but keep personal details if logged in
                setOrders([{ grade: '', quantity: '' }]);
                setForm(prevForm => ({
                    ...prevForm,
                    name: isLoggedIn ? currentUser.name : '',
                    contact: isLoggedIn ? currentUser.phone : '',
                    delivery: isLoggedIn ? currentUser.address : '',
                }));
                setTotal(0);
                setConfirmedOrderDetails(null);
            } else {
                const errorData = await response.json();
                console.error('SheetDB submission error:', response.status, errorData);
                showTemporaryFeedback(`Failed to submit order: ${errorData.message || 'Server error'}. Please try again.`, 'error');
            }
        } catch (err) {
            console.error('Network or submission error:', err);
            showTemporaryFeedback('Failed to submit order. Please check your internet connection and try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Modal Closing Handlers ---
    const closeSuccessModal = () => {
        setShowSuccessModal(false);
        setFeedback({ message: '', type: '' }); // Clear feedback after closing success modal
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelConfirmation = () => {
        setShowConfirmModal(false);
        setConfirmedOrderDetails(null);
        showTemporaryFeedback('Order confirmation cancelled.', 'info');
    };

    const closeSignUpPromptModal = () => {
        setShowSignUpPromptModal(false);
        // If user cancels signup prompt, clear any related feedback
        setFeedback({ message: '', type: '' });
    };

    const closeSignUpModal = () => {
        setShowSignUpModal(false);
        setFeedback({ message: '', type: '' }); // Clear signup messages
        setSignUpForm({ name: '', phone: '', address: '', pincode: '' }); // Clear signup form
    };

    // --- Sign Up Form Handlers ---
    const handleSignUpFormChange = (e) => {
        const { name, value } = e.target;
        // Pincode validation
        if (name === 'pincode') {
            if (!/^\d*$/.test(value) || value.length > 6) {
                return;
            }
        }
        // Phone number validation for signup form
        if (name === 'phone') {
            if (!/^\d*$/.test(value) || value.length > 10) {
                return;
            }
        }
        setSignUpForm(prevForm => ({ ...prevForm, [name]: value }));
    };

    const handleSignUpSubmit = async (e) => {
        e.preventDefault();
        setIsSigningUp(true);
        setFeedback({ message: '', type: '' }); // Clear signup messages

        // Sign up form validation
        const { name, phone, address, pincode } = signUpForm;
        if (!name.trim() || !phone.trim() || !address.trim() || !pincode.trim()) {
            showTemporaryFeedback('Please fill in all signup details.', 'error');
            setIsSigningUp(false);
            return;
        }
        if (!/^\d{10}$/.test(phone)) {
            showTemporaryFeedback('Please enter a valid 10-digit phone number.', 'error');
            setIsSigningUp(false);
            return;
        }
        if (!/^\d{6}$/.test(pincode)) {
            showTemporaryFeedback('Please enter a valid 6-digit pincode.', 'error');
            setIsSigningUp(false);
            return;
        }

        try {
            // --- Check for existing user (by phone number) before new signup ---
            const checkRes = await fetch(`${SIGNUP_SHEET_URL}?searchField=phone&searchValue=${phone}`);
            if (!checkRes.ok && checkRes.status !== 404 && checkRes.status !== 204) {
                throw new Error(`Failed to check existing users during signup: ${checkRes.status} ${checkRes.statusText}`);
            }

            let existingUsers = [];
            if (checkRes.status !== 204 && checkRes.status !== 404) {
                existingUsers = await checkRes.json();
            }

            if (!Array.isArray(existingUsers)) {
                existingUsers = [];
            }

            if (existingUsers.length > 0) {
                showTemporaryFeedback('An account with this phone number already exists. Please login or use a different number.', 'error');
                setIsSigningUp(false);
                return;
            }

            // --- Proceed with new user signup ---
            const response = await fetch(SIGNUP_SHEET_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: {
                        name: name.trim(),
                        phone: phone.trim(),
                        address: address.trim(),
                        pincode: pincode.trim(),
                        'Signup Date': new Date().toLocaleString(),
                    }
                }),
            });
            if (response.ok) {
                const newUser = { name: name.trim(), phone: phone.trim(), address: address.trim(), pincode: pincode.trim() };
                login(newUser); // Use login from AuthContext
                showTemporaryFeedback(`Thank you, ${newUser.name}, for signing up. Let's start ordering! 😊`, 'success');
                // Auto-fill order form
                setForm(prevForm => ({
                    ...prevForm,
                    name: newUser.name,
                    contact: newUser.phone,
                    delivery: newUser.address,
                }));
                closeSignUpModal(); // Close signup form
                closeSignUpPromptModal(); // Close prompt if it was open
                closeLoginModal(); // Ensure login modal is closed if it was open before signup

                // Immediately open the order confirmation modal after signup if there was an order pending
                if (orders.filter(o => o.grade && o.quantity && parseInt(o.quantity) > 0).length > 0) {
                    const dummyEvent = { preventDefault: () => { } };
                    handleSubmit(dummyEvent);
                }
            } else {
                const errorData = await response.json();
                console.error('SheetDB signup error:', response.status, errorData);
                showTemporaryFeedback(`Failed to create account: ${errorData.message || 'Server error'}. Please try again.`, 'error');
            }
        } catch (err) {
            console.error('Network or signup error:', err);
            showTemporaryFeedback('Failed to create account. Please check your internet connection and try again.', 'error');
        } finally {
            setIsSigningUp(false);
        }
    };

    // --- Login Modal Handlers ---
    const openLoginModal = () => {
        setShowLoginModal(true);
        setLoginForm({ name: '', phone: '' }); // Clear login form
        setFeedback({ message: '', type: '' }); // Clear any general feedback
    };

    const closeLoginModal = () => {
        setShowLoginModal(false);
        setLoginForm({ name: '', phone: '' });
        setFeedback({ message: '', type: '' }); // Clear login messages
    };
    // The handleLoginFormChange function is defined earlier, no need to redefine
    // const handleLoginFormChange = (e) => { ... }

    // The handleLoginSubmit function is defined earlier, no need to redefine
    // const handleLoginSubmit = async (e) => { ... }


    // --- Logout Function ---
    const handleLogout = () => {
        logout(); // Use logout from AuthContext
        setUserAddresses([]); // Clear addresses on logout
        // Clear order form personal details
        setOrders([{ grade: '', quantity: '' }]); // Reset orders as well
        setTotal(0); // Reset total
        showTemporaryFeedback('You have been logged out.', 'info');
        setIsSidebarOpen(false); // Close sidebar on logout
    };

    // --- Account Sidebar Handlers ---
    const toggleSidebar = () => {
        if (isLoggedIn) { // Only open sidebar if logged in
            setIsSidebarOpen(!isSidebarOpen);
            if (!isSidebarOpen) { // If opening, reset to default tab and clear messages
                setActiveAccountTab('accountDetails');
                setFeedback({ message: '', type: '' }); // Clear any general feedback
                // Ensure accountDetailsForm is synced with loggedInUser when opening
                if (currentUser) {
                    setAccountDetailsForm(currentUser);
                }
                setShowAddressForm(false); // Hide address form in case it was open
                setAddressForm({ id: null, addressName: '', fullAddress: '', pincode: '' }); // Reset address form
                setFeedbackText(''); // Clear feedback text for new submission
                setFeedbackSubmittedMessage(''); // Clear 'thank you' message
            }
        } else {
            // If user tries to open sidebar without being logged in, prompt login
            openLoginModal();
            showTemporaryFeedback('Please log in to access your account.', 'info');
        }
    };

    const handleAccountDetailsFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'pincode') {
            if (!/^\d*$/.test(value) || value.length > 6) {
                return;
            }
        }
        setAccountDetailsForm(prevForm => ({ ...prevForm, [name]: value }));
    };

    const saveAccountDetails = async (e) => {
        e.preventDefault();
        if (!currentUser || !currentUser.phone) {
            showTemporaryFeedback('Please login to save account details.', 'error');
            return;
        }
        setIsUpdatingAccount(true);
        setFeedback({ message: '', type: '' }); // Clear general feedback

        const { name, address, pincode } = accountDetailsForm;
        if (!name.trim() || !address.trim() || !pincode.trim()) {
            showTemporaryFeedback('Please fill in all account details.', 'error');
            setIsUpdatingAccount(false);
            return;
        }
        if (!/^\d{6}$/.test(pincode)) {
            showTemporaryFeedback('Please enter a valid 6-digit pincode.', 'error');
            setIsUpdatingAccount(false);
            return;
        }

        try {
            const response = await fetch(`${SIGNUP_SHEET_URL}/phone/${currentUser.phone}`, { // Use PUT for updating by phone
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: {
                        name: name.trim(),
                        address: address.trim(),
                        pincode: pincode.trim(),
                    }
                }),
            });
            if (response.ok) {
                // Update AuthContext user state
                const updatedUser = { ...currentUser, name: name.trim(), address: address.trim(), pincode: pincode.trim() };
                setCurrentUser(updatedUser); // Update context and localStorage via _app.js
                showTemporaryFeedback('Account details updated successfully!', 'success');
                // Also update the main order form fields if they are currently being edited
                setForm(prevForm => ({
                    ...prevForm,
                    name: updatedUser.name,
                    delivery: updatedUser.address,
                }));
            } else {
                const errorData = await response.json();
                console.error('SheetDB account update error:', response.status, errorData);
                showTemporaryFeedback(`Failed to update: ${errorData.message || 'Server error'}.`, 'error');
            }
        } catch (error) {
            console.error('Network error updating account:', error);
            showTemporaryFeedback('Network error. Could not update account.', 'error');
        } finally {
            setIsUpdatingAccount(false);
        }
    };

    // --- Address Management Handlers (functions are defined earlier) ---
    // handleAddressFormChange
    // handleSaveAddress
    // handleDeleteAddress
    // handleEditAddress

    // --- Feedback Handlers ---
    const handleFeedbackTextChange = (e) => {
        setFeedbackText(e.target.value);
        setFeedbackSubmittedMessage(''); // Reset 'thank you' message if user starts typing again
        setFeedback({ message: '', type: '' }); // Clear any general error/success
    };

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        setFeedback({ message: '', type: '' }); // Clear general feedback
        setIsSubmittingFeedback(true);

        if (!currentUser) {
            setFeedback({ message: 'Please log in to submit feedback.', type: 'error' });
            setIsSubmittingFeedback(false);
            return;
        }

        if (!feedbackText.trim()) {
            setFeedback({ message: 'Feedback cannot be empty.', type: 'error' });
            setIsSubmittingFeedback(false);
            return;
        }

        try {
            const feedbackData = {
                Name: currentUser.name,
                Phone: currentUser.phone,
                Address: currentUser.address || 'N/A', // Use address from loggedInUser, or 'N/A'
                Feedback: feedbackText,
                'Feedback Date': new Date().toLocaleString(),
            };

            const res = await fetch(FEEDBACK_SHEET_URL, { // Corrected URL here
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: feedbackData }) // SheetDB expects { data: {} } for single row
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to submit feedback: ${res.status} ${res.statusText}`);
            }

            setFeedbackText(''); // Clear textarea
            setFeedbackSubmittedMessage('Thank you for your valuable feedback!'); // Set specific message
            setFeedback({ message: 'Feedback submitted successfully!', type: 'success' }); // General success
        } catch (error) {
            console.error('Error submitting feedback:', error);
            setFeedbackSubmittedMessage(''); // Ensure no success message on error
            setFeedback({ message: `Error submitting feedback: ${error.message}`, type: 'error' });
        } finally {
            setIsSubmittingFeedback(false);
        }
    };


    // The getWhatsappLink function is defined earlier, no need to redefine
    // const getWhatsappLink = () => { ... }

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

            {/* --- NEW: Header with Login Button / Account Icon --- */}
            <header className={styles.header}>
                <h1 className={styles.headerTitle}>3 Lemons Traders</h1>
                <div className={styles.headerActions}>
                    {isLoggedIn ? (
                        <button className={styles.loginButton} onClick={toggleSidebar}>
                            <FaUserCircle size={24} color="#333" /> {/* User icon if logged in */}
                        </button>
                    ) : (
                        <button className={styles.loginButton} onClick={openLoginModal}>
                            Login / Signup
                        </button>
                    )}
                    {/* Hamburger menu for small screens - can be shown/hidden via CSS media queries */}
                    {/* <IoMenu className={styles.hamburgerIcon} onClick={toggleSidebar} /> */}
                </div>
            </header>

            <main className={styles.container}>
                {/* Feedback Message Display */}
                {feedback.message && (
                    <div className={`${styles.feedbackMessage} ${styles[`feedback${feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}`]}`}>
                        {feedback.type === 'success' && <FaCheckCircle style={{ marginRight: '8px' }} />}
                        {feedback.type === 'error' && <FaExclamationCircle style={{ marginRight: '8px' }} />}
                        {feedback.type === 'info' && <FaInfoCircle style={{ marginRight: '8px' }} />}
                        {feedback.message}
                    </div>
                )}

                {/* --- Hero Section --- */}
                <section className={styles.hero}>
                    <Image
                        src="/lemons-hero.jpg" // Assuming this is a local image in your public folder
                        alt="Fresh Lemons"
                        width={1200} // Set explicit width
                        height={400} // Set explicit height
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
                                <div key={lemon.id || lemon.Grade || index} className={styles.lemonCard}> {/* Improved key handling */}
                                    {lemon['Image url'] && (
                                        <Image
                                            src={lemon['Image url']}
                                            alt={lemon['Grade'] || 'Lemon'}
                                            width={300} // IMPORTANT: Provide an appropriate width
                                            height={200} // IMPORTANT: Provide an appropriate height
                                            loading="lazy" // Load lazily for images not in the viewport initially
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
                            <p style={{ textAlign: 'center', width: '100%', gridColumn: '1 / -1' }}>
                                Loading lemons or no lemon data available. Please check your internet connection or SheetDB setup.
                            </p>
                        )}
                    </div>
                </section>

                {/* --- Order Form Section --- */}
                <section id="buy-now" className={styles.formSection}>
                    <h2 className={styles.sectionTitle}>Place Your Order</h2>
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
                                readOnly={isLoggedIn} // Make read-only if logged in
                                style={isLoggedIn ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="delivery">Delivery Address</label>
                            {isLoggedIn && userAddresses.length > 0 ? (
                                <select
                                    id="delivery"
                                    className={styles.select}
                                    required
                                    value={form.delivery}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setForm({ ...form, delivery: value === "custom" ? "" : value });
                                        if (value === "custom") {
                                            showTemporaryFeedback('Please enter your new address below.', 'info');
                                        }
                                    }}
                                >
                                    <option value="">-- Select Saved Address or Enter New --</option>
                                    {userAddresses.map((addr) => (
                                        <option key={addr.id} value={addr.fullAddress}>
                                            {addr.addressName} - {addr.fullAddress}
                                        </option>
                                    ))}
                                    <option value="custom">-- Enter New Address --</option>
                                </select>
                            ) : (
                                <input
                                    id="delivery"
                                    className={styles.input}
                                    required
                                    value={form.delivery}
                                    onChange={(e) => setForm({ ...form, delivery: e.target.value })}
                                    placeholder="Enter your full delivery address"
                                    readOnly={isLoggedIn && form.delivery !== 'custom' && userAddresses.length > 0} // Read-only if logged in, not custom, and addresses exist
                                    style={isLoggedIn && form.delivery !== 'custom' && userAddresses.length > 0 ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
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
                                value={form.contact}
                                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                                maxLength={10}
                                pattern="[0-9]{10}"
                                title="Please enter a 10-digit mobile number"
                                placeholder="e.g., 9876543210"
                                readOnly={isLoggedIn} // Make read-only if logged in
                                style={isLoggedIn ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                            />
                        </div>

                        {/* Dynamic Order Varieties Inputs */}
                        {orders.map((order, index) => (
                            <Fragment key={index}>
                                <div className={styles.formGroup}>
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
                                            <option key={idx} value={lemon.Grade} disabled={orders.some(o => o.grade === lemon.Grade && orders.indexOf(order) !== index)}>
                                                {lemon.Grade} – ₹{parseFloat(lemon['Price Per Kg']).toFixed(2)}/kg
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <label className={styles.label} htmlFor={`quantity-${index}`} style={{ flexGrow: 1 }}>Quantity (kg)</label>
                                    <input
                                        id={`quantity-${index}`}
                                        type="number"
                                        min="1"
                                        className={styles.input}
                                        value={order.quantity}
                                        onChange={(e) => handleOrderChange(index, 'quantity', e.target.value)}
                                        placeholder="e.g., 10"
                                        required
                                        style={{ flexGrow: 2 }}
                                    />
                                    {parseInt(order.quantity) > 50 && (
                                        <span className={styles.discountNote}> (10% bulk discount)</span>
                                    )}
                                    {orders.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveVariety(index)} className={styles.removeVarietyButton}>
                                            <FaMinus />
                                        </button>
                                    )}
                                </div>
                            </Fragment>
                        ))}

                        <button type="button" onClick={handleAddVariety} className={styles.addAddressButton}>
                            <FaPlus /> Add Another Variety
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
                    📸 <a href="https://www.instagram.com/3Lemons_Traders" target="_blank" rel="noopener noreferrer">3Lemons_Traders</a> | 🌐 <a href="https://3lemons.vercel.app" target="_blank" rel="noopener noreferrer">3lemons.vercel.app</a>
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
                    <div className={styles.modalContent}>
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

            {/* --- Sign Up Prompt Modal --- */}
            {showSignUpPromptModal && (
                <div className={`${styles.modalOverlay} ${showSignUpPromptModal ? styles.visible : ''}`}>
                    <div className={styles.modalContent}>
                        <button className={styles.modalCloseButton} onClick={closeSignUpPromptModal}>
                            <IoCloseCircleOutline />
                        </button>
                        <h2 className={styles.modalTitle}>Please Sign Up to Order</h2>
                        <p className={styles.modalText}>
                            To place an order for fresh lemons, please sign up for an account. It's quick and easy!
                        </p>
                        <div className={styles.modalButtons}>
                            <button
                                className={styles.modalButton}
                                onClick={() => {
                                    setShowSignUpPromptModal(false);
                                    setShowSignUpModal(true);
                                }}
                            >
                                Sign Up Now
                            </button>
                            <button className={`${styles.modalButton} ${styles.cancel}`} onClick={closeSignUpPromptModal}>
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Sign Up Form Modal --- */}
            {showSignUpModal && (
                <div className={`${styles.modalOverlay} ${showSignUpModal ? styles.visible : ''}`}>
                    <div className={styles.modalContent}>
                        <button className={styles.modalCloseButton} onClick={closeSignUpModal}>
                            <IoCloseCircleOutline />
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
                                    type="text" // Use text to allow partial input without number validation issues
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

            {/* --- NEW: Login Modal --- */}
            {showLoginModal && (
                <div className={`${styles.modalOverlay} ${showLoginModal ? styles.visible : ''}`}>
                    <div className={styles.modalContent}>
                        <button className={styles.modalCloseButton} onClick={closeLoginModal}>
                            <IoCloseCircleOutline />
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
                                    {isLoggingIn ? 'Logging In...' : 'Login'}
                                </button>
                                <button type="button" className={`${styles.modalButton} ${styles.cancel}`} onClick={() => {
                                    closeLoginModal();
                                    setShowSignUpModal(true); // Offer signup if login fails
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
                <div className={`${styles.accountSidebarOverlay} ${isSidebarOpen ? styles.visible : ''}`} onClick={() => setIsSidebarOpen(false)}> {/* Close sidebar on overlay click */}
                    <div className={`${styles.accountSidebar} ${isSidebarOpen ? styles.open : ''}`} onClick={(e) => e.stopPropagation()}> {/* Prevent closing when clicking inside sidebar */}
                        <div className={styles.sidebarHeader}>
                            <h3 className={styles.sidebarTitle}>My Account</h3>
                            <button className={styles.sidebarCloseButton} onClick={() => setIsSidebarOpen(false)}>
                                <IoCloseCircleOutline />
                            </button>
                        </div>
                        <div className={styles.sidebarTabs}>
                            <button
                                className={`${styles.tabButton} ${activeAccountTab === 'accountDetails' ? styles.active : ''}`}
                                onClick={() => setActiveAccountTab('accountDetails')}
                            >
                                Account Details
                            </button>
                            <button
                                className={`${styles.tabButton} ${activeAccountTab === 'addresses' ? styles.active : ''}`}
                                onClick={() => setActiveAccountTab('addresses')}
                            >
                                Addresses
                            </button>
                            <button
                                className={`${styles.tabButton} ${activeAccountTab === 'feedback' ? styles.active : ''}`}
                                onClick={() => {
                                    setActiveAccountTab('feedback');
                                    setFeedbackSubmittedMessage(''); // Clear specific feedback message
                                    setFeedbackText(''); // Clear textarea
                                    setFeedback({message: '', type: ''}); // Clear general feedback
                                }}
                            >
                                Feedback
                            </button>
                        </div>

                        <div className={styles.tabContent}>
                            {activeAccountTab === 'accountDetails' && (
                                <Fragment>
                                    <h3>Your Profile</h3>
                                    {feedback.message && (feedback.type === 'success' || feedback.type === 'error' || feedback.type === 'info') && (
                                        <p className={`${styles.feedbackMessage} ${styles[`feedback${feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}`]}`}>
                                            {feedback.message}
                                        </p>
                                    )}
                                    {currentUser ? (
                                        <form className={styles.accountDetailsForm} onSubmit={saveAccountDetails}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label} htmlFor="acc-name">Name</label>
                                                <input
                                                    id="acc-name"
                                                    className={styles.input}
                                                    name="name"
                                                    value={accountDetailsForm.name || ''}
                                                    onChange={handleAccountDetailsFormChange}
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
                                                    readOnly // Phone number should not be editable after signup (as it's the identifier)
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
                                                    onChange={handleAccountDetailsFormChange}
                                                    required
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label} htmlFor="acc-pincode">Pincode</label>
                                                <input
                                                    id="acc-pincode"
                                                    className={styles.input}
                                                    name="pincode"
                                                    value={accountDetailsForm.pincode || ''}
                                                    onChange={handleAccountDetailsFormChange}
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
                                                onClick={handleLogout} // Use logout for clearing session
                                                style={{ marginTop: '10px' }}
                                            >
                                                Logout
                                            </button>
                                        </form>
                                    ) : (
                                        <p style={{ textAlign: 'center', marginTop: '20px' }}>Please log in to view and manage your account details.</p>
                                    )}
                                </Fragment>
                            )}

                            {activeAccountTab === 'addresses' && (
                                <Fragment>
                                    <h3>Your Saved Addresses ({userAddresses.length}/5)</h3>
                                    {feedback.message && (feedback.type === 'success' || feedback.type === 'error' || feedback.type === 'info') && (
                                        <p className={`${styles.feedbackMessage} ${styles[`feedback${feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}`]}`}>
                                            {feedback.message}
                                        </p>
                                    )}
                                    {isManagingAddresses && <p style={{ textAlign: 'center' }}><FaSpinner className={styles.spinner} /> Loading addresses...</p>}

                                    {currentUser ? (
                                        <Fragment>
                                            <div className={styles.addressList}>
                                                {userAddresses.length > 0 ? (
                                                    <ul>
                                                        {userAddresses.map(addr => (
                                                            <li key={addr.id} className={styles.addressItem}>
                                                                <strong>{addr.addressName}</strong>
                                                                <p>{addr.fullAddress}</p>
                                                                <p>Pincode: {addr.pincode}</p>
                                                                <div className={styles.addressActions}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleEditAddress(addr)}
                                                                        style={{ backgroundColor: '#00796b' }} // Green edit button
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
                                                    <p style={{ textAlign: 'center', marginBottom: '20px' }}>No addresses saved yet.</p>
                                                )}
                                            </div>

                                            {userAddresses.length < 5 && !showAddressForm && (
                                                <button
                                                    type="button"
                                                    className={`${styles.button} ${styles.addAddressButton}`}
                                                    onClick={() => {
                                                        setShowAddressForm(true);
                                                        setAddressForm({ id: null, addressName: '', fullAddress: '', pincode: '' }); // Reset form for new address
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
                                                            setAddressForm({ id: null, addressName: '', fullAddress: '', pincode: '' }); // Clear form
                                                        }}>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </Fragment>
                                    ) : (
                                        <p style={{ textAlign: 'center', marginTop: '20px' }}>Please log in to manage your addresses.</p>
                                    )}
                                </Fragment>
                            )}

                            {activeAccountTab === 'feedback' && (
                                <Fragment>
                                    <h3>Send Us Your Feedback</h3>
                                    {feedbackSubmittedMessage ? (
                                        <p className={styles.feedbackSuccessMessage}>{feedbackSubmittedMessage}</p>
                                    ) : (
                                        currentUser ? (
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
                                                {feedback.message && feedback.type === 'error' && ( // Display error specific to feedback here
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
export async function getStaticProps() {
    try {
        const res = await fetch(LEMONS_DATA_URL);
        if (!res.ok) {
            console.error(`Failed to fetch lemons: ${res.status} ${res.statusText}`);
            const errorBody = await res.text();
            console.error('Lemons API Response Body:', errorBody);
            // Fallback to dummy data on fetch error
            return {
                props: {
                    lemons: [
                        { id: 1, Grade: 'Eureka Lemon', 'Price Per Kg': 1.50, 'Image url': '/lemon-with-leaves.jpg', Description: 'Classic juicy lemons, perfect for beverages.' },
                        { id: 2, Grade: 'Meyer Lemon', 'Price Per Kg': 2.00, 'Image url': '/sliced-lemon.jpeg', Description: 'Sweeter, less acidic, ideal for desserts and garnishes.' },
                        { id: 3, Grade: 'Lisbon Lemon', 'Price Per Kg': 1.75, 'Image url': '/basket-of-lemons.jpeg', Description: 'Tart and tangy, great for cooking and zest.' },
                        { id: 4, Grade: 'Verna Lemon', 'Price Per Kg': 1.80, 'Image url': '/lemon-tree.jpeg', Description: 'Large and flavorful, excellent for juicing.' },
                    ]
                },
                revalidate: 30,
            };
        }
        const lemons = await res.json();

        // Ensure lemons is an array, provide dummy data if not or if empty
        if (!Array.isArray(lemons) || lemons.length === 0) {
            console.warn("Fetched lemons data is empty or not an array. Providing dummy data.");
            return {
                props: {
                    lemons: [
                        { id: 1, Grade: 'Eureka Lemon', 'Price Per Kg': 1.50, 'Image url': '/lemon-with-leaves.jpg', Description: 'Classic juicy lemons, perfect for beverages.' },
                        { id: 2, Grade: 'Meyer Lemon', 'Price Per Kg': 2.00, 'Image url': '/sliced-lemon.jpeg', Description: 'Sweeter, less acidic, ideal for desserts and garnishes.' },
                        { id: 3, Grade: 'Lisbon Lemon', 'Price Per Kg': 1.75, 'Image url': '/basket-of-lemons.jpeg', Description: 'Tart and tangy, great for cooking and zest.' },
                        { id: 4, Grade: 'Verna Lemon', 'Price Per Kg': 1.80, 'Image url': '/lemon-tree.jpeg', Description: 'Large and flavorful, excellent for juicing.' },
                    ]
                },
                revalidate: 30,
            };
        }

        return {
            props: { lemons },
            revalidate: 30, // Revalidate every 30 seconds to get fresh data
        };
    } catch (error) {
        console.error("Error in getStaticProps for lemons:", error);
        // Fallback to dummy data on any error
        return {
            props: {
                lemons: [
                    { id: 1, Grade: 'Eureka Lemon', 'Price Per Kg': 1.50, 'Image url': '/lemon-with-leaves.jpg', Description: 'Classic juicy lemons, perfect for beverages.' },
                    { id: 2, Grade: 'Meyer Lemon', 'Price Per Kg': 2.00, 'Image url': '/sliced-lemon.jpeg', Description: 'Sweeter, less acidic, ideal for desserts and garnishes.' },
                    { id: 3, Grade: 'Lisbon Lemon', 'Price Per Kg': 1.75, 'Image url': '/basket-of-lemons.jpeg', Description: 'Tart and tangy, great for cooking and zest.' },
                    { id: 4, Grade: 'Verna Lemon', 'Price Per Kg': 1.80, 'Image url': '/lemon-tree.jpeg', Description: 'Large and flavorful, excellent for juicing.' },
                ]
            },
            revalidate: 30,
        };
    }
}
