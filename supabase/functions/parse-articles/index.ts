import { parseFeed } from "https://deno.land/x/rss@1.1.3/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

// Список RSS-фидов для парсинга. В будущем можно вынести в отдельную таблицу.
const RSS_FEEDS = [
    'https://www.theverge.com/rss/index.xml',
    'https://www.wired.com/feed/rss',
    // TODO: Добавить релевантные источники про FPV, спорт, технологии
];

serve(async (req: Request) => {
    // Обработка CORS preflight-запроса
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Создаем сервисный клиент Supabase с полными правами доступа.
        // Переменные окружения должны быть заданы в настройках функции.
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        let newArticlesCount = 0;
        const processingLog: string[] = [];

        for (const feedUrl of RSS_FEEDS) {
            try {
                const response = await fetch(feedUrl);
                const xml = await response.text();
                const feed = await parseFeed(xml);

                processingLog.push(`Processing feed: ${feed.title.value} (${feed.entries.length} entries)`);

                for (const entry of feed.entries) {
                    const sourceUrl = entry.id; // Уникальный URL статьи из фида

                    // 1. Проверяем, существует ли уже такая статья
                    const { data: existingArticle, error: checkError } = await supabaseClient
                        .from('articles')
                        .select('id')
                        .eq('source_url', sourceUrl)
                        .single();

                    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 - No rows found
                        throw new Error(`Error checking for existing article: ${checkError.message}`);
                    }

                    // 2. Если статьи нет, добавляем ее как черновик
                    if (!existingArticle) {
                        const { error: insertError } = await supabaseClient
                            .from('articles')
                            .insert({
                                source_url: sourceUrl,
                                title: entry.title?.value || 'Untitled', // Берем заголовок из фида
                                summary: entry.description?.value || '', // Берем описание
                                raw_content: entry, // Сохраняем всю запись из фида для дальнейшей обработки
                                status: 'draft',
                            });

                        if (insertError) {
                            throw new Error(`Error inserting article: ${insertError.message}`);
                        }
                        newArticlesCount++;
                    }
                }
            } catch (feedError) {
                const errorMessage = feedError instanceof Error ? feedError.message : String(feedError);
                processingLog.push(`Failed to process feed ${feedUrl}: ${errorMessage}`);
            }
        }

        const message = `Parsing complete. Added ${newArticlesCount} new articles.`;
        processingLog.push(message);

        return new Response(JSON.stringify({ message, log: processingLog }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
}); 