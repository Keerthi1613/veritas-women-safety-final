import React from "react";
import ImageUploadChecker from "@/components/ProfileScanner/ImageUploadChecker";
import Navigation from "@/components/Navigation";

const ProfileGuardScanner = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <ImageUploadChecker />
    </div>
  );
};

export default ProfileGuardScanner;
