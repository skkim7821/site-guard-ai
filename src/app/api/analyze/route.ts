import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getPrompt = (expectedCount: number, customScenario: string) => {
  return `
You are SiteGuard AI, a conservative safety engineering auditor. 

SYSTEM ROLE: Your task is to perform a PHYSICAL CAPACITY AUDIT for a specific crowd size (${expectedCount} people) in the visible space.

AUDIT STEPS (STRICT LOGIC):
1. ESTIMATE ACCESSIBLE AREA: Look at the image and estimate the visible floor area in square meters (m²). 
   - A standard corridor is ~2-3m wide. 
   - A standard door is ~1m wide.
2. CALCULATE DENSITY: Compute the predicted density (${expectedCount} people / Estimated m²).
3. ASSESS RISK LEVEL (FOLLOW THESE THRESHOLDS):
   - 🟢 < 1 person/m²: 'Low'. Perfectly safe.
   - 🟡 1-2 people/m²: 'Medium'. Normal movement.
   - 🟠 2-4 people/m²: 'High'. Fluid movement restricted.
   - 🔴 > 5 people/m²: 'Critical'. Crush risk.

CRITICAL: If ${expectedCount} is small (e.g., < 50) and the space is a wide corridor or room, the risk MUST be 'Low'.

Return ONLY valid JSON matching this schema:

{
  "simulationRiskLevel": "Low | Medium | High | Critical",
  "spatialAnalysis": {
    "estimatedAreaM2": 0, /* Estimated floor area in m² */
    "predictedDensity": 0 /* people/m² (Count / Area) */
  },
  "safetyScores": {
    "flow": 0, /* 0-100 (0=Congestion, 100=Fluent) */
    "space": 0, /* 0-100 (0=Crush Risk, 100=Ample Space) */
    "evacuation": 0 /* 0-100 */
  },
  "keyInsights": [
    "3-4 short insights with physical evidence (max one sentence each)"
  ],
  "spatialSimulationRisks": [
    {
      "area": "Area Name",
      "risk": "Specific physical bottleneck for ${expectedCount} people",
      "status": "Safe | Warning | Danger"
    }
  ],
  "hotspots": [
    {
       "box_2d": [ymin, xmin, ymax, xmax],
       "label": "Physical Bottleneck Point"
    }
  ],
  "prevention": {
    "immediate": ["Realistic staffing/signage for ${expectedCount} people"],
    "longTerm": ["Structural improvement suggestion"]
  },
  "currentObservedDensity": {
    "count": 0,
    "level": "Low"
  }
}

INSTRUCTIONS: 
- Be a skeptic. Only report high risk if it is physically impossible for ${expectedCount} people to move.
- Scale scores linearly with density.
- ALL Text MUST be in English.
- Return JSON only.
`;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, expectedCount = 300, customScenario = "" } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Extract base64 part
    const base64Data = image.split(',')[1];
    if (!base64Data) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    const prompt = getPrompt(expectedCount, customScenario);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg',
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    // Safety check parsing
    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image', details: error.message },
      { status: 500 }
    );
  }
}
