import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Cart.css';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and is a normal user
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn) {
      navigate('/login');
    } else {
      // Load cart from localStorage
      const savedCart = localStorage.getItem('eventCart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    }
  }, [navigate]);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('eventCart', JSON.stringify(cart));
  }, [cart]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('eventCart');
    navigate('/login');
  };

  const updateQuantity = (eventId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(eventId);
    } else {
      setCart(cart.map(item => 
        item.id === eventId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (eventId) => {
    setCart(cart.filter(item => item.id !== eventId));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('eventCart');
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalTickets = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    
    // Simulate checkout process
    setTimeout(() => {
      alert('🎉 Checkout successful! Your tickets have been booked.');
      clearCart();
      setIsCheckingOut(false);
      navigate('/events');
    }, 2000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="cart-container">
      {/* Header */}
      <div className="cart-header">
        <div className="header-content">
          <h1>My Cart</h1>
          <div className="header-actions">
            <Link to="/events" className="nav-button">
              🏪 Continue Shopping
            </Link>
            <Link to="/dashboard" className="nav-button">
              👤 Dashboard
            </Link>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="cart-content">
        {cart.length === 0 ? (
          /* Empty Cart */
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any events to your cart yet.</p>
            <Link to="/events" className="shop-now-btn">
              <span className="btn-icon">🏪</span>
              Browse Events
            </Link>
          </div>
        ) : (
          /* Cart with Items */
          <div className="cart-layout">
            {/* Cart Items */}
            <div className="cart-items-section">
              <div className="cart-summary-header">
                <h2>Cart Items ({getTotalTickets()} tickets)</h2>
                <button onClick={clearCart} className="clear-cart-btn">
                  Clear All
                </button>
              </div>

              <div className="cart-items-list">
                {cart.map(item => (
                  <div key={item.id} className="cart-item-card">
                    <div className="item-image">
                      <img src={item.image} alt={item.title} />
                      <div className="item-category">{item.category}</div>
                    </div>
                    
                    <div className="item-details">
                      <h3 className="item-title">{item.title}</h3>
                      <p className="item-description">{item.description}</p>
                      
                      <div className="item-info">
                        <div className="info-row">
                          <span className="icon">📅</span>
                          <span>{formatDate(item.date)} at {item.time}</span>
                        </div>
                        <div className="info-row">
                          <span className="icon">📍</span>
                          <span>{item.location}</span>
                        </div>
                        <div className="info-row">
                          <span className="icon">👥</span>
                          <span>{item.organizer}</span>
                        </div>
                      </div>
                    </div>

                    <div className="item-actions">
                      <div className="price-section">
                        <div className="unit-price">₹{item.price.toLocaleString()} each</div>
                        <div className="total-price">₹{(item.price * item.quantity).toLocaleString()}</div>
                      </div>
                      
                      <div className="quantity-controls">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="quantity-btn"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="quantity-display">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="quantity-btn"
                        >
                          +
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="remove-item-btn"
                      >
                        <span className="remove-icon">🗑️</span>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checkout Sidebar */}
            <div className="checkout-sidebar">
              <div className="checkout-card">
                <h3>Order Summary</h3>
                
                <div className="order-details">
                  <div className="detail-row">
                    <span>Total Tickets:</span>
                    <span>{getTotalTickets()}</span>
                  </div>
                  <div className="detail-row">
                    <span>Subtotal:</span>
                    <span>₹{getTotalPrice().toLocaleString()}</span>
                  </div>
                  <div className="detail-row">
                    <span>Service Fee:</span>
                    <span>₹{Math.round(getTotalPrice() * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="detail-row">
                    <span>GST (18%):</span>
                    <span>₹{Math.round(getTotalPrice() * 0.18).toLocaleString()}</span>
                  </div>
                  <div className="detail-row total-row">
                    <span>Total Amount:</span>
                    <span>₹{Math.round(getTotalPrice() * 1.23).toLocaleString()}</span>
                  </div>
                </div>

                <div className="payment-section">
                  <h4>Payment Method</h4>
                  <div className="payment-options">
                    <label className="payment-option">
                      <input type="radio" name="payment" value="card" defaultChecked />
                      <span className="option-text">💳 Credit/Debit Card</span>
                    </label>
                    <label className="payment-option">
                      <input type="radio" name="payment" value="upi" />
                      <span className="option-text">📱 UPI</span>
                    </label>
                    <label className="payment-option">
                      <input type="radio" name="payment" value="wallet" />
                      <span className="option-text">👛 Digital Wallet</span>
                    </label>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="checkout-button"
                >
                  {isCheckingOut ? (
                    <>
                      <span className="loading-spinner">⏳</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">💳</span>
                      Proceed to Pay ₹{Math.round(getTotalPrice() * 1.23).toLocaleString()}
                    </>
                  )}
                </button>

                <div className="security-info">
                  <span className="security-icon">🔒</span>
                  <span>Secure payment powered by SSL encryption</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;  