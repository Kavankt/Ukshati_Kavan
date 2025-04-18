import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic"; // Import dynamic to handle client-side rendering
import StarryBackground from "@/components/StarryBackground";
import { FiUsers, FiBell, FiPackage } from "react-icons/fi";
import { motion } from "framer-motion";
import BackButton from "@/components/BackButton";
import Footer from "@/components/Footer";

const HomePage = () => {
  const [notification, setNotification] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Ensures hydration is client-side only
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleButtonClick = (section) => {
    setNotification(`Navigating to ${section}...`);
  };

  if (!isClient) return null; // Prevents server-side mismatch

  return (
    <div className="min-h-screen relative overflow-hidden">
      <StarryBackground />
      <BackButton route="/dashboard" />
      <div className="flex flex-col items-center flex-grow pt-20">
        <h1 className="text-4xl font-bold mb-0 mt-8 text-center text-white">Customer Relationship Management</h1>

      {/* Notification System */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 bg-gray-800/80 text-white px-6 py-3 rounded-lg backdrop-blur-sm shadow-lg"
        >
          {notification}
        </motion.div>
      )}
      {/* Main Content */}
      <motion.div 
        className="flex justify-center items-center min-h-[60vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-20 max-w-6xl">
          <Link href="/crm/customers" passHref>
            <motion.a 
              className="card"
              whileHover={{ scale: 1.05 }}
              onClick={() => handleButtonClick("Customers")}
            >
              <div className="heading">
                <FiUsers className="w-12 h-12 mx-auto mb-4" />
                <h2>Customers</h2>
              </div>
              <p>Manage client relationships and interactions</p>
              <p>Click to explore</p>
            </motion.a>
          </Link>

          <Link href="/reminders" passHref>
            <motion.a 
              className="card"
              whileHover={{ scale: 1.05 }}
              onClick={() => handleButtonClick("Reminders")}
            >
              <div className="heading">
                <FiBell className="w-12 h-12 mx-auto mb-4" />
                <h2>Reminders</h2>
              </div>
              <p>Track important tasks and deadlines</p>
              <p>Click to explore</p>
            </motion.a>
          </Link>

          <Link href="/crm/project" passHref>
            <motion.a 
              className="card"
              whileHover={{ scale: 1.05 }}
              onClick={() => handleButtonClick("Projects")}
            >
              <div className="heading">
                <FiPackage className="w-12 h-12 mx-auto mb-4" />
                <h2>Projects</h2>
              </div>
              <p>Monitor ongoing and upcoming initiatives</p>
              <p>Click to explore</p>
            </motion.a>
          </Link>
        </div>
      </motion.div>
      <Footer/>
      <style jsx global>{`
        body {
          background: linear-gradient(to bottom right, #0f172a, #1e293b);
          color: white;
        }

        .card {
          position: relative;
          width: 190px;
          height: 254px;
          background-color: #000;
          display: flex;
          flex-direction: column;
          justify-content: end;
          padding: 12px;
          gap: 12px;
          border-radius: 8px;
          cursor: pointer;
        }

        .card::before {
          content: '';
          position: absolute;
          inset: 0;
          left: -5px;
          margin: auto;
          width: 200px;
          height: 264px;
          border-radius: 10px;
          background: linear-gradient(-45deg, #e81cff 0%, #40c9ff 100% );
          z-index: -10;
          pointer-events: none;
          transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .card::after {
          content: "";
          z-index: -1;
          position: absolute;
          inset: 0;
          background: linear-gradient(-45deg, #fc00ff 0%, #00dbde 100% );
          transform: translate3d(0, 0, 0) scale(0.95);
          filter: blur(20px);
        }

        .heading {
          font-size: 20px;
          text-transform: capitalize;
          font-weight: 700;
        }

        .card p:not(.heading) {
          font-size: 14px;
        }

        .card p:last-child {
          color: #e81cff;
          font-weight: 600;
        }

        .card:hover::after {
          filter: blur(30px);
        }

        .card:hover::before {
          transform: rotate(-90deg) scaleX(1.34) scaleY(0.77);
        }
      `}</style>
    </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(HomePage), { ssr: false }); 
