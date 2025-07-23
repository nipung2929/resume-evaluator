import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';

// Initialize OpenAI (v4 syntax)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key is not configured.' }, { status: 500 });
    }
    const formData = await req.formData();
    // console.log('Received form data keys:', Array.from(formData.keys()));
    const resumeFile = formData.get('resume');
    // console.log('Resume file type:', typeof resumeFile);
    const jobDescription = formData.get('job') as string;

    if (!resumeFile || typeof jobDescription !== 'string') {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    if (!(resumeFile instanceof File)) {
      return NextResponse.json({ error: 'Resume must be a file.' }, { status: 400 });
    }
    if (resumeFile.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed.' }, { status: 400 });
    }
    if (resumeFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB.' }, { status: 400 });
    }

    // Read PDF buffer
    const buffer = Buffer.from(await resumeFile.arrayBuffer());
    const parsed = await pdfParse(buffer);

    const prompt = `
You are a professional AI resume evaluator. Given the following job description and resume, evaluate how well the resume matches the job, and provide:
1. A match score out of 100
2. Key missing skills
3. Suggestions for improvement

Job Description:
${jobDescription}

Resume:
${parsed.text}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const aiResponse = completion.choices[0].message.content;
    // Logging for debugging (remove or replace with proper logging in production)
    // console.log("Resume file:", resumeFile?.name);
    // console.log("Job description snippet:", jobDescription?.slice(0, 100));
    // console.log("Parsed text length:", parsed.text.length);
    // console.log("API key present:", !!process.env.OPENAI_API_KEY);

    return NextResponse.json({ result: aiResponse });
  } catch (error: any) {
    // console.error('API Error:', error.message);
    return NextResponse.json({ error: error?.message || 'Something went wrong.' }, { status: 500 });
  }
}
