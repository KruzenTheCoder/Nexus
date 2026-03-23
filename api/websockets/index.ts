import { Server, Socket } from 'socket.io';
import { handleAICallAnalysis } from '../services/aiService.js';

export function setupWebSockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join a specific call room
    socket.on('join-call', (callId: string) => {
      socket.join(callId);
      console.log(`Socket ${socket.id} joined call room: ${callId}`);
    });

    // Handle real-time transcriptions from client/Twilio to be analyzed by AI
    socket.on('transcription', async (data: { callId: string, text: string, speaker: 'agent' | 'customer' }) => {
      try {
        // Here we would typically send this to our AI service
        // For demonstration of the pipeline, we simulate the AI analysis
        const analysis = await handleAICallAnalysis(data.text);
        
        // Broadcast the analysis back to the room
        io.to(data.callId).emit('ai-analysis', {
          sentiment: analysis.sentiment,
          suggestedAction: analysis.suggestedAction,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error processing transcription:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
