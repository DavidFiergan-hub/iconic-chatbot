// services/botLogic.js - El cerebro del chatbot Iconic CON LOGGING Y VALIDACIONES
const logger = require('./logger');
const responses = require('../config/responses');

class IconicBot {
    constructor() {
        logger.info('BOT_INITIALIZED', { 
            version: '2.1', 
            features: ['appointment', 'validation', 'logging'] 
        });
        this.userSessions = new Map();
        this.availableDates = this.generateAvailableDates();
    }

    // Método PRINCIPAL: procesa cualquier mensaje y devuelve respuesta
    processMessage(userId, userMessage) {
        const startTime = Date.now();
        const message = userMessage.toLowerCase().trim();
        const platform = this.detectPlatform(userId);
        
        logger.debug('MESSAGE_RECEIVED', {
            userId: userId.substring(0, 10) + '...',
            platform: platform,
            messageLength: message.length,
            hasSession: this.userSessions.has(userId)
        });
        
        // 1. VERIFICAR SI EL USUARIO ESTÁ EN MEDIO DE UN AGENDAMIENTO
        if (this.userSessions.has(userId)) {
            const session = this.userSessions.get(userId);
            if (session.step && session.step.startsWith('appointment_')) {
                return this.handleAppointmentFlow(userId, message, session);
            }
        }
        
        // 2. Si no está agendando, detectar intención normal
        const intent = this.detectIntent(message);
        const response = this.generateResponse(intent, message, userId);
        
        // 3. Loggear la interacción
        const duration = Date.now() - startTime;
        logger.logInteraction(
            userId,
            platform,
            'processed',
            {
                intent: intent,
                responseType: response.type,
                durationMs: duration,
                hasAppointment: response.type.includes('appointment')
            }
        );
        
        return response;
    }

    // Método para detectar plataforma desde userId
    detectPlatform(userId) {
        if (userId.includes('whatsapp')) return 'whatsapp';
        if (userId.includes('fb_')) return 'facebook';
        if (userId.includes('ig_')) return 'instagram';
        if (userId.includes('web') || userId.includes('test')) return 'web';
        return 'unknown';
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
                logger.info('APPOINTMENT_STARTED', { userId: userId });
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

    // ==================== MÉTODOS DE VALIDACIÓN ====================
    validatePhone(phone) {
        // 1. Limpiar el número
        const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
        
        // 2. Validar que sean solo dígitos
        if (!/^\d+$/.test(cleanPhone)) {
            return { 
                valid: false, 
                reason: 'Solo debe contener números (sin espacios, guiones o símbolos)' 
            };
        }
        
        // 3. Validar longitud
        if (cleanPhone.length < 8 || cleanPhone.length > 15) {
            return { 
                valid: false, 
                reason: `Longitud incorrecta (${cleanPhone.length} dígitos). Debe tener 8-15 dígitos.` 
            };
        }
        
        return { 
            valid: true, 
            clean: cleanPhone,
            formatted: `+${cleanPhone}`
        };
    }

    validateEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        
        if (!emailRegex.test(email.toLowerCase())) {
            return { 
                valid: false, 
                reason: 'Formato inválido. Ejemplo: nombre@dominio.com' 
            };
        }
        
        // Validar dominios de prueba comunes
        const testDomains = ['example.com', 'test.com', 'mailinator.com', 'tempmail.com'];
        const domain = email.split('@')[1];
        
        if (testDomains.includes(domain.toLowerCase())) {
            return { 
                valid: false, 
                reason: 'Por favor usa un correo electrónico real (no uno de prueba)' 
            };
        }
        
        return { valid: true, email: email.toLowerCase() };
    }

    // ==================== FLUJO COMPLETO DE AGENDAMIENTO ====================
    handleAppointmentFlow(userId, message, session) {
        logger.info('APPOINTMENT_FLOW', {
            userId: userId,
            step: session.step,
            inputLength: message.length
        });
        
        switch(session.step) {
            case 'appointment_name':
                session.data.name = message;
                session.step = 'appointment_phone';
                logger.info('APPOINTMENT_NAME_SET', { name: message });
                return {
                    text: `✅ Nombre registrado: ${message}\n\n${responses.appointment.questions[2]} (Ej: 5512345678)`,
                    type: 'appointment_step',
                    step: 2
                };
                
            case 'appointment_phone':
                const phoneValidation = this.validatePhone(message);
                if (!phoneValidation.valid) {
                    logger.info('PHONE_VALIDATION_FAILED', {
                        input: message,
                        reason: phoneValidation.reason
                    });
                    
                    return {
                        text: `❌ **Número inválido**\n\n${phoneValidation.reason}\n\nEjemplos válidos:\n• 0987654321\n• +593987654321\n\nPor favor, ingresa tu número nuevamente:`,
                        type: 'appointment_error',
                        step: 2
                    };
                }
                session.data.phone = phoneValidation.formatted;
                session.step = 'appointment_email';
                
                logger.info('PHONE_VALIDATION_SUCCESS', {
                    phone: phoneValidation.formatted
                });
                
                return {
                    text: `✅ **Teléfono registrado:** ${phoneValidation.formatted}\n\n${responses.appointment.questions[3]}\n\n_Ejemplo: paciente@gmail.com_`,
                    type: 'appointment_step',
                    step: 3
                };
                
            case 'appointment_email':
                const emailValidation = this.validateEmail(message);
                if (!emailValidation.valid) {
                    logger.info('EMAIL_VALIDATION_FAILED', {
                        input: message,
                        reason: emailValidation.reason
                    });
                    
                    return {
                        text: `❌ **Correo inválido**\n\n${emailValidation.reason}\n\nPor favor, ingresa tu correo nuevamente:`,
                        type: 'appointment_error',
                        step: 3
                    };
                }
                session.data.email = emailValidation.email;
                session.step = 'appointment_procedure';
                
                logger.info('EMAIL_VALIDATION_SUCCESS', {
                    email: emailValidation.email
                });
                
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
                    logger.info('PROCEDURE_VALIDATION_FAILED', {
                        input: message,
                        validRange: `1-${procedures.length}`
                    });
                    
                    return {
                        text: `❌ Por favor, selecciona un número válido entre 1 y ${procedures.length}.`,
                        type: 'appointment_error',
                        step: 4
                    };
                }
                
                session.data.procedure = procedures[procedureIndex];
                session.step = 'appointment_date';
                
                logger.info('PROCEDURE_SELECTED', {
                    procedure: session.data.procedure
                });
                
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
                    logger.info('DATE_VALIDATION_FAILED', {
                        input: message,
                        validRange: '1-3'
                    });
                    
                    return {
                        text: '❌ Por favor, selecciona un número válido entre 1 y 3.',
                        type: 'appointment_error',
                        step: 5
                    };
                }
                
                const selectedDate = this.availableDates[dateIndex];
                session.data.date = selectedDate.date;
                session.step = 'appointment_time';
                
                logger.info('DATE_SELECTED', {
                    date: session.data.date
                });
                
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
                    logger.info('TIME_VALIDATION_FAILED', {
                        input: message,
                        validRange: `1-${selectedDateObj.slots.length}`
                    });
                    
                    return {
                        text: `❌ Por favor, selecciona un número válido entre 1 y ${selectedDateObj.slots.length}.`,
                        type: 'appointment_error',
                        step: 6
                    };
                }
                
                session.data.time = selectedDateObj.slots[timeIndex];
                session.step = 'appointment_confirm';
                
                logger.info('TIME_SELECTED', {
                    time: session.data.time
                });
                
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
                    // GUARDAR LA CITA
                    this.saveAppointmentToDatabase(session.data, userId);
                    
                    // Limpiar sesión
                    this.userSessions.delete(userId);
                    
                    logger.info('APPOINTMENT_CONFIRMED', {
                        userId: userId,
                        procedure: session.data.procedure,
                        date: session.data.date,
                        time: session.data.time
                    });
                    
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
                    logger.info('APPOINTMENT_CANCELLED', { userId: userId });
                    return {
                        text: '❌ Agendamiento cancelado. Si deseas una cita más adelante, no dudes en decírnoslo.',
                        type: 'appointment_cancelled'
                    };
                }
                
            default:
                this.userSessions.delete(userId);
                logger.info('APPOINTMENT_RESET', { userId: userId });
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
        
        logger.debug('AVAILABLE_DATES_GENERATED', { count: dates.length });
        return dates;
    }

    saveAppointmentToDatabase(appointmentData, userId) {
        logger.logAppointment({
            userId: userId,
            procedure: appointmentData.procedure,
            date: appointmentData.date,
            time: appointmentData.time,
            status: 'CONFIRMED',
            hasEmail: !!appointmentData.email,
            hasPhone: !!appointmentData.phone
        });
        
        console.log('📅 CITA GUARDADA EN LOGS:', appointmentData);
        
        // TODO: Conectar con base de datos real
        // const Appointment = require('../models/Appointment');
        // await Appointment.create(appointmentData);
    }
}

// Exportar UNA instancia del bot (patrón Singleton)
module.exports = new IconicBot();