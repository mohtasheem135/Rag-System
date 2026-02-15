import { NextRequest, NextResponse } from 'next/server';
import { chatHistoryManager } from '@/lib/memory/chat-history';
import type { ApiResponse } from '@/types/api';

// Create new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collectionName } = body;

    const session = chatHistoryManager.createSession(collectionName);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        sessionId: session.id,
        collectionName: session.collectionName,
        createdAt: session.createdAt,
      },
      message: 'Chat session created',
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create session',
      },
      { status: 500 }
    );
  }
}

// Get session details
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    const session = chatHistoryManager.getSession(sessionId);

    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get session',
      },
      { status: 500 }
    );
  }
}
