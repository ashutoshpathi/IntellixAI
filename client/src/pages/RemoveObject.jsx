import { Scissors, Sparkles } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const RemoveObject = () => {
  const [input, setInput] = useState("");
  const [object, setObject] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");

  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (object.split(" ").length > 1) {
      toast.error("Please enter only one object");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("image", input);
      formData.append("object", object);

      const token = await getToken();

      const { data } = await axios.post(
        "/api/ai/remove-image-object",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (data.success) {
        setContent(data.content);
        toast.success("Object removed successfully!");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">
      {/* Left col */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#4A7AFF]" />
          <h1 className="font-semibold text-xl">Object Removal</h1>
        </div>
        <p className="mt-6 font-medium text-sm">Upload image</p>
        <input
          onChange={(e) => {
            setInput(e.target.files[0]);
          }}
          accept="image/*"
          type="file"
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600"
          required
        />
        <p className="mt-4 font-medium text-sm">
          Describe object name to remove
        </p>
        <textarea
          onChange={(e) => {
            setObject(e.target.value);
          }}
          rows={4}
          value={object}
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
          placeholder="e.g.., Watch or spoon, Only single object name"
          required
        />
        <br />
        <button
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 rounded-lg text-white text-sm cursor-pointer border px-4 mt-6 py-2 bg-gradient-to-r from-[#226BFF] to-[#8E37EB]"
        >
          {loading ? (
            <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span>
          ) : (
            <Scissors className="w-5" />
          )}
          Remove Object
        </button>
      </form>

      {/* Right col */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96">
        <div className="flex items-center gap-3">
          <Scissors className="w-5 h-5 text-[#4A7AFF]" />
          <h1 className="text-lg font-semibold">Processed Image</h1>
        </div>
        {!content ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-sm flex flex-col items-center gap-5 text-gray-400 ">
              <Scissors className="w-9 h-9" />
              <p>Upload an image and click "Remove Object" to get started</p>
            </div>
          </div>
        ) : (
          <div className="mt-3 h-full overflow-y-scroll text-sm text-slate-600">
            <div className="mt-3 h-full">
              <img src={content} alt="images" className="mt-3 w-full h-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemoveObject;
