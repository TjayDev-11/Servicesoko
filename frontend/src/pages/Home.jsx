import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function Home() {
  // Array of background images for the hero section
  const heroBackgrounds = [
    "/images/gardening.png",
    "/images/plumbing.png",
    "/images/movers.png",
    "/images/electrical.png",
  ];

  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Rotate background images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) =>
        prevIndex === heroBackgrounds.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      {/* Hero Section with Rotating Background Images */}
      <section
        style={{
          padding: "120px 20px 80px",
          background: `linear-gradient(rgba(26, 35, 126, 0.7), rgba(40, 53, 147, 0.7)), url(${heroBackgrounds[currentBgIndex]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          textAlign: "center",
          color: "white",
          position: "relative",
          overflow: "hidden",
          width: "100vw",
          minHeight: "100vh",
          marginLeft: "calc(-50vw + 50%)",
          transition: "background-image 1s ease-in-out",
        }}
      >
        {/* Background image indicators */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "10px",
            zIndex: 2,
          }}
        >
          {heroBackgrounds.map((_, index) => (
            <div
              key={index}
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor:
                  index === currentBgIndex
                    ? "#4fc3f7"
                    : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onClick={() => setCurrentBgIndex(index)}
            />
          ))}
        </div>

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <h1
            style={{
              fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
              fontWeight: "800",
              marginBottom: "24px",
              lineHeight: "1.2",
              padding: "0 20px",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            Find Trusted Services in{" "}
            <span style={{ color: "#4fc3f7" }}>Kenya</span>
          </h1>
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              maxWidth: "720px",
              margin: "0 auto 40px",
              opacity: "0.9",
              padding: "0 20px",
              textShadow: "0 1px 2px rgba(0,0,0,0.2)",
            }}
          >
            Connecting skilled professionals with customers across Kenya. From
            electricians to mama fuas,we help you hire or offer trusted services
            easily.
          </p>
          <div
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/services"
              style={{
                padding: "14px 32px",
                backgroundColor: "#4fc3f7",
                color: "#0d47a1",
                textDecoration: "none",
                borderRadius: "50px",
                fontWeight: "600",
                fontSize: "1rem",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                ":hover": {
                  transform: "translateY(-2px) scale(1.02)",
                  boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
                  backgroundColor: "#3fb3e6",
                },
              }}
            >
              Explore Services
            </Link>
            <Link
              to="/login"
              style={{
                padding: "14px 32px",
                backgroundColor: "transparent",
                color: "white",
                textDecoration: "none",
                borderRadius: "50px",
                fontWeight: "600",
                fontSize: "1rem",
                border: "2px solid rgba(255,255,255,0.3)",
                transition: "all 0.3s ease",
                ":hover": {
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderColor: "rgba(255,255,255,0.7)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(79,195,247,0.2) 0%, rgba(79,195,247,0) 70%)",
          }}
        ></div>
      </section>

      {/* How It Works Section */}
      <section
        style={{
          padding: "80px 20px",
          backgroundColor: "white",
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#e3f2fd",
                color: "#1a237e",
                padding: "8px 16px",
                borderRadius: "50px",
                fontWeight: "600",
                marginBottom: "16px",
                fontSize: "0.875rem",
              }}
            >
              HOW IT WORKS
            </span>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: "700",
                marginBottom: "16px",
                color: "#1a237e",
                padding: "0 20px",
              }}
            >
              Get Services in 3 Simple Steps
            </h2>
            <p
              style={{
                maxWidth: "600px",
                margin: "0 auto",
                color: "#666",
                padding: "0 20px",
              }}
            >
              ServiceSoko makes it easy to connect with trusted professionals in
              your area
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "40px",
              padding: "0 20px",
            }}
          >
            {[
              {
                image:
                  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
                title: "Describe Your Need",
                description: "Tell us what service you're looking for",
                step: "1",
              },
              {
                image:
                  "https://images.unsplash.com/photo-1581093450021-4a7360e9a7e3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
                title: "Get Matched",
                description: "We connect you with qualified professionals",
                step: "2",
              },
              {
                image:
                  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
                title: "Get It Done",
                description: "Your task is completed to your satisfaction",
                step: "3",
              },
            ].map((step, index) => (
              <div
                key={index}
                style={{ textAlign: "center", position: "relative" }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-15px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "50px",
                    height: "50px",
                    backgroundColor: "#4fc3f7",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "700",
                    fontSize: "1.25rem",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    zIndex: 1,
                  }}
                >
                  {step.step}
                </div>
                <div
                  style={{
                    height: "180px",
                    width: "180px",
                    borderRadius: "50%",
                    backgroundImage: `url(${step.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    margin: "30px auto 20px",
                    border: "3px solid #4fc3f7",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                  }}
                />
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    marginBottom: "12px",
                    color: "#1a237e",
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ color: "#666", lineHeight: "1.6" }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section
        style={{
          padding: "80px 20px",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span
            style={{
              display: "inline-block",
              backgroundColor: "#e3f2fd",
              color: "#1a237e",
              padding: "8px 16px",
              borderRadius: "50px",
              fontWeight: "600",
              marginBottom: "16px",
              fontSize: "0.875rem",
            }}
          >
            WHY CHOOSE US
          </span>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: "700",
              marginBottom: "16px",
              color: "#1a237e",
              padding: "0 20px",
            }}
          >
            ServiceSoko Benefits
          </h2>
          <p
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              color: "#666",
              padding: "0 20px",
            }}
          >
            We make service hiring safe, easy and reliable for everyone
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "32px",
            padding: "0 20px",
          }}
        >
          {[
            {
              icon: "https://cdn-icons-png.flaticon.com/512/1828/1828884.png",
              title: "Verified Professionals",
              description:
                "All service providers are thoroughly vetted for quality and reliability",
            },
            {
              icon: "https://cdn-icons-png.flaticon.com/512/2489/2489756.png",
              title: "Secure Payments",
              description:
                "Your money is protected until the job is completed to your satisfaction",
            },
            {
              icon: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
              title: "Customer Protection",
              description: "24/7 support and dispute resolution for any issues",
            },
          ].map((feature, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "32px 24px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                transition: "all 0.3s ease",
                borderBottom: "3px solid transparent",
                ":hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 12px 28px rgba(0,0,0,0.1)",
                  borderBottom: "3px solid #4fc3f7",
                },
              }}
            >
              <div
                style={{
                  fontSize: "2.5rem",
                  marginBottom: "16px",
                  background: "#e3f2fd",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.3s ease",
                  ":hover": {
                    transform: "scale(1.1)",
                  },
                }}
              >
                <img
                  src={feature.icon}
                  alt={feature.title}
                  style={{ width: "40px", height: "40px" }}
                />
              </div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  marginBottom: "12px",
                  color: "#1a237e",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  color: "#555",
                  lineHeight: "1.6",
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Services Section */}
      <section
        style={{
          padding: "80px 20px",
          backgroundColor: "#f5f7ff",
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#e3f2fd",
                color: "#1a237e",
                padding: "8px 16px",
                borderRadius: "50px",
                fontWeight: "600",
                marginBottom: "16px",
                fontSize: "0.875rem",
              }}
            >
              POPULAR SERVICES
            </span>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: "700",
                marginBottom: "16px",
                color: "#1a237e",
                padding: "0 20px",
              }}
            >
              Services You Can Book Today
            </h2>
            <p
              style={{
                maxWidth: "600px",
                margin: "0 auto",
                color: "#666",
                padding: "0 20px",
              }}
            >
              Trusted professionals ready to help with your needs
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "24px",
              padding: "0 20px",
            }}
          >
            {[
              {
                name: "Plumbing Services",
                description: "Fix leaks, install fixtures, and more",
                price: "From KES 1,500",
                image:
                  "https://images.unsplash.com/photo-1603302576837-37561b2e2302?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
              },
              {
                name: "Electrical Work",
                description: "Wiring, installations, and repairs",
                price: "From KES 2,000",
                image:
                  "https://images.unsplash.com/photo-1581093057305-25a8e1e9e1b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
              },
              {
                name: "Cleaning Services",
                description: "Home and office cleaning",
                price: "From KES 1,000",
                image:
                  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
              },
              {
                name: "Movers & Packers",
                description: "Reliable moving services",
                price: "From KES 5,000",
                image:
                  "https://images.unsplash.com/photo-1555212697-194d092e3b8f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
              },
            ].map((service, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.05)",
                  transition: "all 0.3s ease",
                  ":hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 12px 24px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <div
                  style={{
                    height: "180px",
                    backgroundColor: "#e3f2fd",
                    backgroundImage: `url(${service.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    transition: "transform 0.5s ease",
                    ":hover": {
                      transform: "scale(1.05)",
                    },
                  }}
                ></div>
                <div style={{ padding: "24px" }}>
                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "600",
                      marginBottom: "8px",
                      color: "#1a237e",
                    }}
                  >
                    {service.name}
                  </h3>
                  <p
                    style={{
                      color: "#666",
                      marginBottom: "16px",
                      minHeight: "48px",
                    }}
                  >
                    {service.description}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "600",
                        color: "#1a237e",
                      }}
                    >
                      {service.price}
                    </span>
                    <Link
                      to="/services"
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#4fc3f7",
                        color: "#0d47a1",
                        textDecoration: "none",
                        borderRadius: "50px",
                        fontWeight: "500",
                        fontSize: "0.875rem",
                        transition: "all 0.3s ease",
                        ":hover": {
                          backgroundColor: "#3fb3e6",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        },
                      }}
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        style={{
          padding: "80px 20px",
          backgroundColor: "white",
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#e3f2fd",
                color: "#1a237e",
                padding: "8px 16px",
                borderRadius: "50px",
                fontWeight: "600",
                marginBottom: "16px",
                fontSize: "0.875rem",
              }}
            >
              TESTIMONIALS
            </span>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: "700",
                marginBottom: "16px",
                color: "#1a237e",
                padding: "0 20px",
              }}
            >
              Trusted by Thousands
            </h2>
            <p
              style={{
                maxWidth: "600px",
                margin: "0 auto",
                color: "#666",
                padding: "0 20px",
              }}
            >
              What our customers and service providers say about us
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "32px",
              padding: "0 20px",
            }}
          >
            {[
              {
                quote:
                  "Found a great plumber who fixed my leak in under an hour!",
                author: "James M., Nairobi",
                rating: "★★★★★",
                image: "https://randomuser.me/api/portraits/men/32.jpg",
                role: "Homeowner",
              },
              {
                quote:
                  "The electrician was professional and reasonably priced.",
                author: "Sarah W., Mombasa",
                rating: "★★★★☆",
                image: "https://randomuser.me/api/portraits/women/44.jpg",
                role: "Business Owner",
              },
              {
                quote:
                  "Best platform to find trusted service providers in Kenya.",
                author: "David K., Kisumu",
                rating: "★★★★★",
                image: "https://randomuser.me/api/portraits/men/75.jpg",
                role: "Service Provider",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "#f8f9fa",
                  borderRadius: "12px",
                  padding: "32px",
                  position: "relative",
                  transition: "all 0.3s ease",
                  ":hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                    backgroundColor: "white",
                  },
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-25px",
                    left: "25px",
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    backgroundImage: `url(${testimonial.image})`,
                    backgroundSize: "cover",
                    border: "3px solid white",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    zIndex: 2,
                  }}
                />
                <div
                  style={{
                    fontSize: "1.5rem",
                    color: "#4fc3f7",
                    marginBottom: "16px",
                  }}
                >
                  {testimonial.rating}
                </div>
                <p
                  style={{
                    fontSize: "1.125rem",
                    fontStyle: "italic",
                    marginBottom: "24px",
                    lineHeight: "1.6",
                  }}
                >
                  "{testimonial.quote}"
                </p>
                <div>
                  <p
                    style={{
                      fontWeight: "600",
                      color: "#1a237e",
                      marginBottom: "4px",
                    }}
                  >
                    {testimonial.author}
                  </p>
                  <p style={{ color: "#666", fontSize: "0.875rem" }}>
                    {testimonial.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: "100px 20px",
          background: "linear-gradient(135deg, #1a237e 0%, #4fc3f7 100%)",
          textAlign: "center",
          color: "white",
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: "700",
              marginBottom: "24px",
              padding: "0 20px",
              lineHeight: "1.3",
            }}
          >
            Ready to Find or Offer Services in Kenya?
          </h2>
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              marginBottom: "40px",
              opacity: "0.9",
              padding: "0 20px",
            }}
          >
            Join thousands of satisfied customers and service providers today.
          </p>
          <div
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/signup"
              style={{
                padding: "16px 40px",
                backgroundColor: "white",
                color: "#1a237e",
                textDecoration: "none",
                borderRadius: "50px",
                fontWeight: "600",
                fontSize: "1.125rem",
                transition: "all 0.3s ease",
                display: "inline-block",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                ":hover": {
                  transform: "translateY(-3px)",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              Sign Up Now
            </Link>
            <Link
              to="/services"
              style={{
                padding: "16px 40px",
                backgroundColor: "transparent",
                color: "white",
                textDecoration: "none",
                borderRadius: "50px",
                fontWeight: "600",
                fontSize: "1.125rem",
                border: "2px solid rgba(255,255,255,0.3)",
                transition: "all 0.3s ease",
                display: "inline-block",
                ":hover": {
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderColor: "rgba(255,255,255,0.7)",
                  transform: "translateY(-3px)",
                },
              }}
            >
              Browse Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
