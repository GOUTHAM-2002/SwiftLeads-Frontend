import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

interface ModalProps {
  campaign: Campaign;
  onClose: () => void;
  onSave: (updatedCampaign: Campaign) => void;
  onDelete: (campaignId: string) => void;
}

const Modal: React.FC<ModalProps> = ({ campaign, onClose, onSave, onDelete }) => {
  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description);
  const [callWindowStart, setCallWindowStart] = useState(campaign.call_window_start);
  const [callWindowEnd, setCallWindowEnd] = useState(campaign.call_window_end);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !description || !callWindowStart || !callWindowEnd) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        ...campaign,
        name,
        description,
        call_window_start: callWindowStart,
        call_window_end: callWindowEnd,
      });
      toast.success('Campaign updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      setIsLoading(true);
      try {
        await onDelete(campaign.id);
        toast.success('Campaign deleted successfully');
        onClose();
      } catch (error) {
        toast.error('Failed to delete campaign');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1A1540] rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6">Edit Campaign</h2>

        <div className="mb-4">
          <label className="block text-white mb-2">Campaign Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 bg-white/10 border border-[#C742A8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#C742A8]/50"
            placeholder="Enter campaign name"
          />
        </div>

        <div className="mb-4">
          <label className="block text-white mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 bg-white/10 border border-[#C742A8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#C742A8]/50"
            placeholder="Enter campaign description"
            rows={3}
          />
        </div>

        <div className="mb-4">
          <label className="block text-white mb-2">Call Window Start</label>
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
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal; 