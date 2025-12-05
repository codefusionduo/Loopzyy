export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = "dpjklathd"; 
  // IMPORTANT: You must create this preset in your Cloudinary Dashboard.
  // Go to Settings > Upload > Add Upload Preset. 
  // Name: loopzyy_unsigned
  // Signing Mode: Unsigned
  const uploadPreset = "loopzyy_unsigned"; 
  const apiKey = "958874194464753";

  // Use 'auto' to automatically detect if it's an image or video
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("api_key", apiKey);

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
        // Cloudinary returns detailed error messages in data.error.message
        const errorMessage = data.error?.message || res.statusText;
        // Avoid logging full 'data' object if it might contain complex structures, just log key parts
        console.error("Cloudinary error:", errorMessage); 
        throw new Error(`Cloudinary upload failed: ${errorMessage}. Please ensure you have created an 'Unsigned' upload preset named '${uploadPreset}' in your Cloudinary settings.`);
    }

    return data.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
};