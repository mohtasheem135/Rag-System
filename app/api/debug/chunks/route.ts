// app/api/debug/chunks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { documentProcessor } from '@/lib/services/document-processor';
import { getFilePath } from '@/lib/utils/file-storage';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filename = searchParams.get('filename');
  const fileType = searchParams.get('fileType');

  if (!filename || !fileType) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const filepath = getFilePath(filename);
  const result = await documentProcessor.processDocument(
    filepath,
    fileType,
    'debug-id',
    filename
  );

  // Return first 3 chunks for inspection
  const sampleChunks = result.chunks.slice(0, 3).map(chunk => ({
    content: chunk.pageContent.substring(0, 200) + '...',
    metadata: chunk.metadata,
  }));

  return NextResponse.json({
    stats: result.stats,
    sampleChunks,
  });
}
