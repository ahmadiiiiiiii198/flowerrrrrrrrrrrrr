
import React from "react";

interface AdminLoaderProps {
  message?: string;
}

const AdminLoader: React.FC<AdminLoaderProps> = ({ message = "Loading admin panel..." }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-persian-gold mx-auto"></div>
        <p className="mt-4 text-lg font-medium text-persian-navy">{message}</p>
        <p className="mt-2 text-sm text-gray-500">
          This may take a moment as we connect to the database.
        </p>
      </div>
    </div>
  );
};

export default AdminLoader;
