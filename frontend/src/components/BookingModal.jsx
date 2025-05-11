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
  error,
}) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-inter animate-fadeInUp"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="bg-white w-11/12 sm:max-w-md rounded-lg shadow-xl flex flex-col">
        <div className="flex justify-between items-center p-4 bg-cyan-400 text-white rounded-t-lg">
          <h3 id="booking-modal-title" className="text-base font-semibold">
            Confirm Booking
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close booking modal"
          >
            <IoMdClose size={20} />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-4">
          {bookingStatus === "pending" ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="border-4 border-gray-200 border-t-cyan-400 rounded-full w-8 h-8 animate-spin" />
              <p className="text-sm text-gray-600">
                Processing your booking...
              </p>
            </div>
          ) : bookingStatus === "success" ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-green-600">
                Booking confirmed! Redirecting...
              </p>
            </div>
          ) : bookingStatus === "failed" ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-red-500">
                {error ||
                  "Booking failed. Please try again or contact support."}
              </p>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-cyan-400 text-gray-900 font-medium rounded-md hover:bg-cyan-500 hover:shadow-md transition-colors text-sm"
                aria-label="Retry booking"
              >
                Retry
              </button>
            </div>
          ) : bookingStatus === "needsLogin" ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-gray-600">
                Please log in to confirm your booking.
              </p>
              <Link
                to="/login"
                className="px-4 py-2 bg-cyan-400 text-gray-900 font-medium rounded-md hover:bg-cyan-500 hover:shadow-md transition-colors text-sm"
                aria-label="Log in to book"
              >
                Log In
              </Link>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-600">
                  Professional:
                </label>
                <p className="text-sm text-gray-900">{seller?.name || "N/A"}</p>
              </div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-600">
                  Service:
                </label>
                <p className="text-sm text-gray-900">
                  {seller?.serviceName || "N/A"}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-600">
                  Price:
                </label>
                <p className="text-sm text-gray-900">
                  {seller?.price ? `From KSh ${seller.price}` : "N/A"}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-600">
                  Date:
                </label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2">
                  <FaCalendarAlt className="text-gray-600" />
                  <input
                    type="date"
                    value={bookingDate || ""}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="border-none outline-none text-sm text-gray-900 focus:ring-2 focus:ring-cyan-400 rounded"
                    aria-label="Select booking date"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 bg-gray-100 text-gray-900 font-medium rounded-md hover:bg-gray-200 transition-colors text-sm"
                  aria-label="Cancel booking"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-2 bg-cyan-400 text-gray-900 font-medium rounded-md hover:bg-cyan-500 hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                  disabled={!bookingDate}
                  aria-label="Confirm booking"
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
