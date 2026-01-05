import { GoogleGenAI } from "@google/genai";
import http from 'http';

// Cloud Run injects PORT environment variable
const PORT = process.env.PORT || 8080;
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error("CRITICAL: API_KEY is missing from environment variables.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const MODEL_NAME = 'veo-3.1-fast-generate-preview';

const server = http.createServer(async (req, res) => {
    // CORS Configuration
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle Preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/api/generate-reel' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        
        req.on('end', async () => {
            try {
                const { prompt, persona } = JSON.parse(body);
                
                if (!prompt) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Prompt is required" }));
                    return;
                }

                console.log(`[Veo-Backend] Starting generation for: ${prompt.substring(0, 50)}...`);

                // 1. Submit Generation Job
                let operation = await ai.models.generateVideos({
                    model: MODEL_NAME,
                    prompt: prompt,
                    config: {
                        numberOfVideos: 1,
                        resolution: "720p",
                        aspectRatio: "9:16"
                    }
                });

                console.log(`[Veo-Backend] Operation launched: ${operation.name}`);

                // 2. Poll for Completion
                while (!operation.done) {
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
                    process.stdout.write("."); // heartbeat
                    operation = await ai.operations.getVideosOperation({ operation });
                }
                console.log("\n[Veo-Backend] Generation complete.");

                const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
                if (!videoUri) {
                    throw new Error("Veo completed but returned no video URI.");
                }

                // 3. Secure Download (Server-Side)
                // We append the key here, safely on the backend
                const downloadUrl = `${videoUri}${videoUri.includes('?') ? '&' : '?'}key=${API_KEY}`;
                
                const videoRes = await fetch(downloadUrl);
                if (!videoRes.ok) throw new Error(`Failed to download video from Google Cloud: ${videoRes.statusText}`);

                const videoBuffer = await videoRes.arrayBuffer();

                // 4. Return Video Blob to Client
                res.writeHead(200, {
                    'Content-Type': 'video/mp4',
                    'Content-Length': videoBuffer.byteLength
                });
                res.end(Buffer.from(videoBuffer));
                console.log("[Veo-Backend] Video sent to client.");

            } catch (error) {
                console.error("[Veo-Backend] Error:", error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: error.message, 
                    details: "Ensure your project has Veo access and billing enabled." 
                }));
            }
        });
    } else {
        res.writeHead(404);
        res.end("Not Found");
    }
});

server.listen(PORT, () => {
    console.log(`Veo Secure Backend running on port ${PORT}`);
});