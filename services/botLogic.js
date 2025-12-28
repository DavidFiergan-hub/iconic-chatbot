// services/botLogic.js - El cerebro del chatbot Iconic
const responses = require('../config/responses');

class IconicBot {
    constructor() {
        this.userSessions = new Map(); // Para seguir conversaciones
    }

    // Método PRINCIPAL: procesa cualquier mensaje y devuelve respuesta
    processMessage(userId, userMessage) {
        const message = userMessage.toLowerCase().trim();
        
        // 1. Detectar la intención del usuario
        const intent = this.detectIntent(message);
        
        // 2. Generar la respuesta adecuada
        return this.generateResponse(intent, message, userId);
    }

    detectIntent(message) {
        // Palabras clave para cada intención
        const intents = {
            greeting: ['hola', 'buenos días', 'buenas tardes', 'hi', 'hello', 'qué tal'],
            services: ['servicio', 'procedimiento', 'operación', 'qué hacen', 'qué ofrecen'],
            prices: ['precio', 'costo', 'cuánto cuesta', 'tarifa', 'presupuesto'],
            doctors: ['doctor', 'médico', 'especialista', 'quién opera', 'dra.', 'dr.'],
            appointment: ['agendar', 'cita', 'consulta', 'reservar', 'quiero una cita'],
            location: ['dónde están', 'ubicación', 'dirección', 'cómo llegar', 'horario'],
            thanks: ['gracias', 'thank you', 'agradecido', 'te lo agradezco']
        };

        // Buscar coincidencias
        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => message.includes(keyword))) {
                return intent;
            }
        }
        
        return 'fallback'; // Si no entendió
    }

    generateResponse(intent, originalMessage, userId) {
        switch(intent) {
            case 'greeting':
                const randomGreeting = responses.greetings.es[
                    Math.floor(Math.random() * responses.greetings.es.length)
                ];
                return {
                    text: `${randomGreeting}\n\n${responses.greetings.options.join('\n')}`,
                    type: 'greeting'
                };
                
            case 'services':
                return {
                    text: `${responses.services.title}\n\n${responses.services.list.join('\n')}\n\n${responses.services.note}`,
                    type: 'services'
                };
                
            case 'prices':
                return {
                    text: responses.pricing.disclaimer,
                    type: 'prices',
                    buttons: [
                        { text: '💬 Consultar por WhatsApp', payload: 'WHATSAPP' },
                        { text: '📅 Valoración gratuita', payload: 'APPOINTMENT' }
                    ]
                };
                
            case 'doctors':
                const docs = responses.specialists.team.map(doc => 
                    `**${doc.name}**\n${doc.specialty}\n${doc.experience}\n${doc.certification}\n`
                ).join('\n');
                return {
                    text: `${responses.specialists.title}\n\n${docs}`,
                    type: 'doctors'
                };
                
            case 'appointment':
                // Iniciar sesión para agendamiento
                this.userSessions.set(userId, { step: 'start_booking' });
                return {
                    text: `🎯 ${responses.appointment.steps.join('\n')}\n\n${responses.appointment.questions[0]}`,
                    type: 'appointment_start',
                    step: 1
                };
                
            case 'location':
                return {
                    text: `${responses.location.address}\n\n⏰ **Horarios:**\n${responses.location.hours.weekdays}\n${responses.location.hours.saturday}\n${responses.location.hours.sunday}\n\n${responses.location.contact}`,
                    type: 'location'
                };
                
            case 'thanks':
                return {
                    text: '¡Gracias a ti! 😊\n\nRecuerda que estoy aquí para ayudarte con cualquier información sobre Iconic.',
                    type: 'thanks'
                };
                
            default:
                // Buscar en FAQ automáticas
                for (const [question, answer] of Object.entries(responses.autoResponses.faq)) {
                    if (originalMessage.includes(question.toLowerCase().split(' ')[0])) {
                        return { text: answer, type: 'faq' };
                    }
                }
                
                return {
                    text: `🤔 ${responses.autoResponses.faq["¿Cuánto tiempo dura la recuperación?"].split('\n')[0]}\n\n${responses.greetings.options.slice(0, 3).join('\n')}`,
                    type: 'fallback'
                };
        }
    }

    // Para manejar sesiones de agendamiento (se implementará después)
    handleAppointmentStep(userId, message) {
        // Aquí irá la lógica paso a paso para agendar
        return { text: 'Función de agendamiento en desarrollo...' };
    }
}

// Exportar UNA instancia del bot (patrón Singleton)
module.exports = new IconicBot();