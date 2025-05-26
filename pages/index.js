import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Image from 'next/image'; // Assuming you use Image for logo or product images
import styles from '../styles/styles.module.css';
import { FaStar, FaPhoneAlt, FaMapMarkerAlt, FaWhatsapp, FaEnvelope, FaBars, FaTimes, FaUserCircle, FaEdit, FaHome, FaHistory, FaSignOutAlt, FaPlus, FaMinus, FaTrash, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaSpinner } from 'react-icons/fa';
import { IoMenu } from 'react-icons/io5'; // For the hamburger menu icon

// SheetDB API URLs (replace with your actual SheetDB URLs)
const LEMONS_DATA_URL = 'https://sheetdb.io/api/v1/y1c5j21f7823f'; // Your Lemons data SheetDB URL
const ORDERS_SUBMISSION_URL = 'https://sheetdb.io/api/v1/y1c5j21f7823f'; // Your Orders submission SheetDB URL
const SIGNUP_SHEET_URL = 'https://sheetdb.io/api/v1/s06797j7x9p31'; // Your Signup/Users SheetDB URL
const ADDRESSES_SHEET_URL = 'https://sheetdb.io/api/v1/j25kiz6g4h0c3'; // Your Addresses SheetDB URL

export default function Home() {
    const [lemons, setLemons] = useState([]);
    const [orders, setOrders] = useState([{ grade: '', quantity: '' }]);
    const [total, setTotal] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmedOrderDetails, setConfirmedOrderDetails] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // --- New State for Login/Signup/Account ---
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState(null); // Stores user object {name, phone, address, pincode}
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginForm, setLoginForm] = useState({ phone: '', name: '' });
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showSignUpPromptModal, setShowSignUpPromptModal] = useState(false); // Modal to ask if user wants to sign up
    const [showSignUpModal, setShowSignUpModal] = useState(false); // Actual signup form modal
    const [signUpForm, setSignUpForm] = useState({ name: '', phone: '', address: '', pincode: '' });
    const [isSigningUp, setIsSigningUp] = useState(false);

    // --- Sidebar State ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeAccountTab, setActiveAccountTab] = useState('accountDetails'); // 'accountDetails', 'addresses', 'orderHistory'

    // --- Account Details Tab State ---
    const [accountDetailsForm, setAccountDetailsForm] = useState({ name: '', phone: '', address: '', pincode: '' });
    const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);

    // --- Addresses Tab State ---
    const [userAddresses, setUserAddresses] = useState([]);
    const [addressForm, setAddressForm] = useState({ id: null, address: '', pincode: '', isDefault: false }); // id for editing
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [isManagingAddresses, setIsManagingAddresses] = useState(false); // For loading state during address ops

    // --- Order History Tab State ---
    const [userOrders, setUserOrders] = useState([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);


    // Initial form state (personal details for order)
    const [form, setForm] = useState({
        name: '',
        contact: '',
        delivery: '',
    });

    // Dummy Reviews Data
    const reviews = useMemo(() => [
        { name: 'Alice Smith', rating: 5, text: 'Absolutely fresh and juicy lemons every time! Perfect for my culinary needs.' },
        { name: 'Bob Johnson', rating: 4, text: 'Good quality lemons. Delivery was quick and efficient.' },
        { name: 'Charlie Brown', rating: 5, text: 'The best lemons I\'ve ever bought online. Highly recommended!' },
        { name: 'Diana Prince', rating: 3, text: 'Decent quality, but some lemons were a bit small. Still good value.' },
        { name: 'Eve Adams', rating: 5, text: 'Fantastic customer service and consistently high-quality produce.' },
    ], []);

    // Fetch lemons data
    useEffect(() => {
        async function fetchLemons() {
            try {
                const response = await fetch(LEMONS_DATA_URL);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setLemons(data);
                // Initialize orders with the first lemon grade if available
                if (data.length > 0) {
                    setOrders([{ grade: data[0].Grade, quantity: '' }]);
                }
            } catch (error) {
                console.error("Failed to fetch lemons data:", error);
                setFeedback({ message: 'Failed to load lemon varieties. Please try again.', type: 'error' });
            }
        }
        fetchLemons();
    }, []);

    // Calculate total whenever orders change
    useEffect(() => {
        calculateTotal();
    }, [orders, lemons]); // Recalculate if lemons data also changes (e.g., prices)

    // Load account details from local storage on component mount
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('loggedInUser');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                setLoggedInUser(user);
                setIsLoggedIn(true);
                setAccountDetailsForm(user); // Initialize sidebar form with logged in user
                // Auto-populate form with saved details if available
                setForm(prevForm => ({
                    ...prevForm,
                    name: user.name || prevForm.name,
                    contact: user.phone || prevForm.contact,
                    delivery: user.address || prevForm.delivery,
                }));
                showTemporaryFeedback(`Welcome back, ${user.name}! 😊`, 'success');
            }
        } catch (error) {
            console.error("Failed to parse loggedInUser from localStorage:", error);
            localStorage.removeItem('loggedInUser'); // Clear corrupted data
            setIsLoggedIn(false);
            setLoggedInUser(null);
        }
    }, []);

    // Effect to fetch addresses when user logs in or addresses change
    useEffect(() => {
        if (isLoggedIn && loggedInUser?.phone) {
            fetchUserAddresses(loggedInUser.phone);
        } else {
            setUserAddresses([]); // Clear addresses if logged out
        }
    }, [isLoggedIn, loggedInUser?.phone]); // Depend on login status and user phone

    // Function to show temporary feedback messages
    const showTemporaryFeedback = useCallback((message, type) => {
        setFeedback({ message, type });
        const timer = setTimeout(() => {
            setFeedback({ message: '', type: '' });
        }, 5000); // Message disappears after 5 seconds
        return () => clearTimeout(timer);
    }, []);

    // --- Handlers for order form changes ---
    const handleOrderChange = (index, field, value) => {
        const updated = [...orders];
        if (field === 'quantity') {
            // Ensure quantity is a positive integer or empty string
            value = value === '' ? '' : String(Math.max(1, parseInt(value) || 1));
        }
        updated[index][field] = value;
        setOrders(updated);
    };

    const handleAddVariety = () => {
        setOrders([...orders, { grade: '', quantity: '' }]);
    };

    const handleRemoveVariety = (index) => {
        const updated = orders.filter((_, i) => i !== index);
        setOrders(updated.length > 0 ? updated : [{ grade: '', quantity: '' }]); // Ensure at least one row remains
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
                        itemPrice *= 0.90; // 10% discount for quantity > 50
                    }
                    totalPrice += itemPrice;
                }
            }
        });
        setTotal(totalPrice);
    };

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
        // This is the existing flow for users who are not explicitly logged in via the login button,
        // but are attempting to order.
        if (!isLoggedIn) {
            setIsSubmitting(true); // Show loading state while checking user
            try {
                const checkRes = await fetch(`${SIGNUP_SHEET_URL}?searchField=phone&searchValue=${form.contact}`);

                if (!checkRes.ok && checkRes.status !== 404 && checkRes.status !== 204) {
                     // 404 and 204 mean no data, which is fine. Other non-ok statuses are errors.
                     throw new Error(`Failed to check existing users: ${checkRes.status} ${checkRes.statusText}`);
                }

                let existingUsers = [];
                // Only attempt to parse JSON if content is expected
                if (checkRes.status !== 204 && checkRes.status !== 404) {
                    existingUsers = await checkRes.json();
                }

                // Ensure existingUsers is an array
                if (!Array.isArray(existingUsers)) {
                    existingUsers = [];
                }

                if (existingUsers.length > 0) {
                    // User exists, "log them in"
                    const user = existingUsers[0];
                    localStorage.setItem('loggedInUser', JSON.stringify(user));
                    setLoggedInUser(user);
                    setIsLoggedIn(true);
                    setAccountDetailsForm(user); // Sync sidebar form
                    showTemporaryFeedback(`Welcome back, ${user.name}! 😊`, 'success');
                    // Auto-fill order form (already done by useEffect, but ensure consistency)
                    setForm(prevForm => ({
                        ...prevForm,
                        name: user.name || '',
                        contact: user.phone || '',
                        delivery: user.address || '',
                    }));
                    setIsSubmitting(false);
                    // Now that user is logged in, proceed to show confirmation modal
                    // Re-call handleSubmit to trigger the confirmation modal logic
                    const dummyEvent = { preventDefault: () => { } };
                    handleSubmit(dummyEvent); // <--- Recursive call to proceed after login
                    return; // Exit to prevent further execution in this call
                } else {
                    // User does not exist, prompt for signup
                    setIsSubmitting(false);
                    setShowSignUpPromptModal(true); // <--- This should trigger the popup
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
        setFeedback({ message: '', type: '' }); // Clear feedback

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
                    name: isLoggedIn ? loggedInUser.name : '',
                    contact: isLoggedIn ? loggedInUser.phone : '',
                    delivery: isLoggedIn ? loggedInUser.address : '',
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
                localStorage.setItem('loggedInUser', JSON.stringify(newUser)); // Store in local storage
                setLoggedInUser(newUser);
                setIsLoggedIn(true);
                setAccountDetailsForm(newUser); // Sync sidebar form
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


    // --- NEW: Login Modal Handlers ---
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

    const handleLoginFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            if (!!/^\d*$/.test(value) || value.length > 10) { // Regex for digits only, max 10
                return;
            }
        }
        setLoginForm(prev => ({ ...prev, [name]: value }));
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setFeedback({ message: '', type: '' }); // Clear any previous login messages

        const { name, phone } = loginForm;

        // Basic validation
        if (!name.trim() || !phone.trim()) {
            showTemporaryFeedback('Please enter both name and phone number.', 'error');
            setIsLoggingIn(false);
            return;
        }
        if (!/^\d{10}$/.test(phone)) {
            showTemporaryFeedback('Please enter a valid 10-digit phone number.', 'error');
            setIsLoggingIn(false);
            return;
        }

        try {
            const checkRes = await fetch(`${SIGNUP_SHEET_URL}?searchField=phone&searchValue=${phone}`);

            if (!checkRes.ok && checkRes.status !== 404 && checkRes.status !== 204) {
                 throw new Error(`Failed to check existing users during login: ${checkRes.status} ${checkRes.statusText}`);
            }

            let existingUsers = [];
            if (checkRes.status !== 204 && checkRes.status !== 404) {
                existingUsers = await checkRes.json();
            }

            if (!Array.isArray(existingUsers)) {
                existingUsers = [];
            }

            const foundUser = existingUsers.find(user => user.phone === phone && user.name.toLowerCase() === name.toLowerCase());

            if (foundUser) {
                localStorage.setItem('loggedInUser', JSON.stringify(foundUser));
                setLoggedInUser(foundUser);
                setIsLoggedIn(true);
                setAccountDetailsForm(foundUser); // Sync sidebar form
                showTemporaryFeedback(`Welcome back, ${foundUser.name}! 😊`, 'success');

                // Auto-fill order form
                setForm(prevForm => ({
                    ...prevForm,
                    name: foundUser.name,
                    contact: foundUser.phone,
                    delivery: foundUser.address,
                }));

                closeLoginModal(); // Close the login modal
            } else {
                showTemporaryFeedback('Account not found with provided name and phone number. Please try again or sign up.', 'error');
                // Option to lead to signup:
                // setShowSignUpModal(true); // Open signup modal directly
                // closeLoginModal();
            }
        } catch (error) {
            console.error("Error during login:", error);
            showTemporaryFeedback('Failed to log in. Please try again later.', 'error');
        } finally {
            setIsLoggingIn(false);
        }
    };

    // --- Logout Handler ---
    const handleLogout = () => {
        localStorage.removeItem('loggedInUser');
        setLoggedInUser(null);
        setIsLoggedIn(false);
        setIsSidebarOpen(false); // Close sidebar on logout
        setAccountDetailsForm({ name: '', phone: '', address: '', pincode: '' }); // Clear sidebar form
        setUserAddresses([]); // Clear addresses
        setUserOrders([]); // Clear orders
        showTemporaryFeedback('You have been logged out.', 'info');
        // Optionally clear the order form or specific fields
        setForm({
            name: '',
            contact: '',
            delivery: '',
        });
    };


    // --- Sidebar Handlers ---
    const toggleSidebar = () => {
        if (!isLoggedIn) {
            openLoginModal(); // Prompt login if not logged in
        } else {
            setIsSidebarOpen(!isSidebarOpen);
        }
    };

    const handleTabClick = (tabName) => {
        setActiveAccountTab(tabName);
        // Fetch data relevant to the tab if needed
        if (tabName === 'addresses' && isLoggedIn && loggedInUser?.phone) {
            fetchUserAddresses(loggedInUser.phone);
        }
        if (tabName === 'orderHistory' && isLoggedIn && loggedInUser?.phone) {
            fetchUserOrders(loggedInUser.phone);
        }
    };

    // --- Account Details Tab Logic ---
    const handleAccountDetailsChange = (e) => {
        const { name, value } = e.target;
        if (name === 'pincode' && (!/^\d*$/.test(value) || value.length > 6)) return;
        if (name === 'phone' && (!/^\d*$/.test(value) || value.length > 10)) return;

        setAccountDetailsForm(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateAccount = async (e) => {
        e.preventDefault();
        setIsUpdatingAccount(true);
        setFeedback({ message: '', type: '' });

        const { name, phone, address, pincode } = accountDetailsForm;
        if (!name.trim() || !phone.trim() || !address.trim() || !pincode.trim()) {
            showTemporaryFeedback('All account details fields are required.', 'error');
            setIsUpdatingAccount(false);
            return;
        }
        if (!/^\d{10}$/.test(phone)) {
            showTemporaryFeedback('Please enter a valid 10-digit phone number for contact.', 'error');
            setIsUpdatingAccount(false);
            return;
        }
        if (!/^\d{6}$/.test(pincode)) {
            showTemporaryFeedback('Please enter a valid 6-digit pincode.', 'error');
            setIsUpdatingAccount(false);
            return;
        }

        try {
            // Update the user record in SheetDB based on their phone number (acting as unique ID)
            const response = await fetch(`${SIGNUP_SHEET_URL}/phone/${loggedInUser.phone}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: {
                        name: name.trim(),
                        phone: phone.trim(),
                        address: address.trim(),
                        pincode: pincode.trim(),
                    }
                }),
            });

            if (response.ok) {
                const updatedUser = { ...loggedInUser, name, phone, address, pincode };
                localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
                setLoggedInUser(updatedUser);
                showTemporaryFeedback('Account details updated successfully!', 'success');
                // Also update the main order form if current user is logged in
                setForm(prevForm => ({
                    ...prevForm,
                    name: updatedUser.name,
                    contact: updatedUser.phone,
                    delivery: updatedUser.address,
                }));
            } else {
                const errorData = await response.json();
                console.error('SheetDB account update error:', response.status, errorData);
                showTemporaryFeedback(`Failed to update account: ${errorData.message || 'Server error'}.`, 'error');
            }
        } catch (error) {
            console.error('Network or update error:', error);
            showTemporaryFeedback('Failed to update account. Please check your internet connection.', 'error');
        } finally {
            setIsUpdatingAccount(false);
        }
    };


    // --- Addresses Tab Logic ---
    const fetchUserAddresses = useCallback(async (userPhone) => {
        if (!userPhone) return;
        setIsManagingAddresses(true);
        try {
            const response = await fetch(`${ADDRESSES_SHEET_URL}?searchField=userPhone&searchValue=${userPhone}`);
            if (!response.ok && response.status !== 404 && response.status !== 204) {
                throw new Error(`Failed to fetch addresses: ${response.status} ${response.statusText}`);
            }
            let data = [];
            if (response.status !== 204 && response.status !== 404) {
                 data = await response.json();
            }

            if (!Array.isArray(data)) {
                data = [];
            }

            setUserAddresses(data);
        } catch (error) {
            console.error("Error fetching user addresses:", error);
            showTemporaryFeedback('Failed to load your addresses.', 'error');
        } finally {
            setIsManagingAddresses(false);
        }
    }, [showTemporaryFeedback]);

    const handleAddressFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'pincode' && (!/^\d*$/.test(value) || value.length > 6)) return;
        setAddressForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setIsManagingAddresses(true);
        setFeedback({ message: '', type: '' });

        const { address, pincode, isDefault } = addressForm;
        if (!address.trim() || !pincode.trim()) {
            showTemporaryFeedback('Address and Pincode are required.', 'error');
            setIsManagingAddresses(false);
            return;
        }
        if (!/^\d{6}$/.test(pincode)) {
            showTemporaryFeedback('Please enter a valid 6-digit pincode.', 'error');
            setIsManagingAddresses(false);
            return;
        }

        try {
            // If it's a new address (id is null)
            if (!addressForm.id) {
                const response = await fetch(ADDRESSES_SHEET_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: {
                            userPhone: loggedInUser.phone, // Link to the logged-in user
                            address: address.trim(),
                            pincode: pincode.trim(),
                            isDefault: isDefault ? 'Yes' : 'No', // SheetDB stores string for boolean
                            'Created At': new Date().toLocaleString(),
                        }
                    }),
                });
                if (response.ok) {
                    showTemporaryFeedback('Address added successfully!', 'success');
                } else {
                    throw new Error(`Failed to add address: ${response.status} ${response.statusText}`);
                }
            } else {
                // If it's an existing address being updated
                const response = await fetch(`${ADDRESSES_SHEET_URL}/id/${addressForm.id}`, { // Assuming 'id' is unique in SheetDB
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: {
                            address: address.trim(),
                            pincode: pincode.trim(),
                            isDefault: isDefault ? 'Yes' : 'No',
                        }
                    }),
                });
                if (response.ok) {
                    showTemporaryFeedback('Address updated successfully!', 'success');
                } else {
                    throw new Error(`Failed to update address: ${response.status} ${response.statusText}`);
                }
            }
            setShowAddressForm(false);
            setAddressForm({ id: null, address: '', pincode: '', isDefault: false }); // Reset form
            fetchUserAddresses(loggedInUser.phone); // Refresh addresses
        } catch (error) {
            console.error("Error saving address:", error);
            showTemporaryFeedback(`Failed to save address: ${error.message}.`, 'error');
        } finally {
            setIsManagingAddresses(false);
        }
    };

    const handleEditAddress = (address) => {
        setAddressForm({
            id: address.id, // Assuming each row has an 'id' from SheetDB
            address: address.address,
            pincode: address.pincode,
            isDefault: address.isDefault === 'Yes',
        });
        setShowAddressForm(true);
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm('Are you sure you want to delete this address?')) {
            return;
        }
        setIsManagingAddresses(true);
        setFeedback({ message: '', type: '' });
        try {
            const response = await fetch(`${ADDRESSES_SHEET_URL}/id/${addressId}`, { // Assuming 'id' is unique
                method: 'DELETE',
            });
            if (response.ok) {
                showTemporaryFeedback('Address deleted successfully!', 'success');
                fetchUserAddresses(loggedInUser.phone); // Refresh addresses
            } else {
                throw new Error(`Failed to delete address: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error deleting address:", error);
            showTemporaryFeedback(`Failed to delete address: ${error.message}.`, 'error');
        } finally {
            setIsManagingAddresses(false);
        }
    };

    const handleSetDefaultAddress = async (addressId) => {
        setIsManagingAddresses(true);
        setFeedback({ message: '', type: '' });
        try {
            // First, set all other addresses for this user to not default
            const resetPromises = userAddresses
                .filter(addr => addr.isDefault === 'Yes' && addr.id !== addressId)
                .map(addr =>
                    fetch(`${ADDRESSES_SHEET_URL}/id/${addr.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ data: { isDefault: 'No' } }),
                    })
                );
            await Promise.all(resetPromises);

            // Then, set the chosen address as default
            const response = await fetch(`${ADDRESSES_SHEET_URL}/id/${addressId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: { isDefault: 'Yes' } }),
            });

            if (response.ok) {
                showTemporaryFeedback('Default address updated!', 'success');
                fetchUserAddresses(loggedInUser.phone); // Refresh addresses
            } else {
                throw new Error(`Failed to set default address: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error setting default address:", error);
            showTemporaryFeedback(`Failed to set default address: ${error.message}.`, 'error');
        } finally {
            setIsManagingAddresses(false);
        }
    };


    // --- Order History Tab Logic ---
    const fetchUserOrders = useCallback(async (userPhone) => {
        if (!userPhone) return;
        setIsLoadingOrders(true);
        try {
            // Note: SheetDB's search is exact. If your orders sheet has `contact` as `+91-XXXXXXXXXX`
            // and `userPhone` is `XXXXXXXXXX`, it won't match. Ensure consistency.
            const response = await fetch(`${ORDERS_SUBMISSION_URL}?searchField=contact&searchValue=${userPhone}`);
            if (!response.ok && response.status !== 404 && response.status !== 204) {
                throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
            }
            let data = [];
            if (response.status !== 204 && response.status !== 404) {
                 data = await response.json();
            }

            if (!Array.isArray(data)) {
                data = [];
            }

            // Group orders by a unique identifier (e.g., Order Date, or a generated ID if available)
            // For now, let's group by Order Date assuming multiple items in one order share the same date/time stamp
            const groupedOrders = data.reduce((acc, order) => {
                const orderDate = order['Order Date']; // Use the 'Order Date' field
                if (!acc[orderDate]) {
                    acc[orderDate] = {
                        date: orderDate,
                        deliveryAddress: order.delivery,
                        totalPrice: 0,
                        items: [],
                    };
                }
                acc[orderDate].items.push(order);
                acc[orderDate].totalPrice += parseFloat(order['Item Total Price'] || 0); // Sum up item total prices
                return acc;
            }, {});

            // Convert object back to array, sorting by date (newest first)
            const sortedOrders = Object.values(groupedOrders).sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            setUserOrders(sortedOrders);
        } catch (error) {
            console.error("Error fetching user orders:", error);
            showTemporaryFeedback('Failed to load your order history.', 'error');
        } finally {
            setIsLoadingOrders(false);
        }
    }, [showTemporaryFeedback]);


    return (
        <div className={styles.container}>
            <Head>
                <title>3 Lemons - Fresh Lemons Delivered</title>
                <meta name="description" content="Order fresh lemons online with easy delivery." />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <header className={styles.header}>
                <div className={styles.logoContainer}>
                    <Image src="/lemon-logo.png" alt="3 Lemons Logo" width={50} height={50} className={styles.logo} />
                    <h1 className={styles.title}>3 Lemons</h1>
                </div>
                <div className={styles.headerActions}>
                    {/* Login/User icon button */}
                    <button onClick={toggleSidebar} className={styles.loginButton}>
                        {isLoggedIn ? (
                            <FaUserCircle size={24} color="#333" /> // User icon if logged in
                        ) : (
                            'Login / Signup' // Text button if not logged in
                        )}
                    </button>
                    {/* Hamburger menu for small screens */}
                    <IoMenu className={styles.hamburgerIcon} onClick={toggleSidebar} />
                </div>
            </header>

            <main className={styles.main}>
                {feedback.message && (
                    <div className={`${styles.feedbackMessage} ${styles[`feedback${feedback.type === 'success' ? 'Success' : feedback.type === 'error' ? 'Error' : 'Info'}`]}`}>
                        {feedback.type === 'success' && <FaCheckCircle style={{ marginRight: '8px' }} />}
                        {feedback.type === 'error' && <FaExclamationCircle style={{ marginRight: '8px' }} />}
                        {feedback.type === 'info' && <FaInfoCircle style={{ marginRight: '8px' }} />}
                        {feedback.message}
                    </div>
                )}

                <section className={styles.hero}>
                    <h2 className={styles.heroTagline}>Your Daily Dose of Freshness, Delivered.</h2>
                    <p className={styles.heroDescription}>Order the freshest lemons directly from our farm to your doorstep.</p>
                </section>

                <section className={styles.lemonSection}>
                    <h2 className={styles.sectionTitle}>Our Lemon Varieties</h2>
                    <div className={styles.lemonGrid}>
                        {lemons.length > 0 ? (
                            lemons.map((lemon, index) => (
                                <div key={index} className={styles.lemonCard}>
                                    <Image src={lemon.ImageURL || '/default-lemon.jpg'} alt={lemon.Grade} width={200} height={150} objectFit="cover" className={styles.lemonImage} />
                                    <h3>{lemon.Grade}</h3>
                                    <p>{lemon.Description}</p>
                                    <p className={styles.lemonPrice}>₹{parseFloat(lemon['Price Per Kg']).toFixed(2)} / Kg</p>
                                    {parseInt(lemon.Stock) > 0 ? (
                                        <span className={styles.inStock}>In Stock: {lemon.Stock} Kg</span>
                                    ) : (
                                        <span className={styles.outOfStock}>Out of Stock</span>
                                    )}
                                    {parseInt(lemon.Stock) > 50 && (
                                        <p className={styles.discountInfo}>*10% off for orders over 50 Kg!</p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className={styles.loadingMessage}>Loading lemon varieties...</p>
                        )}
                    </div>
                </section>

                <section className={styles.orderFormSection}>
                    <h2 className={styles.sectionTitle}>Place Your Order</h2>
                    <form onSubmit={handleSubmit} className={styles.orderForm}>
                        <div className={styles.formGroup}>
                            <label htmlFor="name">Your Name:</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                className={styles.inputField}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="contact">Contact Number:</label>
                            <input
                                type="tel"
                                id="contact"
                                name="contact"
                                value={form.contact}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (!/^\d*$/.test(value) || value.length > 10) { // Allow only digits, max 10
                                        return;
                                    }
                                    setForm({ ...form, contact: value });
                                }}
                                required
                                maxLength="10"
                                placeholder="e.g., 9876543210"
                                className={styles.inputField}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="delivery">Delivery Address:</label>
                            <textarea
                                id="delivery"
                                name="delivery"
                                value={form.delivery}
                                onChange={(e) => setForm({ ...form, delivery: e.target.value })}
                                required
                                rows="3"
                                className={styles.textareaField}
                            ></textarea>
                        </div>

                        <div className={styles.varietiesContainer}>
                            <h3>Select Varieties & Quantities:</h3>
                            {orders.map((order, index) => (
                                <div key={index} className={styles.varietyRow}>
                                    <select
                                        value={order.grade}
                                        onChange={(e) => handleOrderChange(index, 'grade', e.target.value)}
                                        className={styles.selectField}
                                        required
                                    >
                                        <option value="">Select Grade</option>
                                        {lemons.map((lemon, i) => (
                                            <option key={i} value={lemon.Grade} disabled={parseInt(lemon.Stock) === 0}>
                                                {lemon.Grade} {parseInt(lemon.Stock) === 0 ? '(Out of Stock)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Quantity (Kg)"
                                        value={order.quantity}
                                        onChange={(e) => handleOrderChange(index, 'quantity', e.target.value)}
                                        min="1"
                                        className={styles.quantityInput}
                                        required
                                    />
                                    {orders.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveVariety(index)} className={styles.removeVarietyBtn}>
                                            <FaTrash />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={handleAddVariety} className={styles.addVarietyBtn}>
                                <FaPlus /> Add Another Variety
                            </button>
                        </div>

                        <div className={styles.totalSection}>
                            <p>Total Estimated Price: <span className={styles.totalPrice}>₹{total.toFixed(2)}</span></p>
                        </div>

                        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <> <FaSpinner className={styles.spinner} /> Processing Order...</>
                            ) : (
                                'Proceed to Order'
                            )}
                        </button>
                    </form>
                </section>

                <section className={styles.testimonialsSection}>
                    <h2 className={styles.sectionTitle}>What Our Customers Say</h2>
                    <div className={styles.reviewsGrid}>
                        {reviews.map((review, index) => (
                            <div key={index} className={styles.reviewCard}>
                                <div className={styles.reviewStars}>
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

                <section className={styles.contactSection}>
                    <h2 className={styles.sectionTitle}>Contact Us</h2>
                    <div className={styles.contactDetails}>
                        <p><FaPhoneAlt /> Call Us: <a href="tel:+919876543210">+91 98765 43210</a></p>
                        <p><FaWhatsapp /> WhatsApp: <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer">+91 98765 43210</a></p>
                        <p><FaEnvelope /> Email: <a href="mailto:info@3lemons.com">info@3lemons.com</a></p>
                        <p><FaMapMarkerAlt /> Address: 123 Lemon Grove, Citrus City, PIN 123456</p>
                    </div>
                </section>
            </main>

            <footer className={styles.footer}>
                <p>&copy; {new Date().getFullYear()} 3 Lemons. All rights reserved.</p>
            </footer>

            {/* --- Modals (positioned at the end for z-index) --- */}

            {/* Confirm Order Modal */}
            <div className={`${styles.modalOverlay} ${showConfirmModal ? styles.visible : ''}`}>
                <div className={styles.modalContent}>
                    <button className={styles.modalCloseButton} onClick={cancelConfirmation}>
                        <FaTimes />
                    </button>
                    <h3 className={styles.modalTitle}>Confirm Your Order</h3>
                    {confirmedOrderDetails && (
                        <>
                            <p className={styles.modalText}>Please review your order details:</p>
                            <ul className={styles.modalText}>
                                <li><strong>Name:</strong> {confirmedOrderDetails.personal.name}</li>
                                <li><strong>Contact:</strong> {confirmedOrderDetails.personal.contact}</li>
                                <li><strong>Delivery Address:</strong> {confirmedOrderDetails.personal.delivery}</li>
                                <li><strong>Items:</strong>
                                    <ul>
                                        {confirmedOrderDetails.items.map((item, index) => (
                                            <li key={index}>
                                                {item.quantity} Kg {item.grade} (₹{item.pricePerKg} / Kg) - Total: ₹{item.itemTotalPrice} {item.discount !== '0%' && `(${item.discount} discount)`}
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                                <li><strong>Total Price:</strong> ₹{confirmedOrderDetails.total}</li>
                            </ul>
                            <div className={styles.modalButtons}>
                                <button onClick={confirmAndSubmitOrder} className={styles.modalButton} disabled={isSubmitting}>
                                    {isSubmitting ? 'Submitting...' : 'Confirm Order'}
                                </button>
                                <button onClick={cancelConfirmation} className={`${styles.modalButton} ${styles.modalButton.cancel}`}>
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Order Success Modal */}
            <div className={`${styles.modalOverlay} ${showSuccessModal ? styles.visible : ''}`}>
                <div className={styles.modalContent}>
                    <button className={styles.modalCloseButton} onClick={closeSuccessModal}>
                        <FaTimes />
                    </button>
                    <div className={styles.successPage}>
                        <FaCheckCircle className={styles.successIcon} size={60} color="#4CAF50" />
                        <h3 className={styles.successTitle}>Order Placed Successfully!</h3>
                        <p className={styles.successMessage}>
                            Thank you for your order! We have received your request and will process it shortly.
                            You will receive a confirmation on your provided contact number.
                        </p>
                        <button onClick={closeSuccessModal} className={styles.modalButton}>
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Login Modal */}
            <div className={`${styles.modalOverlay} ${showLoginModal ? styles.visible : ''}`}>
                <div className={styles.modalContent}>
                    <button className={styles.modalCloseButton} onClick={closeLoginModal}>
                        <FaTimes />
                    </button>
                    <h3 className={styles.modalTitle}>Login to Your Account</h3>
                    <form onSubmit={handleLoginSubmit} className={styles.form}>
                        {feedback.message && feedback.type.includes('login') && (
                            <div className={`${styles.feedbackMessage} ${styles[`feedback${feedback.type === 'loginSuccess' ? 'Success' : 'Error'}`]}`}>
                                {feedback.message}
                            </div>
                        )}
                        <div className={styles.formGroup}>
                            <label htmlFor="loginName">Name:</label>
                            <input
                                type="text"
                                id="loginName"
                                name="name"
                                value={loginForm.name}
                                onChange={handleLoginFormChange}
                                required
                                className={styles.inputField}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="loginPhone">Phone Number:</label>
                            <input
                                type="tel"
                                id="loginPhone"
                                name="phone"
                                value={loginForm.phone}
                                onChange={handleLoginFormChange}
                                required
                                maxLength="10"
                                placeholder="10-digit number"
                                className={styles.inputField}
                            />
                        </div>
                        <div className={styles.modalButtons}>
                            <button type="submit" className={styles.modalButton} disabled={isLoggingIn}>
                                {isLoggingIn ? (<><FaSpinner className={styles.spinner} /> Logging In...</>) : 'Login'}
                            </button>
                            <button type="button" onClick={() => { closeLoginModal(); setShowSignUpModal(true); }} className={`${styles.modalButton} ${styles.modalButton.cancel}`}>
                                New User? Sign Up
                            </button>
                        </div>
                    </form>
                </div>
            </div>


            {/* Signup Prompt Modal (if user not logged in when ordering) */}
            <div className={`${styles.modalOverlay} ${showSignUpPromptModal ? styles.visible : ''}`}>
                <div className={styles.modalContent}>
                    <button className={styles.modalCloseButton} onClick={closeSignUpPromptModal}>
                        <FaTimes />
                    </button>
                    <h3 className={styles.modalTitle}>First Time Ordering?</h3>
                    <p className={styles.modalText}>
                        It looks like you're new here! We recommend creating an account to save your details for faster future orders and to manage your addresses and order history.
                    </p>
                    <div className={styles.modalButtons}>
                        <button onClick={() => { closeSignUpPromptModal(); setShowSignUpModal(true); }} className={styles.modalButton}>
                            Create Account
                        </button>
                        <button onClick={closeSignUpPromptModal} className={`${styles.modalButton} ${styles.modalButton.cancel}`}>
                            No, Thanks (Continue as Guest)
                        </button>
                    </div>
                </div>
            </div>


            {/* Actual Sign Up Modal */}
            <div className={`${styles.modalOverlay} ${showSignUpModal ? styles.visible : ''}`}>
                <div className={styles.modalContent}>
                    <button className={styles.modalCloseButton} onClick={closeSignUpModal}>
                        <FaTimes />
                    </button>
                    <h3 className={styles.modalTitle}>Create Your Account</h3>
                    <form onSubmit={handleSignUpSubmit} className={styles.form}>
                        {feedback.message && feedback.type.includes('signup') && (
                            <div className={`${styles.feedbackMessage} ${styles[`feedback${feedback.type === 'signupSuccess' ? 'Success' : 'Error'}`]}`}>
                                {feedback.message}
                            </div>
                        )}
                        <div className={styles.formGroup}>
                            <label htmlFor="signupName">Name:</label>
                            <input
                                type="text"
                                id="signupName"
                                name="name"
                                value={signUpForm.name}
                                onChange={handleSignUpFormChange}
                                required
                                className={styles.inputField}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="signupPhone">Phone Number:</label>
                            <input
                                type="tel"
                                id="signupPhone"
                                name="phone"
                                value={signUpForm.phone}
                                onChange={handleSignUpFormChange}
                                required
                                maxLength="10"
                                placeholder="10-digit number"
                                className={styles.inputField}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="signupAddress">Delivery Address:</label>
                            <textarea
                                id="signupAddress"
                                name="address"
                                value={signUpForm.address}
                                onChange={handleSignUpFormChange}
                                required
                                rows="3"
                                className={styles.textareaField}
                            ></textarea>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="signupPincode">Pincode:</label>
                            <input
                                type="text"
                                id="signupPincode"
                                name="pincode"
                                value={signUpForm.pincode}
                                onChange={handleSignUpFormChange}
                                required
                                maxLength="6"
                                placeholder="6-digit pincode"
                                className={styles.inputField}
                            />
                        </div>
                        <div className={styles.modalButtons}>
                            <button type="submit" className={styles.modalButton} disabled={isSigningUp}>
                                {isSigningUp ? (<><FaSpinner className={styles.spinner} /> Signing Up...</>) : 'Sign Up'}
                            </button>
                            <button type="button" onClick={() => { closeSignUpModal(); openLoginModal(); }} className={`${styles.modalButton} ${styles.modalButton.cancel}`}>
                                Already have an account? Login
                            </button>
                        </div>
                    </form>
                </div>
            </div>


            {/* Account Sidebar */}
            <div className={`${styles.accountSidebarOverlay} ${isSidebarOpen ? styles.visible : ''}`} onClick={toggleSidebar}>
                <div className={`${styles.accountSidebar} ${isSidebarOpen ? styles.open : ''}`} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.sidebarHeader}>
                        <h3>
                            {isLoggedIn ? `Hello, ${loggedInUser?.name || 'User'}` : 'Guest User'}
                        </h3>
                        <button className={styles.sidebarCloseButton} onClick={toggleSidebar}>
                            <FaTimes />
                        </button>
                    </div>
                    {isLoggedIn && (
                        <div className={styles.sidebarNav}>
                            <button
                                className={`${styles.sidebarNavItem} ${activeAccountTab === 'accountDetails' ? styles.active : ''}`}
                                onClick={() => handleTabClick('accountDetails')}
                            >
                                <FaUserCircle /> Account Details
                            </button>
                            <button
                                className={`${styles.sidebarNavItem} ${activeAccountTab === 'addresses' ? styles.active : ''}`}
                                onClick={() => handleTabClick('addresses')}
                            >
                                <FaHome /> My Addresses
                            </button>
                            <button
                                className={`${styles.sidebarNavItem} ${activeAccountTab === 'orderHistory' ? styles.active : ''}`}
                                onClick={() => handleTabClick('orderHistory')}
                            >
                                <FaHistory /> Order History
                            </button>
                            <button className={styles.sidebarNavItem} onClick={handleLogout}>
                                <FaSignOutAlt /> Logout
                            </button>
                        </div>
                    )}

                    <div className={styles.sidebarContent}>
                        {isLoggedIn && activeAccountTab === 'accountDetails' && (
                            <div className={styles.tabContent}>
                                <h4>Update Personal Information</h4>
                                <form onSubmit={handleUpdateAccount} className={styles.form}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="accountName">Name:</label>
                                        <input
                                            type="text"
                                            id="accountName"
                                            name="name"
                                            value={accountDetailsForm.name}
                                            onChange={handleAccountDetailsChange}
                                            required
                                            className={styles.inputField}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="accountPhone">Phone Number:</label>
                                        <input
                                            type="tel"
                                            id="accountPhone"
                                            name="phone"
                                            value={accountDetailsForm.phone}
                                            onChange={handleAccountDetailsChange}
                                            required
                                            maxLength="10"
                                            placeholder="10-digit number"
                                            className={styles.inputField}
                                            disabled // Phone number usually not editable as it's the primary identifier
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="accountAddress">Delivery Address:</label>
                                        <textarea
                                            id="accountAddress"
                                            name="address"
                                            value={accountDetailsForm.address}
                                            onChange={handleAccountDetailsChange}
                                            required
                                            rows="3"
                                            className={styles.textareaField}
                                        ></textarea>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="accountPincode">Pincode:</label>
                                        <input
                                            type="text"
                                            id="accountPincode"
                                            name="pincode"
                                            value={accountDetailsForm.pincode}
                                            onChange={handleAccountDetailsChange}
                                            required
                                            maxLength="6"
                                            placeholder="6-digit pincode"
                                            className={styles.inputField}
                                        />
                                    </div>
                                    <button type="submit" className={styles.modalButton} disabled={isUpdatingAccount}>
                                        {isUpdatingAccount ? (<><FaSpinner className={styles.spinner} /> Updating...</>) : 'Update Details'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {isLoggedIn && activeAccountTab === 'addresses' && (
                            <div className={styles.tabContent}>
                                <h4>My Saved Addresses</h4>
                                {isManagingAddresses ? (
                                    <p className={styles.loadingMessage}><FaSpinner className={styles.spinner} /> Loading addresses...</p>
                                ) : (
                                    <>
                                        <div className={styles.addressList}>
                                            {userAddresses.length === 0 ? (
                                                <p>No addresses saved yet. Add one below!</p>
                                            ) : (
                                                userAddresses.map(addr => (
                                                    <div key={addr.id} className={styles.addressCard}>
                                                        <p><strong>{addr.address}, {addr.pincode}</strong></p>
                                                        {addr.isDefault === 'Yes' && <span className={styles.defaultBadge}>Default</span>}
                                                        <div className={styles.addressActions}>
                                                            <button onClick={() => handleEditAddress(addr)} className={styles.addressActionButton}>
                                                                <FaEdit /> Edit
                                                            </button>
                                                            <button onClick={() => handleDeleteAddress(addr.id)} className={styles.addressActionButton}>
                                                                <FaTrash /> Delete
                                                            </button>
                                                            {addr.isDefault !== 'Yes' && (
                                                                <button onClick={() => handleSetDefaultAddress(addr.id)} className={styles.addressActionButton}>
                                                                    Set Default
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <button onClick={() => setShowAddressForm(!showAddressForm)} className={styles.addVarietyBtn} style={{ marginTop: '20px' }}>
                                            <FaPlus /> {showAddressForm ? 'Close Add Form' : 'Add New Address'}
                                        </button>

                                        {showAddressForm && (
                                            <form onSubmit={handleSaveAddress} className={styles.form} style={{ marginTop: '20px' }}>
                                                <h4>{addressForm.id ? 'Edit Address' : 'Add New Address'}</h4>
                                                <div className={styles.formGroup}>
                                                    <label htmlFor="addressLine">Address Line:</label>
                                                    <textarea
                                                        id="addressLine"
                                                        name="address"
                                                        value={addressForm.address}
                                                        onChange={handleAddressFormChange}
                                                        required
                                                        rows="3"
                                                        className={styles.textareaField}
                                                    ></textarea>
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label htmlFor="addressPincode">Pincode:</label>
                                                    <input
                                                        type="text"
                                                        id="addressPincode"
                                                        name="pincode"
                                                        value={addressForm.pincode}
                                                        onChange={handleAddressFormChange}
                                                        required
                                                        maxLength="6"
                                                        className={styles.inputField}
                                                    />
                                                </div>
                                                <div className={styles.formGroupCheckbox}>
                                                    <input
                                                        type="checkbox"
                                                        id="isDefault"
                                                        name="isDefault"
                                                        checked={addressForm.isDefault}
                                                        onChange={handleAddressFormChange}
                                                        className={styles.checkboxField}
                                                    />
                                                    <label htmlFor="isDefault">Set as default address</label>
                                                </div>
                                                <div className={styles.modalButtons}>
                                                    <button type="submit" className={styles.modalButton} disabled={isManagingAddresses}>
                                                        {isManagingAddresses ? (<><FaSpinner className={styles.spinner} /> Saving...</>) : 'Save Address'}
                                                    </button>
                                                    <button type="button" onClick={() => { setShowAddressForm(false); setAddressForm({ id: null, address: '', pincode: '', isDefault: false }); }} className={`${styles.modalButton} ${styles.modalButton.cancel}`}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {isLoggedIn && activeAccountTab === 'orderHistory' && (
                            <div className={styles.tabContent}>
                                <h4>My Order History</h4>
                                {isLoadingOrders ? (
                                    <p className={styles.loadingMessage}><FaSpinner className={styles.spinner} /> Loading order history...</p>
                                ) : userOrders.length === 0 ? (
                                    <p>You haven't placed any orders yet.</p>
                                ) : (
                                    <div className={styles.orderHistoryList}>
                                        {userOrders.map((orderGroup, index) => (
                                            <div key={index} className={styles.orderCard}>
                                                <div className={styles.orderHeader}>
                                                    <h5>Order on {orderGroup.date}</h5>
                                                    <p>Total: ₹{orderGroup.totalPrice.toFixed(2)}</p>
                                                </div>
                                                <p className={styles.orderDeliveryAddress}>Delivery: {orderGroup.deliveryAddress}</p>
                                                <ul className={styles.orderItems}>
                                                    {orderGroup.items.map((item, itemIndex) => (
                                                        <li key={itemIndex}>
                                                            {item.quantity} Kg {item.quality} (₹{parseFloat(item['Price Per Kg']).toFixed(2)}/Kg)
                                                            {item.discount !== '0%' && ` - ${item.discount} off`}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
