// server.js - Servidor principal CORREGIDO (sin duplicaciones)
require('dotenv').config({ path: '.env' });

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Importar el sistema de logging
const logger = require('./services/logger');

// Importar el cerebro del bot
const bot = require('./services/botLogic');

// Importar servicios de plataformas
const WhatsAppService = require('./platforms/whatsappService');

// ==================== CONFIGURACIÓN WHATSAPP ====================
const WHATSAPP_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const WHATSAPP_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

let whatsappService = null;
if (WHATSAPP_ACCOUNT_SID && WHATSAPP_AUTH_TOKEN && WHATSAPP_NUMBER) {
    whatsappService = new WhatsAppService(WHATSAPP_ACCOUNT_SID, WHATSAPP_AUTH_TOKEN, WHATSAPP_NUMBER);
    console.log('✅ Servicio de WhatsApp (Twilio) inicializado');
} else {
    console.log('⚠️  Credenciales de WhatsApp no encontradas. El webhook estará inactivo.');
}

// ==================== MIDDLEWARE ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging HTTP profesional
app.use(logger.expressMiddleware);

// ==================== RUTAS PRINCIPALES ====================

// Ruta principal de prueba con el bot
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

// Ruta del WEBHOOK que Twilio llamará cuando llegue un mensaje
app.post('/webhook/whatsapp', async (req, res) => {
    if (!whatsappService) {
        return res.status(503).send('Servicio de WhatsApp no configurado.');
    }

    try {
        // 1. Pasar el mensaje entrante a nuestro servicio
        const twimlResponse = await whatsappService.handleIncomingMessage(
            req.body,
            (userId, message) => bot.processMessage(userId, message) // Usamos nuestro bot
        );

        // 2. Configurar la respuesta para Twilio
        res.type('text/xml');
        res.send(twimlResponse);

    } catch (error) {
        console.error('❌ Error en webhook /whatsapp:', error);
        res.status(500).send('Error interno del servidor');
    }
});

// Ruta de prueba para enviar un mensaje MANUALMENTE (solo desarrollo)
if (process.env.NODE_ENV === 'development') {
    app.get('/test-send-whatsapp', async (req, res) => {
        const testToken = req.query.token;
        const allowedToken = process.env.DEV_TEST_TOKEN || 'iconic_dev_2025';
        
        if (testToken !== allowedToken) {
            console.warn('⚠️ Intento de acceso no autorizado a /test-send-whatsapp');
            return res.status(403).json({ 
                error: 'Acceso no autorizado', 
                message: 'Se requiere token de desarrollo válido' 
            });
        }
        
        if (!whatsappService) {
            return res.status(503).json({ 
                error: 'Servicio no disponible', 
                message: 'WhatsApp Service no está configurado' 
            });
        }
        
        const testNumber = process.env.TEST_PHONE_NUMBER;
        if (!testNumber) {
            return res.status(400).json({ 
                error: 'Configuración incompleta', 
                message: 'Variable TEST_PHONE_NUMBER no configurada en .env',
                example: 'TEST_PHONE_NUMBER=whatsapp:+593995592482'
            });
        }
        
        try {
            console.log(`🚀 Enviando mensaje de prueba a: ${testNumber}`);
            
            await whatsappService.sendMessage(
                testNumber,
                `🔧 [MODO DESARROLLO] Mensaje de prueba de Iconic Chatbot\n\n📅 Fecha: ${new Date().toLocaleString()}\n🏥 Estado: Servidor funcionando correctamente`
            );
            
            res.json({ 
                success: true, 
                message: '✅ Mensaje de prueba enviado al número autorizado.',
                recipient: testNumber 
            });
            
        } catch (error) {
            console.error('❌ Error en test-send-whatsapp:', error);
            res.status(500).json({ 
                error: 'Error al enviar mensaje', 
                details: error.message
            });
        }
    });
    
    // Ruta para ver configuración de desarrollo
    app.get('/dev/config', (req, res) => {
        res.json({
            environment: process.env.NODE_ENV,
            whatsapp_configured: !!whatsappService,
            test_number_set: !!process.env.TEST_PHONE_NUMBER,
            twilio_sid_set: !!process.env.TWILIO_ACCOUNT_SID,
            endpoints: {
                health: '/health',
                whatsapp_webhook: '/webhook/whatsapp',
                api_chat: '/api/chat',
                test_send: '/test-send-whatsapp?token=' + (process.env.DEV_TEST_TOKEN || 'iconic_dev_2025')
            }
        });
    });
}

// Iniciar servidor
app.listen(PORT, () => {
    logger.info('Iconic Chatbot v2.0 iniciado', {
        port: PORT,
        environment: process.env.NODE_ENV,
        whatsappConfigured: !!whatsappService
    });
    
    console.log(`
    🧠 Iconic Chatbot v2.1 INICIADO CON LOGGING
    👉 Local:  http://localhost:${PORT}
    👉 Health: http://localhost:${PORT}/health
    👉 API Chat: POST http://localhost:${PORT}/api/chat
    👉 Dev Config: http://localhost:${PORT}/dev/config
    👉 Test WhatsApp: http://localhost:${PORT}/test-send-whatsapp?token=iconic_dev_2025
    👉 Sistema de Logging: ✅ ACTIVADO
    👉 Ver logs en tiempo real: tail -f logs/combined.log
    `);
});