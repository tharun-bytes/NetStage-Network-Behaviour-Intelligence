import React, { useState } from "react";

interface PageBackgroundProps {
  imageSrc: string;
  overlayVariant?: "dark" | "gradient" | "glass" | "subtle";
  opacity?: number;
}

export const PageBackground: React.FC<PageBackgroundProps> = ({
  imageSrc,
  overlayVariant = "dark",
  opacity = 0.22,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
      {/* Base Dark Foundation */}
      <div className="absolute inset-0 bg-[#050816]" />

      {/* Background Graphic Image */}
      {!error && (
        <img
          src={imageSrc}
          alt=""
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`h-full w-full object-cover object-center transition-opacity duration-700 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ opacity }}
        />
      )}

      {/* Cyber Technical Grid Mesh Texture */}
      <div
        className="absolute inset-0 opacity-[0.035] bg-repeat pointer-events-none mix-blend-screen"
        style={{ backgroundImage: `url('/assets/netsage/grid-texture.jpg')`, backgroundSize: "400px" }}
      />

      {/* Gradient Overlays tailored to variant */}
      {overlayVariant === "dark" && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#050816]/75 via-[#050816]/85 to-[#050816]" />
      )}

      {overlayVariant === "gradient" && (
        <div className="absolute inset-0 bg-gradient-to-tr from-[#050816] via-[#050816]/80 to-transparent" />
      )}

      {overlayVariant === "glass" && (
        <div className="absolute inset-0 bg-[#050816]/80 backdrop-blur-[2px]" />
      )}

      {overlayVariant === "subtle" && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/60 to-[#050816]/40" />
      )}
    </div>
  );
};
