// server.js - Servidor principal CON lógica del bot
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Importar el cerebro del bot
const bot = require('./services/botLogic');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta PRINCIPAL de prueba con el bot
app.get('/', (req, res) => {
  // Simular un usuario preguntando
  const response = bot.processMessage('test-user', 'hola');
  res.send(`
    <html>
      <head><title>Iconic Chatbot</title></head>
      <body style="font-family: Arial; padding: 30px; max-width: 800px; margin: 0 auto;">
        <h1>🏥 Iconic Chatbot - Con Lógica Integrada ✅</h1>
        <p><strong>URL Pública:</strong> ${process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000'}</p>
        
        <h3>🧠 El bot ahora puede responder a:</h3>
        <ul>
          <li>"Hola" / "Buenos días" → Saludo y opciones</li>
          <li>"Servicios" / "¿Qué hacen?" → Lista de procedimientos</li>
          <li>"Precios" / "¿Cuánto cuesta?" → Info de costos</li>
          <li>"Doctores" / "Especialistas" → Equipo médico</li>
          <li>"Agendar cita" → Inicia proceso</li>
          <li>"Ubicación" / "Horarios" → Dirección y contacto</li>
        </ul>
        
        <h3>📡 Próximos pasos:</h3>
        <ol>
          <li><strong>Webhook WhatsApp</strong> (con Twilio)</li>
          <li><strong>Webhook Facebook Messenger</strong></li>
          <li>Sistema completo de agendamiento</li>
        </ol>
        
        <hr>
        <p><em>Prueba del bot simulada:</em></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 10px;">
          <strong>Usuario:</strong> "Hola"<br>
          <strong>Bot:</strong> "${response.text.substring(0, 100)}..."
        </div>
      </body>
    </html>
  `);
});

// Ruta de API para probar el bot directamente (útil para desarrollo)
app.post('/api/chat', (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Se requiere un mensaje' });
    }
    
    // Procesar con el bot
    const botResponse = bot.processMessage(userId || 'web-user', message);
    
    res.json({
      success: true,
      query: message,
      response: botResponse.text,
      type: botResponse.type,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Error procesando mensaje', details: error.message });
  }
});

// Ruta de salud extendida
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Iconic Chatbot API',
    version: '2.0.0',
    features: ['bot-logic', 'response-system', 'api-chat-endpoint'],
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Ruta para ver todas las respuestas disponibles (solo desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.get('/debug/responses', (req, res) => {
    const responses = require('./config/responses');
    res.json({
      availableIntents: ['greeting', 'services', 'prices', 'doctors', 'appointment', 'location', 'thanks'],
      sampleQuestions: [
        "Hola",
        "¿Qué servicios tienen?",
        "¿Cuánto cuesta una rinoplastia?",
        "¿Quiénes son sus doctores?",
        "Quiero agendar una cita",
        "¿Dónde están ubicados?"
      ]
    });
  });
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
  🧠 Iconic Chatbot v2.0 INICIADO
  👉 Local:  http://localhost:${PORT}
  👉 Health: http://localhost:${PORT}/health
  👉 API Chat: POST http://localhost:${PORT}/api/chat
  👉 Lógica del bot: ACTIVADA
  `);
});