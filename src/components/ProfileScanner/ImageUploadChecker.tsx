import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";

const ImageUploadChecker: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({
    followers: "",
    following: "",
    posts: "",
    username: "",
    bio: "",
    posted_same_day: false,
  });

 const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  const { name, value, type } = e.target;

  if (type === "checkbox") {
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({ ...prev, [name]: checked }));
  } else {
    setForm((prev) => ({ ...prev, [name]: value }));
  }
};

  const handleSubmit = async () => {
    if (!image) return;

    const formData = new FormData();
    formData.append("image", image);
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    try {
      const res = await axios.post("http://127.0.0.1:5000/analyze", formData);
      setResult(res.data);
    } catch (err) {
      alert("Error analyzing profile.");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4 bg-white rounded-xl shadow-md mt-4">
      <h2 className="text-2xl font-bold text-center">Instagram Fake Profile Scanner</h2>

      <input type="file" onChange={(e) => setImage(e.target.files?.[0] || null)} className="w-full" />

      <div className="grid grid-cols-2 gap-4">
        <input name="followers" placeholder="Followers" className="p-2 border rounded" onChange={handleChange} />
        <input name="following" placeholder="Following" className="p-2 border rounded" onChange={handleChange} />
        <input name="posts" placeholder="Post Count" className="p-2 border rounded" onChange={handleChange} />
        <input name="username" placeholder="Username" className="p-2 border rounded" onChange={handleChange} />
        <textarea name="bio" placeholder="Bio (if empty OCR will be used)" className="col-span-2 p-2 border rounded" onChange={handleChange} />
        <label className="col-span-2 flex items-center gap-2">
          <input type="checkbox" name="posted_same_day" onChange={handleChange} />
          All posts posted on the same day?
        </label>
      </div>

      <Button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        Scan Profile
      </Button>

      {result && (
        <div className="mt-6 p-4 rounded border bg-gray-50">
          <h3 className="text-lg font-semibold text-green-800">
            Result: {result.result}
          </h3>
          <ul className="list-disc pl-6 mt-2 text-sm text-gray-700">
            {Array.isArray(result.explanation)
              ? result.explanation.map((line: string, idx: number) => <li key={idx}>{line}</li>)
              : <li>{result.explanation}</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImageUploadChecker;
