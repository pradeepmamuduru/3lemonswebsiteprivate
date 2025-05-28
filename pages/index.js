// pages/index.js
import { useState, useEffect, Fragment, useContext } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { FaWhatsapp, FaStar } from 'react-icons/fa';
import { IoCloseCircleOutline } from 'react-icons/io5';
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
            } else if (userAddresses.length > 0 && selectedDeliveryAddress === '') {
                // If there are addresses but none selected, select the first
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
  }, [isLoggedIn, currentUser?.phone]); // Refetch when user logs in/out or phone changes

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

  // --- Feedback Logic ---
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackMessage('');
    setIsSubmittingFeedback(true);

    if (!isLoggedIn || !currentUser?.name || !currentUser?.phone) {
        setFeedbackMessage('Please log in to submit feedback.');
        setIsSubmittingFeedback(false);
        return;
    }

    if (!feedbackText.trim()) {
        setFeedbackMessage('Please enter your feedback before submitting.');
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
                // Assuming 'address' from signup sheet can be used as a general address
                address: currentUser.address || 'N/A',
                feedback: feedbackText.trim(),
                'Submission Date': new Date().toLocaleString(),
            }]}),
        });

        if (res.ok) {
            setFeedbackMessage('Thank you for your valuable feedback! 😊');
            setFeedbackText(''); // Clear feedback input
        } else {
            const errorData = await res.json();
            console.error('Feedback submission error:', res.status, errorData);
            setFeedbackMessage(`Failed to submit feedback: ${errorData.message || 'Server error'}. Please try again.`);
        }
    } catch (error) {
        console.error("Error submitting feedback:", error);
        setFeedbackMessage('Error submitting feedback. Please check your internet connection and try again.');
    } finally {
        setIsSubmittingFeedback(false);
    }
  };


  // --- Render Logic ---
  const renderAuthModal = () => (
    <div className={`${styles.modalOverlay} ${showAuthModal ? styles.visible : ''}`} onClick={closeAuthModal}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalCloseButton} onClick={closeAuthModal}>
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
              <label className={styles.label} htmlFor="login-name">Name</label>
              <input id="login-name" name="name" className={styles.input} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="login-phone">Mobile Number</label>
              <input id="login-phone" name="phone" type="tel" className={styles.input} maxLength={10} pattern="[0-9]{10}" title="Please enter a 10-digit mobile number" required />
            </div>
            <button type="submit" className={styles.button}>Login</button>
            <p className={styles.authSwitch}>
              Not registered? <span onClick={() => setAuthModalType('signup')} className={styles.authLink}>Sign up</span>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignup} className={styles.authForm}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="signup-name">Name</label>
              <input id="signup-name" name="name" className={styles.input} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="signup-phone">Mobile Number</label>
              <input id="signup-phone" name="phone" type="tel" className={styles.input} maxLength={10} pattern="[0-9]{10}" title="Please enter a 10-digit mobile number" required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="signup-address">Address</label>
              <input id="signup-address" name="address" className={styles.input} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="signup-pincode">Pincode</label>
              <input id="signup-pincode" name="pincode" type="text" className={styles.input} maxLength={6} pattern="[0-9]{6}" title="Please enter a 6-digit pincode" required />
            </div>
            <button type="submit" className={styles.button}>Sign Up</button>
            <p className={styles.authSwitch}>
              Already have an account? <span onClick={() => setAuthModalType('login')} className={styles.authLink}>Login</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );

  const renderAccountSidebar = () => (
    <div className={`${styles.accountSidebarOverlay} ${showAccountSidebar ? styles.visible : ''}`} onClick={toggleAccountSidebar}>
      <div className={styles.accountSidebar} onClick={(e) => e.stopPropagation()}>
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
            My Addresses
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
            <div>
              <h3>Personal Information</h3>
              {currentUser ? (
                <form onSubmit={handleSaveAccountDetails} className={styles.accountDetailsForm}>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="account-name">Name</label>
                    <input
                      type="text"
                      id="account-name"
                      name="name"
                      className={styles.input}
                      value={currentUser.name || ''}
                      onChange={handleAccountDetailChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="account-phone">Mobile Number</label>
                    <input
                      type="tel"
                      id="account-phone"
                      name="phone"
                      className={styles.input}
                      value={currentUser.phone || ''}
                      disabled // Phone number is typically immutable for login ID
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="account-address">Address</label>
                    <input
                      type="text"
                      id="account-address"
                      name="address"
                      className={styles.input}
                      value={currentUser.address || ''}
                      onChange={handleAccountDetailChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="account-pincode">Pincode</label>
                    <input
                      type="text"
                      id="account-pincode"
                      name="pincode"
                      className={styles.input}
                      value={currentUser.pincode || ''}
                      onChange={handleAccountDetailChange}
                      maxLength={6}
                      pattern="[0-9]{6}"
                      title="Please enter a 6-digit pincode"
                      required
                    />
                  </div>
                  <button type="submit" className={`${styles.button} ${styles.saveButton}`} disabled={isSavingAccount}>
                    {isSavingAccount ? <span className="spinner"></span> : 'Save Changes'}
                  </button>
                  <button type="button" onClick={handleLogout} className={`${styles.button} ${styles.logoutButton}`}>
                    Logout
                  </button>
                </form>
              ) : (
                <p>Please log in to view your account details.</p>
              )}
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
                    {userAddresses.map((address) => ( // Use address.id for key if available, otherwise index is fallback
                      <li key={address.id || `${address.phone}-${address.street}`} className={styles.addressItem}>
                        <strong>{address.street}</strong>
                        <p>{address.city}, {address.state} - {address.pincode}</p>
                        <div className={styles.addressActions}>
                          {/* SheetDB DELETE by column value 'id' is more robust if you set one up. */}
                          {/* Using phone+street as a makeshift identifier if id not present */}
                          <button onClick={() => handleDeleteAddress(address.id)} className={styles.deleteAddressButton}>Delete</button>
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
                    <label className={styles.label} htmlFor="new-street">Street</label>
                    <input type="text" id="new-street" name="street" className={styles.input} value={newAddress.street} onChange={handleNewAddressChange} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="new-city">City</label>
                    <input type="text" id="new-city" name="city" className={styles.input} value={newAddress.city} onChange={handleNewAddressChange} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="new-state">State</label>
                    <input type="text" id="new-state" name="state" className={styles.input} value={newAddress.state} onChange={handleNewAddressChange} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="new-pincode">Pincode</label>
                    <input type="text" id="new-pincode" name="pincode" className={styles.input} value={newAddress.pincode} onChange={handleNewAddressChange} maxLength={6} pattern="[0-9]{6}" title="Please enter a 6-digit pincode" required />
                  </div>
                  <div className={styles.formButtons}>
                    <button type="submit" className={styles.button} disabled={isSavingAddress || userAddresses.length >= 5}>
                      {isSavingAddress ? <span className="spinner"></span> : 'Save Address'}
                    </button>
                    <button type="button" onClick={() => setIsAddingAddress(false)} className={`${styles.button} ${styles.modalButtonCancel}`}>Cancel</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setIsAddingAddress(true)} className={`${styles.button} ${styles.addAddressButton}`} disabled={userAddresses.length >= 5}>
                  + Add New Address
                </button>
              )}
              {userAddresses.length >= 5 && <p className={styles.limitMessage}>You have reached the maximum of 5 saved addresses.</p>}
            </div>
          )}

          {activeSidebarTab === 'feedback' && (
            <div>
              <h3>Share Your Feedback</h3>
              {!isLoggedIn ? (
                  <p>Please log in to submit your feedback.</p>
              ) : (
                  <form onSubmit={handleFeedbackSubmit} className={styles.feedbackForm}>
                      <div className={styles.formGroup}>
                          <label className={styles.label} htmlFor="feedback-text">Your Feedback</label>
                          <textarea
                              id="feedback-text"
                              className={styles.textarea}
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                              placeholder="Tell us what you think..."
                              rows="5"
                              required
                          ></textarea>
                      </div>
                      <button type="submit" className={styles.button} disabled={isSubmittingFeedback}>
                          {isSubmittingFeedback ? <span className="spinner"></span> : 'Submit Feedback'}
                      </button>
                      {feedbackMessage && (
                          <p className={`${styles.statusMessage} ${feedbackMessage.includes('Thank you') ? styles.successMessage : styles.errorMessage}`}>
                              {feedbackMessage}
                          </p>
                      )}
                  </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );


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
      </Head>

      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>3 Lemons Traders</h1>
        <div className={styles.headerActions}>
          {isLoggedIn ? (
            <span className={styles.loggedInUser}>Hi, {currentUser?.name || 'User'}!</span>
          ) : (
            <button onClick={() => openAuthModal('login')} className={styles.loginButton}>
              Login
            </button>
          )}
          <button onClick={toggleAccountSidebar} className={styles.hamburgerIcon}>
            ☰
          </button>
        </div>
      </header>

      <main className={styles.container}>
        {/* --- Hero Section --- */}
        <section className={styles.hero}>
          <img
            src="/lemons-hero.jpg"
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
            {Array.isArray(lemons) && lemons.length > 0 ? (
              lemons.map((lemon, index) => (
                <div key={index} className={styles.lemonCard}>
                  {lemon['Image url'] && (
                    <Image
                      src={lemon['Image url']}
                      alt={lemon['Grade'] || 'Lemon'}
                      width={300}
                      height={200}
                      layout="responsive"
                      objectFit="cover"
                      loading="lazy"
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
              <p className={styles.noDataMessage}>
                Loading lemons or no lemon data available. Please check your internet connection or SheetDB setup.
              </p>
            )}
          </div>
        </section>

        {/* --- Order Form Section --- */}
        <section id="buy-now" className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Place Your Order</h2>
          {submissionMessage && (
            <p className={`${styles.statusMessage} ${submissionMessage.includes('successfully') ? styles.successMessage : styles.errorMessage}`}>
              {submissionMessage}
            </p>
          )}

          {!isLoggedIn && (
            <div className={styles.loginPrompt}>
                <p>Please <span className={styles.authLink} onClick={() => openAuthModal('login')}>Login</span> or <span className={styles.authLink} onClick={() => openAuthModal('signup')}>Sign Up</span> to place an order.</p>
                <button className={styles.button} onClick={() => openAuthModal('login')}>Login / Sign Up</button>
            </div>
          )}

          {isLoggedIn && (
            <form onSubmit={handleSubmitOrder} className={styles.form}>
              {/* Personal Details Inputs (pre-filled if logged in) */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="name">Your Name</label>
                <input
                  id="name"
                  className={styles.input}
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={isLoggedIn} // Disable if logged in
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
                  maxLength={10}
                  pattern="[0-9]{10}"
                  title="Please enter a 10-digit mobile number"
                  placeholder="e.g., 9876543210"
                  disabled={isLoggedIn} // Disable if logged in
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="delivery">Delivery Address</label>
                {userAddresses.length > 0 ? (
                    <select
                        id="delivery"
                        className={styles.select}
                        value={selectedDeliveryAddress}
                        onChange={handleDeliveryAddressChange}
                        required
                    >
                        <option value="">-- Select Address --</option>
                        {userAddresses.map((addr, idx) => (
                            <option key={addr.id || idx} value={addr.fullAddress}>{addr.fullAddress}</option>
                        ))}
                        <option value="new">-- Enter New Address --</option>
                    </select>
                ) : (
                    <input
                        id="delivery"
                        className={styles.input}
                        required
                        value={form.delivery}
                        onChange={(e) => setForm({ ...form, delivery: e.target.value })}
                        placeholder="Enter your delivery address"
                    />
                )}
                {selectedDeliveryAddress === 'new' && (
                    <input
                        type="text"
                        className={styles.input}
                        value={form.delivery}
                        onChange={(e) => setForm({ ...form, delivery: e.target.value })}
                        placeholder="Enter your new delivery address"
                        required
                        style={{ marginTop: '10px' }}
                    />
                )}
              </div>


              {/* Dynamic Order Varieties Inputs */}
              {orders.map((order, index) => (
                <Fragment key={index}>
                  <div className={styles.orderVarietyGroup}>
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
                          <option key={idx} value={lemon.Grade}>
                            {lemon.Grade} – ₹{parseFloat(lemon['Price Per Kg']).toFixed(2)}/kg
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label} htmlFor={`quantity-${index}`}>Quantity (kg)</label>
                      <input
                        id={`quantity-${index}`}
                        type="number"
                        min="1"
                        className={styles.input}
                        value={order.quantity}
                        onChange={(e) => handleOrderChange(index, 'quantity', e.target.value)}
                        placeholder="e.g., 10"
                        required
                      />
                      {parseInt(order.quantity) > 50 && (
                        <span className={styles.discountNote}> (10% bulk discount)</span>
                      )}
                    </div>
                  </div>
                  {orders.length > 1 && (
                      <button
                          type="button"
                          onClick={() => setOrders(orders.filter((_, i) => i !== index))}
                          className={styles.removeVarietyButtonSquare} {/* Changed class */}
                      >
                          &times;
                      </button>
                  )}
                </Fragment>
              ))}

              <button type="button" onClick={handleAddVariety} className={styles.addVarietyButtonSquare}> {/* Changed class */}
                ➕
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
                      <FaWhatsapp className={styles.buttonIcon} /> Place Order on WhatsApp
                  </a>
              </div>
            </form>
          )}
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
                    <FaStar key={i + review.rating} className={styles.emptyStar} />
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

      {/* --- Order Confirmation Modal --- */}
      {showConfirmModal && confirmedOrderDetails && (
        <div className={`${styles.modalOverlay} ${showConfirmModal ? styles.visible : ''}`} onClick={cancelConfirmation}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
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
              <ul className={styles.orderSummaryList}>
                {confirmedOrderDetails.items.map((item, index) => (
                  <li key={index}>
                    {item.quantity} kg of {item.grade} (₹{item.itemTotalPrice})
                    {item.discount === '10%' && <span className={styles.discountNote}> ({item.discount} discount applied)</span>}
                  </li>
                ))}
              </ul>
              <p className={styles.totalPayable}><strong>Total Payable: ₹{confirmedOrderDetails.total}</strong></p>
            </div>
            <div className={styles.modalButtons}>
              <button className={styles.modalButton} onClick={confirmAndSubmitOrder} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Proceed'}
              </button>
              <button className={`${styles.modalButton} ${styles.modalButtonCancel}`} onClick={cancelConfirmation}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Order Submitted Successfully Modal/Page --- */}
      {showSuccessModal && (
        <div className={`${styles.modalOverlay} ${showSuccessModal ? styles.visible : ''}`} onClick={closeSuccessModal}>
            <div className={`${styles.modalContent} ${styles.successPage}`} onClick={(e) => e.stopPropagation()}>
                <button className={styles.modalCloseButton} onClick={closeSuccessModal}>
                    <IoCloseCircleOutline />
                </button>
                <h2 className={styles.successTitle}>Order Submitted Successfully!</h2>
                <p className={styles.successMessageText}>
                    Thank you for your order. We have received your details and will contact you shortly to confirm.
                </p>
                <button className={styles.modalButton} onClick={closeSuccessModal}>
                    Close
                </button>
            </div>
        </div>
      )}

      {/* --- Authentication Modal (Login/Signup) --- */}
      {renderAuthModal()}

      {/* --- Account Sidebar --- */}
      {renderAccountSidebar()}
    </div>
  );
}
