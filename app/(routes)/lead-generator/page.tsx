"use client";

import { useState, useEffect } from "react";
import BaseLayout from "@/app/components/layout/BaseLayout";
import { Property } from "@/app/types/property";
import axios from "axios";
import BASE_URL from "@/app/urls/urls";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export default function LeadGenerator() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [propertiesPerPage] = useState(8);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("jwt_token");
      const response = await axios.get(`${BASE_URL}/api/getProperties`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProperties(response.data.data);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const filteredProperties = properties.filter(
    (property) =>
      property.address.toLowerCase().includes(searchQuery) ||
      property.name.toLowerCase().includes(searchQuery) ||
      property.type.toLowerCase().includes(searchQuery)
  );

  const indexOfLastProperty = currentPage * propertiesPerPage;
  const indexOfFirstProperty = indexOfLastProperty - propertiesPerPage;
  const currentProperties = filteredProperties.slice(
    indexOfFirstProperty,
    indexOfLastProperty
  );
  const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);

  return (
    <BaseLayout isLoggedIn={true}>
      <div className="container mx-auto px-4 py-8 bg-gradient-to-b from-[#0D0A2C] to-[#1A1744] text-white min-h-screen">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-[#c742a8] to-[#8E2CFF] text-transparent bg-clip-text drop-shadow-lg">
           Lead Generator 
        </h1>

        {/* Search Bar */}
        <div className="mb-8 relative max-w-2xl mx-auto">
          <div className="relative transform hover:scale-[1.01] transition-all duration-300">
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full bg-[#1A1540]/80 backdrop-blur-md text-white p-4 rounded-xl border-2 border-[#c742a8]/50 pl-12
                focus:outline-none focus:ring-2 focus:ring-[#c742a8] focus:border-transparent
                shadow-[0_0_15px_rgba(199,66,168,0.15)] transition-all duration-300"
            />
            <MagnifyingGlassIcon className="h-6 w-6 text-[#c742a8] absolute left-4 top-4 animate-pulse" />
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {currentProperties.map((property) => (
            <div
              key={property.id}
              className="group bg-[#1A1540]/90 backdrop-blur-md rounded-xl overflow-hidden border border-[#c742a8]/30 
                hover:shadow-[0_0_25px_rgba(199,66,168,0.3)] hover:border-[#c742a8]/60 hover:scale-[1.02] 
                transition-all duration-500 ease-out"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={property.image_url || "/placeholder-property.jpg"}
                  alt={property.address}
                  fill
                  className="object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1540] to-transparent opacity-60" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold bg-gradient-to-r from-[#c742a8] to-[#8E2CFF] text-transparent bg-clip-text mb-3">
                  {property.address}
                </h3>
                <p className="text-[#8892b0] text-sm mb-3">{property.locality}</p>
                <p className="text-2xl font-bold text-white mb-4 drop-shadow-glow">
                  ${property.list_price?.toLocaleString()}
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm text-[#8892b0] mb-4">
                  <div className="flex flex-col items-center p-2 rounded-lg bg-[#c742a8]/10">
                    <span className="font-bold text-white mb-1">{property.bedrooms}</span>
                    <span>Beds</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-[#c742a8]/10">
                    <span className="font-bold text-white mb-1">{property.bathrooms}</span>
                    <span>Baths</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-[#c742a8]/10">
                    <span className="font-bold text-white mb-1">{property.sq_ft?.toLocaleString()}</span>
                    <span>sqft</span>
                  </div>
                </div>
                <div className="border-t border-[#c742a8]/20 pt-4 space-y-2">
                  <p className="text-sm flex items-center gap-2">
                    <span className="text-[#c742a8]">Contact:</span>
                    <span className="text-white">{property.name}</span>
                  </p>
                  <p className="text-sm flex items-center gap-2">
                    <span className="text-[#c742a8]">Phone:</span>
                    <span className="text-white">{property.phone_number}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-12 flex justify-center gap-3">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105
                ${currentPage === page
                  ? 'bg-gradient-to-r from-[#c742a8] to-[#8E2CFF] text-white shadow-[0_0_15px_rgba(199,66,168,0.3)]'
                  : 'bg-[#1A1540] text-white hover:bg-[#c742a8]/20 border border-[#c742a8]/30'
                }`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    </BaseLayout>
  );
}

// Add this to your global CSS
// style={{
//   '.drop-shadow-glow': {
//     filter: 'drop-shadow(0 0 10px rgba(199,66,168,0.3))'
//   }
// }}