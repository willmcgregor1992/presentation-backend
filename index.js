const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.get('/', (req, res) => {
  res.json({ status: 'Presentation API is running!' });
});

app.post('/api/generate-presentation', async (req, res) => {
  try {
    const {
      topic,
      detailedContext,
      dataFileName,
      numSlides,
      audience,
      storyStructure,
      storylineType,
      presentationType,
      openingStyle,
      includeElements
    } = req.body;

    const prompt = `You are an expert presentation architect specializing in storytelling and business communication.

Create a ${numSlides}-slide presentation outline for: "${topic}"

CONTEXT:
${detailedContext || 'No additional context provided'}

REQUIREMENTS:
- Audience: ${audience}
- Presentation Type: ${presentationType}
- Story Structure: ${storyStructure}
- Storyline Type: ${storylineType || 'None'}
- Opening Style: ${openingStyle}
- Data File Reference: ${dataFileName || 'None'}

Include these elements: ${Object.keys(includeElements).filter(k => includeElements[k]).join(', ')}

For each slide, provide:
1. Slide number
2. Title (compelling and specific)
3. Type (e.g., "Title Slide", "Problem Statement", "Solution", "Data Analysis")
4. Purpose (what this slide accomplishes)
5. 3-5 bullet points with actual content (not placeholders)
6. A storytelling note explaining how this slide advances the narrative

Return ONLY a valid JSON array with this structure:
[
  {
    "number": 1,
    "title": "Slide Title",
    "type": "Slide Type",
    "purpose": "What this slide accomplishes",
    "bullets": ["Bullet 1", "Bullet 2", "Bullet 3"],
    "storytellingNote": "How this advances the story"
  }
]

Make the content specific, actionable, and tailored to the topic and context. Use professional business language appropriate for the audience.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = message.content[0].text;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const slides = JSON.parse(jsonMatch[0]);
    res.json({ slides });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate presentation',
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
