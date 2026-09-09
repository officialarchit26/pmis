// Gemini AI Service
// Handles communication with Google's Gemini API

const MODELS = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-pro-latest'];

/**
 * Strips markdown code block wrappers and parses JSON safely
 */
function parseStructuredJson(text) {
  if (!text || typeof text !== 'string') return null;
  let cleaned = text.trim();

  // 1. Try markdown code block extraction
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    try {
      return JSON.parse(jsonBlockMatch[1].trim());
    } catch (e) {
      cleaned = jsonBlockMatch[1].trim();
    }
  }

  // 2. Direct JSON parse
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // 3. Fallback: locate outermost braces
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (braceErr) {
        return null;
      }
    }
    return null;
  }
}

/**
 * Ask Gemini a question with given data context
 */
async function askGemini(userMessage, context = '') {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  // Build prompt
  const systemPrompt = `You are an AI assistant for PMIS (Project Monitoring & Intelligence System), a government project monitoring platform.
You help administrators, senior officials, and department officers understand their project data.

${context ? `Here is the current project ground-truth data:\n${context}\n` : ''}

Instructions:
- Answer concisely, accurately, and professionally based on the project data provided
- Highlight key facts: progress percentages, budget utilization, delays, and risk scores
- If you don't have enough information, say so clearly
- Format responses cleanly with bullet points and clear sections
- Ground your responses in the actual figures from the context`;

  const fullPrompt = `${systemPrompt}\n\nUser Question: ${userMessage}`;

  for (const model of MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(25000),
          body: JSON.stringify({
            contents: [{
              parts: [{ text: fullPrompt }]
            }],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 2048
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return text;
        }
      }
    } catch (modelError) {
      console.warn(`Model ${model} request error:`, modelError.message);
      continue;
    }
  }

  throw new Error('All Gemini models failed or unavailable');
}

/**
 * Generate a comprehensive, structured AI report for a project
 */
async function generateAIReport(project, riskAnalysis, reportType = 'full') {
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `You are the chief AI analyst for PMIS (Project Monitoring & Intelligence System).
Analyze this government project and produce a formal executive intelligence report.

Project Data:
- Name: ${project.name}
- Status: ${project.status}
- Progress: ${project.progress_percent || 0}%
- Total Budget: $${(project.budget_total || 0).toLocaleString()}
- Utilized Budget: $${(project.budget_utilized || 0).toLocaleString()} (${project.budget_total > 0 ? Math.round(((project.budget_utilized || 0) / project.budget_total) * 100) : 0}%)
- Timeline: ${project.start_date || 'N/A'} to ${project.end_date || 'N/A'}
- Department: ${project.department?.name || 'Department of Transportation'}
- District: ${project.district?.name || 'Central District'}
- Risk Score: ${riskAnalysis.riskScore}/100 (${riskAnalysis.riskLevel})
- Risk Factors: ${riskAnalysis.factors.join('; ')}
- Recommendations: ${riskAnalysis.recommendations.join('; ')}
- Milestones: ${(project.milestones || []).map(m => `${m.title} (${m.status}, due ${m.due_date})`).join(', ') || 'None recorded'}

Generate a JSON object with EXACTLY this structure:
{
  "title": "${project.name} - Executive Intelligence Report",
  "report_type": "${reportType}",
  "executive_summary": "High-level summary of project status, performance, and outlook",
  "timeline_analysis": "Assessment of schedule adherence and milestone completion",
  "financial_analysis": "Assessment of budget burn rate versus physical progress",
  "risk_assessment": "Analysis of key risks and potential blockers",
  "strategic_recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2",
    "Specific actionable recommendation 3"
  ],
  "overall_verdict": "One of: ON TRACK, AT RISK, CRITICAL ATTENTION REQUIRED"
}

Return ONLY the raw JSON object, without markdown formatting or code fences.`;

  if (apiKey) {
    for (const model of MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(25000),
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 4096
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = parseStructuredJson(text);
            if (parsed && parsed.executive_summary) {
              return parsed;
            }
          }
        }
      } catch (err) {
        console.warn(`Model ${model} report generation error:`, err.message);
        continue;
      }
    }
  }

  // Fallback rule-based structured report if Gemini API is offline
  return {
    title: `${project.name} - Intelligence Report`,
    report_type: reportType,
    executive_summary: `Project "${project.name}" is currently ${project.status} at ${project.progress_percent || 0}% completion with ${project.budget_total > 0 ? Math.round(((project.budget_utilized || 0) / project.budget_total) * 100) : 0}% budget utilized. Risk profile is evaluated at ${riskAnalysis.riskLevel} (${riskAnalysis.riskScore}/100).`,
    timeline_analysis: `Project scheduled from ${project.start_date || 'N/A'} to ${project.end_date || 'N/A'}. Milestone progress is being actively monitored.`,
    financial_analysis: `Budget allocated: $${(project.budget_total || 0).toLocaleString()}, utilized: $${(project.budget_utilized || 0).toLocaleString()}.`,
    risk_assessment: `Key identified risk factors: ${riskAnalysis.factors.join(', ') || 'No critical factors identified.'}`,
    strategic_recommendations: riskAnalysis.recommendations.length > 0 ? riskAnalysis.recommendations : [
      'Maintain regular milestone tracking intervals',
      'Ensure budget drawdown aligns with verified site deliverables'
    ],
    overall_verdict: riskAnalysis.riskScore >= 75 ? 'CRITICAL ATTENTION REQUIRED' : riskAnalysis.riskScore >= 50 ? 'AT RISK' : 'ON TRACK'
  };
}

module.exports = {
  askGemini,
  generateAIReport,
  parseStructuredJson
};
