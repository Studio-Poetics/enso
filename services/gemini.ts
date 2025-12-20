import { GoogleGenAI } from "@google/genai";
import { Project } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_TEXT = 'gemini-2.5-flash';

export const generateProjectEssence = async (notes: string): Promise<string> => {
  if (!apiKey) return "API Key missing. Cannot generate essence.";

  try {
    const prompt = `
      You are a senior design strategist inspired by Kenya Hara and Ikko Tanaka.
      Distill the following rough project notes into a "Project Essence" - a clear, minimalist, and strategic design brief (max 3 sentences).
      
      CRITICAL: While the tone should be sophisticated, the goal is clarity. 
      Do not use overly abstract metaphors that obscure the function. 
      Define the core problem and the intended solution clearly.
      
      Notes: ${notes}
    `;

    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
    });

    return response.text || "Could not grasp the essence.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The spirits are quiet today. (Error generating essence)";
  }
};

export const getUncleIrohWisdom = async (project: Project, specificProblem?: string): Promise<string> => {
  if (!apiKey) return "Look within yourself to save yourself from your other self.";

  try {
    const prompt = `
      You are Uncle Iroh from Avatar: The Last Airbender. 
      You are advising a designer or project manager who is working on: "${project.title}".
      The essence of their work is: "${project.essence}".
      
      ${specificProblem ? `The user is stuck on: "${specificProblem}"` : "The user is feeling the pressure of the creative process."}

      CRITICAL INSTRUCTION:
      Do not simply write abstract poetry about the project's aesthetics. The user finds that vague and unhelpful.
      Instead, provide **grounded, warm, and relatable wisdom** about patience, failure, rest, or perspective.
      
      Guidelines:
      1. Focus on the *person* doing the work, not just the object they are making.
      2. Use a simple metaphor involving tea, nature, or the Pai Sho board, but explain clearly how it applies to their stress.
      3. Be encouraging and clear. Sound like a kind uncle, not a riddle.

      Example of BAD response: "The digital fish swims only when the water is calm. Be like the fish."
      Example of GOOD response: "Perfection is a heavy burden to carry. Even the best tea needs time to steep. Do not rush your result; there is power in simply resting and letting the answer come to you."

      Keep it under 60 words.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
    });

    return response.text || "It is important to draw wisdom from many different places.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sometimes the best way to solve your own problem is to help someone else.";
  }
};

export const suggestTasks = async (essence: string): Promise<string[]> => {
  if (!apiKey) return ["Define scope", "Research", "Sketch"];
  
  try {
    const prompt = `
      Based on this design brief: "${essence}", list 5 clear, practical, and sequential steps to execute this project.
      
      CRITICAL: Act as a Pragmatic Lead Producer. 
      Avoid vague creative fluff (e.g. "Feel the space"). 
      Focus on the actual work required (e.g. "Conduct material research", "Build 1:1 cardboard prototype", "Finalize color palette").
      
      Return only the tasks as a JSON array of strings.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    return ["Reflect on the brief", "Sketch initial concepts", "Iterate"];
  }
};

export interface MentorshipResponse {
  advice: string;
  steps: string[];
}

export const getTaskMentorship = async (taskText: string, essence: string): Promise<MentorshipResponse> => {
  if (!apiKey) return { advice: "Break the task down into smaller steps.", steps: ["Step 1", "Step 2", "Step 3"] };

  try {
    const prompt = `
      The user is stuck on this task: "${taskText}".
      The project essence is: "${essence}".
      
      Act as a Senior Design Mentor (Pragmatic, Experienced, Encouraging).
      
      PROVIDE TWO THINGS IN JSON FORMAT:
      1. "advice": 2-3 sentences of strategic guidance. How should they approach this problem mentally? What is the trap to avoid?
      2. "steps": 3 concrete, immediately executable sub-tasks to get moving.
      
      CRITICAL: 
      - Advice should be "Hand-holding" but professional. "Don't worry about X yet, focus on Y."
      - Steps must be actionable. Not "Think about it", but "Draft 3 options".
      
      Response Schema:
      {
        "advice": "string",
        "steps": ["string", "string", "string"]
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return { advice: "Proceed with care.", steps: [] };
    return JSON.parse(text);
  } catch (error) {
    console.error(error);
    return { advice: "Consult the project brief.", steps: [] };
  }
};