import { env } from 'cloudflare:workers';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[a-f0-9]{64}$/.test(id)) return Response.json({ error: 'Книга не найдена.' }, { status: 404 });
  try {
    const book = await env.DB!.prepare('SELECT id,title,author,format,original_name AS originalName,word_count AS wordCount,created_at AS createdAt FROM books WHERE id = ?').bind(id).first();
    if (!book) return Response.json({ error: 'Книга не найдена.' }, { status: 404 });
    const object = await env.BUCKET!.get(`books/${id}/text.json`);
    if (!object) return Response.json({ error: 'Текст книги временно недоступен.' }, { status: 503 });
    return Response.json({ book, document: await object.json() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('library.open', error);
    return Response.json({ error: 'Не удалось открыть книгу. Попробуйте ещё раз.' }, { status: 503 });
  }
}
