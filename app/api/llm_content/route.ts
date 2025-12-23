// /app/api/llm_content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from "@ai-sdk/anthropic";
import { streamObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 100;

export async function POST(req: NextRequest) {
  try {
    const { subpages, mainpage, linkedinData, websiteurl } = await req.json();

    if (!subpages || !mainpage) {
      return NextResponse.json({ error: 'Mainpage or subpage content is required' }, { status: 400 });
    }

    const subpagesText = JSON.stringify(subpages, null, 2);
    const mainpageText = JSON.stringify(mainpage, null, 2);
    const linkedinText = linkedinData ? JSON.stringify(linkedinData, null, 2) : null;

    // Website grading schema
    const websiteGradeSchema = z.object({
      overall_score: z.number().min(0).max(100),
      grade_letter: z.enum(['A+', 'A', 'B', 'C', 'D', 'F']),
      summary: z.string(),

      categories: z.object({
        performance: z.object({
          score: z.number().min(0).max(100),
          findings: z.array(z.string()).length(3),
          recommendation: z.string()
        }),
        mobile: z.object({
          score: z.number().min(0).max(100),
          findings: z.array(z.string()).length(3),
          recommendation: z.string()
        }),
        seo: z.object({
          score: z.number().min(0).max(100),
          findings: z.array(z.string()).length(3),
          recommendation: z.string()
        }),
        content: z.object({
          score: z.number().min(0).max(100),
          findings: z.array(z.string()).length(3),
          recommendation: z.string()
        })
      }),

      top_improvements: z.array(z.object({
        priority: z.enum(['high', 'medium', 'low']),
        title: z.string(),
        description: z.string(),
        impact: z.string()
      })).length(5),

      upgrade_prompt: z.string()
    });

    const prompt = `You are a professional website auditor. Analyze this website and provide a comprehensive grade with actionable improvements.

WEBSITE URL: ${websiteurl}

${linkedinText ? `LINKEDIN PROFILE:
${linkedinText}
` : ''}

SUBPAGES CONTENT:
${subpagesText}

WEBSITE CONTENT:
${mainpageText}

Provide a professional website audit with these sections:

📊 OVERALL SCORE (0-100)
Grade the website overall from 0-100. Use this scale:
- 90-100: A+ (Exceptional - industry-leading website)
- 80-89: A (Excellent - well-optimized, minor improvements possible)
- 70-79: B (Good - solid foundation, room for improvement)
- 60-69: C (Average - notable issues that need attention)
- 50-59: D (Below Average - significant problems)
- 0-49: F (Poor - major overhaul needed)

📝 SUMMARY
Write a 2-3 sentence executive summary of the website's strengths and main areas for improvement.

🚀 PERFORMANCE (Score 0-100)
Evaluate based on:
- Page structure and organization
- Code cleanliness (based on content structure)
- Image optimization indicators
- Content loading patterns
Give 3 specific findings and 1 key recommendation.

📱 MOBILE (Score 0-100)
Evaluate based on:
- Content readability indicators
- Navigation structure simplicity
- Touch-friendly element patterns
- Responsive design indicators
Give 3 specific findings and 1 key recommendation.

🔍 SEO (Score 0-100)
Evaluate based on:
- Title and heading structure
- Meta description quality
- Content keyword usage
- URL structure
- Internal linking
Give 3 specific findings and 1 key recommendation.

✍️ CONTENT (Score 0-100)
Evaluate based on:
- Clarity of messaging
- Value proposition strength
- Call-to-action effectiveness
- Content quality and depth
- Brand consistency
Give 3 specific findings and 1 key recommendation.

🎯 TOP 5 IMPROVEMENTS
List the 5 most impactful improvements with:
- Priority level (high/medium/low)
- Clear title
- Specific description of what to do
- Expected impact

🔧 UPGRADE PROMPT
Write a detailed prompt that could be given to an AI assistant (like Claude or ChatGPT) to help implement the improvements. The prompt should:
- Reference the specific website URL
- Include the top issues found
- Request specific code changes or content improvements
- Be ready to copy and paste into an AI coding assistant

Format example:
"I need help upgrading my website [URL]. Based on an audit, here are the issues to fix: [issues]. Please help me: 1) [specific task] 2) [specific task] 3) [specific task]. Focus on [priority area] first."

RULES:
- Be professional and constructive, not sarcastic
- Provide specific, actionable feedback
- Base scores on actual website content analysis
- Make the upgrade prompt immediately usable
- Keep findings concise but specific`;

    try {
      const { partialObjectStream } = streamObject({
        model: anthropic('claude-sonnet-4-20250514'),
        schema: websiteGradeSchema,
        system: "You are a professional website auditor who provides constructive, actionable feedback. Score fairly based on actual evidence from the website content. Be specific and helpful.",
        prompt: prompt,
        providerOptions: {
          anthropic: {
            sendReasoning: false
          }
        }
      });

      // Create a TransformStream to convert the stream to a ReadableStream
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const partialObject of partialObjectStream) {
              controller.enqueue(new TextEncoder().encode(JSON.stringify({ result: partialObject }) + '\n'));
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (error) {
      // If rate limited, retry with fallback model
      if (error instanceof Error && 'status' in error && error.status === 429) {
        const { partialObjectStream } = streamObject({
          model: anthropic('claude-3-7-sonnet-20250219'),
          schema: websiteGradeSchema,
          system: "You are a professional website auditor who provides constructive, actionable feedback. Score fairly based on actual evidence from the website content. Be specific and helpful.",
          prompt: prompt,
          providerOptions: {
            anthropic: {
              sendReasoning: false
            }
          }
        });

        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const partialObject of partialObjectStream) {
                controller.enqueue(new TextEncoder().encode(JSON.stringify({ result: partialObject }) + '\n'));
              }
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }

      console.error('Website Grade API error:', error);
      return NextResponse.json({ error: `Website Grade API Failed | ${error}` }, { status: 500 });
    }

  } catch (error) {
    console.error('Website grade API error:', error);
    return NextResponse.json({ error: `Website grade API Failed | ${error}` }, { status: 500 });
  }
}