import { useEffect, useRef } from "react";
import { FaHandshake, FaBolt, FaShieldAlt } from "react-icons/fa";

function About() {
  const sectionRef = useRef(null);
  const cardRefs = useRef([]);

  // Animate section and cards on load
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fadeInUp");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
      cardRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div
        ref={sectionRef}
        className="w-full max-w-4xl bg-gray-800 rounded-xl p-8 sm:p-10 shadow-2xl border border-white border-opacity-10 opacity-0"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-6 text-center animate-fadeInUp">
          About ServiceSoko
        </h1>

        <div className="mb-8 animate-fadeInUp animation-delay-200">
          <p className="text-base sm:text-lg text-gray-400 leading-relaxed mb-6">
            ServiceSoko is a trusted platform designed to bridge the gap between
            service providers and customers in Kenya. Whether you're a skilled
            worker looking for clients or someone in need of reliable services
            like plumbing, electrical repairs, or cleaning—we make it easy and
            safe to connect.
          </p>
          <p className="text-base sm:text-lg text-gray-400 leading-relaxed">
            Our mission is to create a simple, digital solution that empowers
            both sides of the service economy. We believe in transparency,
            affordability, and convenience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <FaHandshake className="text-cyan-400 text-2xl" />,
              title: "Trusted Platform",
              description: "Verified professionals and secure transactions",
            },
            {
              icon: <FaBolt className="text-cyan-400 text-2xl" />,
              title: "Quick Connections",
              description: "Find or offer services in minutes",
            },
            {
              icon: <FaShieldAlt className="text-cyan-400 text-2xl" />,
              title: "Safe & Secure",
              description: "Your safety and privacy are our priority",
            },
          ].map((feature, index) => (
            <div
              key={index}
              ref={(el) => (cardRefs.current[index] = el)}
              className="bg-gray-700 rounded-lg p-6 text-center border border-white border-opacity-5 hover:shadow-xl hover:-translate-y-1 hover:scale-105 transition-all duration-300 opacity-0"
            >
              <div className="w-14 h-14 bg-cyan-400 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-base">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default About;
