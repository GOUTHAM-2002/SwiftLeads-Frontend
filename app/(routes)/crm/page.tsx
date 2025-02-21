"use client";

import axios from "axios";
import { Parser } from "json2csv";
import { useState, useEffect, useRef } from "react";
import BaseLayout from "@/app/components/layout/BaseLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhone,
  faEnvelope,
  faUser,
  faEdit,
  faTrash,
  faEye, // Ensure this is imported
  faXmark,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import BASE_URL from "@/app/urls/urls";

interface CSVContact {
  phone: string;
  name: string;
  email?: string;
  campaign?: string;
  business_name?: string;
  title?: string;
  website?: string;
  linkedin?: string;
  source?: string;
  timezone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  pipeline_stage?: string;
  status?: string;
  created_date?: string;
  last_updated?: string;
  notes?: string;
  last_called?: string;
  total_calls?: number;
  successful_calls?: number;
  total_call_duration?: string;
  voicemail_count?: number;
  last_voicemail_date?: string;
  total_voicemail_duration?: string;
  call_summary?: string;
  call_transcript?: string;
  success_evaluation?: string;
  end_reason?: string;
  recording_urls?: string;
  duration_seconds?: number;
  total_cost?: number;
  speech_to_text_cost?: number;
  llm_cost?: number;
  text_to_speech_cost?: number;
  vapi_cost?: number;
  hot_lead?: boolean;
}

interface Contact {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: string; // Changed from specific union to more flexible string
  campaign: string;
  last_called?: string;
  duration?: string;
  cost?: number;
  total_calls?: number; // Added to match potential backend structure
}

export default function CRM() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState({
    show: false,
    message: "",
    type: "" as "success" | "error" | "",
  });
  const [importedContacts, setImportedContacts] = useState<CSVContact[]>([]);
  const [showImportedData, setShowImportedData] = useState(false);
  const [selectedImportedContacts, setSelectedImportedContacts] = useState<
    number[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [callWindowStart, setCallWindowStart] = useState("");
  const [callWindowEnd, setCallWindowEnd] = useState("");
  const [showCampaignListModal, setShowCampaignListModal] = useState(false);
  const [campaignList, setCampaignList] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [contactsPerPage] = useState(10);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const indexOfLastContact = currentPage * contactsPerPage;
  const indexOfFirstContact = indexOfLastContact - contactsPerPage;
  const currentContacts = contacts.slice(
    indexOfFirstContact,
    indexOfLastContact
  );
  const totalPages = Math.ceil(contacts.length / contactsPerPage);

  const handleCreateCampaign = async () => {
    // Get user_id and token from localStorage
    const userId = localStorage.getItem("user_id");
    const token = localStorage.getItem("jwt_token");

    // Validate inputs
    if (
      !campaignName ||
      !campaignDescription ||
      !callWindowStart ||
      !callWindowEnd
    ) {
      showNotification("Please fill in all campaign details", "error");
      return;
    }

    try {
      setIsLoading(true);

      // Prepare campaign data using userId from localStorage
      const campaignData = {
        user_id: userId, // Use userId from localStorage
        name: campaignName,
        description: campaignDescription,
        call_window_start: callWindowStart,
        call_window_end: callWindowEnd,
      };

      // Get selected contacts with full details
      const campaignInfoData = selectedContacts
        .map((contactId) =>
          contacts.find((contact) => contact.id === contactId)
        )
        .filter((contact) => contact !== undefined); // Remove any undefined entries

      // Make API request with Authorization header
      const response = await axios.post(
        `${BASE_URL}/api/createCampaign`,
        {
          campaignData,
          campaignInfoData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Add Authorization header
          },
        }
      );

      // Handle successful response
      showNotification("Campaign created successfully", "success");
      setShowCreateCampaignModal(false);

      // Reset form
      setCampaignName("");
      setCampaignDescription("");
      setCallWindowStart("");
      setCallWindowEnd("");
    } catch (error) {
      console.error("Error creating campaign:", error);

      // More detailed error logging
      if (axios.isAxiosError(error)) {
        console.error("Axios Error Details:", {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
        });
      }

      showNotification("Failed to create campaign", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      setIsLoading(true);

      // Get user_id from localStorage
      const userId = localStorage.getItem("user_id");

      // Get JWT token from localStorage
      const token = localStorage.getItem("jwt_token");

      // Verify userId exists
      if (!userId) {
        showNotification("User ID not found", "error");
        return;
      }

      const response = await axios.get(`${BASE_URL}/api/getContacts`, {
        params: {
          user_id: userId,
        },
        headers: {
          Authorization: `Bearer ${token}`, // Add Authorization header
        },
      });

      const data = response.data.data;
      setContacts(
        data.map((contact: Contact) => ({
          ...contact,
          status: contact.status || "pending", // Provide a default status
        }))
      );
    } catch (error) {
      console.error("Error fetching contacts:", error);

      // More detailed error logging
      if (axios.isAxiosError(error)) {
        console.error("Axios Error Details:", {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
        });
      }

      showNotification("Error fetching contacts", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    // Client-side filtering
    const filteredContacts = contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.phone.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query)
    );
  };

  const exportCSV = async () => {
    try {
      setIsLoading(true);

      // Get user_id from localStorage
      const userId = localStorage.getItem("user_id");

      // Get JWT token from localStorage
      const token = localStorage.getItem("jwt_token");

      // Verify userId exists
      if (!userId) {
        showNotification("User ID not found", "error");
        return;
      }

      // Fetch campaign list using axios with Authorization header
      const campaignResponse = await axios.get(
        `${BASE_URL}/api/getCampaignList`,
        {
          params: {
            user_id: userId,
          },
          headers: {
            Authorization: `Bearer ${token}`, // Add Authorization header
          },
        }
      );

      // Set campaign list and show modal
      setCampaignList(campaignResponse.data.data);
      setShowCampaignListModal(true);
    } catch (error) {
      console.error("Error fetching campaign list:", error);

      // More detailed error logging
      if (axios.isAxiosError(error)) {
        console.error("Axios Error Details:", {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
        });
      }

      showNotification("Failed to fetch campaigns", "error");
    } finally {
      setIsLoading(false);
    }
  };
  // New function to export campaign contacts to CSV
  const exportCampaignToCSV = async () => {
    if (!selectedCampaign) {
      showNotification("Please select a campaign", "error");
      return;
    }

    try {
      setIsLoading(true);

      // Get user_id from localStorage
      const userId = localStorage.getItem("user_id");

      // Get JWT token from localStorage
      const token = localStorage.getItem("jwt_token");

      // Verify userId exists
      if (!userId) {
        showNotification("User ID not found", "error");
        return;
      }

      // Fetch campaign details using axios with Authorization header
      const campaignDetailsResponse = await axios.get(
        `${BASE_URL}/api/getCampaignDeets`,
        {
          params: {
            campaign_id: selectedCampaign,
            user_id: userId, // Include user_id in params
          },
          headers: {
            Authorization: `Bearer ${token}`, // Add Authorization header
          },
        }
      );

      const contacts = campaignDetailsResponse.data.data;

      // Use json2csv to convert contacts to CSV
      const parser = new Parser();
      const csvContent = parser.parse(contacts);

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `campaign_${selectedCampaign}_contacts.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Close modal and show success notification
      setShowCampaignListModal(false);
      showNotification("Campaign contacts exported successfully", "success");
    } catch (error) {
      console.error("Error exporting campaign contacts:", error);

      // More detailed error logging
      if (axios.isAxiosError(error)) {
        console.error("Axios Error Details:", {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
        });
      }

      showNotification("Failed to export campaign contacts", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Add this new function to handle hot leads export
  const exportHotLeadsToCSV = async () => {
    if (!selectedCampaign) {
      showNotification("Please select a campaign", "error");
      return;
    }

    try {
      setIsLoading(true);
      const userId = localStorage.getItem("user_id");
      const token = localStorage.getItem("jwt_token");

      if (!userId) {
        showNotification("User ID not found", "error");
        return;
      }

      const campaignDetailsResponse = await axios.get(
        `${BASE_URL}/api/getCampaignDeets`,
        {
          params: {
            campaign_id: selectedCampaign,
            user_id: userId,
            hot_leads_only: true, // New parameter to filter hot leads
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const hotLeads = campaignDetailsResponse.data.data.filter(
        (contact: any) => contact.hot_lead === true
      );

      if (hotLeads.length === 0) {
        alert("No hot leads found in this campaign");
        return;
      }

      // Use json2csv to convert contacts to CSV
      const parser = new Parser();
      const csvContent = parser.parse(hotLeads);

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `campaign_${selectedCampaign}_hot_leads.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowCampaignListModal(false);
      showNotification("Hot leads exported successfully", "success");
    } catch (error) {
      console.error("Error exporting hot leads:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios Error Details:", {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
        });
      }
      showNotification("Failed to export hot leads", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsLoading(true);

        // Get user_id from localStorage
        const userId = localStorage.getItem("user_id");

        // Get JWT token from localStorage
        const token = localStorage.getItem("jwt_token");

        // Verify userId exists
        if (!userId) {
          showNotification("User ID not found", "error");
          return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
          const csvText = event.target?.result as string;
          const contacts = parseCSV(csvText);

          if (contacts && contacts.length > 0) {
            try {
              // Make API request with Authorization header
              const response = await axios.post(
                `${BASE_URL}/api/addContacts`,
                {
                  contacts,
                  user_id: userId,
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`, // Add Authorization header
                  },
                }
              );

              // Handle successful response
              setImportedContacts(contacts);
              setShowImportedData(true);
              showNotification(
                `${contacts.length} contacts imported successfully`,
                "success"
              );

              // Optional: Refresh contacts list
              await fetchContacts();
            } catch (apiError) {
              console.error("Error adding contacts:", apiError);

              // More detailed error logging
              if (axios.isAxiosError(apiError)) {
                console.error("Axios Error Details:", {
                  response: apiError.response?.data,
                  status: apiError.response?.status,
                  headers: apiError.response?.headers,
                });
              }

              showNotification("Failed to add contacts", "error");
            }
          }
        };

        reader.onerror = () => {
          showNotification("Error reading CSV file", "error");
        };

        reader.readAsText(file);
      } catch (error) {
        console.error("CSV Import Error:", error);
        showNotification("Failed to import CSV", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Modify parseCSV to be more flexible
  const parseCSV = (csvText: string): any[] | null => {
    const lines = csvText.split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());

    // Validate required fields
    if (!headers.includes("phone") || !headers.includes("name")) {
      showNotification("CSV must include phone and name columns", "error");
      return null;
    }

    const contacts: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(",").map((v) => v.trim());
      const contact: any = {};

      headers.forEach((header, index) => {
        contact[header] = values[index] || undefined;
      });

      if (!contact.phone || !contact.name) {
        showNotification(
          `Row ${i} missing required fields (phone or name)`,
          "error"
        );
        continue;
      }

      contacts.push(contact);
    }

    return contacts;
  };

  // Toast notification helper
  const showNotification = (message: string, type: "success" | "error") => {
    setShowToast({ show: true, message, type });
    setTimeout(
      () => setShowToast({ show: false, message: "", type: "" }),
      3000
    );
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const Pagination = () => {
    return (
      <div className="flex justify-center items-center gap-2 mt-4 mb-8">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md bg-[#C742A8]/20 text-[#C742A8] disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-white">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md bg-[#C742A8]/20 text-[#C742A8] disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  };

  const saveContactChanges = async () => {
    if (!editContact) return;

    try {
      const response = await axios.put(
        `${BASE_URL}/api/editContact`,
        editContact
      );
      if (response.status === 200) {
        setContacts((prev) =>
          prev.map((c) => (c.id === editContact.id ? editContact : c))
        );
        setShowEditModal(false);
        showNotification("Contact updated successfully", "success");
      }
    } catch (error) {
      showNotification("Failed to update contact", "error");
    }
  };

  return (
    <BaseLayout isLoggedIn={true}>
      <div className="p-8 min-h-screen bg-[#0D0A2C]">
        {/* Loading Indicator */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-[#C742A8]"></div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">CRM System</h2>
          <p className="text-gray-400">Lead Management System</p>
        </div>

        {/* Search and Actions */}
        <div className="mb-8 relative max-w-4xl mx-auto transform hover:scale-[1.01] transition-all duration-300">
          <input
            type="text"
            className="w-full p-4 pl-12 border-2 border-[#C742A8]/30 rounded-xl 
              bg-gradient-to-r from-[#1A1540]/80 to-[#2A1B4A]/80 
              backdrop-blur-lg text-white 
              focus:outline-none focus:ring-2 focus:ring-[#C742A8]/50 focus:border-[#C742A8]/50
              shadow-[0_0_15px_rgba(199,66,168,0.15)]
              transition-all duration-300
              text-lg placeholder:text-gray-400"
            placeholder=" Search by name, email, or phone..."
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#C742A8]/10 to-[#8E2CFF]/10 rounded-xl blur-xl transition-opacity duration-300 opacity-50 group-hover:opacity-100"></div>
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <svg
              className="w-5 h-5 text-[#C742A8] animate-pulse"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        {/* Contacts Table */}
        {/* Contacts Table */}
        <div className="bg-gradient-to-r from-[#0D0A2C]/95 to-[#1A1540]/95 rounded-2xl border border-[#C742A8]/30 overflow-hidden shadow-2xl backdrop-blur-xl">
          {/* Table Header with Actions */}
          <div className="flex justify-between items-center p-6 border-b border-[#C742A8]/20 bg-gradient-to-r from-[#1A1540]/50 to-[#2A1B4A]/50">
            <div className="flex items-center gap-6">
              <button
                onClick={() => {
                  setSelectedContacts(
                    selectedContacts.length === contacts.length
                      ? []
                      : contacts.map((contact) => contact.id)
                  );
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-[#C742A8]/20 to-[#8E2CFF]/20 text-white rounded-xl
                  hover:from-[#C742A8]/30 hover:to-[#8E2CFF]/30 transition-all duration-300 transform hover:scale-105
                  shadow-lg shadow-[#C742A8]/10 backdrop-blur-sm font-medium"
              >
                {selectedContacts.length === contacts.length
                  ? "✨ Deselect All"
                  : "✨ Select All"}
              </button>
              {selectedContacts.length > 0 && (
                <div className="text-white text-sm bg-[#C742A8]/10 px-4 py-2 rounded-full border border-[#C742A8]/20
                  shadow-inner backdrop-blur-sm">
                  {selectedContacts.length} contacts selected
                </div>
              )}
            </div>
            <div className="flex gap-6">
              <button
                onClick={() => setShowCreateCampaignModal(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 
                  rounded-xl hover:from-emerald-500/30 hover:to-green-500/30 transition-all duration-300 
                  transform hover:scale-105 shadow-lg shadow-emerald-500/10 backdrop-blur-sm font-medium
                  disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                disabled={selectedContacts.length === 0}
              >
                <span className="text-lg">✦</span> Create Campaign
              </button>
              <div className="flex gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv"
                  onChange={handleCSVImport}
                />
                <button
                  className="px-6 py-2.5 bg-gradient-to-r from-[#C742A8]/20 to-[#8E2CFF]/20 text-white 
                    rounded-xl hover:from-[#C742A8]/30 hover:to-[#8E2CFF]/30 transition-all duration-300 
                    transform hover:scale-105 shadow-lg shadow-[#C742A8]/10 backdrop-blur-sm font-medium
                    flex items-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="text-lg">📤</span> Import CSV
                </button>
                <button
                  onClick={exportCSV}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#C742A8]/20 to-[#8E2CFF]/20 text-white 
                    rounded-xl hover:from-[#C742A8]/30 hover:to-[#8E2CFF]/30 transition-all duration-300 
                    transform hover:scale-105 shadow-lg shadow-[#C742A8]/10 backdrop-blur-sm font-medium
                    flex items-center gap-2"
                >
                  <span className="text-lg">📥</span> Export to CSV
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
           {/* Enhanced Luxury Table */}
           <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[#C742A8]/5 to-[#8E2CFF]/5 text-gray-300 border-b border-[#C742A8]/20">
                  <th className="p-6 text-left w-12">
                    <div className="relative group">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-[#C742A8] bg-[#0D0A2C] border-2 border-[#C742A8]/30 rounded 
                          transition-all duration-300 ease-in-out
                          checked:border-[#C742A8] checked:bg-[#C742A8]/20
                          hover:border-[#C742A8] focus:ring-2 focus:ring-[#C742A8]/50"
                        checked={selectedContacts.length === contacts.length}
                        onChange={() => {
                          setSelectedContacts(
                            selectedContacts.length === contacts.length
                              ? []
                              : contacts.map((contact) => contact.id)
                          );
                        }}
                      />
                      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#C742A8]/10 to-[#8E2CFF]/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </th>
                  <th className="p-6 text-left font-medium tracking-wider text-sm uppercase">Name</th>
                  <th className="p-6 text-left font-medium tracking-wider text-sm uppercase">Phone</th>
                  <th className="p-6 text-left font-medium tracking-wider text-sm uppercase">Email</th>
                  <th className="p-6 text-left font-medium tracking-wider text-sm uppercase">Status</th>
                  <th className="p-6 text-left font-medium tracking-wider text-sm uppercase">Last Called</th>
                  <th className="p-6 text-left font-medium tracking-wider text-sm uppercase">Total Calls</th>
                  <th className="p-6 text-left font-medium tracking-wider text-sm uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C742A8]/10">
                {currentContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="group transition-all duration-300 hover:bg-gradient-to-r from-[#C742A8]/5 to-[#8E2CFF]/5 backdrop-blur-sm"
                  >
                    <td className="p-6">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-[#C742A8] bg-[#0D0A2C] border-2 border-[#C742A8]/30 rounded 
                            transition-all duration-300 ease-in-out
                            checked:border-[#C742A8] checked:bg-[#C742A8]/20
                            hover:border-[#C742A8] focus:ring-2 focus:ring-[#C742A8]/50"
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => {
                            setSelectedContacts((prev) =>
                              prev.includes(contact.id)
                                ? prev.filter((id) => id !== contact.id)
                                : [...prev, contact.id]
                            );
                          }}
                        />
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-white font-medium group-hover:text-[#C742A8] transition-colors duration-300">
                        {contact.name}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-white/80 group-hover:text-white transition-colors duration-300">
                        {contact.phone}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-white/80 group-hover:text-white transition-colors duration-300">
                        {contact.email || "-"}
                      </div>
                    </td>
                    <td className="p-6">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase
                          backdrop-blur-md shadow-lg transition-all duration-300 
                          ${
                            contact.status === "completed"
                              ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : contact.status === "pending"
                              ? "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-amber-400 border border-yellow-500/20"
                              : "bg-gradient-to-r from-red-500/10 to-rose-500/10 text-rose-400 border border-red-500/20"
                          }`}
                      >
                        {contact.status}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="text-white/80 group-hover:text-white transition-colors duration-300">
                        {contact.last_called || "-"}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-white/80 group-hover:text-white transition-colors duration-300">
                        {contact.total_calls || 0}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedContact(contact);
                            setShowModal(true);
                          }}
                          className="p-2.5 bg-gradient-to-r from-[#C742A8]/10 to-[#8E2CFF]/10 text-white rounded-lg
                            hover:from-[#C742A8]/20 hover:to-[#8E2CFF]/20 
                            transition-all duration-300 transform hover:scale-105
                            border border-[#C742A8]/20 hover:border-[#C742A8]/40
                            shadow-lg shadow-[#C742A8]/5 hover:shadow-[#C742A8]/10"
                        >
                          <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditContact(contact);
                            setShowEditModal(true);
                          }}
                          className="p-2.5 bg-gradient-to-r from-[#C742A8]/10 to-[#8E2CFF]/10 text-white rounded-lg
                            hover:from-[#C742A8]/20 hover:to-[#8E2CFF]/20 
                            transition-all duration-300 transform hover:scale-105
                            border border-[#C742A8]/20 hover:border-[#C742A8]/40
                            shadow-lg shadow-[#C742A8]/5 hover:shadow-[#C742A8]/10"
                        >
                          <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const response = await axios.delete(
                                `${BASE_URL}/api/deleteContact`,
                                {
                                  params: { contact_id: contact.id },
                                }
                              );
                              if (response.status === 200) {
                                setContacts((prev) =>
                                  prev.filter((c) => c.id !== contact.id)
                                );
                                showNotification(
                                  "Contact deleted successfully",
                                  "success"
                                );
                              }
                            } catch (error) {
                              showNotification(
                                "Failed to delete contact",
                                "error"
                              );
                            }
                          }}
                          className="p-2.5 bg-gradient-to-r from-red-500/10 to-rose-500/10 text-rose-400 rounded-lg
                            hover:from-red-500/20 hover:to-rose-500/20 
                            transition-all duration-300 transform hover:scale-105
                            border border-red-500/20 hover:border-red-500/40
                            shadow-lg shadow-red-500/5 hover:shadow-red-500/10"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination or Total Contacts */}
          <div className="p-4 text-white text-sm">
            Total Contacts: {contacts.length}
          </div>
        </div>

        {showCreateCampaignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1A1540] rounded-xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-6">
                Create Campaign
              </h2>

              <div className="mb-4">
                <label className="block text-white mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full p-2 bg-white/10 border border-[#C742A8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#C742A8]/50"
                  placeholder="Enter campaign name"
                />
              </div>

              <div className="mb-4">
                <label className="block text-white mb-2">Description</label>
                <textarea
                  value={campaignDescription}
                  onChange={(e) => setCampaignDescription(e.target.value)}
                  className="w-full p-2 bg-white/10 border border-[#C742A8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#C742A8]/50"
                  placeholder="Enter campaign description"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-white mb-2">
                  Call Window Start
                </label>
                <input
                  type="time"
                  value={callWindowStart}
                  onChange={(e) => setCallWindowStart(e.target.value)}
                  className="w-full p-2 bg-white/10 border border-[#C742A8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#C742A8]/50"
                />
              </div>

              <div className="mb-6">
                <label className="block text-white mb-2">Call Window End</label>
                <input
                  type="time"
                  value={callWindowEnd}
                  onChange={(e) => setCallWindowEnd(e.target.value)}
                  className="w-full p-2 bg-white/10 border border-[#C742A8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#C742A8]/50"
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowCreateCampaignModal(false)}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCampaign}
                  className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
        {showCampaignListModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1A1540] rounded-xl p-8 w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Select Campaign to Export
                </h2>
                <button
                  onClick={() => setShowCampaignListModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-3">
                  {campaignList.map((campaign) => (
                    <div
                      key={campaign.id}
                      onClick={() => setSelectedCampaign(campaign.id)}
                      className={`p-4 rounded-lg cursor-pointer transition-all transform hover:scale-[1.01] ${
                        selectedCampaign === campaign.id
                          ? "bg-[#C742A8]/30 border-[#C742A8] border"
                          : "bg-white/5 hover:bg-white/10 border border-transparent"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h3 className="text-white text-lg font-medium">
                            {campaign.name}
                          </h3>
                          <p className="text-gray-400 text-sm mt-1">
                            {campaign.description}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm text-gray-400">
                            <span>
                              <FontAwesomeIcon icon={faUser} className="mr-2" />
                              {campaign.total_contacts || 0} Contacts
                            </span>
                            <span>
                              <FontAwesomeIcon
                                icon={faClock}
                                className="mr-2"
                              />
                              {campaign.call_window_start} -{" "}
                              {campaign.call_window_end}
                            </span>
                          </div>
                        </div>
                        <input
                          type="radio"
                          checked={selectedCampaign === campaign.id}
                          onChange={() => setSelectedCampaign(campaign.id)}
                          className="form-radio h-5 w-5 text-[#C742A8] border-gray-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-[#C742A8]/20">
                <button
                  onClick={() => setShowCampaignListModal(false)}
                  className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={exportCampaignToCSV}
                  disabled={!selectedCampaign}
                  className="px-4 py-2 bg-[#C742A8] text-white rounded-lg hover:bg-[#C742A8]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export to CSV
                </button>
                <button
                  onClick={exportHotLeadsToCSV}
                  disabled={!selectedCampaign || isLoading}
                  className="px-4 py-2 bg-[#ff4757] text-white rounded-lg hover:bg-[#ff6b81] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export Hot Leads
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1A1540] rounded-xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-6">
                Edit Contact
              </h2>
              <div className="mb-4">
                <label className="block text-white mb-2">Name</label>
                <input
                  type="text"
                  value={editContact?.name || ""}
                  onChange={(e) =>
                    setEditContact({ ...editContact, name: e.target.value })
                  }
                  className="w-full p-2 bg-white/10 border border-[#C742A8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#C742A8]/50"
                  placeholder="Enter name"
                />
              </div>
              <div className="mb-4">
                <label className="block text-white mb-2">Phone</label>
                <input
                  type="text"
                  value={editContact?.phone || ""}
                  onChange={(e) =>
                    setEditContact({ ...editContact, phone: e.target.value })
                  }
                  className="w-full p-2 bg-white/10 border border-[#C742A8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#C742A8]/50"
                  placeholder="Enter phone"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={saveContactChanges}
                  className="bg-[#C742A8] text-white px-6 py-2 rounded-lg hover:bg-[#C742A8]/90 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="ml-2 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        <Pagination />

        {/* Toast Notification */}
        {showToast.show && (
          <div
            className={`fixed bottom-8 right-8 px-6 py-4 rounded-lg z-50   
              ${
                showToast.type === "success"
                  ? "bg-green-500/90 text-white"
                  : "bg-red-500/90 text-white"
              }`}
          >
            {showToast.message}
          </div>
        )}
      </div>
    </BaseLayout>
  );
}
