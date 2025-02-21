/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */




"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import {
  PhoneIcon,
  ClockIcon,
  CurrencyDollarIcon,
  FireIcon,
  EyeIcon,
} from "@heroicons/react/24/solid";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import BaseLayout from "@/app/components/layout/BaseLayout";
import BASE_URL from "@/app/urls/urls";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface EndReasonCounts {
  [key: string]: number;
}

interface AnalyticsData {
  end_reason_counts: EndReasonCounts;
  hot_leads: number;
  total_calls: number;
  total_cost: number;
  total_duration: number;
}

interface campaign {
  call_window_end: string;
  call_window_start: string;
  created_at: string;
  description: string;
  id: string;
  name: string;
  updated_at: string;
  user_id: string;
}

interface HotLead {
  id: string;
  campaign_id: string;
  name: string;
  phone: string;
  email: string;

  // Contact Details
  address?: string;
  city?: string;
  country?: string;
  company?: string;
  business_name?: string;
  linkedin?: string;

  // Call Details
  call_summary?: string;
  call_transcript?: string;
  recording_urls?: string[];
  duration_seconds?: number;
  last_called?: string;

  // Lead Qualification
  hot_lead: boolean;
  pipeline_stage?: string;
  end_reason?: string;

  // Cost Tracking
  llm_cost?: number;

  // Timestamps
  created_date: string;
  last_updated: string;
}

export default function Analytics() {
  const [campaignList, setCampaignList] = useState<campaign[]>([]);

  const [selectedCampaign, setSelectedCampaign] = useState<string>("");

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>();

  const [hotLeads, setHotLeads] = useState<HotLead[]>([]);

  //   const callsChartData = {
  //     labels: analyticsData.callsOverTime.map((item) => item.date),
  //     datasets: [
  //       {
  //         label: "Number of Calls",
  //         data: analyticsData.callsOverTime.map((item) => item.count),
  //         borderColor: "#c742a8",
  //         backgroundColor: "rgba(199, 66, 168, 0.1)",
  //         tension: 0.4,
  //         fill: true,
  //       },
  //     ],
  //   };

  const successRateChartData = analyticsData
    ? {
        labels: Object.keys(analyticsData.end_reason_counts),
        datasets: [
          {
            data: Object.values(analyticsData.end_reason_counts),
            backgroundColor: Object.keys(analyticsData.end_reason_counts).map(
              (_, index) => {
                const colors = [
                  "#c742a8", // Vibrant pink
                  "#9C27B0", // Deep purple
                  "#E91E63", // Bright pink
                  "#673AB7", // Deep violet
                  "#FF4081", // Bright pink-magenta
                  "#7C4DFF", // Vibrant violet
                  "#F50057", // Intense pink-red
                  "#6A1B9A", // Dark purple
                  "#D500F9", // Bright magenta
                  "#AA00FF", // Vivid purple
                ];
                return colors[index % colors.length];
              }
            ),
            borderColor: Object.keys(analyticsData.end_reason_counts).map(
              (_, index) => {
                const borderColors = [
                  "#FF1493", // Deep pink
                  "#8A2BE2", // Blue violet
                  "#FF69B4", // Hot pink
                  "#9400D3", // Dark violet
                  "#FF00FF", // Magenta
                  "#8B008B", // Dark magenta
                  "#BA55D3", // Medium orchid
                  "#DA70D6", // Orchid
                  "#D8BFD8", // Thistle
                  "#DDA0DD", // Plum
                ];
                return borderColors[index % borderColors.length];
              }
            ),
            borderWidth: 1,
          },
        ],
      }
    : {
        labels: ["No Data"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["#c742a8"],
            borderColor: ["#FF1493"],
            borderWidth: 1,
          },
        ],
      };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: "#ffffff",
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#ffffff",
        },
      },
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#ffffff",
        },
      },
    },
  };

  const fetchCampaignList = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/getCampaignList`, {
        params: { user_id: localStorage.getItem("user_id") },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
        },
      });
      console.log(response);
      setCampaignList(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getAnalytics = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/getAnalytics`, {
        params: { campaign_id: selectedCampaign },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
        },
      });
      console.log(response);
      setAnalyticsData(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getHotLeads = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/getHotLeads`, {
        params: { campaign_id: selectedCampaign },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
        },
      });
      console.log(response);
      setHotLeads(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleCampaignChange: React.ChangeEventHandler<HTMLSelectElement> = (
    event
  ) => {
    setSelectedCampaign(event.target.value);
    console.log(selectedCampaign);
  };

  useEffect(() => {
    fetchCampaignList();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      getAnalytics();
      getHotLeads();
    }
  }, [selectedCampaign]);

  return (
    <BaseLayout isLoggedIn={true}>
      <div className="container mx-auto px-8 py-12 bg-gradient-to-b from-[#0D0A2C] to-[#1A1540] text-white min-h-screen relative">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-[#C742A8]/10 to-[#8E2CFF]/10 backdrop-blur-3xl"></div>
        
        {/* Content */}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-[#C742A8] to-[#8E2CFF] bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>

          {/* Campaign Selector */}
          <div className="mb-8 max-w-md mx-auto transform hover:scale-[1.01] transition-all duration-300">
            <select
              value={selectedCampaign}
              onChange={handleCampaignChange}
              className="w-full p-4 pl-6 border-2 border-[#C742A8]/30 rounded-xl 
                bg-gradient-to-r from-[#1A1540]/80 to-[#2A1B4A]/80 
                backdrop-blur-lg text-white 
                focus:outline-none focus:ring-2 focus:ring-[#C742A8]/50 focus:border-[#C742A8]/50
                shadow-[0_0_15px_rgba(199,66,168,0.15)]
                transition-all duration-300"
            >
              <option value="" className="bg-[#0D0A2C] text-white">
                ✨ Select a Campaign
              </option>
              {campaignList.map((campaign) => (
                <option
                  key={campaign.id}
                  value={campaign.id}
                  className="bg-[#0D0A2C] text-white"
                >
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              {
                icon: PhoneIcon,
                title: "Total Calls",
                value: analyticsData?.total_calls || 0,
                gradient: "from-[#C742A8] to-[#8E2CFF]",
              },
              {
                icon: ClockIcon,
                title: "Total Duration",
                value: `${analyticsData?.total_duration || 0} mins`,
                gradient: "from-[#FF4081] to-[#7C4DFF]",
              },
              {
                icon: CurrencyDollarIcon,
                title: "Total Cost",
                value: `$${analyticsData?.total_cost || 0}`,
                gradient: "from-[#F50057] to-[#AA00FF]",
              },
              {
                icon: FireIcon,
                title: "Hot Leads",
                value: analyticsData?.hot_leads || 0,
                gradient: "from-[#E91E63] to-[#9C27B0]",
              },
            ].map((card, index) => (
              <div
                key={index}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#C742A8]/20 to-[#8E2CFF]/20 rounded-xl blur-xl transition-opacity duration-300 opacity-50 group-hover:opacity-100"></div>
                <div className="relative bg-gradient-to-r from-[#1A1540]/90 to-[#2A1B4A]/90 rounded-xl p-6
                  border border-[#C742A8]/20 backdrop-blur-xl
                  transform transition-all duration-500 group-hover:scale-[1.02]
                  shadow-[0_0_15px_rgba(199,66,168,0.15)]">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${card.gradient} mr-4`}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white/90">
                      {card.title}
                    </h3>
                  </div>
                  <p className="text-4xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    {card.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Chart containers with enhanced styling */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#C742A8]/20 to-[#8E2CFF]/20 rounded-xl blur-xl transition-opacity duration-300 opacity-50 group-hover:opacity-100"></div>
              <div className="relative bg-gradient-to-r from-[#1A1540]/90 to-[#2A1B4A]/90 rounded-xl p-6
                border border-[#C742A8]/20 backdrop-blur-xl
                transform transition-all duration-500 group-hover:scale-[1.01]">
                <h3 className="text-xl font-semibold mb-6 bg-gradient-to-r from-[#C742A8] to-[#8E2CFF] bg-clip-text text-transparent">
                  Calls Over Time
                </h3>
                {/* <Line data={callsChartData} options={chartOptions} /> */}
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#C742A8]/20 to-[#8E2CFF]/20 rounded-xl blur-xl transition-opacity duration-300 opacity-50 group-hover:opacity-100"></div>
              <div className="relative bg-gradient-to-r from-[#1A1540]/90 to-[#2A1B4A]/90 rounded-xl p-6
                border border-[#C742A8]/20 backdrop-blur-xl
                transform transition-all duration-500 group-hover:scale-[1.01]">
                <h3 className="text-xl font-semibold mb-6 bg-gradient-to-r from-[#C742A8] to-[#8E2CFF] bg-clip-text text-transparent">
                  Success Rate
                </h3>
                <Doughnut data={successRateChartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Hot Leads Table */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#C742A8]/20 to-[#8E2CFF]/20 rounded-xl blur-xl transition-opacity duration-300 opacity-50 group-hover:opacity-100"></div>
            <div className="relative bg-gradient-to-r from-[#1A1540]/90 to-[#2A1B4A]/90 rounded-xl p-6
              border border-[#C742A8]/20 backdrop-blur-xl">
              <h3 className="text-xl font-semibold mb-6 bg-gradient-to-r from-[#C742A8] to-[#8E2CFF] bg-clip-text text-transparent">
                Hot Leads
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#C742A8]/20">
                      <th className="py-4 px-6 text-left text-sm font-semibold text-white/70">Name</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-white/70">Phone</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-white/70">Email</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-white/70 w-1/3">Call Summary</th>
                      <th className="py-4 px-6 text-center text-sm font-semibold text-white/70">Recordings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C742A8]/10">
                    {hotLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="group/row hover:bg-[#C742A8]/5 transition-all duration-300"
                      >
                        <td className="py-4 px-6 text-white/90">{lead.name}</td>
                        <td className="py-4 px-6 text-white/90">{lead.phone}</td>
                        <td className="py-4 px-6 text-white/90">{lead.email || "N/A"}</td>
                        <td className="py-4 px-6 text-white/90">{lead.call_summary || "N/A"}</td>
                        <td className="py-4 px-6 flex justify-center gap-2">
                          {lead.recording_urls &&
                            lead.recording_urls.length > 0 && (
                              <>
                                <button
                                  onClick={() => window.open(lead.recording_urls![0], "_blank")}
                                  className="px-4 py-2 bg-gradient-to-r from-[#C742A8] to-[#8E2CFF] rounded-lg
                                    text-white text-sm font-medium
                                    transform transition-all duration-300 hover:scale-105
                                    shadow-[0_0_10px_rgba(199,66,168,0.3)] hover:shadow-[0_0_15px_rgba(199,66,168,0.5)]"
                                >
                                  Mono
                                </button>
                                {lead.recording_urls.length > 1 && (
                                  <button
                                    onClick={() => window.open(lead.recording_urls![1], "_blank")}
                                    className="px-4 py-2 bg-gradient-to-r from-[#673AB7] to-[#9C27B0] rounded-lg
                                      text-white text-sm font-medium
                                      transform transition-all duration-300 hover:scale-105
                                      shadow-[0_0_10px_rgba(103,58,183,0.3)] hover:shadow-[0_0_15px_rgba(103,58,183,0.5)]"
                                  >
                                    Stereo
                                  </button>
                                )}
                              </>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
