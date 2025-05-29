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

    // --- State Variables ---
    // Order form states
    const [orders, setOrders] = useState([{ grade: '', quantity: '' }]);
    const [form, setForm] = useState({ name: '', delivery: '', contact: '' }); // <-- ESSENTIAL: This state is used in JSX
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

    // Hardcoded customer reviews - kept separate as static data
    const customerReviews = useMemo(() => [
        { id: 1, text: "The freshest lemons I've ever tasted! Perfect for my morning lemonade. Delivery was super fast too.", name: "Priya Sharma", rating: 5 },
        { id: 2, text: "Excellent quality and consistent supply. My restaurant relies on these lemons. Highly recommended!", name: "Chef Anand Rao", rating: 5 },
        { id: 3, text: "So convenient to get fresh lemons delivered home. They truly are farm fresh. My family loves them!", name: "Rajesh Kumar", rating: 5 },
    ], []);

    // --- All Function Definitions (IMPORTANT: Defined BEFORE first use in JSX or effects) ---

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
                        itemPrice *= 0.90; // 10% discount for quantity > 50
                    }
                    totalPrice += itemPrice;
                }
            }
        });
        setTotal(totalPrice);
    }, [orders, lemons]); // Dependencies for useCallback

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
        // calculateTotal is called via useEffect based on orders dependency
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
        // calculateTotal is called via useEffect based on orders dependency
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
            let discountMsg = '';
            if (quantity > 50) {
                itemPrice *= 0.90;
                discountMsg = ` (10% bulk discount applied)`;
            }
            return `${quantity} kg of ${order.grade} (Approx. ₹${itemPrice.toFixed(2)})${discountMsg}`;
        }).join('; ');

        const orderData = {
            Name: currentUser.name,
            Phone: currentUser.phone,
            Address: currentUser.address || 'N/A',
            Pincode: currentUser.pincode || 'N/A',
            OrderDetails: orderDetails,
            TotalAmount: total.toFixed(2),
            Timestamp: new Date().toLocaleString(),
            OrderType: orderType
        };

        setIsSubmitting(true);
        try {
            const res = await fetch(ORDERS_SHEET_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: orderData }),
            });

            if (res.ok) {
                showTemporaryFeedback('Order placed successfully! We will contact you soon.', 'success');
                setShowSuccessModal(true);
                setOrders([{ grade: '', quantity: '' }]);
                setTotal(0);
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

    const generateWhatsAppLink = () => {
        const whatsappPhoneNumber = '919539304300';

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
                    const pricePerKg = parseFloat(lemon['Price Per Kg'] || lemon.Price || 0);
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

    // --- Auth Form Handlers (also moved to top) ---
    const handleLoginFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            if (!/^\d*$/.test(value) || value.length > 10) {
                return;
            }
        }
        setLoginForm(prev => ({ ...prev, [name]: value }));
    };

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
            const searchUrl = `https://sheetdb.io/api/v1/wm0oxtmmfkndt/search?sheet=Signup&search={"Phone":"${trimmedPhone}"}`;
            const res = await fetch(searchUrl);

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
                user.Phone === trimmedPhone && user.Name.toLowerCase() === trimmedName.toLowerCase()
            );

            if (foundUser) {
                const userForContext = {
                    name: foundUser.Name,
                    phone: foundUser.Phone,
                    address: foundUser.Address,
                    pincode: foundUser.Pincode
                };
                login(userForContext);
                showTemporaryFeedback(`Welcome back, ${foundUser.Name}! 😊`, 'success');
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
            const existingUserSearchUrl = `https://sheetdb.io/api/v1/wm0oxtmmfkndt/search?sheet=Signup&search={"Phone":"${trimmedPhone}"}`;
            const existingUserRes = await fetch(existingUserSearchUrl);

            let existingUsers = [];
            if (existingUserRes.ok && existingUserRes.status !== 204) {
                existingUsers = await existingUserRes.json();
                if (!Array.isArray(existingUsers)) existingUsers = [];
            }

            if (existingUsers.length > 0) {
                showTemporaryFeedback('An account with this phone number already exists. Please log in.', 'error');
                setIsSigningUp(false);
                return;
            }

            const res = await fetch(SIGNUP_SHEET_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: {
                        Name: trimmedName,
                        Phone: trimmedPhone,
                        Address: trimmedAddress,
                        Pincode: trimmedPincode,
                        'Signup Date': new Date().toLocaleString(),
                    },
                }),
            });

            if (res.ok) {
                const newUserForContext = {
                    name: trimmedName,
                    phone: trimmedPhone,
                    address: trimmedAddress,
                    pincode: trimmedPincode
                };
                login(newUserForContext);
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

    const handleLogout = () => {
        logout();
        setUserAddresses([]);
        setUserOrders([]);
        setOrders([{ grade: '', quantity: '' }]);
        setTotal(0);
        showTemporaryFeedback('You have been logged out.', 'info');
        setIsSidebarOpen(false);
    };

    // --- Account Details Update ---
    const [accountDetailsForm, setAccountDetailsForm] = useState({ name: '', phone: '', address: '', pincode: '' }); // Declare here

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
            const updateUrl = `https://sheetdb.io/api/v1/wm0oxtmmfkndt/Phone/${currentUser.phone}?sheet=Signup`;
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
                setCurrentUser(prevUser => ({
                    ...prevUser,
                    name: trimmedName,
                    address: trimmedAddress,
                    pincode: trimmedPincode
                }));
                showTemporaryFeedback('Account details updated successfully! ✅', 'success');
            } else {
                const errorData = await res.json();
                console.error('SheetDB account update error:', res.status, errorData);
                showTemporaryFeedback(`Failed to update: ${errorData.message || 'Server error'}.`, 'error');
            }
        } catch (error) {
            console.error('Network error updating account:', error);
            showTemporaryFeedback('An error occurred while updating details.', 'error');
        } finally {
            setIsUpdatingAccount(false);
        }
    };


    // --- Address Management Functions ---
    const handleAddressFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone' || name === 'pincode') {
            if (!/^\d*$/.test(value)) return;
            if (name === 'phone' && value.length > 10) return;
            if (name === 'pincode' && value.length > 6) return;
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
                const updateUrl = `https://sheetdb.io/api/v1/wm0oxtmmfkndt/id/${id}?sheet=Addresses`;
                response = await fetch(updateUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: addressData }),
                });
            } else {
                response = await fetch(ADDRESSES_SHEET_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: addressData }),
                });
            }

            if (response.ok) {
                showTemporaryFeedback(`Address ${id ? 'updated' : 'added'} successfully!`, 'success');
                setShowAddressForm(false);
                setAddressForm({ id: null, addressName: '', fullAddress: '', pincode: '' });
                fetchUserAddresses();
            } else {
                const errorData = await response.json();
                console.error('SheetDB address save error:', response.status, errorData);
                showTemporaryFeedback(`Failed to save address: ${errorData.message || 'Server error'}.`, 'error');
            }
        } catch (error) {
            console.error('Network error saving address:', error);
            showTemporaryFeedback('Network error. Could not save address.', 'error');
        } finally {
            setIsManagingAddresses(false);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;
        setIsManagingAddresses(true);
        setFeedback({ message: '', type: '' });
        try {
            const deleteUrl = `https://sheetdb.io/api/v1/wm0oxtmmfkndt/id/${addressId}?sheet=Addresses`;
            const response = await fetch(deleteUrl, {
                method: 'DELETE',
            });
            if (response.ok) {
                showTemporaryFeedback('Address deleted successfully!', 'success');
                fetchUserAddresses();
            } else {
                const errorData = await response.json();
                console.error('SheetDB address delete error:', response.status, errorData);
                showTemporaryFeedback(`Failed to delete address: ${errorData.message || 'Server error'}.`, 'error');
            }
        } catch (error) {
            console.error('Network error deleting address:', error);
            showTemporaryFeedback('Network error. Could not delete address.', 'error');
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
            Phone: currentUser.phone.trim(),
            Address: (currentUser.address || 'N/A').trim(),
            Feedback: feedbackText.trim(),
            'Feedback Date': new Date().toLocaleString(),
        };

        try {
            const res = await fetch(FEEDBACK_SHEET_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: feedbackData })
            });

            if (res.ok) {
                setFeedbackText('');
                showTemporaryFeedback('Thank you for your valuable feedback!', 'success');
            } else {
                const errorData = await res.json();
                console.error('SheetDB feedback submission error:', res.status, errorData);
                showTemporaryFeedback(`Error submitting feedback: ${errorData.message || 'Server error'}`, 'error');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            showTemporaryFeedback(`Error submitting feedback: ${error.message}`, 'error');
        } finally {
            setIsSubmittingFeedback(false);
        }
    };


    // --- Effects for loading data (placed after all functions they might call) ---
    useEffect(() => {
        calculateTotal();
    }, [orders, lemons, calculateTotal]);

    useEffect(() => {
        if (currentUser) {
            setAccountDetailsForm({
                name: currentUser.name || '',
                phone: currentUser.phone || '',
                address: currentUser.address || '',
                pincode: currentUser.pincode || ''
            });
            setForm(prevForm => ({
                ...prevForm,
                name: currentUser.name || prevForm.name,
                contact: currentUser.phone || prevForm.contact,
                delivery: currentUser.address || prevForm.delivery,
            }));
        } else {
            setAccountDetailsForm({ name: '', phone: '', address: '', pincode: '' });
            setForm({ name: '', delivery: '', contact: '' });
        }
    }, [currentUser]); // Dependencies for this effect

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
                                    {lemon.Image && (
                                        <Image
                                            src={`/${lemon.Image}`}
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
                                readOnly={isLoggedIn}
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
                                value={currentUser?.phone || ''}
                                readOnly={isLoggedIn}
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
                                    openSignUpModal();
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
                                            ) : userOrders.length > 0 ? ( // Check if userOrders is not empty
                                                <div className={styles.ordersList}>
                                                    {/* The sorting and grouping logic for userOrders is handled in fetchUserOrders */}
                                                    {/* Loop through each order */}
                                                    {userOrders.map((order, index) => (
                                                        <div key={`${order.timestamp}-${index}`} className={styles.orderCard}>
                                                            <p><strong>Order Time:</strong> {new Date(order.timestamp).toLocaleString()}</p>
                                                            <p><strong>Delivery Address:</strong> {order.address || 'N/A'}</p>
                                                            <p><strong>Order Details:</strong> {order.orderDetails}</p>
                                                            <p className={styles.totalPrice}>Total: ₹{parseFloat(order.totalAmount).toFixed(2)}</p>
                                                            <p><strong>Ordered Via:</strong> {order.orderType}</p>
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
    lemons = lemons.map(lemon => ({
        ...lemon,
        'Price Per Kg': parseFloat(lemon['Price Per Kg'] || lemon.Price || 0)
    }));


    return {
        props: {
            lemons,
        },
        revalidate: 30, // Re-generate page every 30 seconds
    };
}
