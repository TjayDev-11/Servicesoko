import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useStore from "../store";
import { FaSearch, FaChevronRight } from "react-icons/fa";
import serviceCategories from "../data/services";

function Services() {
  const { services, fetchServices } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchServices();
      } catch (error) {
        console.error("Fetch services error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [fetchServices]);

  // Log services to confirm state update
  console.log("Current services state:", services);

  // Process services from backend to match serviceCategories IDs
  // Replace the processedServices and enhancedServices logic with:
  const processedServices = services.flatMap((service) =>
    service.sellers.map((seller) => ({
      id: service.id,
      title: service.title,
      category: service.category.toLowerCase().trim(),
      sellerId: seller.id,
      sellerName: seller.name,
      price: seller.price,
      rating: seller.rating,
      description: seller.description,
      experience: seller.experience,
    }))
  );

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
  const servicesByCategory = processedServices.reduce((acc, service) => {
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

  // Debug log for servicesByCategory
  console.log("servicesByCategory:", servicesByCategory);

  // For display - merge predefined categories with actual services
  const displayCategories = serviceCategories.map((category) => ({
    ...category,
    serviceCount: servicesByCategory[category.id]?.services?.length || 0,
    sampleServices:
      servicesByCategory[category.id]?.services?.length > 0
        ? null
        : category.sampleServices,
  }));

  // Debug log for displayCategories
  console.log("displayCategories:", displayCategories);

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
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-5 mt-5">
          <h1 className="text-4xl font-bold text-indigo-900 mb-4">
            Service Categories
          </h1>
          <p className="text-lg text-gray-600">
            Browse professionals by service type
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="relative flex items-center">
            <FaSearch className="absolute left-4 text-gray-500 text-lg" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent shadow-sm transition-colors"
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <Link
                to={`/services/${category.id}`}
                key={category.id}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                    onError={(e) =>
                      (e.target.src = "/images/service-default.png")
                    }
                  />
                  <div className="absolute top-4 right-4 bg-white bg-opacity-90 w-10 h-10 rounded-full flex items-center justify-center text-2xl">
                    {category.icon}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-indigo-900 mb-2">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {category.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {category.serviceCount} professionals
                    </span>
                    <FaChevronRight className="text-cyan-400 text-lg" />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-600 text-lg">
              No services found for "{searchTerm}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Services;
