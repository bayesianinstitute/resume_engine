// components/ui/Modal.tsx

import React, { ReactNode } from "react";

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ children }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 sm:mx-auto p-6 relative">
        {/* Close button */}
        
        {/* Modal content */}
        {children}
      </div>
    </div>
  );
};

export default Modal;
