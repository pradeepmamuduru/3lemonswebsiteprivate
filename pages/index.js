import React, { useState, useEffect, useCallback, useMemo, Fragment, useContext, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/styles.module.css';
import { AuthContext } from '../pages/_app';

// Import all necessary icons
import { FaWhatsapp, FaStar, FaUserCircle, FaPlus, FaMinus, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaSpinner, FaBox, FaTimes, FaBars, FaPlusCircle, FaMinusCircle, FaMapMarkerAlt, FaPencilAlt, FaTrash } from 'react-icons/fa';


// SheetDB API URLs - CONFIRMED BY USER
const LEMONS_DATA_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Lemons';
const SIGNUP_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Signup'; // Ensure this matches sheet name
const ORDERS_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Orders'; // Ensure this matches sheet name
const ADDRESSES_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Addresses'; // Ensure this matches sheet name
const FEEDBACK_SHEET_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Feedback'; // Ensure this matches sheet name

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
    }, []);

    return [feedback, showTemporaryFeedback];
};


// --- Home Component ---
export default function Home({ lemons }) {
    // Access AuthContext for global user state
    const { isLoggedIn, currentUser, login, logout, setCurrentUser } = useContext(AuthContext);

    // --- State Variables (All useState and useMemo at the very top) ---
    const [orders, setOrders] = useState([{ grade: '', quantity: '' }]);
    const [form, setForm] = useState({ name: '', delivery: '', contact: '' }); // This is for the main order form, will be pre-filled
    const [total, setTotal] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [feedback, showTemporaryFeedback] = useTemporaryFeedback();

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmedOrderDetails, setConfirmedOrderDetails] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginForm, setLoginForm] = useState({ name: '', phone: '' });
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const [showSignUpModal, setShowSignUpModal] = useState(false);
    const [signUpForm, setSignUpForm] = useState({ name: '', phone: '', address: '', pincode: '' });
    const [isSigningUp, setIsSigningUp] = useState(false);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeAccountTab, setActiveAccountTab] = useState('accountDetails');
    const [userAddresses, setUserAddresses] = useState([]);
    const [isManagingAddresses, setIsManagingAddresses] = useState(false);
    const [addressForm, setAddressForm] = useState({ id: null, addressName: '', fullAddress: '', pincode: '' });
    const [showAddressForm, setShowAddressForm] = useState(false);

    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    const [userOrders, setUserOrders] = useState([]);
    const [isFetchingOrders, setIsFetchingOrders] = useState(false);

    const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
    const [accountDetailsForm, setAccountDetailsForm] = useState({ name: '', phone: '', address: '', pincode: '' });


    // Hardcoded customer reviews
    const customerReviews = useMemo(() => [
        { id: 1, text: "The freshest lemons I've ever tasted! Perfect for my morning lemonade. Delivery was super fast too.", name: "Priya Sharma", rating: 5 },
        { id: 2, text: "Excellent quality and consistent supply. My restaurant relies on these lemons. Highly recommended!", name: "Chef Anand Rao", rating: 5 },
        { id: 3, text: "So convenient to get fresh lemons delivered home. They truly are farm fresh. My family loves them!", name: "Rajesh Kumar", rating: 5 },
    ], []);


    // --- All Function Definitions (IMPORTANT: Defined here, after states, before effects) ---

    // --- Modal & Sidebar Helper Functions ---
    const openLoginModal = () => {
        setShowLoginModal(true);
        setLoginForm({ name: '', phone: '' });
        setFeedback({ message: '', type: '' }); // Clear any previous feedback
    };

    const closeLoginModal = () => {
        setShowLoginModal(false);
        setLoginForm({ name: '', phone: '' });
        setFeedback({ message: '', type: '' });
    };

    const openSignUpModal = () => {
        console.log('openSignUpModal called. Setting showSignUpModal to true.'); // DEBUG LOG
        setShowSignUpModal(true);
        setSignUpForm({ name: '', phone: '', address: '', pincode: '' });
        setFeedback({ message: '', type: '' });
    };

    const closeSignUpModal = () => {
        console.log('closeSignUpModal called. Setting showSignUpModal to false.'); // DEBUG LOG
        setShowSignUpModal(false);
        setSignUpForm({ name: '', phone: '', address: '', pincode: '' });
        setFeedback({ message: '', type: '' });
    };

    const toggleSidebar = () => {
        if (isLoggedIn) {
            setIsSidebarOpen(!isSidebarOpen);
            if (!isSidebarOpen) {
                // When closing sidebar, reset tab and other states
                setActiveAccountTab('accountDetails');
                setFeedback({ message: '', type: '' });
                if (currentUser) {
                    setAccountDetailsForm(currentUser);
                }
                setShowAddressForm(false);
                setAddressForm({ id: null, addressName: '', fullAddress: '', pincode: '' });
                setFeedbackText('');
                setUserOrders([]);
            }
        } else {
            openLoginModal();
            showTemporaryFeedback('Please log in to access your account.', 'info');
        }
    };

    // --- Auth Form Handlers ---
    const handleLoginFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            if (!/^\d*$/.test(value) || value.length > 10) {
                return; // Prevent non-digits or >10 digits
            }
        }
        setLoginForm(prev => ({ ...prev, [name]: value }));
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setFeedback({ message: '', type: '' }); // Clear feedback before new attempt

        const { name, phone } = loginForm;
        const trimmedName = name.trim();
        const trimmedPhone = phone.trim(); // Trim input to match clean data in SheetDB

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
            // SheetDB search by exact phone number
            // IMPORTANT: Using 'phone' (lowercase) to match your column name in Signup sheet
            const searchUrl = `${SIGNUP_SHEET_URL.split('?')[0]}/search?sheet=Signup&search={"phone":"${trimmedPhone}"}`;
            console.log('Login search URL:', searchUrl); // Debug log
            const res = await fetch(searchUrl);

            let users = [];
            if (res.ok && res.status !== 204 && res.status !== 404) {
                users = await res.json();
                console.log('Login search API response (parsed):', users); // Debug log
            } else {
                let errorDetails = '';
                try {
                    errorDetails = (await res.json()).message || res.statusText;
                } catch (jsonError) {
                    errorDetails = res.statusText;
                }
                console.error(`Login search API responded with: ${res.status} ${errorDetails}`); // Debug log
            }

            if (!Array.isArray(users)) { // Ensure users is an array
                users = [];
            }

            // Find user where phone matches and name matches (case-insensitive for name)
            // IMPORTANT: Using 'phone' (lowercase) to access the property from fetched data
            const foundUser = users.find(user =>
                user.phone === trimmedPhone && user.Name.toLowerCase() === trimmedName.toLowerCase()
            );

            if (foundUser) {
                // Store user data in AuthContext
                const userForContext = {
                    name: foundUser.Name,
                    phone: foundUser.phone, // Use lowercase 'phone' here
                    address: foundUser.Address,
                    pincode: foundUser.Pincode
                };
                login(userForContext); // Call context's login function
                showTemporaryFeedback(`Welcome back, ${foundUser.Name}! 😊`, 'success');
                closeLoginModal();
            } else {
                showTemporaryFeedback('Invalid name or phone number. Please check your credentials or sign up.', 'error');
            }
        } catch (error) {
            console.error('Login process network/parsing error:', error); // Debug log
            showTemporaryFeedback(`An error occurred during login: ${error.message}. Please check your internet.`, 'error');
        } finally {
            setIsLoggingIn(false); // Always reset loading state
        }
    };

    const handleSignUpFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone' || name === 'pincode') {
            if (!/^\d*$/.test(value)) return;
            if (name === 'phone' && value.length > 10) return;
            if (name === 'pincode' && value.length > 6) return;
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
            // Check if phone number already exists before attempting to sign up
            // IMPORTANT: Using 'phone' (lowercase) for search
            const existingUserSearchUrl = `${SIGNUP_SHEET_URL.split('?')[0]}/search?sheet=Signup&search={"phone":"${trimmedPhone}"}`;
            console.log('Signup existing user check URL:', existingUserSearchUrl); // Debug log
            const existingUserRes = await fetch(existingUserSearchUrl);

            let existingUsers = [];
            if (existingUserRes.ok && existingUserRes.status !== 204 && existingUserRes.status !== 404) {
                existingUsers = await existingUserRes.json();
                console.log('Existing user check response (parsed):', existingUsers); // Debug log
            } else {
                let errorDetails = '';
                try {
                    errorDetails = (await existingUserRes.json()).message || existingUserRes.statusText;
                } catch (jsonError) {
                    errorDetails = existingUserRes.statusText;
                }
                console.error(`Existing user check API responded with: ${existingUserRes.status} ${errorDetails}`); // Debug log
            }

            // IMPORTANT: Accessing 'phone' (lowercase) from existing data
            if (existingUsers.some(user => user.phone === trimmedPhone)) {
                showTemporaryFeedback('An account with this phone number already exists. Please log in.', 'error');
                setIsSigningUp(false);
                return;
            }

            // Proceed with signup if phone number is unique
            console.log('Attempting to POST new user to Signup sheet.'); // Debug log
            const res = await fetch(SIGNUP_SHEET_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: {
                        Name: trimmedName,
                        phone: trimmedPhone, // IMPORTANT: Using 'phone' (lowercase) for column mapping
                        Address: trimmedAddress,
                        Pincode: trimmedPincode,
                        SignupDate: new Date().toLocaleString(), // Using 'SignupDate' to match your actual Google Sheet column header (no space)
                    },
                }),
            });

            if (res.ok) {
                console.log('Signup POST successful!'); // Debug log
                // If signup is successful, log in the new user automatically
                const newUserForContext = {
                    name: trimmedName,
                    phone: trimmedPhone, // Use lowercase 'phone' here
                    address: trimmedAddress,
                    pincode: trimmedPincode
                };
                login(newUserForContext); // Call context's login function
                showTemporaryFeedback('Account created successfully! Welcome! 🎉', 'success');
                closeSignUpModal();
            } else {
                let errorDetails = '';
                try {
                    const errorJson = await res.json();
                    errorDetails = errorJson.message || res.statusText; // Prefer SheetDB message if available
                } catch (jsonError) {
                    errorDetails = res.statusText; // Fallback to HTTP status text
                }
                console.error('SheetDB signup error:', res.status, errorDetails); // Debug log
                showTemporaryFeedback(`Failed to create account: ${errorDetails}. Please try again.`, 'error');
            }
        } catch (error) {
            console.error('Sign up process network/parsing error:', error); // Debug log
            showTemporaryFeedback(`An error occurred during sign up: ${error.message}. Please check your internet.`, 'error');
        } finally {
            setIsSigningUp(false);
        }
    };

    const handleLogout = () => {
        logout(); // Clear user from AuthContext and localStorage
        setUserAddresses([]); // Clear sidebar data
        setUserOrders([]);
        setOrders([{ grade: '', quantity: '' }]); // Reset order form
        setTotal(0);
        showTemporaryFeedback('You have been logged out.', 'info');
        setIsSidebarOpen(false); // Close sidebar on logout
    };

    // --- Account Details Update ---
    const handleAccountDetailChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone' || name === 'pincode') {
            if (!/^\d*$/.test(value)) return;
            if (name === 'phone' && value.length > 10) return;
            if (name === 'pincode' && value.length > 6) return;
        }
        setAccountDetailsForm(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateAccountDetails = async (e) => {
        e.preventDefault();
        if (!currentUser || !currentUser.phone) {
            showTemporaryFeedback('No user logged in to update.', 'error');
            return;
        }

        setIsUpdatingAccount(true);
        setFeedback({ message: '', type: '' });

        const { name, address, pincode } = accountDetailsForm;
        const trimmedName = name.trim();
        const trimmedAddress = address.trim();
        const trimmedPincode = pincode.trim();

        if (!trimmedName || !trimmedAddress || !trimmedPincode) {
            showTemporaryFeedback('Name, Address, and Pincode cannot be empty.', 'error');
            setIsUpdatingAccount(false);
            return;
        }
        if (!/^\d{6}$/.test(trimmedPincode)) {
            showTemporaryFeedback('Please enter a valid 6-digit pincode.', 'error');
            setIsUpdatingAccount(false);
            return;
        }

        try {
            // Update user in Signup sheet by phone
            // IMPORTANT: Using 'phone' (lowercase) in the URL path for SheetDB row update
            const updateUrl = `${SIGNUP_SHEET_URL.split('?')[0]}/phone/${currentUser.phone}?sheet=Signup`;
            console.log('Update account URL:', updateUrl); // Debug log
            const res = await fetch(updateUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: {
                        Name: trimmedName,
                        Address: trimmedAddress,
                        Pincode: trimmedPincode,
                    },
                }),
            });

            if (res.ok) {
                console.log('Account update successful!'); // Debug log
                // Update currentUser in AuthContext with new details
                setCurrentUser(prevUser => ({
                    ...prevUser,
                    name: trimmedName,
                    address: trimmedAddress,
                    pincode: trimmedPincode
                }));
                showTemporaryFeedback('Account details updated successfully! ✅', 'success');
            } else {
                let errorDetails = '';
                try {
                    const errorJson = await res.json();
                    errorDetails = errorJson.message || res.statusText;
                } catch (jsonError) {
                    errorDetails = res.statusText;
                }
                console.error('SheetDB account update error:', res.status, errorDetails); // Debug log
                showTemporaryFeedback(`Failed to update: ${errorDetails}.`, 'error');
            }
        } catch (error) {
            console.error('Network error updating account:', error); // Debug log
            showTemporaryFeedback(`An error occurred while updating details: ${error.message}.`, 'error');
        } finally {
            setIsUpdatingAccount(false);
        }
    };


    // --- Address Management Functions ---
    const fetchUserAddresses = useCallback(async () => {
        if (!currentUser || !currentUser.phone) {
            setUserAddresses([]);
            return;
        }
        setIsManagingAddresses(true);
        try {
            // Fetch addresses by UserPhone from the Addresses sheet
            // IMPORTANT: Using 'UserPhone' to match your column name in Addresses sheet
            const searchUrl = `${ADDRESSES_SHEET_URL.split('?')[0]}/search?sheet=Addresses&search={"UserPhone":"${currentUser.phone}"}`;
            console.log('Fetch addresses URL:', searchUrl); // Debug log
            const res = await fetch(searchUrl);

            let addresses = [];
            if (res.ok && res.status !== 204 && res.status !== 404) {
                addresses = await res.json();
                console.log('Fetched addresses (parsed):', addresses); // Debug log
            } else {
                 let errorDetails = '';
                try {
                    errorDetails = (await res.json()).message || res.statusText;
                } catch (jsonError) {
                    errorDetails = res.statusText;
                }
                console.error(`Fetch addresses API responded with: ${res.status} ${errorDetails}`); // Debug log
            }

            if (Array.isArray(addresses)) {
                // SheetDB's API response usually includes an 'id' for each row.
                // If it doesn't, we create a temporary unique key for React lists.
                setUserAddresses(addresses.map(addr => ({ ...addr, id: addr.id || `${addr.UserPhone}-${addr.AddressName}-${Date.now() + Math.random()}` })));
            } else {
                setUserAddresses([]);
            }
        } catch (error) {
            console.error("Error fetching user addresses:", error); // Debug log
            showTemporaryFeedback(`Failed to load addresses: ${error.message}.`, 'error');
            setUserAddresses([]);
        } finally {
            setIsManagingAddresses(false);
        }
    }, [currentUser, showTemporaryFeedback]);

    const handleAddressFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'pincode') {
            if (!/^\d*$/.test(value)) return;
            if (value.length > 6) return;
        }
        setAddressForm(prevForm => ({ ...prevForm, [name]: value }));
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setIsManagingAddresses(true);
        setFeedback({ message: '', type: '' });

        if (!currentUser || !currentUser.phone) {
            showTemporaryFeedback('Please log in to save addresses.', 'error');
            setIsManagingAddresses(false);
            return;
        }

        const { addressName, fullAddress, pincode, id } = addressForm;
        const trimmedAddressName = addressName.trim();
        const trimmedFullAddress = fullAddress.trim();
        const trimmedPincode = pincode.trim();

        if (!trimmedAddressName || !trimmedFullAddress || !trimmedPincode) {
            showTemporaryFeedback('Please fill all address fields.', 'error');
            setIsManagingAddresses(false);
            return;
        }
        if (!/^\d{6}$/.test(trimmedPincode)) {
            showTemporaryFeedback('Please enter a valid 6-digit pincode.', 'error');
            setIsManagingAddresses(false);
            return;
        }

        if (userAddresses.length >= 5 && !id) {
            showTemporaryFeedback('You can save a maximum of 5 addresses.', 'error');
            setIsManagingAddresses(false);
            return;
        }

        const addressData = {
            UserPhone: currentUser.phone,
            AddressName: trimmedAddressName,
            FullAddress: trimmedFullAddress,
            Pincode: trimmedPincode,
        };

        try {
            let response;
            if (id) {
                // Update by 'id' in Addresses sheet
                const updateUrl = `${ADDRESSES_SHEET_URL.split('?')[0]}/id/${id}?sheet=Addresses`;
                console.log('Update address URL:', updateUrl); // Debug log
                response = await fetch(updateUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: addressData }),
                });
            } else {
                // POST new address to Addresses sheet
                console.log('Add new address URL:', ADDRESSES_SHEET_URL); // Debug log
                response = await fetch(ADDRESSES_SHEET_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: addressData }),
                });
            }

            if (response.ok) {
                console.log('Address save successful!'); // Debug log
                showTemporaryFeedback(`Address ${id ? 'updated' : 'added'} successfully!`, 'success');
                setShowAddressForm(false);
                setAddressForm({ id: null, addressName: '', fullAddress: '', pincode: '' });
                fetchUserAddresses(); // Re-fetch to update list and get actual SheetDB ID for new address
            } else {
                let errorDetails = '';
                try {
                    const errorJson = await response.json();
                    errorDetails = errorJson.message || response.statusText;
                } catch (jsonError) {
                    errorDetails = response.statusText;
                }
                console.error('SheetDB address save error:', response.status, errorDetails); // Debug log
                showTemporaryFeedback(`Failed to save address: ${errorDetails}.`, 'error');
            }
        } catch (error) {
            console.error('Network error saving address:', error); // Debug log
            showTemporaryFeedback(`Network error. Could not save address: ${error.message}.`, 'error');
        } finally {
            setIsManagingAddresses(false);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;
        setIsManagingAddresses(true);
        setFeedback({ message: '', type: '' });
        try {
            // Delete by 'id' in Addresses sheet
            const deleteUrl = `${ADDRESSES_SHEET_URL.split('?')[0]}/id/${addressId}?sheet=Addresses`;
            console.log('Delete address URL:', deleteUrl); // Debug log
            const response = await fetch(deleteUrl, {
                method: 'DELETE',
            });
            if (response.ok) {
                console.log('Address delete successful!'); // Debug log
                showTemporaryFeedback('Address deleted successfully!', 'success');
                fetchUserAddresses();
            } else {
                let errorDetails = '';
                try {
                    const errorJson = await response.json();
                    errorDetails = errorJson.message || response.statusText;
                } catch (jsonError) {
                    errorDetails = response.statusText;
                }
                console.error('SheetDB address delete error:', response.status, errorDetails); // Debug log
                showTemporaryFeedback(`Failed to delete address: ${errorDetails}.`, 'error');
            }
        } catch (error) {
            console.error('Network error deleting address:', error); // Debug log
            showTemporaryFeedback(`Network error. Could not delete address: ${error.message}.`, 'error');
        } finally {
            setIsManagingAddresses(false);
        }
    };

    const handleEditAddress = (address) => {
        setAddressForm({ id: address.id, addressName: address.AddressName, fullAddress: address.FullAddress, pincode: address.Pincode });
        setShowAddressForm(true);
    };

    // --- Feedback Submission ---
    const handleFeedbackTextChange = (e) => {
        setFeedbackText(e.target.value);
        setFeedback({ message: '', type: '' });
    };

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
            Name: currentUser.name.trim(),
            Phone: currentUser.phone.trim(), // Use phone as received from currentUser (which is lowercase)
            Address: (currentUser.address || 'N/A').trim(),
            Feedback: feedbackText.trim(),
            'Feedback Date': new Date().toLocaleString(),
        };

        try {
            console.log('Submitting feedback to:', FEEDBACK_SHEET_URL); // Debug log
            const res = await fetch(FEEDBACK_SHEET_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: feedbackData })
            });

            if (res.ok) {
                console.log('Feedback submission successful!'); // Debug log
                setFeedbackText('');
                showTemporaryFeedback('Thank you for your valuable feedback!', 'success');
            } else {
                let errorDetails = '';
                try {
                    const errorJson = await res.json();
                    errorDetails = errorJson.message || res.statusText;
                } catch (jsonError) {
                    errorDetails = res.statusText;
                }
                console.error('SheetDB feedback submission error:', res.status, errorDetails); // Debug log
                showTemporaryFeedback(`Error submitting feedback: ${errorDetails}.`, 'error');
            }
        } catch (error) {
            console.error('Error submitting feedback network/parsing error:', error); // Debug log
            showTemporaryFeedback(`Error submitting feedback: ${error.message}.`, 'error');
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    // --- Calculation and Order Form Logic ---
    const calculateTotal = useCallback(() => {
        let totalPrice = 0;
        orders.forEach(order => {
            const lemon = lemons.find(l => l.Grade === order.grade);
            if (lemon) {
                const pricePerKg = parseFloat(lemon['Price Per Kg'] || lemon.Price || 0);
                const quantity = parseFloat(order.quantity);

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
    }, [orders, lemons]);

    const handleOrderChange = (index, field, value) => {
        const updated = [...orders];
        if (field === 'quantity') {
            value = value === '' ? '' : String(Math.max(0.5, parseFloat(value) || 0.5));
        }

        if (field === 'grade') {
            const selectedGrades = updated.map((order, i) => (i === index ? value : order.grade));
            const isDuplicate = selectedGrades.filter(g => g === value && g !== '').length > 1;
            if (isDuplicate) {
                showTemporaryFeedback(`${currentUser?.name || 'You'}, are selecting the same variety again! 🧐`, 'error');
                return;
            }
        }

        updated[index][field] = value;
        setOrders(updated);
    };

    const addAnotherVariety = () => {
        const lastOrder = orders[orders.length - 1];
        if (orders.length > 0 && (lastOrder.grade === '' || lastOrder.quantity === '')) {
            showTemporaryFeedback('Please complete the current variety selection before adding a new one.', 'info');
            return;
        }
        setOrders([...orders, { grade: '', quantity: '' }]);
    };

    const removeVariety = (index) => {
        const updated = orders.filter((_, i) => i !== index);
        setOrders(updated.length > 0 ? updated : [{ grade: '', quantity: '' }]);
        showTemporaryFeedback('Variety removed.', 'info');
    };

    const handlePlaceOrder = async (orderType) => {
        if (!isLoggedIn) {
            showTemporaryFeedback('Please log in to place an order.', 'error');
            openLoginModal();
            return;
        }

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

        const orderDetails = validOrders.map(order => {
            const lemon = lemons.find(l => l.Grade === order.grade);
            const quantity = parseFloat(order.quantity);
            const pricePerKg = parseFloat(lemon?.['Price Per Kg'] || lemon.Price || 0);
            let itemPrice = pricePerKg * quantity;
            if (quantity > 50) {
                itemPrice *= 0.90;
                discountMsg = ` (10% bulk discount applied)`;
            }
            return `${quantity} kg of ${order.grade} (Approx. ₹${itemPrice.toFixed(2)})${discountMsg}`;
        }).join('; ');

        const orderData = {
            Name: currentUser.name,
            phone: currentUser.phone, // Use phone (lowercase) here to match Signup sheet structure
            Address: currentUser.address || 'N/A',
            Pincode: currentUser.pincode || 'N/A',
            OrderDetails: orderDetails,
            TotalAmount: total.toFixed(2),
            Timestamp: new Date().toLocaleString(),
            OrderType: orderType
        };

        setIsSubmitting(true);
        try {
            console.log('Placing order to:', ORDERS_SHEET_URL); // Debug log
            const res = await fetch(ORDERS_SHEET_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: orderData }),
            });

            if (res.ok) {
                console.log('Order placement successful!'); // Debug log
                showTemporaryFeedback('Order placed successfully! We will contact you soon.', 'success');
                setShowSuccessModal(true);
                setOrders([{ grade: '', quantity: '' }]); // Reset order form after successful submission
                setTotal(0);
                if (activeAccountTab === 'yourOrders' && isLoggedIn) {
                    fetchUserOrders(); // Re-fetch orders for the sidebar to show the new order
                }
            } else {
                let errorDetails = '';
                try {
                    const errorJson = await res.json();
                    errorDetails = errorJson.message || res.statusText;
                } catch (jsonError) {
                    errorDetails = res.statusText;
                }
                console.error('SheetDB order submission error:', res.status, errorDetails); // Debug log
                showTemporaryFeedback('Failed to place order. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error placing order network/parsing error:', error); // Debug log
            showTemporaryFeedback('An error occurred while placing your order. Please check your internet connection.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const generateWhatsAppLink = () => {
        const whatsappPhoneNumber = '919539304300'; // Your WhatsApp number

        let message = `Hello! I'd like to place an order from 3 Lemons Traders.\n\n`;
        if (isLoggedIn && currentUser) {
            message += `Name: ${currentUser.name}\n`;
            message += `Phone: ${currentUser.phone}\n`;
            message += `Delivery Address: ${currentUser.address || 'Not provided'}\n`;
            message += `Pincode: ${currentUser.pincode || 'Not provided'}\n\n`;
        } else {
            message += `(Please provide your Name, Phone Number, Delivery Address, and Pincode in the chat)\n\n`;
        }

        const validOrders = orders.filter(order => order.grade && order.quantity && parseFloat(order.quantity) > 0);
        if (validOrders.length > 0) {
            message += `My Order Details:\n`;
            validOrders.forEach((order) => {
                const lemon = lemons.find(l => l.Grade === order.grade);
                if (lemon) {
                    const quantity = parseFloat(order.quantity);
                    const pricePerKg = parseFloat(lemon?.['Price Per Kg'] || lemon.Price || 0);
                    let itemCalculatedPrice = pricePerKg * quantity;
                    if (quantity > 50) {
                        itemCalculatedPrice *= 0.90;
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


    // --- Fetch User Orders ---
    const fetchUserOrders = useCallback(async () => {
        if (!currentUser || !currentUser.phone) {
            setUserOrders([]);
            return;
        }
        setIsFetchingOrders(true);
        try {
            // Fetch orders by Phone from the Orders sheet
            // IMPORTANT: Using 'Phone' (uppercase) for search on Orders sheet, assuming this is your column name
            const searchUrl = `${ORDERS_SHEET_URL.split('?')[0]}/search?sheet=Orders&search={"Phone":"${currentUser.phone}"}`;
            console.log('Fetch orders URL:', searchUrl); // Debug log
            const res = await fetch(searchUrl);

            let ordersData = [];
            if (res.ok && res.status !== 204 && res.status !== 404) {
                ordersData = await res.json();
                console.log('Fetched orders (parsed):', ordersData); // Debug log
            } else {
                let errorDetails = '';
                try {
                    errorDetails = (await res.json()).message || res.statusText;
                } catch (jsonError) {
                    errorDetails = res.statusText;
                }
                console.error(`Fetch orders API responded with: ${res.status} ${errorDetails}`); // Debug log
            }

            if (!Array.isArray(ordersData)) {
                ordersData = [];
            }

            // Sort orders by Timestamp (newest first)
            setUserOrders(ordersData.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp)));
        } catch (error) {
            console.error("Error fetching user orders:", error); // Debug log
            showTemporaryFeedback(`Failed to load your orders: ${error.message}.`, 'error');
            setUserOrders([]);
        } finally {
            setIsFetchingOrders(false);
        }
    }, [currentUser, showTemporaryFeedback]);


    // --- Effects (placed after all functions they might call) ---
    // Sync order form and account details form with currentUser from AuthContext
    useEffect(() => {
        if (currentUser) {
            setAccountDetailsForm({
                name: currentUser.name || '',
                phone: currentUser.phone || '', // Use lowercase 'phone' here for currentUser consistency
                address: currentUser.address || '',
                pincode: currentUser.pincode || ''
            });
            // Also pre-fill main order form with logged-in user data
            setForm(prevForm => ({
                ...prevForm,
                name: currentUser.name || prevForm.name,
                contact: currentUser.phone || prevForm.contact, // Use lowercase 'phone' for currentUser consistency
                delivery: currentUser.address || prevForm.delivery,
            }));
        } else {
            setAccountDetailsForm({ name: '', phone: '', address: '', pincode: '' });
            setForm({ name: '', delivery: '', contact: '' }); // Clear main order form if logged out
        }
    }, [currentUser]);

    // Recalculate total whenever orders or lemons data changes
    useEffect(() => {
        calculateTotal();
    }, [orders, lemons, calculateTotal]); // calculateTotal is memoized, so it's stable

    // Fetch addresses when sidebar is open and tab is 'addresses' and user is logged in
    useEffect(() => {
        if (isLoggedIn && currentUser?.phone && activeAccountTab === 'addresses') {
            fetchUserAddresses();
        } else if (activeAccountTab !== 'addresses') {
            setUserAddresses([]); // Clear addresses if not on addresses tab or not logged in
        }
    }, [isLoggedIn, currentUser?.phone, activeAccountTab, fetchUserAddresses]);

    // Fetch orders when sidebar is open and tab is 'yourOrders' and user is logged in
    useEffect(() => {
        if (isLoggedIn && currentUser?.phone && activeAccountTab === 'yourOrders') {
            fetchUserOrders();
        } else if (activeAccountTab !== 'yourOrders') {
            setUserOrders([]); // Clear orders if not on orders tab or not logged in
        }
    }, [isLoggedIn, currentUser?.phone, activeAccountTab, fetchUserOrders]);


    // --- Main Render ---
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
                </div>
            </header>

            <main className={styles.container}>
                {feedback.message && (
                    <div className={`${styles.feedbackMessage} ${styles[`feedback${feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}`]}`}>
                        {feedback.message}
                    </div>
                )}

                {/* --- Hero Section --- */}
                <section className={styles.hero}>
                    <Image
                        src="/lemons-hero.jpg"
                        alt="Fresh Lemons"
                        layout="fill"
                        objectFit="cover"
                        priority
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
                                    {/* Adjusted to use 'Image url' to match your sheet's column header */}
                                    {lemon['Image url'] && (
                                        <Image
                                            src={`/${lemon['Image url']}`} // Image paths should be relative to public folder
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
                    <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="name">Your Name</label>
                            <input
                                id="name"
                                className={styles.input}
                                required
                                value={currentUser?.name || ''}
                                readOnly={isLoggedIn} // Pre-fill and make read-only if logged in
                                style={isLoggedIn ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                                placeholder="Enter your name"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="delivery">Delivery Address</label>
                            {isLoggedIn && currentUser?.address ? ( // Pre-fill and make read-only if logged in
                                <input
                                    id="delivery"
                                    className={styles.input}
                                    required
                                    value={currentUser.address || ''}
                                    readOnly={true}
                                    style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                                />
                            ) : (
                                <input
                                    id="delivery"
                                    className={styles.input}
                                    required
                                    value={form.delivery}
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
                                value={currentUser?.phone || ''} // Use lowercase 'phone' here for consistency with currentUser
                                readOnly={isLoggedIn} // Pre-fill and make read-only if logged in
                                style={isLoggedIn ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                                maxLength={10}
                                pattern="[0-9]{10}"
                                title="Please enter a 10-digit mobile number"
                                placeholder="e.g., 9876543210"
                            />
                        </div>

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
                                                // Disable already selected grades for other variety rows
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
                                    {orders.length > 1 && ( // Only show remove button if there's more than one variety
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
                                // Disable WhatsApp button if no valid order items
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
                                    {/* FIX: Wrap the two map calls in a Fragment */}
                                    <>
                                        {Array.from({ length: review.rating }).map((_, i) => (
                                            <FaStar key={i} />
                                        ))}
                                        {Array.from({ length: 5 - review.rating }).map((_, i) => (
                                            <FaStar key={i + review.rating} style={{ opacity: 0.3 }} />
                                        ))}
                                    </>
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
                console.log('Signup modal JSX is attempting to render'), // DEBUG LOG
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
                                    console.log('Switching to signup modal from login.'); // DEBUG LOG
                                    openSignUpModal(); // Option to switch to signup
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
                                                    value={accountDetailsForm.phone || ''} // Use lowercase 'phone'
                                                    readOnly // Phone is read-only as it's the primary identifier
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
                                                        setAddressForm({ id: null, addressName: '', fullAddress: '', pincode: '' }); // Clear for new address
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

                                    {activeAccountTab === 'yourOrders' && (
                                        <>
                                            <h3>Your Recent Orders</h3>
                                            {isFetchingOrders ? (
                                                <p style={{ textAlign: 'center' }}><FaSpinner className={styles.spinner} /> Loading orders...</p>
                                            ) : userOrders.length > 0 ? (
                                                <div className={styles.ordersList}>
                                                    {userOrders.map((order, index) => (
                                                        <div key={`${order.Timestamp}-${index}`} className={styles.orderCard}>
                                                            <p><strong>Order Time:</strong> {new Date(order.Timestamp).toLocaleString()}</p>
                                                            <p><strong>Delivery Address:</strong> {order.Address || 'N/A'}</p>
                                                            <p><strong>Order Details:</strong> {order.OrderDetails}</p>
                                                            <p className={styles.totalPrice}>Total: ₹{parseFloat(order.TotalAmount).toFixed(2)}</p>
                                                            <p><strong>Ordered Via:</strong> {order.OrderType}</p>
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
            lemons = [];
        }
    } catch (error) {
        console.error('Error fetching lemons from SheetDB:', error);
        lemons = [];
    }

    // Fallback data if SheetDB fetch fails or returns empty
    if (lemons.length === 0) {
        console.log("Using fallback lemon data.");
        lemons = [
            // Using 'Image url' to match your actual Google Sheet column header
            { id: 1, Grade: 'Eureka Lemon', 'Price Per Kg': 1.50, 'Image url': 'lemon-with-leaves.jpg', Description: 'Classic juicy lemons, perfect for beverages.' },
            { id: 2, Grade: 'Meyer Lemon', 'Price Per Kg': 2.00, 'Image url': 'sliced-lemon.jpeg', Description: 'Sweeter, less acidic, ideal for desserts and garnishes.' },
            { id: 3, Grade: 'Lisbon Lemon', 'Price Per Kg': 1.75, 'Image url': 'basket-of-lemons.jpeg', Description: 'Tart and tangy, great for cooking and zest.' },
            { id: 4, Grade: 'Verna Lemon', 'Price Per Kg': 1.80, 'Image url': 'lemon-tree.jpeg', Description: 'Large and flavorful, excellent for juicing.' },
        ];
    }

    // Ensure 'Price Per Kg' is consistent, if some data uses 'Price'
    // Ensure 'Image url' is picked up correctly from fetched data or fallback
    lemons = lemons.map(lemon => ({
        ...lemon,
        'Price Per Kg': parseFloat(lemon['Price Per Kg'] || lemon.Price || 0),
        'Image url': lemon['Image url'] || '' // Ensure 'Image url' is correctly assigned
    }));


    return {
        props: {
            lemons,
        },
        revalidate: 30, // Re-generate page every 30 seconds
    };
}
