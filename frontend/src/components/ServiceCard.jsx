import { Link } from "react-router-dom";
import { FaStar, FaRegStar } from "react-icons/fa";

function ServiceCard({ service }) {
  // Calculate average rating per seller (display seller ratings individually)
  const sellersWithRatings =
    service.sellers?.map((seller) => ({
      ...seller,
      displayRating: seller.rating ? Number(seller.rating).toFixed(1) : null,
    })) || [];

  // Find minimum price from all sellers
  const minPrice =
    service.sellers?.length > 0
      ? Math.min(...service.sellers.map((s) => s.price || service.price))
      : service.price;

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <FaStar key={i} style={{ color: "#FFD700", fontSize: "14px" }} />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <FaStar
            key={i}
            style={{ color: "#FFD700", fontSize: "14px", opacity: 0.7 }}
          />
        );
      } else {
        stars.push(
          <FaRegStar
            key={i}
            style={{ color: "#FFD700", fontSize: "14px", opacity: 0.4 }}
          />
        );
      }
    }
    return stars;
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        padding: "20px",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: "1px solid rgba(0,0,0,0.1)",
        ":hover": {
          transform: "translateY(-5px)",
          boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
        },
      }}
    >
      {/* Service Title */}
      <h3
        style={{
          fontSize: "20px",
          fontWeight: "600",
          color: "#2c3e50",
          marginBottom: "12px",
          lineHeight: "1.4",
        }}
      >
        {service.title}
      </h3>

      {/* Service Description */}
      <p
        style={{
          color: "#7f8c8d",
          marginBottom: "20px",
          flexGrow: 1,
          lineHeight: "1.6",
          fontSize: "15px",
        }}
      >
        {service.description}
      </p>

      {/* Sellers List */}
      <div style={{ marginBottom: "20px" }}>
        {sellersWithRatings.length > 0 ? (
          <div style={{ marginBottom: "15px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  fontWeight: "500",
                  color: "#34495e",
                  marginRight: "8px",
                }}
              >
                Available Sellers:
              </span>
              <span
                style={{
                  backgroundColor: "#ecf0f1",
                  color: "#2c3e50",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {sellersWithRatings.length}
              </span>
            </div>

            {sellersWithRatings.slice(0, 2).map((seller, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "12px",
                  padding: "10px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontWeight: "500", color: "#2c3e50" }}>
                    {seller.name || `Seller ${index + 1}`}
                  </span>
                  <span style={{ fontWeight: "500", color: "#27ae60" }}>
                    KSh {seller.price || minPrice}
                  </span>
                </div>
                {seller.displayRating && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginTop: "6px",
                    }}
                  >
                    <div style={{ display: "flex", marginRight: "8px" }}>
                      {renderStars(seller.rating)}
                    </div>
                    <span
                      style={{
                        color: "#7f8c8d",
                        fontSize: "14px",
                      }}
                    >
                      {seller.displayRating}/5
                    </span>
                  </div>
                )}
              </div>
            ))}

            {sellersWithRatings.length > 2 && (
              <div
                style={{
                  color: "#3498db",
                  fontSize: "14px",
                  textAlign: "center",
                  marginTop: "10px",
                }}
              >
                +{sellersWithRatings.length - 2} more sellers
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: "10px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              textAlign: "center",
              color: "#7f8c8d",
              fontSize: "14px",
            }}
          >
            No sellers available
          </div>
        )}
      </div>

      {/* Starting Price */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "14px",
              color: "#7f8c8d",
              marginRight: "8px",
            }}
          >
            Starting from:
          </span>
          <span
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#e74c3c",
            }}
          >
            KSh {minPrice}
          </span>
        </div>

        {/* Details Button */}
        <Link
          to={`/services/${service.id}`}
          style={{
            padding: "10px 16px",
            backgroundColor: "#3498db",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            transition: "background-color 0.3s ease",
            ":hover": {
              backgroundColor: "#2980b9",
            },
          }}
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

export default ServiceCard;
