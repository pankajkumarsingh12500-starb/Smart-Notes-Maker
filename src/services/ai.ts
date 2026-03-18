import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateNotes(studentClass: string, subject: string, chapter: string) {
  const prompt = `
    Act as a professional education expert. Create high-quality, student-friendly study notes for:
    Class: ${studentClass}
    Subject: ${subject}
    Chapter: ${chapter}

    The notes MUST follow this exact structure:
    # ${chapter}

    ## 1. Introduction
    Explain the topic in very simple language in 3–5 lines suitable for a ${studentClass} student.

    ## 2. Key Concepts
    Provide important points in bullet format.

    ## 3. Important Definitions
    Highlight key terms and explain them clearly.

    ## 4. Diagram / Image Explanation
    Describe a simple educational diagram or visual explanation that would help understand this topic.

    ## 5. Examples
    Give real-life examples so students understand easily.

    ## 6. Important Points for Exam
    List the most important points students should remember.

    ## 7. Quick Revision Summary
    Provide a very short summary for quick revision before exams.

    Rules:
    - Use very simple student-friendly language.
    - Keep explanations brief but complete.
    - Use bullet points.
    - Highlight important words using **bold**.
    - Make formatting clean for Markdown rendering.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
  });

  return response.text;
}

export async function solveDoubt(studentClass: string, subject: string, question: string, imageBase64?: string) {
  const parts: any[] = [
    { text: `Act as a helpful tutor for a ${studentClass} student. Solve this doubt in ${subject}: ${question}. Explain step-by-step in simple language with examples if needed.` }
  ];

  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64.split(",")[1],
      },
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts }],
  });

  return response.text;
}

export async function solveHomework(studentClass: string, subject: string, imageBase64: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: `Identify the homework question in this image for a ${studentClass} student in ${subject}. Provide a correct solution and explain it simply.` },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.split(",")[1],
            },
          },
        ],
      },
    ],
  });

  return response.text;
}
