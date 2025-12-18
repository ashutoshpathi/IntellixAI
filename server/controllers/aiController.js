import FormData from "form-data";
import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import PDFParser from "pdf2json";

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const generateArticle = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: length,
    });

    const content = response.choices[0].message.content;

    await sql`INSERT INTO creations (user_id, prompt, content, type) 
    VALUES (${userId}, ${prompt}, ${content}, 'article')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.json({ success: true, content });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    });

    const content = response.choices[0].message.content;

    await sql`INSERT INTO creations (user_id, prompt, content, type) 
    VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.json({ success: true, content });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

export const generateImage = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

    const formData = new FormData();
    formData.append("prompt", prompt);

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: {
          "x-api-key": process.env.CLIPDROP_API_KEY,
          ...formData.getHeaders(),
        },
        responseType: "arraybuffer",
      }
    );

    const base64Image = `data:image/png;base64,${Buffer.from(
      data,
      "binary"
    ).toString("base64")}`;

    const { secure_url } = await cloudinary.uploader.upload(base64Image, {
      resource_type: "image",
    });

    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})
    `;

    res.json({ success: true, content: secure_url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const image = req.file;
    const plan = req.plan;

    if (!image)
      return res
        .status(400)
        .json({ success: false, message: "No image uploaded." });
    if (plan !== "premium")
      return res.json({ success: false, message: "Premium only." });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "background_removals",
          transformation: [{ effect: "background_removal" }],
        },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      import("fs").then((fs) => fs.createReadStream(image.path).pipe(stream));
    });

    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, 'Remove background from image', ${result.secure_url}, 'image', false)
    `;

    res.json({ success: true, content: result.secure_url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const removeImageObject = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { object } = req.body;
    const image = req.file;
    const plan = req.plan;

    if (plan !== "premium")
      return res.status(403).json({ success: false, message: "Premium only." });
    if (!image)
      return res
        .status(400)
        .json({ success: false, message: "No image uploaded." });

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "object_removal" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      import("fs").then((fs) =>
        fs.createReadStream(image.path).pipe(uploadStream)
      );
    });

    const imageUrl = cloudinary.url(uploadResult.public_id, {
      transformation: [{ effect: `gen_remove:${object}` }],
      resource_type: "image",
    });

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')
    `;

    res.json({ success: true, content: imageUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const resumeReview = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const resume = req.file;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (!resume) {
      return res.status(400).json({
        success: false,
        message: "No resume file uploaded.",
      });
    }

    if (resume.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Resume file exceeds 5MB limit.",
      });
    }

    if (plan !== "premium") {
      return res.status(403).json({
        success: false,
        message: "This feature is only available for premium users.",
      });
    }

    const extractTextFromPDF = (filePath) =>
      new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on("pdfParser_dataError", (err) => reject(err.parserError));

        pdfParser.on("pdfParser_dataReady", (pdfData) => {
          const text = pdfData.Pages.map((page) =>
            page.Texts.map((t) => decodeURIComponent(t.R[0].T)).join(" ")
          ).join("\n");

          resolve(text);
        });

        pdfParser.loadPDF(filePath);
      });

    const resumeText = await extractTextFromPDF(resume.path);

    if (!resumeText || resumeText.length < 100) {
      return res.status(400).json({
        success: false,
        message: "Resume text is empty or too short.",
      });
    }

    const prompt = `
You are a professional HR and career consultant.

Review the following resume and provide:

- **Summary**
- **Strengths**
- **Weaknesses**
- **Recommendations**

Resume Content:
${resumeText}
`;

    const completion = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content =
      completion.choices?.[0]?.message?.content?.trim() ||
      "No response generated.";

    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, 'Resume Review', ${content}, 'resume-review', false)
    `;

    res.json({ success: true, content });
  } catch (err) {
    console.error("Resume review error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
};
