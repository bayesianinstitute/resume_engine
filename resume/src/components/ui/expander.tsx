import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ExpanderProps {
  title: string;
  children: React.ReactNode;
  initialOpen?: boolean; // Allow controlling initial state
}

const Expander: React.FC<ExpanderProps> = ({ title, children, initialOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const toggleExpander = () => {
    setIsOpen(!isOpen);
  };


  return (
    <div className="border rounded-lg shadow-md bg-white dark:bg-gray-800 mb-4 overflow-hidden"> {/* Overflow hidden for smooth animation */}
      <button
        onClick={toggleExpander}
        className="flex justify-between items-center w-full cursor-pointer px-4 py-3 border-b bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {title}
        </h2>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="w-5 h-5 text-gray-500 transform origin-center"
          aria-hidden  // For accessibility, indicate this is decorative
        >
          <ChevronDown /> {/* Only one icon needed, rotation handles open/close state */}
        </motion.div>
      </button>
      <AnimatePresence> {/* For smooth exit animations */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="p-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Expander;