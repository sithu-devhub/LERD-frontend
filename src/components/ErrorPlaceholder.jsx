import React from "react";

const ErrorPlaceholder = ({ status, onRetry }) => {
  let title = "Data not available";
  let subtitle = "We couldn’t fetch the data right now.";
  let iconColor = "text-gray-400";

  if (status.includes("400")) {
    title = "Invalid request";
    subtitle = "Please adjust your filters or try again.";
    iconColor = "text-amber-400";
  } else if (status.includes("401")) {
    title = "Unauthorized";
    subtitle = "Please log in again.";
    iconColor = "text-rose-400";
  } else if (status.includes("403")) {
    title = "Access denied";
    subtitle = "You don’t have permission to view this data.";
    iconColor = "text-rose-400";
  } else if (status.includes("500")) {
    title = "Data not available";
    subtitle = "We couldn’t fetch the data right now. Please try later.";
    iconColor = "text-gray-400";
  } else if (status.includes("NetworkError")) {
    title = "No connection";
    subtitle = "Please check your internet connection.";
    iconColor = "text-gray-400";
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center pt-6 pb-8 h-full w-full bg-gray-50 rounded-2xl border border-gray-100">
      {/* Animated Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-10 w-10 mb-3 ${iconColor} animate-bounce-slow`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.007M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      <h3 className="text-base font-medium text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{subtitle}</p>

      {/* Error code (subtle) */}
      <p className="text-xs text-gray-400 mt-2">({status})</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-sm hover:bg-indigo-100 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorPlaceholder;
