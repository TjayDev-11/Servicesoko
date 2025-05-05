import { FaCalendarAlt } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { Link } from "react-router-dom";

const BookingModal = ({
  seller,
  bookingDate,
  setBookingDate,
  onConfirm,
  onClose,
  bookingStatus,
  error, // Add error prop
}) => {
  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal">
        <div className="booking-header">
          <h3>Confirm Booking</h3>
          <button onClick={onClose} className="close-btn">
            <IoMdClose />
          </button>
        </div>
        <div className="booking-content">
          {bookingStatus === "pending" ? (
            <div className="booking-status">
              <div className="spinner"></div>
              <p>Processing your booking...</p>
            </div>
          ) : bookingStatus === "success" ? (
            <div className="booking-status">
              <p>Booking confirmed! Redirecting...</p>
            </div>
          ) : bookingStatus === "failed" ? (
            <div className="booking-status error">
              <p>
                {error ||
                  "Booking failed. Please try again or contact support."}
              </p>
              <button onClick={onConfirm} className="btn retry-btn">
                Retry
              </button>
            </div>
          ) : bookingStatus === "needsLogin" ? (
            <div className="booking-status login-prompt">
              <p>Please log in to confirm your booking.</p>
              <Link to="/login" className="btn login-btn">
                Log In
              </Link>
            </div>
          ) : (
            <>
              <div className="booking-detail">
                <label>Professional:</label>
                <p>{seller?.name || "N/A"}</p>
              </div>
              <div className="booking-detail">
                <label>Service:</label>
                <p>{seller?.serviceName || "N/A"}</p>
              </div>
              <div className="booking-detail">
                <label>Price:</label>
                <p>{seller?.price ? `From KSh ${seller.price}` : "N/A"}</p>
              </div>
              <div className="booking-detail">
                <label>Date:</label>
                <div className="date-picker">
                  <FaCalendarAlt />
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
              <div className="booking-actions">
                <button onClick={onClose} className="btn cancel-btn">
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="btn confirm-btn"
                  disabled={!bookingDate}
                >
                  Confirm Booking
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;

const styles = `
  .booking-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .booking-modal {
    background: #FFFFFF;
    width: 100%;
    max-width: 480px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
  }

  .booking-header {
    padding: 12px 16px;
    background: #3B82F6;
    color: #FFFFFF;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .booking-header h3 {
    font-size: 16px;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    color: #FFFFFF;
    font-size: 20px;
    cursor: pointer;
  }

  .booking-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .booking-detail {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .booking-detail label {
    font-size: 14px;
    font-weight: 500;
    color: #6B7280;
  }

  .booking-detail p {
    font-size: 14px;
    margin: 0;
  }

  .date-picker {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #E5E7EB;
    border-radius: 6px;
    padding: 8px;
  }

  .date-picker svg {
    color: #6B7280;
  }

  .date-picker input {
    border: none;
    outline: none;
    font-size: 14px;
  }

  .booking-actions {
    display: flex;
    gap: 8px;
  }

  .btn {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .cancel-btn {
    background: #F3F4F6;
    color: #2D2D2D;
  }

  .cancel-btn:hover {
    background: #E5E7EB;
  }

  .confirm-btn {
    background: #3B82F6;
    color: #FFFFFF;
  }

  .confirm-btn:hover {
    background: #2563EB;
  }

  .confirm-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .retry-btn {
    background: #3B82F6;
    color: #FFFFFF;
  }

  .retry-btn:hover {
    background: #2563EB;
  }

  .login-btn {
    background: #3B82F6;
    color: #FFFFFF;
    text-decoration: none;
  }

  .login-btn:hover {
    background: #2563EB;
  }

  .booking-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
  }

  .booking-status p {
    margin: 0;
    font-size: 14px;
  }

  .booking-status.error p {
    color: #EF4444;
  }

  .booking-status.login-prompt p {
    color: #2D2D2D;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #F3F4F6;
    border-top: 3px solid #3B82F6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
