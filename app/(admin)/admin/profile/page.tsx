"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { useRef } from "react";
import { uploadFile } from "@/lib/services/storage.service";
import { updateProfile } from "firebase/auth";

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.photoURL || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "WeFit",
    lastName: "Fitness",
    phone: "0899617518",
    country: "Ireland",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCountryChange = (value: string) => {
    setFormData({ ...formData, country: value });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    // Quick local preview while uploading
    const objectUrl = URL.createObjectURL(file);
    setPhotoUrl(objectUrl);
    setUploadingPhoto(true);

    try {
      const { url: downloadUrl } = await uploadFile(file, "admin/avatars", { publicId: user.uid });
      await updateProfile(user, { photoURL: downloadUrl });
      setPhotoUrl(downloadUrl);
      toast.success("Profile photo updated!");
    } catch (error) {
      console.error("Photo upload failed", error);
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);
    toast.success("Profile updated successfully!");
  };

  const handleReset = () => {
    setFormData({
      firstName: "WeFit",
      lastName: "Fitness",
      phone: "0899617518",
      country: "Ireland",
    });
    setPhotoUrl(user?.photoURL || null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Form reset to original values.");
  };

  const email = user?.email || "admin@wefitfitness.com";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-[#b9b9c3]">
        <Link href="/admin" className="text-[#7367f0] hover:underline font-medium">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-[#6e6b7b] font-medium">My Profile</span>
      </div>

      <div className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-6">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/jpeg, image/png, image/gif" 
            onChange={handlePhotoUpload} 
          />
          <div 
            className="w-[120px] h-[120px] shrink-0 border border-gray-200 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center relative cursor-pointer group hover:ring-2 hover:ring-[#7367f0]/50 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="Admin Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[#f8f8f8] flex flex-col items-center justify-center text-gray-400">
                 <span className="text-[10px] uppercase font-bold text-[#5e5873]">WeFit</span>
                 <span className="text-[10px] uppercase font-bold text-[#5e5873]">FITNESS</span>
              </div>
            )}
            {/* Upload Overlay */}
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity text-white ${uploadingPhoto ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
               {uploadingPhoto ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploadingPhoto} 
                className="bg-[#7367f0] hover:bg-[#6355e0] text-white"
              >
                {uploadingPhoto ? "Uploading..." : "Upload new photo"}
              </Button>
              <Button variant="outline" onClick={handleReset} className="text-[#6e6b7b] border-gray-300 hover:bg-gray-50">
                Reset
              </Button>
            </div>
            <p className="text-sm text-[#b9b9c3]">Allowed JPG, GIF or PNG. Max size of 800k</p>
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#5e5873]">First Name</label>
            <Input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First Name"
              className="h-10 text-sm border-gray-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#5e5873]">Last Name</label>
            <Input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last Name"
              className="h-10 text-sm border-gray-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#5e5873]">Phone Number</label>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="h-10 text-sm border-gray-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#5e5873]">E-mail Address</label>
            <Input
              name="email"
              value={email}
              disabled
              className="h-10 text-sm border-gray-200 bg-gray-50/50 text-[#b9b9c3]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#5e5873]">Country</label>
            <Select value={formData.country} onValueChange={handleCountryChange}>
              <SelectTrigger className="h-10 text-sm border-gray-200">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mt-8">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#7367f0] hover:bg-[#6355e0] text-white px-6 shadow-[0_3px_10px_rgba(115,103,240,0.35)]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save changes
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="text-[#6e6b7b] border-gray-300 hover:bg-gray-50 px-6"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
