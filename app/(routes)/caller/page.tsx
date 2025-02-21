/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */


"use client";

import { useState, useEffect } from "react";
import BaseLayout from "@/app/components/layout/BaseLayout";
import axios from "axios";
import BASE_URL from "@/app/urls/urls";
import Modal from "@/app/components/Modal";
import { toast } from "react-hot-toast";

//fixed this via cursor
interface CampaignStats {
  avg_cost_per_call: number;
  campaign_id: string;
  created_date: string;
  hot_leads: number;
  id: string;
  last_updated: string;
  total_calls: number;
  total_cost: number;
  total_duration: string;
  voicemail_count: number;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  call_window_start: string;
  call_window_end: string;
  // Add other campaign fields as needed
}

interface LogEntry {
  timestamp: string;
  message: string;
}

interface CampaignContact {
  user_id: string;
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  last_called?: string;
  total_calls: number;
  call_summary?: string;
  duration_seconds?: number;
  total_cost?: number;
}

export default function Caller() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [timer, setTimer] = useState("00:00:00");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [stats, setStats] = useState({
    total_calls: 0,
    voicemail_count: 0,
    success_evaluation: 0,
    total_duration: "00:00:00",
    avg_duration: "00:00:00",
    total_cost: 0,
    avg_cost: 0,
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [campaignContacts, setCampaignContacts] = useState<CampaignContact[]>(
    []
  );
  const [isCallActive, setIsCallActive] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const updateCampaignStats = async () => {
    if (!selectedCampaign) return;

    try {
      const response = await axios.get(`${BASE_URL}/api/getCampaignStats`, {
        params: { campaign_id: selectedCampaign.id },
      });

      if (response.data.data) {
        const data = response.data.data;
        console.log(data);

        setStats({
          total_calls: data.total_calls || 0,
          voicemail_count: data.voicemail_count || 0,
          success_evaluation: data.hot_leads || 0,
          total_duration: data.total_duration || "00:00:00",
          // Calculate average duration (assuming total_calls is not zero)
          avg_duration:
            data.total_calls > 0
              ? formatDuration(
                  parseDuration(data.total_duration) / data.total_calls
                )
              : "00:00:00",
          total_cost: data.total_cost || 0,
          avg_cost: data.avg_cost_per_call || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching campaign stats:", error);
    }
  };

  const fetchCampaignLogs = async () => {
    if (!selectedCampaign) return; // Ensure a campaign is selected

    try {
      const response = await axios.get(`${BASE_URL}/api/getCampaignLogs`, {
        params: { campaign_id: selectedCampaign.id },
      });

      // Assuming the logs are in response.data.logs
      if (response.data.logs) {
        const newLogs = response.data.logs; // Extracting logs from the response

        // Append new logs to the existing logs
        setLogs((prevLogs) => [
          ...newLogs.map((log: LogEntry) => ({
            timestamp: log.timestamp.trim(), // Trim any extra spaces
            message: log.message,
          })),
          ...prevLogs,
        ]);
      }
    } catch (error) {
      console.error("Error fetching campaign logs:", error);
      setLogs((prevLogs) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          message: "=== Error Loading Campaign Logs ===",
          type: "error",
        },
        ...prevLogs,
      ]);
    }
  };

  // Utility functions for duration handling
  const parseDuration = (durationStr: string): number => {
    // Convert HH:MM:SS to total seconds
    const [hours, minutes, seconds] = durationStr.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const formatDuration = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };
  const fetchCampaigns = async () => {
    try {
      // Get user_id from localStorage
      const userId = localStorage.getItem("user_id");

      // Get JWT token from localStorage
      const token = localStorage.getItem("jwt_token");

      // Make API request with Authorization header
      const response = await axios.get(`${BASE_URL}/api/getCampaignList`, {
        params: { user_id: userId },
        headers: {
          Authorization: `Bearer ${token}`, // Add Authorization header
        },
      });

      if (response.data.data) {
        setCampaigns(response.data.data);

        // Get selected campaign from localStorage
        const selectedCampaignId = localStorage.getItem("selected_campaign");

        // Find and set selected campaign if exists
        if (selectedCampaignId) {
          const matchedCampaign = response.data.data.find(
            (campaign: Campaign) => campaign.id === selectedCampaignId
          );

          if (matchedCampaign) {
            setSelectedCampaign(matchedCampaign);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);

      // More detailed error logging
      if (axios.isAxiosError(error)) {
        console.error("Axios Error Details:", {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
        });
      }
    }
  };

  const fetchCampaignContacts = async (campaignId: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/getCampaignDeets`, {
        params: { campaign_id: campaignId },
      });

      if (response.data.data) {
        console.log(response.data.data);
        setCampaignContacts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching campaign contacts:", error);
      setLogs((prevLogs) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          message: "=== Error Loading Campaign Contacts ===",
          type: "error",
        },
        ...prevLogs,
      ]);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleCampaignSelect = async (campaignId: string) => {
    setSelectedCampaign(campaigns.find((c) => c.id === campaignId) as Campaign);

    if (campaignId) {
      const campaign = campaigns.find((c) => c.id === campaignId);
      const timestamp = new Date().toLocaleTimeString();

      setLogs((prevLogs) => [
        {
          timestamp,
          message: `=== Campaign ${campaign?.name} Selected ===`,
          type: "success",
        },
        {
          timestamp,
          message: "=== Loading Campaign Data ===",
          type: "loading",
        },
        ...prevLogs,
      ]);

      await fetchCampaignContacts(campaignId);

      setLogs((prevLogs) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          message: "=== Campaign Data Loaded ===",
          type: "success",
        },
        ...prevLogs,
      ]);
    }
  };

  const isWithinTimeRange = () => {
    // Get current time in EST/EDT
    const now = new Date();
    const estTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    const currentHour = estTime.getHours();
    const currentMinute = estTime.getMinutes();

    // Parse start and end times
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    // Convert all times to minutes for easier comparison
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;

    console.log("Current time (EST):", `${currentHour}:${currentMinute}`);
    console.log("Start time:", startTime);
    console.log("End time:", endTime);
    console.log("Current minutes:", currentTimeMinutes);
    console.log("Start minutes:", startTimeMinutes);
    console.log("End minutes:", endTimeMinutes);

    return (
      currentTimeMinutes >= startTimeMinutes &&
      currentTimeMinutes <= endTimeMinutes
    );
  };

  const startCalling = async () => {
    if (!selectedCampaign) {
      alert("Please select a campaign first");
      return;
    }

    if (!isWithinTimeRange()) {
      alert(`Calls can only be made between ${startTime} and ${endTime} EST`);
      return;
    }

    try {
      localStorage.setItem("selected_campaign", selectedCampaign.id);
      setIsCallActive(true);
      const response = await axios.post(`${BASE_URL}/api/startCampaignCalls`, {
        campaign_id: selectedCampaign.id,
        user_id: localStorage.getItem("user_id"),
      });

      if (response.status !== 200) {
        throw new Error("Failed to start campaign");
      }
    } catch (error) {
      console.log(error);
      alert("Error starting campaign calls");
      setIsCallActive(false);
    }
  };

  const stopCalling = async () => {
    try {
      await axios.post(`${BASE_URL}/api/stopCampaignCalls`, {
        campaign_id: selectedCampaign?.id,
      });
      setIsCallActive(false);
    } catch (error) {
      alert("Error stopping campaign calls");
    }
  };

  const handleEditClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowModal(true);
  };

  const handleSave = async (updatedCampaign: Campaign) => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/api/campaigns/${updatedCampaign.id}/update`,
        {
          name: updatedCampaign.name,
          description: updatedCampaign.description,
          call_window_start: updatedCampaign.call_window_start,
          call_window_end: updatedCampaign.call_window_end,
        }
      );

      if (response.status === 200) {
        // Update the campaigns list
        setCampaigns((prevCampaigns) =>
          prevCampaigns.map((c) =>
            c.id === updatedCampaign.id ? { ...c, ...updatedCampaign } : c
          )
        );
        setSelectedCampaign(updatedCampaign);
        setShowModal(false);
        toast.success("Campaign updated successfully");
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast.error("Failed to update campaign");
      throw error;
    }
  };

  const handleDelete = async (campaignId: string) => {
    try {
      const response = await axios.delete(
        `${BASE_URL}/api/campaigns/${campaignId}`
      );

      if (response.status === 200) {
        setCampaigns((prevCampaigns) =>
          prevCampaigns.filter((c) => c.id !== campaignId)
        );
        if (selectedCampaign?.id === campaignId) {
          setSelectedCampaign(null);
        }
        setShowModal(false);
        toast.success("Campaign deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error("Failed to delete campaign");
      throw error;
    }
  };

  const handleSingleCall = async (campaignContactId: string) => {
    try {
      // Ensure user_id is available (from your auth context or state)
      const userId = localStorage.getItem("user_id"); // Adjust based on how you store user ID

      if (!userId) {
        toast.error("User not authenticated");
        return;
      }

      const response = await axios.post(`${BASE_URL}/api/singleCall`, {
        user_id: userId,
        campaign_contact_id: campaignContactId,
      });

      // Handle successful response
      toast.success("Call initiated successfully");
    } catch (error) {
      console.error("Error initiating call:", error);
      toast.error("Failed to initiate call");
    }
  };

  useEffect(() => {
    if (selectedCampaign) {
      updateCampaignStats();
      const interval = setInterval(updateCampaignStats, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedCampaign]);

  useEffect(() => {
    fetchCampaigns();
    for (const campaign of campaigns) {
      if (localStorage.getItem("selected_campaign") === campaign.id) {
        setSelectedCampaign(campaign);
        break; // Exit the loop once a match is found
      }
    }
  }, []);

  useEffect(() => {
    // Load saved times from localStorage
    const savedStartTime = localStorage.getItem("campaign_start_time");
    const savedEndTime = localStorage.getItem("campaign_end_time");

    if (savedStartTime) {
      setStartTime(savedStartTime);
    }
    if (savedEndTime) {
      setEndTime(savedEndTime);
    }
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    if (isCallActive) {
      const timeCheck = setInterval(() => {
        if (!isWithinTimeRange()) {
          stopCalling();
          alert("Campaign stopped: Outside of allowed hours");
        }
      }, 60000); // Check every minute

      return () => clearInterval(timeCheck);
    }
  }, [isCallActive]);

  useEffect(() => {
    if (selectedCampaign) {
      // Fetch initial data immediately
      fetchCampaignLogs();
      fetchCampaignContacts(selectedCampaign.id);

      // Set up interval for periodic fetching
      const interval = setInterval(() => {
        fetchCampaignLogs();
        fetchCampaignContacts(selectedCampaign.id);
      }, 10000);

      // Cleanup function to clear interval
      return () => clearInterval(interval);
    }
  }, [selectedCampaign]);

  return (
    <BaseLayout isLoggedIn={true}>
      <div className="caller-container p-8 text-white max-w-[1400px] mx-auto">
        {/* Campaign Selector Section */}
        {/* Campaign Selector Section */}
        <div className="campaign-selector-section bg-gradient-to-br from-[rgba(13,10,44,0.95)] to-[rgba(13,10,44,0.8)] backdrop-blur-lg rounded-2xl border border-[rgba(199,66,168,0.2)] p-10 mb-8 shadow-[0_8px_32px_rgba(199,66,168,0.15)]">
          <div className="section-header mb-8">
            <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-[#c742a8] to-[#e066cc] text-3xl font-bold mb-3">
              Campaign Selection
            </h2>
            <p className="subtitle text-[#8892b0] text-base font-light tracking-wide">
              Select a campaign to start calling
            </p>
          </div>
          <div className="selector-wrapper flex gap-6 items-center">
            <select
              value={selectedCampaign?.id || ""}
              onChange={(e) => handleCampaignSelect(e.target.value)}
              className="campaign-select flex-1 bg-[rgba(13,10,44,0.95)] border-2 border-[rgba(199,66,168,0.3)] text-white p-5 rounded-xl text-lg transition-all duration-300 focus:outline-none focus:border-[#c742a8] focus:shadow-[0_0_20px_rgba(199,66,168,0.2)] backdrop-blur-xl"
            >
              <option value="" className="bg-[rgba(13,10,44,0.95)]">
                Select a campaign
              </option>
              {campaigns.map((campaign) => (
                <option
                  key={campaign.id}
                  value={campaign.id}
                  className="bg-[rgba(13,10,44,0.95)] py-2"
                >
                  {campaign.name}
                </option>
              ))}
            </select>
            <div className="campaign-actions flex gap-4">
              <button
                className="btn-edit group px-8 py-4 rounded-xl text-base flex items-center gap-3 transition-all duration-300 cursor-pointer bg-gradient-to-r from-[rgba(199,66,168,0.1)] to-[rgba(199,66,168,0.2)] border-2 border-[#c742a8] text-[#c742a8] hover:shadow-[0_0_25px_rgba(199,66,168,0.3)] relative overflow-hidden"
                onClick={() =>
                  selectedCampaign && handleEditClick(selectedCampaign)
                }
                disabled={!selectedCampaign}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#c742a8] to-[#e066cc] opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                <i className="fas fa-edit text-lg"></i>
                <span className="font-medium">Edit</span>
              </button>
              <button
                className="btn-delete group px-8 py-4 rounded-xl text-base flex items-center gap-3 transition-all duration-300 cursor-pointer bg-gradient-to-r from-[rgba(244,67,54,0.1)] to-[rgba(244,67,54,0.2)] border-2 border-[#f44336] text-[#f44336] hover:shadow-[0_0_25px_rgba(244,67,54,0.3)] relative overflow-hidden"
                onClick={() =>
                  selectedCampaign && handleDelete(selectedCampaign.id)
                }
                disabled={!selectedCampaign}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#f44336] to-[#ff7961] opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                <i className="fas fa-trash text-lg"></i>
                <span className="font-medium">Delete</span>
              </button>
            </div>
          </div>
        </div>
        {showModal && selectedCampaign && (
          <Modal
            campaign={selectedCampaign}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
        <div className="analytics-dashboard mb-12">
          <div className="analytics-grid grid grid-cols-6 gap-6 mb-6">
            {[
              {
                label: "Total Calls",
                value: stats.total_calls,
                icon: "fa-phone-alt",
              },
              {
                label: "Voicemails",
                value: stats.voicemail_count,
                icon: "fa-voicemail",
              },
              {
                label: "Hot Leads",
                value: stats.success_evaluation,
                icon: "fa-fire",
              },
              {
                label: "Total Duration",
                value: stats.total_duration,
                icon: "fa-clock",
              },
              {
                label: "Avg Duration",
                value: stats.avg_duration,
                icon: "fa-stopwatch",
              },
              {
                label: "Total Cost",
                value: `$${stats.total_cost.toFixed(3)}`,
                icon: "fa-dollar-sign",
              },
            ].map((stat, index) => (
              <div
                key={index}
                className="stat-box group bg-gradient-to-br from-[rgba(13,10,44,0.95)] to-[rgba(13,10,44,0.8)] p-8 rounded-2xl border-2 border-[rgba(199,66,168,0.2)] text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_35px_rgba(199,66,168,0.2)] backdrop-blur-lg relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[rgba(199,66,168,0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <i
                  className={`fas ${stat.icon} text-[#c742a8] text-2xl mb-4 opacity-75 group-hover:opacity-100 transition-opacity duration-300`}
                ></i>
                <h3 className="text-[#c742a8] text-3xl font-bold mb-3 relative z-10">
                  {stat.value}
                </h3>
                <p className="text-[#8892b0] text-sm font-medium tracking-wide relative z-10">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          <div className="stat-box group bg-gradient-to-br from-[rgba(13,10,44,0.95)] to-[rgba(13,10,44,0.8)] p-8 rounded-2xl border-2 border-[rgba(199,66,168,0.2)] text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_35px_rgba(199,66,168,0.2)] backdrop-blur-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(199,66,168,0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <i className="fas fa-chart-line text-[#c742a8] text-2xl mb-4 opacity-75 group-hover:opacity-100 transition-opacity duration-300"></i>
            <h3 className="text-[#c742a8] text-3xl font-bold mb-3 relative z-10">
              ${stats.avg_cost.toFixed(3)}
            </h3>
            <p className="text-[#8892b0] text-sm font-medium tracking-wide relative z-10">
              Average Cost per Call
            </p>
          </div>
        </div>
        {/* Time Controls */}
        <div className="time-controls grid grid-cols-[400px_1fr] gap-8 mt-8">
          {/* Left Side - Timer Section */}
          <div className="time-settings-section bg-gradient-to-br from-[rgba(13,10,44,0.95)] to-[rgba(13,10,44,0.8)] backdrop-blur-lg rounded-2xl border-2 border-[rgba(199,66,168,0.2)] p-10 w-[400px] shadow-[0_8px_32px_rgba(199,66,168,0.15)]">
            <div className="time-group mb-10">
              <label className="block text-transparent bg-clip-text bg-gradient-to-r from-[#c742a8] to-[#e066cc] text-xl font-semibold mb-4">
                Start Time (EST)
              </label>
              <div className="time-display group bg-[rgba(13,10,44,0.95)] border-2 border-[rgba(199,66,168,0.3)] rounded-2xl p-5 px-7 text-5xl font-mono text-white flex items-center justify-between transition-all duration-300 hover:shadow-[0_0_20px_rgba(199,66,168,0.2)] hover:border-[#c742a8]">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    localStorage.setItem("campaign_start_time", e.target.value);
                  }}
                  className="time-input bg-transparent border-none text-inherit text-5xl p-0.5 w-full rounded-md focus:outline-none group-hover:text-[#c742a8] transition-colors duration-300"
                />
              </div>
            </div>

            <div className="time-group mb-10">
              <label className="block text-transparent bg-clip-text bg-gradient-to-r from-[#c742a8] to-[#e066cc] text-xl font-semibold mb-4">
                End Time (EST)
              </label>
              <div className="time-display group bg-[rgba(13,10,44,0.95)] border-2 border-[rgba(199,66,168,0.3)] rounded-2xl p-5 px-7 text-5xl font-mono text-white flex items-center justify-between transition-all duration-300 hover:shadow-[0_0_20px_rgba(199,66,168,0.2)] hover:border-[#c742a8]">
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    localStorage.setItem("campaign_end_time", e.target.value);
                  }}
                  className="time-input bg-transparent border-none text-inherit text-5xl p-0.5 w-full rounded-md focus:outline-none group-hover:text-[#c742a8] transition-colors duration-300"
                />
              </div>
            </div>

            <div className="timer-display relative bg-gradient-to-br from-[rgba(13,10,44,0.95)] to-[rgba(13,10,44,0.8)] rounded-2xl p-8 text-5xl font-mono text-white text-center my-10 border-2 border-[rgba(199,66,168,0.3)] shadow-[0_4px_20px_rgba(199,66,168,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(199,66,168,0.1)] to-transparent opacity-50 rounded-2xl"></div>
              <span className="relative z-10 font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-[#c742a8] to-[#e066cc]">
                {timer}
              </span>
            </div>

            <div className="control-buttons flex gap-6 mt-10">
              <button
                className="btn-start group flex-1 p-6 text-2xl font-bold rounded-2xl cursor-pointer relative overflow-hidden transition-all duration-500 bg-gradient-to-r from-[#4caf50] to-[#45a049] hover:shadow-[0_0_30px_rgba(76,175,80,0.4)]"
                onClick={startCalling}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[rgba(255,255,255,0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative z-10 text-white tracking-wider">
                  START
                </span>
              </button>
              <button
                className="btn-stop group flex-1 p-6 text-2xl font-bold rounded-2xl cursor-pointer relative overflow-hidden transition-all duration-500 bg-gradient-to-r from-[#f44336] to-[#e53935] hover:shadow-[0_0_30px_rgba(244,67,54,0.4)]"
                onClick={stopCalling}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[rgba(255,255,255,0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative z-10 text-white tracking-wider">
                  STOP
                </span>
              </button>
            </div>
          </div>

          {/* Right Side - Campaign Logs */}
          <div className="campaign-logs relative bg-gradient-to-br from-[rgba(13,10,44,0.95)] to-[rgba(13,10,44,0.85)] backdrop-blur-xl rounded-2xl border border-[rgba(199,66,168,0.2)] mt-8 shadow-[0_8px_32px_rgba(199,66,168,0.15)]">
            {/* Decorative elements */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] rounded-2xl pointer-events-none"></div>
            <div className="absolute -inset-[1px] bg-gradient-to-br from-[rgba(199,66,168,0.2)] to-transparent rounded-2xl blur-[2px] pointer-events-none"></div>

            <div className="logs-header relative flex justify-between items-center p-6 border-b border-[rgba(199,66,168,0.15)]">
              <div className="header-content flex items-center gap-4">
                <div className="status-indicator flex items-center gap-3">
                  <span className="status-dot w-2.5 h-2.5 bg-[#4caf50] rounded-full shadow-[0_0_12px_rgba(76,175,80,0.5)] animate-pulse"></span>
                  <span className="log-title bg-gradient-to-r from-[#c742a8] to-[#e066cc] bg-clip-text text-transparent text-lg font-semibold">
                    Campaign Call Logs
                  </span>
                </div>
              </div>
              <button
                className="btn-clear group px-5 py-2.5 bg-[rgba(13,10,44,0.95)] border border-[rgba(199,66,168,0.3)] text-[#8892b0] rounded-xl text-sm font-medium transition-all duration-300 hover:border-[#c742a8] hover:shadow-[0_0_20px_rgba(199,66,168,0.2)] hover:text-white relative overflow-hidden"
                onClick={clearLogs}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#c742a8] to-[#e066cc] opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                <span className="relative z-10 flex items-center gap-2">
                  <i className="fas fa-eraser text-[#c742a8] group-hover:text-white transition-colors duration-300"></i>
                  Clear Logs
                </span>
              </button>
            </div>

            <div className="logs-content relative p-6 max-h-[400px] overflow-y-auto font-mono custom-scrollbar">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="log-entry group flex gap-4 mb-3 text-sm p-3 rounded-xl transition-all duration-300 hover:bg-[rgba(199,66,168,0.1)] border border-transparent hover:border-[rgba(199,66,168,0.2)]"
                >
                  <span className="timestamp text-[#8892b0] whitespace-nowrap font-medium group-hover:text-[#c742a8] transition-colors duration-300">
                    {log.timestamp}
                  </span>

                  <span
                    className={`  
            ${
              log.message.toLowerCase().includes("initiated")
                ? "text-green-500"
                : log.message.toLowerCase().includes("completed")
                ? "text-green-500"
                : "text-white"
            }  
          `}
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Current Campaign Contacts */}
        <div className="current-campaign-contacts bg-gradient-to-br from-[rgba(13,10,44,0.95)] to-[rgba(13,10,44,0.85)] backdrop-blur-xl rounded-2xl border border-[rgba(199,66,168,0.2)] p-8 mt-8 shadow-[0_8px_32px_rgba(199,66,168,0.15)]">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] rounded-2xl pointer-events-none"></div>
          <div className="absolute -inset-[1px] bg-gradient-to-br from-[rgba(199,66,168,0.2)] to-transparent rounded-2xl blur-[2px] pointer-events-none"></div>

          <div className="contacts-header flex justify-between items-center mb-6">
            <div className="header-content">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-[#c742a8] to-[#e066cc] bg-clip-text text-transparent m-0 mb-2">
                Campaign Contacts Results
              </h3>
              <p className="text-[#8892b0] text-sm font-light">
                Track and manage your campaign contacts
              </p>
            </div>
            <div className="contact-stats bg-[rgba(199,66,168,0.1)] px-4 py-2 rounded-xl border border-[rgba(199,66,168,0.2)]">
              <span className="text-[#c742a8] font-medium">
                {campaignContacts.filter((c) => c.status === "completed").length}
                <span className="text-[#8892b0]"> / </span>
                {campaignContacts.length}
                <span className="text-[#8892b0] ml-2 text-sm">Contacted</span>
              </span>
            </div>
          </div>

          <div className="contacts-table-wrapper max-h-[400px] overflow-y-auto mt-4 rounded-xl border border-[rgba(199,66,168,0.15)]">
            <table className="contacts-table w-full border-collapse bg-[rgba(13,10,44,0.9)]">
              <thead>
                <tr className="bg-gradient-to-r from-[rgba(199,66,168,0.1)] to-[rgba(199,66,168,0.05)]">
                  <th className="p-5 text-left border-b border-[rgba(199,66,168,0.2)] text-[#c742a8] font-semibold sticky top-0 backdrop-blur-md backdrop-filter z-10 text-sm uppercase tracking-wider">
                    Name
                  </th>
                  <th className="p-5 text-left border-b border-[rgba(199,66,168,0.2)] text-[#c742a8] font-semibold sticky top-0 backdrop-blur-md backdrop-filter z-10 text-sm uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="p-5 text-left border-b border-[rgba(199,66,168,0.2)] text-[#c742a8] font-semibold sticky top-0 backdrop-blur-md backdrop-filter z-10 text-sm uppercase tracking-wider">
                    Email
                  </th>
                  <th className="p-5 text-left border-b border-[rgba(199,66,168,0.2)] text-[#c742a8] font-semibold sticky top-0 backdrop-blur-md backdrop-filter z-10 text-sm uppercase tracking-wider">
                    Status
                  </th>
                  <th className="p-5 text-left border-b border-[rgba(199,66,168,0.2)] text-[#c742a8] font-semibold sticky top-0 backdrop-blur-md backdrop-filter z-10 text-sm uppercase tracking-wider">
                    Last Called
                  </th>
                  <th className="p-5 text-left border-b border-[rgba(199,66,168,0.2)] text-[#c742a8] font-semibold sticky top-0 backdrop-blur-md backdrop-filter z-10 text-sm uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="p-5 text-left border-b border-[rgba(199,66,168,0.2)] text-[#c742a8] font-semibold sticky top-0 backdrop-blur-md backdrop-filter z-10 text-sm uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="p-5 text-left border-b border-[rgba(199,66,168,0.2)] text-[#c742a8] font-semibold sticky top-0 backdrop-blur-md backdrop-filter z-10 text-sm uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(199,66,168,0.1)]">
                {campaignContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="transition-all duration-300 hover:bg-gradient-to-r hover:from-[rgba(199,66,168,0.1)] hover:to-transparent"
                  >
                    <td className="p-5 text-white font-medium">
                      {contact.name}
                    </td>
                    <td className="p-5 text-[#8892b0]">
                      {contact.phone}
                    </td>
                    <td className="p-5 text-[#8892b0]">
                      {contact.email || "-"}
                    </td>
                    <td className="p-5">
                      <span
                        className={`px-4 py-1.5 rounded-full text-sm font-medium inline-block transition-all duration-300
                        ${
                          contact.status === "pending"
                            ? "bg-gradient-to-r from-[#c742a8] to-[#e066cc] text-white shadow-[0_4px_12px_rgba(199,66,168,0.25)]"
                            : ""
                        }
                        ${
                          contact.status === "completed"
                            ? "bg-gradient-to-r from-[#4caf50] to-[#45a049] text-white shadow-[0_4px_12px_rgba(76,175,80,0.25)]"
                            : ""
                        }`}
                      >
                        {contact.status}
                      </span>
                    </td>
                    <td className="p-5 text-[#8892b0]">
                      {contact.last_called
                        ? new Date(contact.last_called).toLocaleString()
                        : "-"}
                    </td>
                    <td className="p-5 text-[#8892b0]">
                      {contact.duration_seconds
                        ? `${Math.floor(contact.duration_seconds / 60)}m ${
                            contact.duration_seconds % 60
                          }s`
                        : "-"}
                    </td>
                    <td className="p-5 text-[#8892b0]">
                      ${contact.total_cost?.toFixed(3) || "0.000"}
                    </td>
                    <td className="p-5">
                      <button
                        onClick={() => handleSingleCall(contact.id)}
                        className="bg-gradient-to-r from-[#c742a8] to-[#e066cc] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:shadow-[0_4px_12px_rgba(199,66,168,0.35)] hover:translate-y-[-1px] active:translate-y-[0px] flex items-center gap-2"
                      >
                        <i className="fas fa-phone-alt text-xs"></i>
                        Call
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Call Sequence Settings */}
        <div className="call-sequence-settings bg-[rgba(13,10,44,0.8)] rounded-xl border border-[rgba(199,66,168,0.2)] p-8 mt-8">
          <div className="section-header mb-6">
            <h2 className="text-2xl text-white mb-2">Call Sequence Settings</h2>
            <p className="text-[#8892b0] text-sm">
              Configure call timing and protection parameters
            </p>
          </div>

          <div className="sequence-grid grid grid-cols-4 gap-6 mt-6">
            <div className="sequence-card bg-[rgba(13,10,44,0.9)] border border-[rgba(199,66,168,0.2)] rounded-lg overflow-hidden">
              <div className="card-header bg-[rgba(199,66,168,0.1)] p-4 flex items-center gap-3 border-b border-[rgba(199,66,168,0.2)]">
                <i className="fas fa-globe text-[#c742a8] text-lg"></i>
                <h4 className="text-white text-lg m-0">Global Timing</h4>
              </div>
              <div className="card-content p-6">
                <div className="setting-group mb-6">
                  <label className="block text-[#8892b0] mb-2 text-sm">
                    Global Delay
                  </label>
                  <div className="input-container flex items-center gap-2">
                    <input
                      type="number"
                      id="globalDelay"
                      min="5"
                      defaultValue="10"
                      className="flex-1 bg-[rgba(13,10,44,0.8)] border border-[rgba(199,66,168,0.3)] text-white p-3 rounded-md text-sm focus:outline-none focus:border-[#c742a8]"
                    />
                    <div className="text-[#8892b0] text-sm min-w-[60px]">
                      seconds
                    </div>
                  </div>
                </div>
                <div className="setting-group">
                  <label className="block text-[#8892b0] mb-2 text-sm">
                    Daily Call Limit
                  </label>
                  <div className="input-container flex items-center gap-2">
                    <input
                      type="number"
                      id="dailyLimit"
                      min="1"
                      defaultValue="450"
                      className="flex-1 bg-[rgba(13,10,44,0.8)] border border-[rgba(199,66,168,0.3)] text-white p-3 rounded-md text-sm focus:outline-none focus:border-[#c742a8]"
                    />
                    <div className="text-[#8892b0] text-sm min-w-[60px]">
                      calls
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sequence-card bg-[rgba(13,10,44,0.9)] border border-[rgba(199,66,168,0.2)] rounded-lg overflow-hidden">
              <div className="card-header bg-[rgba(199,66,168,0.1)] p-4 flex items-center gap-3 border-b border-[rgba(199,66,168,0.2)]">
                <i className="fas fa-phone-alt text-[#c742a8] text-lg"></i>
                <h4 className="text-white text-lg m-0">Per-Line Settings</h4>
              </div>
              <div className="card-content p-6">
                <div className="setting-group mb-6">
                  <label className="block text-[#8892b0] mb-2 text-sm">
                    Min Delay
                  </label>
                  <div className="input-container flex items-center gap-2">
                    <input
                      type="number"
                      id="minLineDelay"
                      min="5"
                      defaultValue="30"
                      className="flex-1 bg-[rgba(13,10,44,0.8)] border border-[rgba(199,66,168,0.3)] text-white p-3 rounded-md text-sm focus:outline-none focus:border-[#c742a8]"
                    />
                    <div className="text-[#8892b0] text-sm min-w-[60px]">
                      seconds
                    </div>
                  </div>
                </div>
                <div className="setting-group">
                  <label className="block text-[#8892b0] mb-2 text-sm">
                    Max Delay
                  </label>
                  <div className="input-container flex items-center gap-2">
                    <input
                      type="number"
                      id="maxLineDelay"
                      min="5"
                      defaultValue="60"
                      className="flex-1 bg-[rgba(13,10,44,0.8)] border border-[rgba(199,66,168,0.3)] text-white p-3 rounded-md text-sm focus:outline-none focus:border-[#c742a8]"
                    />
                    <div className="text-[#8892b0] text-sm min-w-[60px]">
                      seconds
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sequence-card bg-[rgba(13,10,44,0.9)] border border-[rgba(199,66,168,0.2)] rounded-lg overflow-hidden">
              <div className="card-header bg-[rgba(199,66,168,0.1)] p-4 flex items-center gap-3 border-b border-[rgba(199,66,168,0.2)]">
                <i className="fas fa-shield-alt text-[#c742a8] text-lg"></i>
                <h4 className="text-white text-lg m-0">Area Protection</h4>
              </div>
              <div className="card-content p-6">
                <div className="setting-group">
                  <label className="block text-[#8892b0] mb-2 text-sm">
                    Area Code Delay
                  </label>
                  <div className="input-container flex items-center gap-2">
                    <input
                      type="number"
                      id="areaCodeDelay"
                      min="5"
                      defaultValue="60"
                      className="flex-1 bg-[rgba(13,10,44,0.8)] border border-[rgba(199,66,168,0.3)] text-white p-3 rounded-md text-sm focus:outline-none focus:border-[#c742a8]"
                    />
                    <div className="text-[#8892b0] text-sm min-w-[60px]">
                      seconds
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sequence-card bg-[rgba(13,10,44,0.9)] border border-[rgba(199,66,168,0.2)] rounded-lg overflow-hidden">
              <div className="card-header bg-[rgba(199,66,168,0.1)] p-4 flex items-center gap-3 border-b border-[rgba(199,66,168,0.2)]">
                <i className="fas fa-clock text-[#c742a8] text-lg"></i>
                <h4 className="text-white text-lg m-0">Peak Management</h4>
              </div>
              <div className="card-content p-6">
                <div className="setting-group mb-6">
                  <label className="block text-[#8892b0] mb-2 text-sm">
                    Lunch Start Time
                  </label>
                  <div className="input-container">
                    <input
                      type="time"
                      id="lunchStart"
                      defaultValue="12:00"
                      className="w-full bg-[rgba(13,10,44,0.8)] border border-[rgba(199,66,168,0.3)] text-white p-3 rounded-md text-sm focus:outline-none focus:border-[#c742a8]"
                    />
                  </div>
                </div>
                <div className="setting-group">
                  <label className="block text-[#8892b0] mb-2 text-sm">
                    Lunch End Time
                  </label>
                  <div className="input-container">
                    <input
                      type="time"
                      id="lunchEnd"
                      defaultValue="13:00"
                      className="w-full bg-[rgba(13,10,44,0.8)] border border-[rgba(199,66,168,0.3)] text-white p-3 rounded-md text-sm focus:outline-none focus:border-[#c742a8]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-actions mt-8 flex justify-end">
            <button className="bg-[#c742a8] text-white px-6 py-3 rounded-lg text-base flex items-center gap-2 cursor-pointer transition-all duration-300 hover:bg-[#a93589]">
              <i className="fas fa-save"></i>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
