function About() {
  return (
    <div
      style={{
        backgroundColor: "#121212",
        minHeight: "calc(100vh - 80px)",
        padding: "80px 20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          width: "100%",
          backgroundColor: "#1e1e1e",
          borderRadius: "12px",
          padding: "60px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "700",
            marginBottom: "24px",
            color: "#4fc3f7",
            textAlign: "center",
          }}
        >
          About ServiceSoko
        </h1>

        <div style={{ marginBottom: "32px" }}>
          <p
            style={{
              fontSize: "18px",
              color: "rgba(255,255,255,0.8)",
              lineHeight: "1.8",
              marginBottom: "24px",
            }}
          >
            ServiceSoko is a trusted platform designed to bridge the gap between
            service providers and customers in Kenya. Whether you're a skilled
            worker looking for clients or someone in need of reliable services
            like plumbing, electrical repairs, or cleaning—we make it easy and
            safe to connect.
          </p>

          <p
            style={{
              fontSize: "18px",
              color: "rgba(255,255,255,0.8)",
              lineHeight: "1.8",
            }}
          >
            Our mission is to create a simple, digital solution that empowers
            both sides of the service economy. We believe in transparency,
            affordability, and convenience.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "30px",
            marginTop: "40px",
          }}
        >
          {[
            {
              icon: "fas fa-handshake",
              title: "Trusted Platform",
              description: "Verified professionals and secure transactions",
            },
            {
              icon: "fas fa-bolt",
              title: "Quick Connections",
              description: "Find or offer services in minutes",
            },
            {
              icon: "fas fa-shield-alt",
              title: "Safe & Secure",
              description: "Your safety and privacy are our priority",
            },
          ].map((feature, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "#2d2d2d",
                borderRadius: "8px",
                padding: "30px",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  backgroundColor: "rgba(79, 195, 247, 0.1)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <i
                  className={feature.icon}
                  style={{
                    color: "#4fc3f7",
                    fontSize: "24px",
                  }}
                />
              </div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "white",
                  marginBottom: "12px",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: "16px",
                  color: "rgba(255,255,255,0.7)",
                  lineHeight: "1.6",
                  margin: 0,
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default About;
