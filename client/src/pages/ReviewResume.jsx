import { FileText, Sparkles } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import Markdown from "react-markdown";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const ReviewResume = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");

  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!file) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("resume", file);

      const token = await getToken();

      const { data } = await axios.post(
        "/api/ai/resume-review",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        setContent(data.content);
        toast.success("Resume reviewed successfully!");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">
      {/* Left */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#00DA83]" />
          <h1 className="font-semibold text-xl">Resume Review</h1>
        </div>

        <p className="mt-6 font-medium text-sm">Upload Resume</p>
        <input
          type="file"
          accept="application/pdf"
          required
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full p-2 px-3 mt-2 text-sm rounded-md border border-gray-300"
        />

        <p className="text-xs text-gray-500 mt-1">
          Supports PDF only (max 5MB)
        </p>

        <button
          disabled={loading}
          className="w-full mt-6 py-2 flex items-center justify-center gap-2 rounded-lg text-white bg-gradient-to-r from-[#00DA83] to-[#009BB3]"
        >
          {loading ? (
            <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" />
          ) : (
            <FileText className="w-5" />
          )}
          Review Resume
        </button>
      </form>

      {/* Right */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 min-h-96 max-h-[600px] flex flex-col">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-[#00DA83]" />
          <h1 className="text-lg font-semibold">Analysis Results</h1>
        </div>

        {!content ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm gap-3">
            <FileText className="w-8 h-8" />
            <p>Upload a resume to see results</p>
          </div>
        ) : (
          <div className="mt-3 h-full overflow-y-auto text-sm text-slate-600 reset-tw">
            <Markdown>{content}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewResume;
