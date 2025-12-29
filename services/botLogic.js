// services/botLogic.js - El cerebro del chatbot Iconic CON AGENDAMIENTO COMPLETO
const responses = require('../config/responses');

class IconicBot {
    constructor() {
        this.userSessions = new Map(); // { userId: { step, data... } }
        this.availableDates = this.generateAvailableDates();
    }

    // Método PRINCIPAL: procesa cualquier mensaje y devuelve respuesta
    processMessage(userId, userMessage) {
        const message = userMessage.toLowerCase().trim();
        
        // 1. VERIFICAR SI EL USUARIO ESTÁ EN MEDIO DE UN AGENDAMIENTO
        if (this.userSessions.has(userId)) {
            const session = this.userSessions.get(userId);
            if (session.step && session.step.startsWith('appointment_')) {
                return this.handleAppointmentFlow(userId, message, session);
            }
        }
        
        // 2. Si no está agendando, detectar intención normal
        const intent = this.detectIntent(message);
        return this.generateResponse(intent, message, userId);
    }

    detectIntent(message) {
        const intents = {
            greeting: ['hola', 'buenos días', 'buenas tardes', 'hi', 'hello', 'qué tal'],
            services: ['servicio', 'procedimiento', 'operación', 'qué hacen', 'qué ofrecen'],
            prices: ['precio', 'costo', 'cuánto cuesta', 'tarifa', 'presupuesto'],
            doctors: ['doctor', 'médico', 'especialista', 'quién opera', 'dra.', 'dr.'],
            appointment: ['agendar', 'cita', 'consulta', 'reservar', 'quiero una cita'],
            location: ['dónde están', 'ubicación', 'dirección', 'cómo llegar', 'horario'],
            thanks: ['gracias', 'thank you', 'agradecido', 'te lo agradezco']
        };

        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => message.includes(keyword))) {
                return intent;
            }
        }
        
        return 'fallback';
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
                // INICIAR FLUJO DE AGENDAMIENTO
                this.userSessions.set(userId, { 
                    step: 'appointment_name',
                    data: {}
                });
                return {
                    text: `🎯 **INICIANDO AGENDAMIENTO** 🎯\n\n${responses.appointment.steps.join('\n')}\n\n${responses.appointment.questions[0]}`,
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

    // ==================== FLUJO COMPLETO DE AGENDAMIENTO ====================
    handleAppointmentFlow(userId, message, session) {
        switch(session.step) {
            case 'appointment_name':
                session.data.name = message;
                session.step = 'appointment_phone';
                return {
                    text: `✅ Nombre registrado: ${message}\n\n${responses.appointment.questions[2]} (Ej: 5512345678)`,
                    type: 'appointment_step',
                    step: 2
                };
                
            case 'appointment_phone':
                // Validación simple de teléfono
                if (!message.match(/^[0-9]{10,15}$/)) {
                    return {
                        text: '❌ Por favor, ingresa un número de teléfono válido (10-15 dígitos, sin espacios ni símbolos).',
                        type: 'appointment_error',
                        step: 2
                    };
                }
                session.data.phone = message;
                session.step = 'appointment_email';
                return {
                    text: `✅ Teléfono registrado\n\n${responses.appointment.questions[3]} (Ej: paciente@email.com)`,
                    type: 'appointment_step',
                    step: 3
                };
                
            case 'appointment_email':
                // Validación simple de email
                if (!message.includes('@') || !message.includes('.')) {
                    return {
                        text: '❌ Por favor, ingresa un correo electrónico válido.',
                        type: 'appointment_error',
                        step: 3
                    };
                }
                session.data.email = message;
                session.step = 'appointment_procedure';
                
                // Mostrar opciones de procedimientos
                const procedureOptions = responses.services.list.map((item, index) => {
                    const procedureName = item.split('**')[1]?.split('**')[0] || item.split('-')[0].trim();
                    return `${index + 1}. ${procedureName}`;
                }).join('\n');
                
                return {
                    text: `✅ Email registrado\n\n${responses.appointment.questions[4]}\n\n${procedureOptions}\n\nResponde con el número del procedimiento:`,
                    type: 'appointment_step',
                    step: 4
                };
                
            case 'appointment_procedure':
                const procedureIndex = parseInt(message) - 1;
                const procedures = responses.services.list.map(item => 
                    item.split('**')[1]?.split('**')[0] || item.split('-')[0].trim()
                );
                
                if (isNaN(procedureIndex) || procedureIndex < 0 || procedureIndex >= procedures.length) {
                    return {
                        text: `❌ Por favor, selecciona un número válido entre 1 y ${procedures.length}.`,
                        type: 'appointment_error',
                        step: 4
                    };
                }
                
                session.data.procedure = procedures[procedureIndex];
                session.step = 'appointment_date';
                
                // Mostrar próximas 3 fechas disponibles
                const dateOptions = this.availableDates.slice(0, 3).map((dateObj, index) => {
                    const dateStr = new Date(dateObj.date).toLocaleDateString('es-MX', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    });
                    return `${index + 1}. ${dateStr}`;
                }).join('\n');
                
                return {
                    text: `✅ Procedimiento seleccionado: ${session.data.procedure}\n\n${responses.appointment.questions[5]}\n\n${dateOptions}\n\nResponde con el número de la fecha deseada:`,
                    type: 'appointment_step',
                    step: 5
                };
                
            case 'appointment_date':
                const dateIndex = parseInt(message) - 1;
                if (isNaN(dateIndex) || dateIndex < 0 || dateIndex >= 3) {
                    return {
                        text: '❌ Por favor, selecciona un número válido entre 1 y 3.',
                        type: 'appointment_error',
                        step: 5
                    };
                }
                
                const selectedDate = this.availableDates[dateIndex];
                session.data.date = selectedDate.date;
                session.step = 'appointment_time';
                
                // Mostrar horarios disponibles para esa fecha
                const timeOptions = selectedDate.slots.map((time, index) => 
                    `${index + 1}. ${time}`
                ).join('\n');
                
                return {
                    text: `✅ Fecha seleccionada\n\nAhora elige un horario:\n\n${timeOptions}\n\nResponde con el número del horario:`,
                    type: 'appointment_step',
                    step: 6
                };
                
            case 'appointment_time':
                const timeIndex = parseInt(message) - 1;
                const selectedDateObj = this.availableDates.find(d => 
                    d.date === session.data.date
                );
                
                if (isNaN(timeIndex) || timeIndex < 0 || timeIndex >= selectedDateObj.slots.length) {
                    return {
                        text: `❌ Por favor, selecciona un número válido entre 1 y ${selectedDateObj.slots.length}.`,
                        type: 'appointment_error',
                        step: 6
                    };
                }
                
                session.data.time = selectedDateObj.slots[timeIndex];
                session.step = 'appointment_confirm';
                
                // Mostrar resumen para confirmación
                const summary = `
📋 **RESUMEN DE TU CITA**

👤 **Nombre:** ${session.data.name}
📞 **Teléfono:** ${session.data.phone}
📧 **Email:** ${session.data.email}
🎯 **Procedimiento:** ${session.data.procedure}
📅 **Fecha:** ${new Date(session.data.date).toLocaleDateString('es-MX')}
⏰ **Hora:** ${session.data.time}

¿Confirmas la cita con estos datos?
Responde **SI** para confirmar o **NO** para cancelar.
                `;
                
                return {
                    text: summary.trim(),
                    type: 'appointment_confirm',
                    step: 7
                };
                
            case 'appointment_confirm':
                if (message.toLowerCase() === 'si' || message.toLowerCase() === 'sí') {
                    // GUARDAR LA CITA (aquí iría la conexión a tu base de datos)
                    this.saveAppointmentToDatabase(session.data);
                    
                    // Limpiar sesión
                    this.userSessions.delete(userId);
                    
                    return {
                        text: `🎉 **¡CITA CONFIRMADA EXITOSAMENTE!** 🎉

✅ Tu cita ha sido agendada.
📅 **Fecha:** ${new Date(session.data.date).toLocaleDateString('es-MX')}
⏰ **Hora:** ${session.data.time}
👨‍⚕️ **Procedimiento:** ${session.data.procedure}

${responses.preparation?.title || '📋 **PREPARACIÓN PARA TU CONSULTA:**'}
${responses.preparation?.list?.join('\n') || '• Llevar identificación oficial\n• Traer estudios médicos recientes\n• Lista de medicamentos actuales'}

📧 Recibirás un correo de confirmación en: ${session.data.email}
📞 Nos pondremos en contacto al: ${session.data.phone}

¡Gracias por confiar en Iconic! 🏥`,
                        type: 'appointment_confirmed'
                    };
                } else {
                    // Cancelar
                    this.userSessions.delete(userId);
                    return {
                        text: '❌ Agendamiento cancelado. Si deseas una cita más adelante, no dudes en decírnoslo.',
                        type: 'appointment_cancelled'
                    };
                }
                
            default:
                this.userSessions.delete(userId);
                return {
                    text: '⚠️ Sesión de agendamiento reiniciada. ¿En qué más puedo ayudarte?',
                    type: 'appointment_reset'
                };
        }
    }

    // ==================== FUNCIONES AUXILIARES ====================
    generateAvailableDates() {
        const dates = [];
        const today = new Date();
        
        for (let i = 1; i <= 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            // No incluir domingos
            if (date.getDay() !== 0) {
                dates.push({
                    date: date.toISOString().split('T')[0],
                    slots: ['10:00', '12:00', '15:00', '17:00']
                });
            }
        }
        
        return dates;
    }

    saveAppointmentToDatabase(appointmentData) {
        // AQUÍ CONECTARÍAS CON TU BASE DE DATOS MONGODB
        // Por ahora, solo lo registramos en la consola
        console.log('📅 CITA GUARDADA:', appointmentData);
        
        // En un sistema real, aquí harías:
        // const Appointment = require('../models/Appointment');
        // await Appointment.create(appointmentData);
        
        // También podrías enviar notificaciones por email aquí
    }
}

// Exportar UNA instancia del bot (patrón Singleton)
module.exports = new IconicBot();