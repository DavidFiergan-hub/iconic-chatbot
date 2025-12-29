// platforms/whatsappService.js - Servicio para enviar/recibir mensajes de WhatsApp via Twilio CON LOGGING
const twilio = require('twilio');
const logger = require('../services/logger');

class WhatsAppService {
    constructor(accountSid, authToken, whatsappNumber) {
        this.client = twilio(accountSid, authToken);
        this.whatsappNumber = whatsappNumber;
        logger.info('WHATSAPP_SERVICE_INIT', { 
            service: 'whatsapp',
            status: 'active',
            number: whatsappNumber
        });
    }

    /**
     * Procesa un mensaje ENTRANTE desde Twilio.
     */
    async handleIncomingMessage(twilioData, botProcessor) {
        const userPhone = twilioData.From;
        const userMessage = twilioData.Body.trim();

        logger.logInteraction(
            userPhone, 
            'whatsapp', 
            'inbound', 
            { messageLength: userMessage.length }
        );

        let botResponse;
        try {
            botResponse = await botProcessor(userPhone, userMessage);
        } catch (error) {
            logger.logError(error, {
                userId: userPhone,
                platform: 'whatsapp',
                operation: 'bot_processing'
            });
            botResponse = { text: 'Lo siento, hubo un error procesando tu mensaje.' };
        }

        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(botResponse.text);

        logger.logInteraction(
            userPhone, 
            'whatsapp', 
            'outbound', 
            { 
                responseLength: botResponse.text.length,
                responseType: botResponse.type || 'unknown'
            }
        );

        return twiml.toString();
    }

    /**
     * ENVÍA un mensaje de WhatsApp.
     */
    async sendMessage(to, message) {
        try {
            logger.info('WHATSAPP_SENDING', {
                to: to,
                messageLength: message.length
            });
            
            const result = await this.client.messages.create({
                body: message,
                from: this.whatsappNumber,
                to: to
            });
            
            logger.info('WHATSAPP_SENT', {
                to: to,
                sid: result.sid,
                status: result.status,
                messageLength: message.length
            });
            
            return result;
        } catch (error) {
            logger.logError(error, {
                to: to,
                platform: 'whatsapp',
                operation: 'send_message'
            });
            throw error;
        }
    }
}

module.exports = WhatsAppService;