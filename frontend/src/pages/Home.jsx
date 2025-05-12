
import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

function Home() {
  const heroBackgrounds = [
    "/images/gardening.png",
    "/images/plumbing.png",
    "/images/movers.png",
    "/images/electrical.png",
  ];

  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [nextBgIndex, setNextBgIndex] = useState(1);
  const [isFading, setIsFading] = useState(false);
  const sectionRefs = useRef([]);

  // Preload images and rotate backgrounds
  useEffect(() => {
    heroBackgrounds.forEach((img) => {
      const image = new Image();
      image.src = img;
    });

    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentBgIndex((prevIndex) =>
          prevIndex === heroBackgrounds.length - 1 ? 0 : prevIndex + 1
        );
        setNextBgIndex((prevIndex) =>
          prevIndex === heroBackgrounds.length - 1 ? 0 : prevIndex + 1
        );
        setIsFading(false);
      }, 1000); // Match transition duration
    }, 5000);

    return () => clearInterval(interval);
  }, [heroBackgrounds]);

  // Animate sections on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fadeInUp");
            if (entry.target.id === "how-it-works") {
              const cards = entry.target.querySelectorAll(".step-card");
              cards.forEach((card, index) => {
                card.style.transitionDelay = `${index * 200}ms`;
                card.classList.add("animate-step");
              });
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      sectionRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  return (
    <div className="bg-black text-white mt-5">
      {/* Hero Section */}
      <section
        className="relative w-screen min-h-screen flex items-center justify-center text-white overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[5000ms] ease-linear min-h-screen sm:min-h-[unset]"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${heroBackgrounds[currentBgIndex]})`,
            transform: isFading ? "scale(1.05)" : "scale(1)",
            opacity: isFading ? 0 : 1,
            transitionProperty: "opacity",
            transitionDuration: "1000ms",
            transitionTimingFunction: "ease-in-out",
          }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[5000ms] ease-linear"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${heroBackgrounds[nextBgIndex]})`,
            transform: isFading ? "scale(1)" : "scale(1.05)",
            opacity: isFading ? 1 : 0,
            transitionProperty: "opacity",
            transitionDuration: "1000ms",
            transitionTimingFunction: "ease-in-out",
          }}
        />
        {/* Background image indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {heroBackgrounds.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentBgIndex
                  ? "bg-cyan-400 scale-110"
                  : "bg-white bg-opacity-50"
              }`}
              onClick={() => {
                setIsFading(true);
                setTimeout(() => {
                  setCurrentBgIndex(index);
                  setNextBgIndex(
                    index === heroBackgrounds.length - 1 ? 0 : index + 1
                  );
                  setIsFading(false);
                }, 1000);
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <div className="max-w-6xl mx-auto px-5 relative z-10 transition-opacity duration-500 animate-fadeInUp">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight px-5 text-center">
            Find Trusted Services in{" "}
            <span className="text-cyan-400">Kenya</span>
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-10 px-5 text-center text-white text-opacity-80">
            Connecting skilled professionals with customers across Kenya. From
            electricians to mama fuas, we help you hire or offer trusted
            services easily.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/services"
              className="px-8 py-3 bg-cyan-400 text-black font-bold rounded-full transition-all hover:bg-cyan-500 hover:shadow-lg hover:-translate-y-1 transform"
            >
              Explore Services
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 bg-transparent text-white font-bold rounded-full border-2 border-white border-opacity-30 transition-all hover:bg-white hover:bg-opacity-15 hover:border-opacity-70 hover:-translate-y-1 transform"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-64 h-64 md:w-96 md:h-96 rounded-full bg-gradient-radial from-cyan-400/20 to-transparent -mr-32 -mb-32"></div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        ref={(el) => (sectionRefs.current[0] = el)}
        className="py-20 bg-white text-black w-screen -ml-[calc(50vw-50%)] px-5"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-gray-100 text-black px-4 py-2 rounded-full font-bold text-sm mb-4">
              HOW IT WORKS
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Book Services in 3 Easy Steps
            </h2>
            <p className="max-w-2xl mx-auto text-gray-600">
              ServiceSoko connects you with trusted professionals in Kenya effortlessly.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                image: "/images/search.png",
                title: "Search for Your Service",
                description: "Browse a wide range of services, from plumbing to cleaning, and find exactly what you need.",
                step: "1",
              },
              {
                image: "/images/choose.png",
                title: "Choose Your Professional",
                description: "Review profiles, ratings, and prices to select the perfect professional for your task.",
                step: "2",
              },
              {
                image: "/images/book.png",
                title: "Book with Confidence",
                description: "Securely book your service and relax knowing your task is in trusted hands.",
                step: "3",
              },
            ].map((step, index) => (
              <div
                key={index}
                className="text-center relative step-card"
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md transition-transform duration-300 hover:scale-110 hover:animate-pulse-custom">
                  {step.step}
                </div>
                <div
                  className="h-40 w-40 md:h-48 md:w-48 rounded-full bg-cover bg-center mx-auto mt-8 border-4 border-cyan-400 shadow-xl transition-transform duration-300 hover:scale-105"
                  style={{ backgroundImage: `url(${step.image})` }}
                />
                <h3 className="text-xl font-bold mt-6 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section
        ref={(el) => (sectionRefs.current[1] = el)}
        className="py-20 max-w-6xl mx-auto px-5 bg-black text-white"
      >
        <div className="text-center mb-12">
          <span className="inline-block bg-gray-800 text-white px-4 py-2 rounded-full font-bold text-sm mb-4">
            WHY CHOOSE US
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ServiceSoko Benefits
          </h2>
          <p className="max-w-2xl mx-auto text-gray-400">
            We make service hiring safe, easy and reliable for everyone
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              className="bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-b-4 border-transparent hover:border-cyan-400 hover:-translate-y-2"
            >
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 transition-transform duration-300 hover:scale-110">
                <img
                  src={feature.icon}
                  alt={feature.title}
                  className="w-10 h-10"
                />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Services Section */}
      <section
        ref={(el) => (sectionRefs.current[2] = el)}
        className="py-20 bg-white text-black w-screen -ml-[calc(50vw-50%)] px-5"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-gray-100 text-black px-4 py-2 rounded-full font-bold text-sm mb-4">
              POPULAR SERVICES
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Services You Can Book Today
            </h2>
            <p className="max-w-2xl mx-auto text-gray-600">
              Trusted professionals ready to help with your needs
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Plumbing Services",
                description: "Fix leaks, install fixtures, and more",
                price: "From KES 1,500",
                image: "/images/plumbing.png",
              },
              {
                name: "Electrical Work",
                description: "Wiring, installations, and repairs",
                price: "From KES 2,000",
                image: "/images/electrical.png",
              },
              {
                name: "Cleaning Services",
                description: "Home and office cleaning",
                price: "From KES 1,000",
                image: "/images/cleaning.png",
              },
              {
                name: "Movers & Packers",
                description: "Reliable moving services",
                price: "From KES 5,000",
                image: "/images/movers.png",
              },
            ].map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
              >
                <div
                  className="h-48 bg-gray-100 bg-cover bg-center transition-transform duration-500 hover:scale-105"
                  style={{ backgroundImage: `url(${service.image})` }}
                ></div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                  <p className="text-gray-600 mb-4 min-h-[3.5rem]">
                    {service.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{service.price}</span>
                    <Link
                      to={`/services/${service.id}`}
                      className="px-4 py-2 bg-cyan-400 text-black font-bold text-sm rounded-full transition-all hover:bg-cyan-500"
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
        ref={(el) => (sectionRefs.current[3] = el)}
        className="py-20 bg-black text-white w-screen -ml-[calc(50vw-50%)] px-5"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-gray-800 text-white px-4 py-2 rounded-full font-bold text-sm mb-4">
              TESTIMONIALS
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Thousands
            </h2>
            <p className="max-w-2xl mx-auto text-gray-400">
              What our customers and service providers say about us
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                className="bg-gray-800 rounded-xl p-8 relative hover:bg-gray-700 hover:shadow-lg transition-all duration-300"
              >
                <div
                  className="absolute -top-6 left-6 w-14 h-14 rounded-full bg-cover border-4 border-white shadow-md"
                  style={{ backgroundImage: `url(${testimonial.image})` }}
                />
                <div className="text-2xl text-cyan-400 mb-4">
                  {testimonial.rating}
                </div>
                <p className="text-lg italic mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-bold mb-1">{testimonial.author}</p>
                  <p className="text-gray-400 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={(el) => (sectionRefs.current[4] = el)}
        className="py-24 bg-gradient-to-br from-black to-gray-800 text-center text-white w-screen -ml-[calc(50vw-50%)] px-5"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Find or Offer Services in Kenya?
          </h2>
          <p className="text-xl mb-10 text-white text-opacity-80">
            Join thousands of satisfied customers and service providers today.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/signup"
              className="px-8 py-4 bg-white text-black font-bold rounded-full transition-all hover:bg-gray-100 hover:shadow-lg hover:-translate-y-1 transform"
            >
              Sign Up Now
            </Link>
            <Link
              to="/services"
              className="px-8 py-4 bg-transparent text-white font-bold rounded-full border-2 border-white border-opacity-30 transition-all hover:bg-white hover:bg-opacity-15 hover:border-opacity-70 hover:-translate-y-1 transform"
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
