// platforms/whatsappService.js - Servicio para enviar/recibir mensajes de WhatsApp via Twilio
const twilio = require('twilio');

class WhatsAppService {
    constructor(accountSid, authToken, whatsappNumber) {
        this.client = twilio(accountSid, authToken);
        this.whatsappNumber = whatsappNumber; // Ej: 'whatsapp:+14155238886'
    }

    /**
     * Procesa un mensaje ENTRANTE desde Twilio.
     * @param {Object} twilioData - El cuerpo de la petición POST de Twilio.
     * @param {Function} botProcessor - Función (userId, message) => { text, type }
     * @returns {Object} Respuesta para Twilio (Twiml).
     */
    async handleIncomingMessage(twilioData, botProcessor) {
        // 1. Extraer datos clave del mensaje entrante
        const userPhone = twilioData.From; // Ej: 'whatsapp:+5215512345678'
        const userMessage = twilioData.Body.trim(); // El texto del usuario

        console.log(`📩 Mensaje de ${userPhone}: "${userMessage}"`);

        // 2. Pasar el mensaje al cerebro de nuestro bot
        let botResponse;
        try {
            botResponse = await botProcessor(userPhone, userMessage);
        } catch (error) {
            console.error('❌ Error en botLogic:', error);
            botResponse = { text: 'Lo siento, hubo un error procesando tu mensaje.' };
        }

        // 3. Formatear y enviar la respuesta usando Twilio MessagingResponse
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(botResponse.text);

        // 4. Devolver el XML que Twilio espera
        return twiml.toString();
    }

    /**
     * ENVÍA un mensaje de WhatsApp (útil para notificaciones o respuestas asíncronas).
     * @param {string} to - Número destino en formato 'whatsapp:+5215512345678'
     * @param {string} message - Texto a enviar.
     */
    async sendMessage(to, message) {
        try {
            const result = await this.client.messages.create({
                body: message,
                from: this.whatsappNumber,
                to: to
            });
            console.log(`✅ Mensaje enviado a ${to}: SID=${result.sid}`);
            return result;
        } catch (error) {
            console.error(`❌ Error enviando mensaje a ${to}:`, error.message);
            throw error;
        }
    }
}

module.exports = WhatsAppService;