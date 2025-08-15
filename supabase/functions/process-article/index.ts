/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { corsHeaders } from 'shared/cors.ts';
import { createClient } from 'supabase-js';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Article {
    id: string;
    raw_content?: {
        title?: { value?: string };
        description?: { value?: string };
        [key: string]: any;
    };
}

// --- OpenAI API вызовы ---

async function processTextWithAI(rawContent: Article['raw_content']): Promise<{ title: string; summary: string; content_markdown: string }> {
    const contentToProcess = `${rawContent?.title?.value || ''}\n\n${rawContent?.description?.value || ''}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an expert copywriter for a sports and tech blog called BIXIRUN. Your task is to rewrite the provided text to be unique, engaging, and well-structured in Russian. The final output must be a JSON object with three keys: "title" (a catchy, short headline), "summary" (a 1-2 sentence preview), and "content_markdown" (the full article formatted in Markdown).`
                },
                {
                    role: "user",
                    content: contentToProcess
                }
            ],
            response_format: { type: "json_object" },
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI text processing failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const jsonResponse = await response.json();
    const result = JSON.parse(jsonResponse.choices[0].message.content);

    // Trim whitespace from all string fields in the result
    const trimmedResult = {
        title: result.title?.trim() || '',
        summary: result.summary?.trim() || '',
        content_markdown: result.content_markdown?.trim() || '',
    };

    return trimmedResult;
}

async function generateImageWithAI(prompt: string): Promise<ArrayBuffer> {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: "dall-e-3",
            prompt: `A vibrant, high-quality cover image for a sports and tech blog article titled "${prompt}". Style: modern, dynamic, slightly futuristic.`,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json",
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI image generation failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const jsonResponse = await response.json();
    const base64Image = jsonResponse.data[0].b64_json;
    const decodedImage = atob(base64Image);
    const buffer = new Uint8Array(decodedImage.length);
    for (let i = 0; i < decodedImage.length; i++) {
        buffer[i] = decodedImage.charCodeAt(i);
    }
    return buffer.buffer;
}


// --- Основная логика функции ---

Deno.serve(async (req: Request) => {
    console.log("--- Invocation start ---");

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        console.log("[1/7] Parsing request body...");
        const { record: article } = (await req.json()) as { record: Article };
        console.log("[2/7] Request body parsed. Article ID:", article.id);

        if (!article?.id || !article.raw_content) {
            console.error("Invalid article data received:", article);
            throw new Error("Invalid article data received");
        }

        console.log("[3/7] Updating status to 'processing'...");
        await supabaseClient.from('articles').update({ status: 'processing' }).eq('id', article.id);
        console.log("[4/7] Status updated.");

        console.log("[5/7] Processing text with AI...");
        const { title, summary, content_markdown } = await processTextWithAI(article.raw_content);
        console.log("[6/7] AI text processing complete. Title:", title);

        console.log("[7/7] Generating image with AI...");
        const imageBuffer = await generateImageWithAI(title);
        const imagePath = `public/${article.id}.png`;
        console.log("[8/8] Image generation complete. Path:", imagePath);


        console.log("[9/9] Uploading image to Storage...");
        const { error: uploadError } = await supabaseClient.storage
            .from('covers')
            .upload(imagePath, imageBuffer, {
                contentType: 'image/png',
                upsert: true,
            });
        if (uploadError) {
            console.error("Storage upload failed:", uploadError.message);
            throw new Error(`Storage upload failed: ${uploadError.message}`);
        }
        console.log("[10/10] Image uploaded.");

        console.log("[11/11] Getting public URL for the image...");
        const { data: { publicUrl } } = supabaseClient.storage.from('covers').getPublicUrl(imagePath);
        if (!publicUrl) {
            throw new Error("Could not get public URL for the uploaded image.");
        }
        console.log("[12/12] Public URL received:", publicUrl);


        console.log("[13/13] Updating article with final data...");
        const { error: finalUpdateError } = await supabaseClient
            .from('articles')
            .update({
                title: title.trim(),
                summary: summary.trim(),
                content_markdown: content_markdown.trim(),
                cover_image_url: publicUrl.trim(),
                status: 'published',
                published_at: new Date().toISOString(),
            })
            .eq('id', article.id);

        if (finalUpdateError) {
            console.error("Final article update failed:", finalUpdateError.message);
            throw new Error(`Final article update failed: ${finalUpdateError.message}`);
        }

        console.log("--- Invocation success ---");
        return new Response(JSON.stringify({ message: `Article ${article.id} processed successfully.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (e: any) {
        console.error("--- Invocation FAILED ---");
        console.error("Error message:", e.message);
        console.error("Stack trace:", e.stack);
        return new Response(JSON.stringify({ error: e.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
}); 