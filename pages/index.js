// pages/index.js
import { useState, useEffect, Fragment, useContext } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { FaWhatsapp, FaStar } from 'react-icons/fa';
import { IoCloseCircleOutline, IoMenuOutline } from 'react-icons/io5'; // Added IoMenuOutline for hamburger
import styles from '../styles/styles.module.css'; // Assuming styles.module.css exists and is used
import { AuthContext } from './_app'; // Import AuthContext

// SheetDB URLs
const LEMONS_API_URL = "https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Lemons";
const ORDERS_API_URL = "https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=orders";
const SIGNUP_API_URL = "https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=signup";
const ADDRESSES_API_URL = "https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Addresses";
const FEEDBACK_API_URL = "https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Feedback";

// --- Static Customer Reviews Data ---
const customerReviews = [
    { id: 1, name: "Anil Kumar S.", rating: 5, text: "Absolutely fresh and juicy lemons! Delivered quickly. Will definitely order again." },
    { id: 2, name: "Priya Sharma", rating: 4, text: "Good quality lemons, perfect for my culinary needs. Packaging was excellent. A bit pricey but worth it." },
    { id: 3, name: "Rajesh V.", rating: 5, text: "Impressed with the consistent quality. The bulk discount is a great deal. Highly recommend 3 Lemons Traders!" },
    { id: 4, name: "Meena Devi", rating: 5, text: "Excellent customer service and prompt delivery. The lemons were exactly as described - fresh and fragrant." },
    { id: 5, name: "Suresh Reddy", rating: 4, text: "Reliable service. The lemons were fresh, but a couple were slightly smaller than expected. Overall good experience." },
];

// --- getStaticProps: Fetches Lemon Product Data ---
export async function getStaticProps() {
    try {
        const res = await fetch(LEMONS_API_URL);
        if (!res.ok) {
            throw new Error(`Failed to fetch lemons: ${res.status} ${res.statusText}`);
        }
        const allLemons = await res.json();

        if (!Array.isArray(allLemons)) {
            console.error("Fetched lemons data is not an array:", allLemons);
            return { props: { lemons: [] }, revalidate: 3600 };
        }

        // Filter to include only the first three qualities
        const lemons = allLemons.slice(0, 3);

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
    const { isLoggedIn, currentUser, login, logout, setCurrentUser } = useContext(AuthContext);

    // Page view state: 'home', 'login', 'signup'
    const [currentPage, setCurrentPage] = useState('home');

    // Order Form States
    const [orders, setOrders] = useState([{ grade: '', quantity: '' }]);
    const [form, setForm] = useState({ name: '', delivery: '', contact: '' });
    const [total, setTotal] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionMessage, setSubmissionMessage] = useState('');

    // Modals
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [confirmedOrderDetails, setConfirmedOrderDetails] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false); // For login/signup pop-up
    const [authModalType, setAuthModalType] = useState('login'); // 'login' or 'signup'
    const [authMessage, setAuthMessage] = useState(''); // Messages for auth modal

    // Account Sidebar States
    const [showAccountSidebar, setShowAccountSidebar] = useState(false);
    const [activeSidebarTab, setActiveSidebarTab] = useState('account'); // 'account', 'addresses', 'feedback'
    const [userAddresses, setUserAddresses] = useState([]);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({ street: '', city: '', state: '', pincode: '' });
    const [isSavingAccount, setIsSavingAccount] = useState(false);
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState(''); // For dropdown in order form

    // Feedback State
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);


    // --- Effects ---

    // Update order form 'name' and 'contact' if user is logged in
    useEffect(() => {
        if (isLoggedIn && currentUser) {
            setForm(prevForm => ({
                ...prevForm,
                name: currentUser.name || '',
                contact: currentUser.phone || ''
            }));
            // If user has saved addresses, set the first one as default
            if (userAddresses.length > 0 && selectedDeliveryAddress === '') { // Only set default if nothing selected yet
                setSelectedDeliveryAddress(userAddresses[0].fullAddress);
                setForm(prevForm => ({ ...prevForm, delivery: userAddresses[0].fullAddress }));
            } else if (userAddresses.length === 0) { // If no addresses, ensure delivery is empty
                setSelectedDeliveryAddress('');
                setForm(prevForm => ({ ...prevForm, delivery: '' }));
            }
        } else {
            // Clear form on logout
            setForm({ name: '', delivery: '', contact: '' });
            setSelectedDeliveryAddress('');
            setOrders([{ grade: '', quantity: '' }]); // Reset order varieties
        }
    }, [isLoggedIn, currentUser, userAddresses]); // Depend on userAddresses too

    // Calculate total whenever orders or lemons data changes
    useEffect(() => {
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
    }, [orders, lemons]);

    // Fetch user addresses when sidebar opens or user logs in/out
    useEffect(() => {
        const fetchAddresses = async () => {
            if (!isLoggedIn || !currentUser?.phone) {
                setUserAddresses([]);
                return;
            }
            try {
                // Fetch addresses associated with the current user's phone number
                const res = await fetch(`${ADDRESSES_API_URL}?phone=${currentUser.phone}`);
                if (!res.ok) {
                    // If the sheetdb response is 404 (no data found), it's not an error, just no addresses.
                    // Check for specific SheetDB 'not found' message if available, otherwise assume no addresses.
                    const errorText = await res.text();
                    if (res.status === 404 && errorText.includes("Not Found")) {
                        setUserAddresses([]); // No addresses found
                        return;
                    }
                    throw new Error(`Failed to fetch addresses: ${res.status} ${res.statusText}`);
                }
                const data = await res.json();
                // SheetDB returns an empty array if no data found for query, or an array of objects.
                if (Array.isArray(data)) {
                    // Filter out any rows that might somehow not belong or are incomplete, though unlikely with SheetDB queries.
                    const validAddresses = data.filter(addr => addr.street && addr.city && addr.state && addr.pincode);
                    const formattedAddresses = validAddresses.map((addr, index) => ({
                        id: addr.id || `${addr.phone}-${index}`, // Use SheetDB's internal ID if available, otherwise generate
                        ...addr,
                        fullAddress: `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}`
                    }));
                    setUserAddresses(formattedAddresses);
                    // If a saved address is still selected and not in the list, clear it.
                    if (selectedDeliveryAddress && !formattedAddresses.some(addr => addr.fullAddress === selectedDeliveryAddress)) {
                        setSelectedDeliveryAddress('');
                        setForm(prevForm => ({ ...prevForm, delivery: '' }));
                    } else if (formattedAddresses.length > 0 && selectedDeliveryAddress === '') { // If there are addresses but none selected, select the first
                        setSelectedDeliveryAddress(formattedAddresses[0].fullAddress);
                        setForm(prevForm => ({ ...prevForm, delivery: formattedAddresses[0].fullAddress }));
                    }
                } else {
                    console.warn("Fetched addresses data is not an array:", data);
                    setUserAddresses([]);
                }
            } catch (error) {
                console.error("Error fetching addresses:", error);
                setUserAddresses([]);
            }
        };
        fetchAddresses();
    }, [isLoggedIn, currentUser?.phone, selectedDeliveryAddress]); // Refetch when user logs in/out or phone changes or selectedDeliveryAddress changes

    // Clear feedback message after a delay
    useEffect(() => {
        if (feedbackMessage) {
            const timer = setTimeout(() => setFeedbackMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [feedbackMessage]);


    // --- General UI Functions ---

    const showFeedback = (message, type = 'info') => {
        setSubmissionMessage(message);
        // Clear message after a few seconds if it's not a modal
        if (type !== 'success') {
            const timer = setTimeout(() => setSubmissionMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    };

    const openAuthModal = (type) => {
        setAuthModalType(type);
        setAuthMessage(''); // Clear previous messages
        setShowAuthModal(true);
    };

    const closeAuthModal = () => {
        setShowAuthModal(false);
        setAuthMessage('');
    };

    const toggleAccountSidebar = () => {
        setShowAccountSidebar(prev => !prev);
        if (!showAccountSidebar) { // If opening, default to account tab
            setActiveSidebarTab('account');
        }
    };

    const handleSidebarTabClick = (tab) => {
        setActiveSidebarTab(tab);
    };

    // --- Authentication Logic ---

    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthMessage('');
        const name = e.target.name.value.trim();
        const phone = e.target.phone.value.trim();

        if (!name || !phone) {
            setAuthMessage('Please enter both name and mobile number.');
            return;
        }
        if (!/^\d{10}$/.test(phone)) {
            setAuthMessage('Please enter a valid 10-digit mobile number.');
            return;
        }

        try {
            // Fetch all users from signup sheet
            const res = await fetch(`${SIGNUP_API_URL}?phone=${phone}`); // Query by phone for efficiency
            if (!res.ok) throw new Error('Failed to fetch user data');
            const users = await res.json();

            const user = Array.isArray(users) ? users.find(u => u.name === name && u.phone === phone) : null;

            if (user) {
                login(user); // Set user in context
                setAuthMessage(`Welcome back, ${user.name}! 😊`);
                setTimeout(() => {
                    closeAuthModal();
                    setCurrentPage('home'); // Redirect to home/order section
                }, 1500);
            } else {
                setAuthMessage("You're not registered yet. Please sign up to continue.");
                setAuthModalType('signup'); // Suggest signup
            }
        } catch (error) {
            console.error("Login error:", error);
            setAuthMessage('Login failed. Please try again later.');
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setAuthMessage('');
        const name = e.target.name.value.trim();
        const phone = e.target.phone.value.trim();
        const address = e.target.address.value.trim(); // This is the main address from signup
        const pincode = e.target.pincode.value.trim();

        if (!name || !phone || !address || !pincode) {
            setAuthMessage('Please fill in all fields.');
            return;
        }
        if (!/^\d{10}$/.test(phone)) {
            setAuthMessage('Please enter a valid 10-digit mobile number.');
            return;
        }
        if (!/^\d{6}$/.test(pincode)) {
            setAuthMessage('Please enter a valid 6-digit pincode.');
            return;
        }

        try {
            // Check if user already exists
            const checkRes = await fetch(`${SIGNUP_API_URL}?phone=${phone}`);
            const existingUsers = await checkRes.json();
            if (Array.isArray(existingUsers) && existingUsers.length > 0) {
                setAuthMessage('This mobile number is already registered. Please log in.');
                setAuthModalType('login'); // Suggest login
                return;
            }

            const res = await fetch(SIGNUP_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: [{ name, phone, address, pincode }] }),
            });

            if (res.ok) {
                const newUser = { name, phone, address, pincode };
                login(newUser); // Log user in immediately

                // Also add the primary signup address to the Addresses sheet
                await fetch(ADDRESSES_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: [{
                        phone: phone,
                        street: address, // Using the main address field as street for initial signup
                        city: 'N/A', // You might want to ask for city/state/pincode separately on signup
                        state: 'N/A',
                        pincode: pincode
                    }]}),
                });

                setAuthMessage(`🎉 Thank you, ${name}, for signing up! Let's start ordering! 😊`);
                setTimeout(() => {
                    closeAuthModal();
                    setCurrentPage('home'); // Redirect to home/order section
                }, 1500);
            } else {
                const errorData = await res.json();
                console.error('Signup error:', res.status, errorData);
                setAuthMessage(`Signup failed: ${errorData.message || 'Server error'}. Please try again.`);
            }
        } catch (error) {
            console.error("Signup error:", error);
            setAuthMessage('Signup failed. Please check your internet connection and try again.');
        }
    };

    const handleLogout = () => {
        logout();
        showFeedback('You have been logged out.', 'info');
        setCurrentPage('home'); // Go back to home page, which will show login prompt for order
        setShowAccountSidebar(false); // Close sidebar
    };

    // --- Order Form Logic ---

    const handleOrderChange = (index, field, value) => {
        const updated = [...orders];

        if (field === 'grade') {
            // Functionality 1: Prevent duplicate varieties in the same order
            const selectedGrades = updated.map((order, i) => (i === index ? value : order.grade));
            const hasDuplicate = selectedGrades.filter(g => g !== '').some((g, i, arr) => arr.indexOf(g) !== i);

            if (hasDuplicate) {
                showFeedback(`The variety "${value}" is already selected in another row. Please choose a unique variety.`, 'error');
                return; // Prevent setting the duplicate grade
            }
        }

        if (field === 'quantity') {
            value = value === '' ? '' : String(Math.max(1, parseInt(value) || 1));
        }
        updated[index][field] = value;
        setOrders(updated);
    };

    const handleAddVariety = () => {
        setOrders([...orders, { grade: '', quantity: '' }]);
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        setSubmissionMessage('');

        // Gated Access Check
        if (!isLoggedIn) {
            openAuthModal('login');
            setAuthMessage('Please log in or sign up to place an order.');
            return;
        }

        // Form Validation
        if (!form.name.trim() || !form.delivery.trim() || !form.contact.trim()) {
            showFeedback('Please provide your Name, Delivery Address, and Contact Number.', 'error');
            return;
        }
        if (!/^\d{10}$/.test(form.contact)) {
            showFeedback('Please enter a valid 10-digit contact number.', 'error');
            return;
        }

        const validOrders = orders.filter(order => order.grade && order.quantity && parseInt(order.quantity) > 0);
        if (validOrders.length === 0) {
            showFeedback('Please add at least one lemon variety with a valid quantity (must be 1 or more).', 'error');
            return;
        }
        const hasInvalidQuantity = orders.some(order => {
            return (order.grade && (order.quantity === '' || isNaN(parseInt(order.quantity)) || parseInt(order.quantity) <= 0));
        });
        if (hasInvalidQuantity) {
            showFeedback('Please ensure all selected varieties have a valid quantity (1 or more).', 'error');
            return;
        }

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

    const confirmAndSubmitOrder = async () => {
        setShowConfirmModal(false);
        setIsSubmitting(true);
        setSubmissionMessage('');

        if (!confirmedOrderDetails) {
            setSubmissionMessage('Error: No order details to confirm.');
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
            const response = await fetch(ORDERS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: rows }),
            });

            if (response.ok) {
                setShowSuccessModal(true);
                // Reset form and orders on main page
                setOrders([{ grade: '', quantity: '' }]);
                setForm(prevForm => ({
                    ...prevForm,
                    delivery: userAddresses.length > 0 ? userAddresses[0].fullAddress : '', // Reset delivery to default or empty
                }));
                setSelectedDeliveryAddress(userAddresses.length > 0 ? userAddresses[0].fullAddress : '');
                setTotal(0);
                setConfirmedOrderDetails(null);
            } else {
                const errorData = await response.json();
                console.error('SheetDB submission error:', response.status, errorData);
                showFeedback(`Failed to submit order: ${errorData.message || 'Server error'}. Please try again.`, 'error');
            }
        } catch (err) {
            console.error('Network or submission error:', err);
            showFeedback('Failed to submit order. Please check your internet connection and try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeSuccessModal = () => {
        setShowSuccessModal(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelConfirmation = () => {
        setShowConfirmModal(false);
        setConfirmedOrderDetails(null);
    };

    const getWhatsappLink = () => {
        // This link should only be active if the user is logged in and form is valid
        const validOrders = orders.filter(order => order.grade && order.quantity && parseInt(order.quantity) > 0);
        if (!isLoggedIn || validOrders.length === 0 || !form.contact || !/^\d{10}$/.test(form.contact)) {
            return '#'; // Disable link
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

        const whatsappContact = `918500130926`; // Your WhatsApp number
        const whatsappMessage = `Hi, I'm ${form.name}.\n\nI want to order: ${orderDetails}.\n\nDelivery Address: ${form.delivery}.\nContact: ${form.contact}\n\nTotal estimated price: ₹${total.toFixed(2)}\n\nPlease confirm availability and final amount.`;

        return `https://wa.me/${whatsappContact}?text=${encodeURIComponent(whatsappMessage)}`;
    };

    // --- Account Sidebar Logic ---
    const handleAccountDetailChange = (e) => {
        const { name, value } = e.target;
        setCurrentUser(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveAccountDetails = async (e) => {
        e.preventDefault();
        setIsSavingAccount(true);
        setAuthMessage(''); // Clear auth message

        if (!currentUser || !currentUser.phone) {
            showFeedback('No user data to save.', 'error');
            setIsSavingAccount(false);
            return;
        }
        if (!currentUser.name.trim() || !currentUser.address.trim() || !currentUser.pincode.trim()) {
            showFeedback('Please fill all account details fields.', 'error');
            setIsSavingAccount(false);
            return;
        }
        if (!/^\d{6}$/.test(currentUser.pincode)) {
            showFeedback('Please enter a valid 6-digit pincode.', 'error');
            setIsSavingAccount(false);
            return;
        }

        try {
            // SheetDB PUT request to update user details by phone number
            const res = await fetch(`${SIGNUP_API_URL}/phone/${currentUser.phone}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: {
                    name: currentUser.name,
                    address: currentUser.address,
                    pincode: currentUser.pincode
                }}),
            });

            if (res.ok) {
                // Update localStorage via AuthContext's setCurrentUser
                // This is already done by handleAccountDetailChange, but ensure it's persisted
                // The AuthContext useEffect handles localStorage update
                showFeedback('Account details saved successfully!', 'success');
                // No need to close sidebar immediately, user might want to check addresses
            } else {
                const errorData = await res.json();
                console.error('Account update error:', res.status, errorData);
                showFeedback(`Failed to save account details: ${errorData.message || 'Server error'}`, 'error');
            }
        } catch (error) {
            console.error("Error saving account details:", error);
            showFeedback('Error saving account details. Please try again.', 'error');
        } finally {
            setIsSavingAccount(false);
        }
    };

    const handleNewAddressChange = (e) => {
        const { name, value } = e.target;
        setNewAddress(prev => ({ ...prev, [name]: value }));
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        setIsSavingAddress(true);
        setAuthMessage(''); // Clear auth message

        if (!currentUser?.phone) {
            showFeedback('Please log in to add addresses.', 'error');
            setIsSavingAddress(false);
            return;
        }
        if (userAddresses.length >= 5) {
            showFeedback('You can save a maximum of 5 addresses.', 'error');
            setIsSavingAddress(false);
            return;
        }
        if (!newAddress.street.trim() || !newAddress.city.trim() || !newAddress.state.trim() || !newAddress.pincode.trim()) {
            showFeedback('Please fill all address fields.', 'error');
            setIsSavingAddress(false);
            return;
        }
        if (!/^\d{6}$/.test(newAddress.pincode)) {
            showFeedback('Please enter a valid 6-digit pincode for the address.', 'error');
            setIsSavingAddress(false);
            return;
        }

        try {
            const res = await fetch(ADDRESSES_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: [{
                    phone: currentUser.phone, // Link address to user's phone
                    street: newAddress.street,
                    city: newAddress.city,
                    state: newAddress.state,
                    pincode: newAddress.pincode
                }] }),
            });

            if (res.ok) {
                // SheetDB post returns a success message, not the new row.
                // We need to refetch to get the updated list, including the new item's ID.
                const updatedRes = await fetch(`${ADDRESSES_API_URL}?phone=${currentUser.phone}`);
                if (!updatedRes.ok) throw new Error('Failed to refetch addresses after adding.');
                const updatedData = await updatedRes.json();
                const formattedAddresses = updatedData.map((addr, index) => ({
                    id: addr.id || `${addr.phone}-${index}`, // Ensure id is set for deletion
                    ...addr,
                    fullAddress: `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}`
                }));
                setUserAddresses(formattedAddresses || []);
                // After adding, set the newly added address as the selected one in the order form
                if (formattedAddresses.length > 0) {
                    setSelectedDeliveryAddress(formattedAddresses[formattedAddresses.length - 1].fullAddress);
                    setForm(prevForm => ({ ...prevForm, delivery: formattedAddresses[formattedAddresses.length - 1].fullAddress }));
                }


                setNewAddress({ street: '', city: '', state: '', pincode: '' });
                setIsAddingAddress(false);
                showFeedback('Address added successfully!', 'success');
            } else {
                const errorData = await res.json();
                console.error('Add address error:', res.status, errorData);
                showFeedback(`Failed to add address: ${errorData.message || 'Server error'}`, 'error');
            }
        } catch (error) {
            console.error("Error adding address:", error);
            showFeedback('Error adding address. Please try again.', 'error');
        } finally {
            setIsSavingAddress(false);
        }
    };

    const handleDeleteAddress = async (idToDelete) => {
        if (!currentUser?.phone) {
            showFeedback('Please log in to delete addresses.', 'error');
            return;
        }

        if (window.confirm('Are you sure you want to delete this address?')) {
            try {
                // SheetDB's DELETE endpoint works directly on a column value.
                // Assuming `id` is a unique identifier you've added to your SheetDB 'Addresses' sheet
                // OR if it's the auto-generated SheetDB row ID (which is more complex to get reliably for client-side delete).
                // For a robust solution, it's best to have a unique ID column in your sheet (e.g., 'AddressID').
                // If you have `id` as a column in your SheetDB:
                const res = await fetch(`${ADDRESSES_API_URL}/id/${idToDelete}`, {
                    method: 'DELETE',
                });

                if (res.ok) {
                    // Update the UI immediately by filtering the state
                    setUserAddresses(prev => prev.filter(addr => addr.id !== idToDelete));
                    showFeedback('Address deleted successfully!', 'success');
                    // If the deleted address was selected for delivery, clear the selection
                    if (selectedDeliveryAddress === userAddresses.find(addr => addr.id === idToDelete)?.fullAddress) {
                        setSelectedDeliveryAddress('');
                        setForm(prevForm => ({ ...prevForm, delivery: '' }));
                    }
                } else {
                    const errorData = await res.json();
                    console.error('Delete address error:', res.status, errorData);
                    showFeedback(`Failed to delete address: ${errorData.message || 'Server error'}`, 'error');
                }
            } catch (error) {
                console.error("Error deleting address:", error);
                showFeedback('Failed to delete address. Please try again.', 'error');
            }
        }
    };

    const handleDeliveryAddressChange = (e) => {
        const selectedValue = e.target.value;
        setSelectedDeliveryAddress(selectedValue);
        if (selectedValue === 'new') {
            setForm(prevForm => ({ ...prevForm, delivery: '' })); // Clear delivery for new input
        } else {
            setForm(prevForm => ({ ...prevForm, delivery: selectedValue }));
        }
    };

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        setFeedbackMessage('');
        setIsSubmittingFeedback(true);

        if (!currentUser?.phone) {
            setFeedbackMessage('Please log in to submit feedback.');
            setIsSubmittingFeedback(false);
            return;
        }

        if (!feedbackText.trim()) {
            setFeedbackMessage('Feedback cannot be empty.');
            setIsSubmittingFeedback(false);
            return;
        }

        try {
            const res = await fetch(FEEDBACK_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: [{
                    name: currentUser.name,
                    phone: currentUser.phone,
                    feedback: feedbackText.trim(),
                    'Timestamp': new Date().toLocaleString()
                }]}),
            });

            if (res.ok) {
                setFeedbackMessage('Thank you for your feedback! It has been submitted successfully.');
                setFeedbackText('');
            } else {
                const errorData = await res.json();
                console.error('Feedback submission error:', res.status, errorData);
                setFeedbackMessage(`Failed to submit feedback: ${errorData.message || 'Server error'}.`);
            }
        } catch (error) {
            console.error("Error submitting feedback:", error);
            setFeedbackMessage('Error submitting feedback. Please try again.');
        } finally {
            setIsSubmittingFeedback(false);
        }
    };


    return (
        <div className={styles.page}>
            <Head>
                <title>3 Lemons Traders - Fresh Lemons</title>
                <meta name="description" content="Order fresh lemons directly from 3 Lemons Traders. Wholesale and retail available." />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            {/* Header */}
            <header className={styles.header}>
                <h1 className={styles.headerTitle}>3 Lemons Traders</h1>
                <div className={styles.headerActions}>
                    {isLoggedIn && (
                        <span className={styles.loggedInUser}>
                            Hello, {currentUser?.name?.split(' ')[0]}!
                        </span>
                    )}
                    <button onClick={toggleAccountSidebar} className={styles.hamburgerIcon}>
                        <IoMenuOutline />
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className={styles.hero}>
                <Image
                    src="/hero-lemons.jpg" // Ensure this image is in your public folder
                    alt="Fresh Lemons"
                    layout="fill"
                    objectFit="cover"
                    priority={true}
                    className={styles.heroImage}
                />
                <div className={styles.heroOverlay}>
                    <h2 className={styles.heroTitle}>Your Source for Fresh Lemons</h2>
                    <p className={styles.heroSubtitle}>High-quality lemons, delivered straight to your door!</p>
                    <button onClick={() => window.location.href = '#order-form'} className={styles.heroButton}>
                        Order Now
                    </button>
                </div>
            </section>

            <main className={styles.container}>
                {/* Product Section */}
                <section className={styles.lemonsSection}>
                    <h2 className={styles.sectionTitle}>Our Lemon Varieties</h2>
                    {lemons.length === 0 ? (
                        <p className={styles.noDataMessage}>No lemon varieties available at the moment. Please check back later!</p>
                    ) : (
                        <div className={styles.lemonsGrid}>
                            {lemons.map((lemon) => (
                                <div key={lemon.Grade} className={styles.lemonCard}>
                                    <Image
                                        src={lemon.ImageURL || '/default-lemon.jpg'} // Fallback image
                                        alt={lemon.Grade}
                                        width={400}
                                        height={220}
                                        className={styles.cardImage}
                                    />
                                    <div className={styles.cardContent}>
                                        <h3 className={styles.cardTitle}>{lemon.Grade}</h3>
                                        <p className={styles.cardDescription}>{lemon.Description}</p>
                                        <p className={styles.cardPrice}>Price: ₹{parseFloat(lemon['Price Per Kg']).toFixed(2)} / Kg</p>
                                        <p className={styles.cardPrice}>(Bulk Discount: 10% off for &gt;50 Kg)</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Customer Reviews Section */}
                <section className={styles.reviewsSection}>
                    <h2 className={styles.sectionTitle}>What Our Customers Say</h2>
                    <div className={styles.reviewsGrid}>
                        {customerReviews.map(review => (
                            <div key={review.id} className={styles.reviewCard}>
                                <div className={styles.reviewerRating}>
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} className={i < review.rating ? styles.filledStar : styles.emptyStar} />
                                    ))}
                                </div>
                                <p className={styles.reviewText}>"{review.text}"</p>
                                <p className={styles.reviewerName}>- {review.name}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Order Form Section */}
                <section id="order-form">
                    <h2 className={styles.sectionTitle}>Place Your Order</h2>

                    {!isLoggedIn && (
                        <div className={styles.loginPrompt}>
                            <p>Please **log in** or **sign up** to place an order and manage your account details.</p>
                            <button onClick={() => openAuthModal('login')}>Login / Signup</button>
                        </div>
                    )}

                    <form onSubmit={handleSubmitOrder} className={styles.form}>
                        {submissionMessage && (
                            <p className={`${styles.statusMessage} ${submissionMessage.includes('successfully') ? styles.successMessage : styles.errorMessage}`}>
                                {submissionMessage}
                            </p>
                        )}

                        <div className={styles.formGroup}>
                            <label htmlFor="name" className={styles.label}>Your Name:</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className={styles.input}
                                required
                                disabled={isLoggedIn} // Disable if logged in, as it's pre-filled
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="contact" className={styles.label}>Your Mobile Number:</label>
                            <input
                                type="tel"
                                id="contact"
                                name="contact"
                                value={form.contact}
                                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                                className={styles.input}
                                pattern="\d{10}"
                                title="Please enter a 10-digit mobile number"
                                required
                                disabled={isLoggedIn} // Disable if logged in, as it's pre-filled
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="delivery" className={styles.label}>Delivery Address:</label>
                            {isLoggedIn && userAddresses.length > 0 ? (
                                <Fragment>
                                    <select
                                        id="delivery"
                                        name="delivery"
                                        value={selectedDeliveryAddress}
                                        onChange={handleDeliveryAddressChange}
                                        className={styles.select}
                                        required
                                    >
                                        <option value="">Select a saved address or enter new</option>
                                        {userAddresses.map((addr) => (
                                            <option key={addr.id} value={addr.fullAddress}>
                                                {addr.fullAddress}
                                            </option>
                                        ))}
                                        <option value="new">Add New Address...</option>
                                    </select>
                                    {selectedDeliveryAddress === 'new' && (
                                        <textarea
                                            value={form.delivery}
                                            onChange={(e) => setForm({ ...form, delivery: e.target.value })}
                                            className={styles.textarea}
                                            placeholder="Enter your full new delivery address (Street, City, State, Pincode)"
                                            rows="3"
                                            required
                                            aria-label="New delivery address"
                                        ></textarea>
                                    )}
                                </Fragment>
                            ) : (
                                <textarea
                                    id="delivery"
                                    name="delivery"
                                    value={form.delivery}
                                    onChange={(e) => setForm({ ...form, delivery: e.target.value })}
                                    className={styles.textarea}
                                    placeholder="Enter your full delivery address (Street, City, State, Pincode)"
                                    rows="3"
                                    required
                                    disabled={!isLoggedIn} // Only allow input if not logged in or no addresses
                                ></textarea>
                            )}
                        </div>

                        <h3 className={styles.sectionTitle} style={{ fontSize: '1.5em', marginBottom: '20px' }}>Your Order:</h3>
                        {orders.map((order, index) => (
                            <div key={index} className={styles.orderVarietyGroup}>
                                <div className={styles.formGroup}>
                                    <label htmlFor={`grade-${index}`} className={styles.label}>Lemon Variety:</label>
                                    <select
                                        id={`grade-${index}`}
                                        name="grade"
                                        value={order.grade}
                                        onChange={(e) => handleOrderChange(index, 'grade', e.target.value)}
                                        className={styles.select}
                                        required
                                        disabled={!isLoggedIn}
                                    >
                                        <option value="">Select a quality</option>
                                        {lemons.map((lemon) => (
                                            <option key={lemon.Grade} value={lemon.Grade} disabled={orders.some((o, i) => i !== index && o.grade === lemon.Grade)}>
                                                {lemon.Grade} (₹{parseFloat(lemon['Price Per Kg']).toFixed(2)}/Kg)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor={`quantity-${index}`} className={styles.label}>Quantity (Kg):</label>
                                    <input
                                        type="number"
                                        id={`quantity-${index}`}
                                        name="quantity"
                                        value={order.quantity}
                                        onChange={(e) => handleOrderChange(index, 'quantity', e.target.value)}
                                        className={styles.input}
                                        min="1"
                                        required
                                        disabled={!isLoggedIn || !order.grade} // Disable quantity if not logged in or no grade selected
                                    />
                                    {order.quantity > 50 && <span className={styles.discountNote}>10% Bulk Discount Applied!</span>}
                                </div>
                                {orders.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setOrders(orders.filter((_, i) => i !== index))}
                                        className={styles.removeVarietyButton} // Applied the new class
                                        disabled={!isLoggedIn}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={handleAddVariety}
                            className={styles.addVarietyButton} // Applied the new class
                            disabled={!isLoggedIn || orders.length >= lemons.length} // Limit adding varieties to available lemons
                        >
                            Add Another Variety
                        </button>

                        <p className={styles.orderSummary}>Total Estimated Price: ₹{total.toFixed(2)}</p>

                        <div className={styles.actions}>
                            <button
                                type="submit"
                                className={styles.button}
                                disabled={isSubmitting || !isLoggedIn || orders.every(o => !o.grade || !o.quantity)}
                            >
                                {isSubmitting ? 'Submitting...' : 'Place Order'}
                            </button>
                            <a
                                href={getWhatsappLink()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${styles.button} ${styles.whatsappButton}`}
                                disabled={!isLoggedIn || orders.every(o => !o.grade || !o.quantity) || !form.name || !form.contact || !form.delivery}
                                onClick={(e) => {
                                    if (!isLoggedIn || orders.every(o => !o.grade || !o.quantity) || !form.name || !form.contact || !form.delivery) {
                                        e.preventDefault();
                                        showFeedback('Please fill out all order details and select at least one variety to generate WhatsApp message.', 'error');
                                    }
                                }}
                            >
                                <FaWhatsapp className={styles.buttonIcon} /> Order via WhatsApp
                            </a>
                        </div>
                    </form>
                </section>
            </main>

            {/* Footer */}
            <footer className={styles.footer}>
                <p>&copy; {new Date().getFullYear()} 3 Lemons Traders. All rights reserved.</p>
                <p>Designed and Developed with ❤️ by <a href="https://linkedin.com/in/mohammed-samiul-haq" target="_blank" rel="noopener noreferrer">Mohammed Samiul Haq</a></p>
            </footer>

            {/* Modals */}
            {/* Authentication Modal (Login/Signup) */}
            <div className={`${styles.modalOverlay} ${showAuthModal ? styles.visible : ''}`}>
                <div className={styles.modalContent}>
                    <button onClick={closeAuthModal} className={styles.modalCloseButton}>
                        <IoCloseCircleOutline />
                    </button>
                    <h2 className={styles.modalTitle}>{authModalType === 'login' ? 'Login' : 'Sign Up'}</h2>
                    {authMessage && (
                        <p className={`${styles.statusMessage} ${authMessage.includes('Welcome') || authMessage.includes('Thank you') ? styles.successMessage : styles.errorMessage}`}>
                            {authMessage}
                        </p>
                    )}
                    {authModalType === 'login' ? (
                        <form onSubmit={handleLogin} className={styles.authForm}>
                            <div className={styles.formGroup}>
                                <label htmlFor="loginName" className={styles.label}>Name:</label>
                                <input type="text" id="loginName" name="name" className={styles.input} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="loginPhone" className={styles.label}>Mobile Number:</label>
                                <input type="tel" id="loginPhone" name="phone" className={styles.input} pattern="\d{10}" title="10-digit mobile number" required />
                            </div>
                            <div className={styles.modalButtons}>
                                <button type="submit" className={`${styles.button} ${styles.modalButton}`}>Login</button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleSignup} className={styles.authForm}>
                            <div className={styles.formGroup}>
                                <label htmlFor="signupName" className={styles.label}>Name:</label>
                                <input type="text" id="signupName" name="name" className={styles.input} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="signupPhone" className={styles.label}>Mobile Number:</label>
                                <input type="tel" id="signupPhone" name="phone" className={styles.input} pattern="\d{10}" title="10-digit mobile number" required />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="signupAddress" className={styles.label}>Primary Address:</label>
                                <textarea id="signupAddress" name="address" className={styles.textarea} rows="2" required></textarea>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="signupPincode" className={styles.label}>Pincode:</label>
                                <input type="text" id="signupPincode" name="pincode" className={styles.input} pattern="\d{6}" title="6-digit pincode" required />
                            </div>
                            <div className={styles.modalButtons}>
                                <button type="submit" className={`${styles.button} ${styles.modalButton}`}>Sign Up</button>
                            </div>
                        </form>
                    )}
                    <p className={styles.authSwitch}>
                        {authModalType === 'login' ? (
                            <Fragment>Don't have an account? <span onClick={() => setAuthModalType('signup')} className={styles.authLink}>Sign up here</span></Fragment>
                        ) : (
                            <Fragment>Already have an account? <span onClick={() => setAuthModalType('login')} className={styles.authLink}>Login here</span></Fragment>
                        )}
                    </p>
                </div>
            </div>

            {/* Order Confirmation Modal */}
            <div className={`${styles.modalOverlay} ${showConfirmModal ? styles.visible : ''}`}>
                <div className={styles.modalContent}>
                    <button onClick={cancelConfirmation} className={styles.modalCloseButton}>
                        <IoCloseCircleOutline />
                    </button>
                    <h2 className={styles.modalTitle}>Confirm Your Order</h2>
                    {confirmedOrderDetails && (
                        <ul className={styles.orderSummaryList}>
                            <li><strong>Name:</strong> {confirmedOrderDetails.personal.name}</li>
                            <li><strong>Contact:</strong> {confirmedOrderDetails.personal.contact}</li>
                            <li><strong>Delivery Address:</strong> {confirmedOrderDetails.personal.delivery}</li>
                            <li>
                                <strong>Items:</strong>
                                <ul>
                                    {confirmedOrderDetails.items.map((item, index) => (
                                        <li key={index}>
                                            {item.quantity} Kg of {item.grade} (₹{item.pricePerKg}/Kg) - Item Total: ₹{item.itemTotalPrice} {item.discount !== '0%' && `(${item.discount} discount)`}
                                        </li>
                                    ))}
                                </ul>
                            </li>
                            <li className={styles.totalPayable}><strong>Total Payable: ₹{confirmedOrderDetails.total}</strong></li>
                        </ul>
                    )}
                    <div className={styles.modalButtons}>
                        <button onClick={cancelConfirmation} className={`${styles.button} ${styles.modalButton} ${styles.modalButtonCancel}`}>
                            Cancel
                        </button>
                        <button onClick={confirmAndSubmitOrder} className={`${styles.button} ${styles.modalButton}`} disabled={isSubmitting}>
                            {isSubmitting ? 'Confirming...' : 'Confirm Order'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Order Success Modal */}
            <div className={`${styles.modalOverlay} ${showSuccessModal ? styles.visible : ''}`}>
                <div className={`${styles.modalContent} ${styles.successPage}`}>
                    <button onClick={closeSuccessModal} className={styles.modalCloseButton}>
                        <IoCloseCircleOutline />
                    </button>
                    <h2 className={styles.successTitle}>Order Placed Successfully!</h2>
                    <p className={styles.successMessageText}>
                        Thank you for your order! We have received it and will process it shortly.
                        You will receive a confirmation call or message on your provided contact number.
                    </p>
                    <button onClick={closeSuccessModal} className={`${styles.button} ${styles.modalButton}`}>
                        Continue Shopping
                    </button>
                </div>
            </div>

            {/* Account Sidebar */}
            <div className={`${styles.accountSidebarOverlay} ${showAccountSidebar ? styles.visible : ''}`} onClick={toggleAccountSidebar}>
                <aside className={styles.accountSidebar} onClick={(e) => e.stopPropagation()}> {/* Prevent closing when clicking inside */}
                    <div className={styles.sidebarHeader}>
                        <h2 className={styles.sidebarTitle}>My Account</h2>
                        <button onClick={toggleAccountSidebar} className={styles.sidebarCloseButton}>
                            <IoCloseCircleOutline />
                        </button>
                    </div>

                    <div className={styles.sidebarTabs}>
                        <button
                            className={`${styles.tabButton} ${activeSidebarTab === 'account' ? styles.active : ''}`}
                            onClick={() => handleSidebarTabClick('account')}
                        >
                            Account Details
                        </button>
                        <button
                            className={`${styles.tabButton} ${activeSidebarTab === 'addresses' ? styles.active : ''}`}
                            onClick={() => handleSidebarTabClick('addresses')}
                        >
                            Addresses
                        </button>
                        <button
                            className={`${styles.tabButton} ${activeSidebarTab === 'feedback' ? styles.active : ''}`}
                            onClick={() => handleSidebarTabClick('feedback')}
                        >
                            Feedback
                        </button>
                    </div>

                    <div className={styles.tabContent}>
                        {activeSidebarTab === 'account' && (
                            <Fragment>
                                <h3>Account Details</h3>
                                <form onSubmit={handleSaveAccountDetails} className={styles.accountDetailsForm}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="accountName" className={styles.label}>Name:</label>
                                        <input
                                            type="text"
                                            id="accountName"
                                            name="name"
                                            value={currentUser?.name || ''}
                                            onChange={handleAccountDetailChange}
                                            className={styles.input}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="accountPhone" className={styles.label}>Mobile Number:</label>
                                        <input
                                            type="tel"
                                            id="accountPhone"
                                            name="phone"
                                            value={currentUser?.phone || ''}
                                            className={styles.input}
                                            disabled // Phone number should generally not be editable here
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="accountAddress" className={styles.label}>Primary Address:</label>
                                        <textarea
                                            id="accountAddress"
                                            name="address"
                                            value={currentUser?.address || ''}
                                            onChange={handleAccountDetailChange}
                                            className={styles.textarea}
                                            rows="2"
                                            required
                                        ></textarea>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="accountPincode" className={styles.label}>Pincode:</label>
                                        <input
                                            type="text"
                                            id="accountPincode"
                                            name="pincode"
                                            value={currentUser?.pincode || ''}
                                            onChange={handleAccountDetailChange}
                                            className={styles.input}
                                            pattern="\d{6}"
                                            title="6-digit pincode"
                                            required
                                        />
                                    </div>
                                    {submissionMessage && activeSidebarTab === 'account' && (
                                        <p className={`${styles.statusMessage} ${submissionMessage.includes('successfully') ? styles.successMessage : styles.errorMessage}`}>
                                            {submissionMessage}
                                        </p>
                                    )}
                                    <div className={styles.formButtons}>
                                        <button type="submit" className={`${styles.button} ${styles.saveButton}`} disabled={isSavingAccount}>
                                            {isSavingAccount ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button type="button" onClick={handleLogout} className={`${styles.button} ${styles.logoutButton}`}>
                                            Logout
                                        </button>
                                    </div>
                                </form>
                            </Fragment>
                        )}

                        {activeSidebarTab === 'addresses' && (
                            <Fragment>
                                <h3>My Addresses</h3>
                                {userAddresses.length === 0 && !isAddingAddress && (
                                    <p className={styles.noDataMessage}>No saved addresses found. Add one below!</p>
                                )}
                                <ul className={styles.addressList}>
                                    {userAddresses.map((addr) => (
                                        <li key={addr.id} className={styles.addressItem}>
                                            <p>{addr.fullAddress}</p>
                                            <div className={styles.addressActions}>
                                                <button onClick={() => handleDeleteAddress(addr.id)} className={styles.deleteAddressButton}>
                                                    Delete
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                {!isAddingAddress ? (
                                    userAddresses.length < 5 && (
                                        <button onClick={() => setIsAddingAddress(true)} className={`${styles.button} ${styles.addAddressButton}`}>
                                            Add New Address
                                        </button>
                                    )
                                ) : (
                                    <form onSubmit={handleAddAddress} className={styles.addressForm}>
                                        <h4>Add New Address</h4>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="newStreet" className={styles.label}>Street/Building:</label>
                                            <input type="text" id="newStreet" name="street" value={newAddress.street} onChange={handleNewAddressChange} className={styles.input} required />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="newCity" className={styles.label}>City:</label>
                                            <input type="text" id="newCity" name="city" value={newAddress.city} onChange={handleNewAddressChange} className={styles.input} required />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="newState" className={styles.label}>State:</label>
                                            <input type="text" id="newState" name="state" value={newAddress.state} onChange={handleNewAddressChange} className={styles.input} required />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="newPincode" className={styles.label}>Pincode:</label>
                                            <input type="text" id="newPincode" name="pincode" value={newAddress.pincode} onChange={handleNewAddressChange} className={styles.input} pattern="\d{6}" title="6-digit pincode" required />
                                        </div>
                                        {feedbackMessage && activeSidebarTab === 'addresses' && (
                                            <p className={`${styles.statusMessage} ${feedbackMessage.includes('successfully') ? styles.successMessage : styles.errorMessage}`}>
                                                {feedbackMessage}
                                            </p>
                                        )}
                                        <div className={styles.formButtons}>
                                            <button type="button" onClick={() => setIsAddingAddress(false)} className={`${styles.button} ${styles.modalButtonCancel}`}>
                                                Cancel
                                            </button>
                                            <button type="submit" className={`${styles.button} ${styles.saveButton}`} disabled={isSavingAddress}>
                                                {isSavingAddress ? 'Adding...' : 'Save Address'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                                {userAddresses.length >= 5 && !isAddingAddress && (
                                    <p className={styles.limitMessage}>You have reached the maximum limit of 5 saved addresses.</p>
                                )}
                            </Fragment>
                        )}

                        {activeSidebarTab === 'feedback' && (
                            <Fragment>
                                <h3>Submit Feedback</h3>
                                <form onSubmit={handleSubmitFeedback} className={styles.authForm}> {/* Reusing authForm styles for spacing */}
                                    <div className={styles.formGroup}>
                                        <label htmlFor="feedbackText" className={styles.label}>Your Feedback:</label>
                                        <textarea
                                            id="feedbackText"
                                            value={feedbackText}
                                            onChange={(e) => setFeedbackText(e.target.value)}
                                            className={styles.textarea}
                                            rows="5"
                                            placeholder="Tell us what you think..."
                                            required
                                        ></textarea>
                                    </div>
                                    {feedbackMessage && (
                                        <p className={`${styles.statusMessage} ${feedbackMessage.includes('successfully') ? styles.successMessage : styles.errorMessage}`}>
                                            {feedbackMessage}
                                        </p>
                                    )}
                                    <div className={styles.formButtons}>
                                        <button
                                            type="submit"
                                            className={`${styles.button} ${styles.saveButton}`}
                                            disabled={isSubmittingFeedback}
                                        >
                                            {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                                        </button>
                                    </div>
                                </form>
                            </Fragment>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
