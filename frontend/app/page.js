"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress((prev) => (prev < 100 ? prev + 1 : 100));
      if (loadingProgress === 100) clearInterval(interval);
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // ✅ Fix: Properly handle download by using fetch
  const handleDownload = async () => {
    const fileUrl = "/Ukshati_User_Manual.pdf";
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();

      // Create a download link and trigger download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "UserManual.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div>
      <h1>Ukshati Technologies Private Ltd.</h1>
      <p>Welcome!!</p>

      <button onClick={() => setIsAboutUsOpen(true)}>About Us</button>
      <button onClick={() => router.push("/login")}>Explore</button>
      <button onClick={handleDownload}>Download</button>

      {isAboutUsOpen && (
        <div>
          <p>At Ukshati Technologies Pvt Ltd</p>
          <button onClick={() => setIsAboutUsOpen(false)}>Close</button>
        </div>
      )}
    </div>
  );
}
