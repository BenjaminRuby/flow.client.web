import React from "react";
import PropTypes from "prop-types";

const Flow = ({ className, ...rest }) => {
  return (
    <svg
      className={className}
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 32 32"
      aria-hidden="true"
      style={{ willChange: "transform" }}
      {...rest}
    >
      <path d="M20 24h-8.14a4.17 4.17 0 0 0-.43-1L22 12.43a3.86 3.86 0 0 0 2 .57 4 4 0 1 0-3.86-5H14v2h6.14a4.17 4.17 0 0 0 .43 1L10 21.57A3.86 3.86 0 0 0 8 21a4 4 0 1 0 3.86 5H20v3h8v-8h-8zm4-17a2 2 0 1 1-2 2 2 2 0 0 1 2-2zM8 27a2 2 0 1 1 2-2 2 2 0 0 1-2 2zm14-4h4v4h-4zM7.05 15.75a9 9 0 0 1 0-13.5l1.32 1.5a7 7 0 0 0 0 10.5z"></path>
      <path d="M9.69 12.75a5 5 0 0 1 0-7.5L11 6.75a3 3 0 0 0 0 4.5z"></path>
    </svg>
  );
};

Flow.propTypes = {
  className: PropTypes.string
};

export default Flow;