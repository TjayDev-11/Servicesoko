import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useStore from "../store";
import { FaSearch, FaChevronRight } from "react-icons/fa";

function Services() {
  const { services, fetchServices, token } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchServices(token);

        // Add this debug log to check what's coming from backend
        console.log("Fetched services:", services);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };
    fetchData();
  }, [fetchServices, token]);

  // Enhanced service categories with more options
  const serviceCategories = [
    {
      id: "plumbing",
      name: "Plumbing",
      image: "/images/plumbing.png",
      description: "Fix leaks, install fixtures, and repairs",
      icon: "🛠️",
      sampleServices: [
        "Pipe repair",
        "Drain unclogging",
        "Water heater installation",
        "Toilet repair",
      ],
    },
    {
      id: "electrical",
      name: "Electrical",
      image: "/images/electrical.png",
      description: "Wiring, installations, and electrical work",
      icon: "💡",
      sampleServices: [
        "Light fixture installation",
        "Circuit breaker repair",
        "Wiring installation",
        "Outlet replacement",
      ],
    },
    {
      id: "cleaning",
      name: "Cleaning",
      image: "/images/cleaning.png",
      description: "Home and office cleaning services",
      icon: "🧹",
      sampleServices: [
        "Deep cleaning",
        "Carpet cleaning",
        "Window cleaning",
        "Post-construction cleaning",
      ],
    },
    {
      id: "moving",
      name: "Moving",
      image: "/images/movers.png",
      description: "Reliable moving and packing services",
      icon: "🚚",
      sampleServices: [
        "Local moving",
        "Long-distance moving",
        "Furniture moving",
        "Packing services",
      ],
    },
    {
      id: "painting",
      name: "Painting",
      image: "/images/painting.png",
      description: "Interior and exterior painting",
      icon: "🎨",
      sampleServices: [
        "Wall painting",
        "Cabinet refinishing",
        "Exterior house painting",
        "Decorative painting",
      ],
    },
    {
      id: "gardening",
      name: "Gardening",
      image: "/images/gardening.png",
      description: "Landscaping and garden maintenance",
      icon: "🌿",
      sampleServices: [
        "Lawn mowing",
        "Hedge trimming",
        "Garden design",
        "Tree pruning",
      ],
    },
    {
      id: "carpentry",
      name: "Carpentry",
      image: "/images/carpentry.png",
      description: "Custom woodwork and furniture",
      icon: "🪚",
      sampleServices: [
        "Custom shelves",
        "Furniture repair",
        "Cabinet making",
        "Door installation",
      ],
    },
    {
      id: "appliance",
      name: "Appliance Repair",
      image: "/images/appliance.png",
      description: "Home appliance maintenance and fixes",
      icon: "🔌",
      sampleServices: [
        "Refrigerator repair",
        "Washing machine fix",
        "Oven maintenance",
        "AC servicing",
      ],
    },
    {
      id: "catering",
      name: "Catering",
      image: "/images/catering.png",
      description: "Food services for events and gatherings",
      icon: "🍽️",
      sampleServices: [
        "Wedding catering",
        "Corporate events",
        "Birthday parties",
        "Buffet services",
      ],
    },
    {
      id: "photography",
      name: "Photography",
      image: "/images/photography.png",
      description: "Professional photo and video services",
      icon: "📷",
      sampleServices: [
        "Portrait photography",
        "Event coverage",
        "Product photography",
        "Real estate photos",
      ],
    },
    {
      id: "tutoring",
      name: "Tutoring",
      image: "/images/tutoring.png",
      description: "Academic help and subject tutoring",
      icon: "📚",
      sampleServices: [
        "Math tutoring",
        "Language lessons",
        "Test preparation",
        "Science tutoring",
      ],
    },
    {
      id: "fitness",
      name: "Fitness Training",
      image: "/images/fitness.png",
      description: "Personal training and fitness coaching",
      icon: "💪",
      sampleServices: [
        "Personal training",
        "Yoga instruction",
        "Weight loss coaching",
        "Group fitness classes",
      ],
    },
    {
      id: "beauty",
      name: "Beauty Services",
      image: "/images/beauty.png",
      description: "Hair, nails, and beauty treatments",
      icon: "💅",
      sampleServices: [
        "Hair styling",
        "Manicures & pedicures",
        "Makeup artistry",
        "Skincare treatments",
      ],
    },
    {
      id: "it",
      name: "IT Services",
      image: "/images/it.png",
      description: "Computer and technology support",
      icon: "💻",
      sampleServices: [
        "Computer repair",
        "Network setup",
        "Software installation",
        "Tech support",
      ],
    },
    {
      id: "petcare",
      name: "Pet Care",
      image: "/images/petcare.png",
      description: "Services for your furry friends",
      icon: "🐕",
      sampleServices: [
        "Pet sitting",
        "Dog walking",
        "Grooming",
        "Veterinary assistance",
      ],
    },
    {
      id: "events",
      name: "Event Planning",
      image: "/images/events.png",
      description: "Professional event organization",
      icon: "🎉",
      sampleServices: [
        "Wedding planning",
        "Corporate events",
        "Birthday parties",
        "Venue decoration",
      ],
    },
  ];

  // Process services from backend to match expected structure
  const processedServices = services.map((service) => ({
    ...service,
    // Normalize category names to match our predefined categories
    category: service.category
      ? service.category.toLowerCase().trim()
      : "uncategorized",
  }));

  // Combine backend services with category info
  const enhancedServices = processedServices.map((service) => {
    const categoryInfo =
      serviceCategories.find((cat) => cat.id === service.category) || {};
    return {
      ...service,
      image: categoryInfo.image || "/images/service-default.png",
      icon: categoryInfo.icon || "🔧",
    };
  });

  // Group services by category
  const servicesByCategory = enhancedServices.reduce((acc, service) => {
    const category = service.category || "uncategorized";
    if (!acc[category]) {
      acc[category] = {
        services: [],
        ...(serviceCategories.find((cat) => cat.id === category) || {}),
      };
    }
    acc[category].services.push(service);
    return acc;
  }, {});

  // For display - merge predefined categories with actual services
  const displayCategories = serviceCategories.map((category) => ({
    ...category,
    serviceCount: servicesByCategory[category.id]?.services?.length || 0,
    // Add sample services if no real services exist
    sampleServices:
      servicesByCategory[category.id]?.services?.length > 0
        ? null
        : category.sampleServices,
  }));

  // Filter categories based on search
  const filteredCategories = displayCategories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive =
      activeCategory === "all" || activeCategory === category.id;
    return matchesSearch && matchesActive;
  });

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Service Categories</h1>
          <p style={styles.subtitle}>Browse professionals by service type</p>
        </div>

        {/* Search Bar */}
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <FaSearch style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div style={styles.grid}>
          {filteredCategories.map((category) => (
            <Link
              to={`/services/${category.id}`}
              key={category.id}
              style={styles.categoryCard}
            >
              <div style={styles.categoryImageContainer}>
                <img
                  src={category.image}
                  alt={category.name}
                  style={styles.categoryImage}
                />
                <div style={styles.categoryIcon}>{category.icon}</div>
              </div>
              <div style={styles.categoryContent}>
                <h3 style={styles.categoryTitle}>{category.name}</h3>
                <p style={styles.categoryDescription}>{category.description}</p>
                <div style={styles.categoryFooter}>
                  <span style={styles.sellerCount}>
                    {servicesByCategory[category.id]?.services?.length || 0}{" "}
                    professionals
                  </span>
                  <FaChevronRight style={styles.arrowIcon} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8f9fa",
    padding: "40px 20px",
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: "40px",
  },
  title: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#1a237e",
    marginBottom: "16px",
  },
  subtitle: {
    fontSize: "18px",
    color: "#666",
  },
  searchContainer: {
    maxWidth: "600px",
    margin: "0 auto 40px",
  },
  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchInput: {
    width: "100%",
    padding: "14px 16px 14px 48px",
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "8px",
    color: "#333",
    fontSize: "16px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  searchIcon: {
    position: "absolute",
    left: "16px",
    color: "#666",
    fontSize: "18px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px",
  },
  categoryCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    transition: "all 0.3s ease",
    textDecoration: "none",
    color: "inherit",
    ":hover": {
      transform: "translateY(-5px)",
      boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    },
  },
  categoryImageContainer: {
    position: "relative",
    height: "160px",
    overflow: "hidden",
  },
  categoryImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.5s ease",
  },
  categoryIcon: {
    position: "absolute",
    top: "16px",
    right: "16px",
    fontSize: "24px",
    backgroundColor: "rgba(255,255,255,0.9)",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryContent: {
    padding: "20px",
  },
  categoryTitle: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#1a237e",
  },
  categoryDescription: {
    color: "#666",
    marginBottom: "16px",
    fontSize: "14px",
  },
  categoryFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sellerCount: {
    fontSize: "14px",
    color: "#666",
  },
  arrowIcon: {
    color: "#4fc3f7",
  },
};

export default Services;
