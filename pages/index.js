import React, { useState, Fragment, useEffect } from 'react';
import { IoCloseCircleOutline } from 'react-icons/io5';
import { FaPlus, FaMinus } from 'react-icons/fa'; // Import icons for add/remove variety buttons
import styles from '../styles/styles.module.css'; // Make sure this path is correct

// Assuming this is your API endpoint for lemons. REPLACE THIS WITH YOUR ACTUAL API URL.
const LEMONS_DATA_URL = 'https://api.example.com/lemons'; // *** IMPORTANT: Replace with your actual lemons API URL ***

// SheetDB API for Feedback
const FEEDBACK_SHEETDB_URL = 'https://sheetdb.io/api/v1/wm0oxtmmfkndt?sheet=Feedback';

export default function Home({ lemons }) {
    // --- Login Modal States ---
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginForm, setLoginForm] = useState({ name: '', phone: '' });
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginFeedback, setLoginFeedback] = useState({ message: '', type: '' }); // Specific feedback for login modal

    // --- Account Sidebar States ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeAccountTab, setActiveAccountTab] = useState('accountDetails'); // Default tab
    const [loggedInUser, setLoggedInUser] = useState(null); // Stores { name, phone, address, pincode }
    const [accountDetailsForm, setAccountDetailsForm] = useState({ name: '', phone: '', address: '', pincode: '' });
    const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
    const [accountFeedback, setAccountFeedback] = useState({ message: '', type: '' }); // Specific feedback for account tabs

    // --- Address Management States ---
    const [userAddresses, setUserAddresses] = useState([]); // Array of { id, addressName, fullAddress, pincode }
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [addressForm, setAddressForm] = useState({ id: null, addressName: '', fullAddress: '', pincode: '' });
    const [isManagingAddresses, setIsManagingAddresses] = useState(false); // For loading states in address management

    // --- Feedback Section States ---
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false); // To show 'Thank you' message for feedback

    // --- Variety Selection States ---
    const [selectedVarieties, setSelectedVarieties] = useState([]); // e.g., [{ id: 1, name: 'Lemon Type A', price: 10.00 }]

    // --- Persist user and addresses to localStorage ---
    useEffect(() => {
        const storedUser = localStorage.getItem('loggedInUser');
        const storedAddresses = localStorage.getItem('userAddresses');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setLoggedInUser(user);
            setAccountDetailsForm(user);
        }
        if (storedAddresses) {
            setUserAddresses(JSON.parse(storedAddresses));
        }
    }, []);

    useEffect(() => {
        if (loggedInUser) {
            localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
        } else {
            localStorage.removeItem('loggedInUser');
        }
    }, [loggedInUser]);

    useEffect(() => {
        localStorage.setItem('userAddresses', JSON.stringify(userAddresses));
    }, [userAddresses]);

    // --- Login Handlers ---
    const handleLoginFormChange = (e) => {
        const { name, value } = e.target;
        setLoginForm(prev => ({ ...prev, [name]: value }));
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginFeedback({ message: '', type: '' }); // Clear previous feedback
        setIsLoggingIn(true);

        // Dummy Login Logic: In a real app, this would be an API call
        try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

            if (loginForm.phone === '9876543210' && loginForm.name === 'John Doe') {
                const user = {
                    name: loginForm.name,
                    phone: loginForm.phone,
                    address: '123 Main St, Anytown', // Dummy address
                    pincode: '110001'      // Dummy pincode
                };
                setLoggedInUser(user);
                setAccountDetailsForm(user);
                setLoginFeedback({ message: 'Login successful!', type: 'success' });
                setIsLoginModalOpen(false);
                setIsSidebarOpen(true);
                setActiveAccountTab('accountDetails');
            } else {
                setLoginFeedback({ message: 'Invalid credentials. Please try again or sign up.', type: 'error' });
            }
        } catch (error) {
            console.error('Login error:', error);
            setLoginFeedback({ message: 'An error occurred during login.', type: 'error' });
        } finally {
            setIsLoggingIn(false);
        }
    };

    const closeLoginModal = () => {
        setIsLoginModalOpen(false);
        setLoginFeedback({ message: '', type: '' });
        setLoginForm({ name: '', phone: '' });
    };

    // --- Account Details Handlers ---
    const handleAccountDetailsFormChange = (e) => {
        const { name, value } = e.target;
        setAccountDetailsForm(prev => ({ ...prev, [name]: value }));
    };

    const saveAccountDetails = async (e) => {
        e.preventDefault();
        setAccountFeedback({ message: '', type: '' });
        setIsUpdatingAccount(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

            const updatedUser = { ...loggedInUser, ...accountDetailsForm };
            setLoggedInUser(updatedUser);
            setAccountFeedback({ message: 'Account details updated successfully!', type: 'success' });
        } catch (error) {
            console.error('Error updating account details:', error);
            setAccountFeedback({ message: 'Failed to update account details.', type: 'error' });
        } finally {
            setIsUpdatingAccount(false);
        }
    };

    const handleLogout = () => {
        setLoggedInUser(null);
        setAccountDetailsForm({ name: '', phone: '', address: '', pincode: '' });
        setUserAddresses([]);
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('userAddresses');
        setIsSidebarOpen(false);
        setLoginFeedback({ message: 'You have been logged out.', type: 'success' }); // Show feedback on main page or next login attempt
    };

    // --- Address Management Handlers ---
    const handleAddressFormChange = (e) => {
        const { name, value } = e.target;
        setAddressForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setAccountFeedback({ message: '', type: '' }); // Clear previous feedback
        setIsManagingAddresses(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

            if (addressForm.id) {
                // Edit existing address
                setUserAddresses(prev =>
                    prev.map(addr =>
                        addr.id === addressForm.id ? { ...addressForm } : addr
                    )
                );
                setAccountFeedback({ message: 'Address updated successfully!', type: 'success' });
            } else {
                // Add new address
                if (userAddresses.length >= 5) {
                    setAccountFeedback({ message: 'You can save a maximum of 5 addresses.', type: 'error' });
                    return;
                }
                const newAddress = { ...addressForm, id: Date.now() }; // Simple ID generation
                setUserAddresses(prev => [...prev, newAddress]);
                setAccountFeedback({ message: 'Address added successfully!', type: 'success' });
            }
            setShowAddressForm(false);
            setAddressForm({ id: null, addressName: '', fullAddress: '', pincode: '' }); // Clear form
        } catch (error) {
            console.error('Error saving address:', error);
            setAccountFeedback({ message: 'Failed to save address.', type: 'error' });
        } finally {
            setIsManagingAddresses(false);
        }
    };

    const handleEditAddress = (addr) => {
        setAddressForm({ ...addr });
        setShowAddressForm(true);
        setAccountFeedback({ message: '', type: '' }); // Clear any previous feedback
    };

    const handleDeleteAddress = async (id) => {
        setAccountFeedback({ message: '', type: '' });
        setIsManagingAddresses(true);

        if (window.confirm('Are you sure you want to delete this address?')) {
            try {
                await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
                setUserAddresses(prev => prev.filter(addr => addr.id !== id));
                setAccountFeedback({ message: 'Address deleted successfully!', type: 'success' });
            } catch (error) {
                console.error('Error deleting address:', error);
                setAccountFeedback({ message: 'Failed to delete address.', type: 'error' });
            } finally {
                setIsManagingAddresses(false);
            }
        } else {
            setIsManagingAddresses(false); // Reset loading state if cancelled
        }
    };

    // --- Feedback Handlers ---
    const handleFeedbackTextChange = (e) => {
        setFeedbackText(e.target.value);
        setFeedbackSubmitted(false); // Reset 'thank you' message if user starts typing again
        setAccountFeedback({ message: '', type: '' }); // Clear any general feedback
    };

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        setAccountFeedback({ message: '', type: '' });
        setIsSubmittingFeedback(true);

        if (!loggedInUser) {
            setAccountFeedback({ message: 'Please log in to submit feedback.', type: 'error' });
            setIsSubmittingFeedback(false);
            return;
        }

        if (!feedbackText.trim()) {
            setAccountFeedback({ message: 'Feedback cannot be empty.', type: 'error' });
            setIsSubmittingFeedback(false);
            return;
        }

        try {
            const feedbackData = {
                Name: loggedInUser.name,
                Phone: loggedInUser.phone,
                Address: loggedInUser.address || 'N/A', // Use address from loggedInUser, or 'N/A'
                Feedback: feedbackText,
            };

            const res = await fetch(FEEDBACK_SHEETDB_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feedbackData)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to submit feedback: ${res.status} ${res.statusText}`);
            }

            setFeedbackText(''); // Clear textarea
            setFeedbackSubmitted(true); // Show thank you message
            setAccountFeedback({ message: 'Thank you for your valuable feedback!', type: 'success' });

        } catch (error) {
            console.error('Error submitting feedback:', error);
            setAccountFeedback({ message: `Error submitting feedback: ${error.message}`, type: 'error' });
            setFeedbackSubmitted(false); // Don't show thank you on error
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    // --- Variety Selection Logic ---
    const handleAddVarietyToOrder = (variety) => {
        // Check if the variety is already selected
        if (selectedVarieties.some(item => item.id === variety.id)) {
            setAccountFeedback({ message: `Variety "${variety.name}" is already in your selection.`, type: 'error' }); // Using account feedback for demo
            return;
        }
        setSelectedVarieties(prev => [...prev, variety]);
        setAccountFeedback({ message: `Added "${variety.name}" to selection.`, type: 'success' }); // Using account feedback for demo
    };

    const handleRemoveVarietyFromOrder = (varietyId) => {
        setSelectedVarieties(prev => prev.filter(item => item.id !== varietyId));
        setAccountFeedback({ message: 'Variety removed from selection.', type: 'success' }); // Using account feedback for demo
    };

    // --- Main Component Render ---
    return (
        <div className={styles.page}>
            {/* Header / Navigation Bar */}
            <header style={{ padding: '20px', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>My Lemon Shop</h1>
                <div>
                    {!loggedInUser ? (
                        <button onClick={() => setIsLoginModalOpen(true)} className={styles.modalButton}>
                            Login
                        </button>
                    ) : (
                        <button onClick={() => setIsSidebarOpen(true)} className={styles.modalButton}>
                            My Account
                        </button>
                    )}
                </div>
            </header>

            {/* Dummy Variety Selection Section (Illustrative) */}
            <div className={styles.container}>
                <h2 className={styles.sectionTitle}>Our Lemon Varieties</h2>
                {loginFeedback.message && loginFeedback.type === 'success' && ( // Display login success message here if applicable
                    <p className={`${styles.statusMessage} ${styles.feedbackSuccess}`}>
                        {loginFeedback.message}
                    </p>
                )}
                {accountFeedback.message && (accountFeedback.type === 'success' || accountFeedback.type === 'error') && (
                    // Display general feedback below the section title (can be for variety selection too)
                    <p className={`${styles.feedbackMessage} ${styles[`feedback${accountFeedback.type.charAt(0).toUpperCase() + accountFeedback.type.slice(1)}`]}`}>
                        {accountFeedback.message}
                    </p>
                )}

                <div className={styles.lemonsGrid}>
                    {lemons.length > 0 ? (
                        lemons.map(lemon => (
                            <div key={lemon.id} className={styles.lemonCard}>
                                <img src={lemon.image || '/images/default-lemon.jpg'} alt={lemon.name} className={styles.cardImage} />
                                <h3 className={styles.cardTitle}>{lemon.name}</h3>
                                <p className={styles.cardDescription}>Price: ${lemon.price ? lemon.price.toFixed(2) : 'N/A'}</p>
                                <button
                                    onClick={() => handleAddVarietyToOrder(lemon)}
                                    className={styles.addVarietyButton}
                                    title="Add this variety"
                                >
                                    <FaPlus />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>No lemon varieties available at the moment.</p>
                    )}
                </div>

                {selectedVarieties.length > 0 && (
                    <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                        <h3 className={styles.sectionTitle} style={{fontSize: '1.8rem', marginBottom: '20px'}}>Your Current Variety Selection:</h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {selectedVarieties.map(variety => (
                                <li key={variety.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed #eee' }}>
                                    <span>{variety.name} (${variety.price ? variety.price.toFixed(2) : 'N/A'})</span>
                                    <button
                                        onClick={() => handleRemoveVarietyFromOrder(variety.id)}
                                        className={styles.removeVarietyButton}
                                        title="Remove this variety"
                                    >
                                        <FaMinus />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* --- Login Modal --- */}
            {isLoginModalOpen && (
                <div className={`${styles.modalOverlay} ${isLoginModalOpen ? styles.visible : ''}`} onClick={closeLoginModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Login</h3>
                            <button className={styles.modalCloseButton} onClick={closeLoginModal}>
                                <IoCloseCircleOutline />
                            </button>
                        </div>
                        {loginFeedback.message && loginFeedback.type === 'error' && (
                            <p className={`${styles.feedbackMessage} ${styles.feedbackError}`}>
                                {loginFeedback.message}
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
                                {/* Removed the "New User? Sign Up" button as it's not implemented yet */}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Account Sidebar --- */}
            {isSidebarOpen && (
                <div className={`${styles.accountSidebarOverlay} ${isSidebarOpen ? styles.visible : ''}`} onClick={() => setIsSidebarOpen(false)}>
                    <div className={`${styles.accountSidebar} ${isSidebarOpen ? styles.open : ''}`} onClick={(e) => e.stopPropagation()}>
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
                                    setFeedbackSubmitted(false); // Reset 'thank you' message when entering tab
                                    setFeedbackText(''); // Clear feedback text on tab switch
                                    setAccountFeedback({ message: '', type: '' }); // Clear general feedback
                                }}
                            >
                                Feedback
                            </button>
                        </div>

                        <div className={styles.tabContent}>
                            {activeAccountTab === 'accountDetails' && (
                                <Fragment>
                                    <h3>Your Profile</h3>
                                    {accountFeedback.message && (accountFeedback.type === 'success' || accountFeedback.type === 'error') && (
                                        <p className={`${styles.feedbackMessage} ${styles[`feedback${accountFeedback.type.charAt(0).toUpperCase() + accountFeedback.type.slice(1)}`]}`}>
                                            {accountFeedback.message}
                                        </p>
                                    )}
                                    {loggedInUser ? (
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
                                                onClick={handleLogout}
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
                                    {accountFeedback.message && (accountFeedback.type === 'success' || accountFeedback.type === 'error') && (
                                        <p className={`${styles.feedbackMessage} ${styles[`feedback${accountFeedback.type.charAt(0).toUpperCase() + accountFeedback.type.slice(1)}`]}`}>
                                            {accountFeedback.message}
                                        </p>
                                    )}
                                    {isManagingAddresses && <p style={{ textAlign: 'center' }}>Loading addresses...</p>}

                                    {loggedInUser ? (
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
                                    {feedbackSubmitted ? (
                                        <p className={styles.feedbackSuccessMessage}>Thank you for your valuable feedback!</p>
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
                                                {accountFeedback.message && accountFeedback.type === 'error' && (
                                                    <p className={`${styles.feedbackMessage} ${styles.feedbackError}`}>
                                                        {accountFeedback.message}
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
    // You MUST replace 'YOUR_LEMONS_API_URL' with the actual URL to your lemons data.
    // Example: const LEMONS_DATA_URL = 'https://my-json-server.typicode.com/your-username/your-repo/lemons';
    const LEMONS_DATA_URL = 'https://api.example.com/lemons'; // Placeholder: REPLACE THIS!

    try {
        const res = await fetch(LEMONS_DATA_URL);
        if (!res.ok) {
            console.error(`Failed to fetch lemons: ${res.status} ${res.statusText}`);
            const errorBody = await res.text();
            console.error('Lemons API Response Body:', errorBody);
            return { props: { lemons: [] }, revalidate: 30 }; // Return empty and revalidate to try again
        }
        const lemons = await res.json();

        // Ensure lemons is an array, provide dummy data if not
        if (!Array.isArray(lemons) || lemons.length === 0) {
            console.warn("Fetched lemons data is empty or not an array. Providing dummy data.");
            // Dummy data for development/testing if API fails or returns empty
            return {
                props: {
                    lemons: [
                        { id: 1, name: 'Eureka Lemon', price: 1.50, image: '/lemon-with-leaves.jpg' },
                        { id: 2, name: 'Meyer Lemon', price: 2.00, image: '/sliced-lemon.jpeg' },
                        { id: 3, name: 'Lisbon Lemon', price: 1.75, image: '/basket-of-lemons.jpeg' },
                        { id: 4, name: 'Verna Lemon', price: 1.80, image: '/lemon-tree.jpeg' },
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
        // Fallback to dummy data on network error too
        return {
            props: {
                lemons: [
                    { id: 1, name: 'Eureka Lemon', price: 1.50, image: '/lemon-with-leaves.jpg' },
                    { id: 2, name: 'Meyer Lemon', price: 2.00, image: '/sliced-lemon.jpeg' },
                    { id: 3, name: 'Lisbon Lemon', price: 1.75, image: '/basket-of-lemons.jpeg' },
                    { id: 4, name: 'Verna Lemon', price: 1.80, image: '/lemon-tree.jpeg' },
                ]
            },
            revalidate: 30,
        };
    }
}
