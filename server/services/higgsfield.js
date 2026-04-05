import fetch from 'node-fetch'; 
import dotenv from 'dotenv';
dotenv.config();

const HIGGSFIELD_URL = "https://api.higgsfield.ai/v1/generations";

export const startGeneration = async (prompt) => {
  try {
    const response = await fetch(HIGGSFIELD_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HIGGSFIELD_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "Higgsfield-Client/1.0.0"
      },
      body: JSON.stringify({
        id: process.env.HIGGSFIELD_ID, 
        task: "text-to-image",
        model: "flux-2-pro",
        prompt: prompt,
        aspect_ratio: "1:1"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Higgsfield Start Err: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.id; 
  } catch (error) {
    console.error("Higgsfield startGeneration error:", error);
    throw error;
  }
};

export const pollImageResult = async (jobId) => {
  try {
    const response = await fetch(`${HIGGSFIELD_URL}/${jobId}`, {
      headers: { "Authorization": `Bearer ${process.env.HIGGSFIELD_API_KEY}` }
    });
    
    if (!response.ok) {
        throw new Error(`Higgsfield Poll Err: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "completed") {
      return data.results?.[0]?.url;
    } else if (data.status === "failed") {
      throw new Error("Higgsfield Generation failed");
    } else {
      return null; 
    }
  } catch (error) {
    console.error("Higgsfield pollImageResult error:", error);
    throw error;
  }
};
