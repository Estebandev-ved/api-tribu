import { useState } from 'react'
import { Shield, FileText, ChevronDown, ChevronUp, Scale } from 'lucide-react'

const sections = [
    {
        id: 'privacidad',
        icon: Shield,
        label: 'Política de Privacidad',
        color: '#4facfe',
        subsections: [
            {
                title: '1. Responsable del Tratamiento',
                content: 'TRIBU E-COMMERCE (en adelante "Tribu", "la plataforma", "nosotros"), con domicilio principal en Colombia, es el responsable del tratamiento de los datos personales recopilados a través del sitio web tribucol.shop y sus aplicaciones asociadas. El contacto del responsable es: contacto@tribu.com.'
            },
            {
                title: '2. Datos Personales Recopilados',
                content: 'Podemos recopilar las siguientes categorías de datos personales: (a) Datos de identificación: nombres, apellidos, número de documento de identidad, fecha de nacimiento. (b) Datos de contacto: correo electrónico, número de teléfono, dirección de domicilio. (c) Datos de facturación: NIT, razón social, información fiscal. (d) Datos de autenticación: contraseña cifrada, PIN de seguridad, secretos TOTP para autenticación de dos factores. (e) Datos de transacciones: historial de compras, montos, métodos de pago, referencias de pago. (f) Datos de comportamiento en plataforma: productos vistos, carritos abandonados, interacciones. (g) Datos de gamificación: logros alcanzados, rachas, giros de ruleta, puntuaciones en leaderboard. (h) Datos de dispositivo: dirección IP, agente de usuario, tipo de navegador, sistema operativo.'
            },
            {
                title: '3. Finalidades del Tratamiento',
                content: 'Los datos personales serán tratados para las siguientes finalidades: (a) Gestionar la creación y mantenimiento de la cuenta de usuario. (b) Procesar pedidos, pagos, devoluciones y facturación electrónica. (c) Verificar la identidad del usuario y prevenir fraudes. (d) Administrar el programa de lealtad, puntos Tribu, cashback y recompensas. (e) Enviar notificaciones transaccionales (confirmaciones de pedido, estados de envío, facturas). (f) Enviar comunicaciones de marketing y promociones, previo consentimiento. (g) Mejorar la plataforma y personalizar la experiencia de usuario. (h) Cumplir con obligaciones legales y regulatorias. (i) Gestionar el soporte al cliente y conversaciones de ayuda.'
            },
            {
                title: '4. Base Legal del Tratamiento',
                content: 'El tratamiento de datos personales se fundamenta en: (a) La ejecución de la relación contractual derivada de los términos y condiciones de la plataforma. (b) El consentimiento expreso del titular, otorgado al registrarse y/o aceptar las políticas. (c) El cumplimiento de obligaciones legales aplicables (Ley 527 de 1999, Estatuto Tributario, Ley 1480 de 2011). (d) El interés legítimo de Tribu para mejorar sus servicios y prevenir el fraude.'
            },
            {
                title: '5. Derechos del Titular (ARCO)',
                content: 'De conformidad con la Ley 1581 de 2012 y el Decreto Reglamentario 1377 de 2013, el titular de los datos tiene los derechos de Acceder, Rectificar, Cancelar y Oponerse (Derechos ARCO) al tratamiento de sus datos personales. Para ejercer estos derechos, el titular puede enviar una solicitud escrita al correo electrónico contacto@tribu.com, indicando: (a) Nombre completo y documento de identidad. (b) Derecho que desea ejercer. (c) Descripción clara de la solicitud. (d) Datos de contacto para respuesta. Tribu responderá la solicitud en un plazo máximo de 15 días hábiles. La solicitud de supresión de datos implicará la cancelación definitiva de la cuenta y la imposibilidad de seguir utilizando los servicios de la plataforma.'
            },
            {
                title: '6. Transferencia y Compartición de Datos',
                content: 'Tribu no vende, alquila ni comercializa datos personales a terceros. Podremos compartir datos con: (a) Procesadores de pago (Efipay y otras pasarelas) exclusivamente para procesar transacciones. (b) Transportadoras y operadores logísticos para la entrega de pedidos. (c) Autoridades competentes en cumplimiento de obligaciones legales (DIAN, Superintendencia de Industria y Comercio, Fiscalía). (d) Proveedores de servicios tecnológicos (alojamiento, email, análisis) que actúan como encargados del tratamiento bajo contrato de confidencialidad.'
            },
            {
                title: '7. Medidas de Seguridad',
                content: 'Tribu implementa las siguientes medidas de seguridad técnicas, administrativas y físicas para proteger los datos personales: (a) Cifrado AES-256 para datos sensibles almacenados. (b) Contraseñas y PIN almacenados con hash BCrypt. (c) Autenticación de dos factores (2FA/TOTP) para cuentas de usuarios. (d) Protección contra ataques de fuerza bruta con bloqueo temporal por IP tras 5 intentos fallidos. (e) Tokens JWT con expiración de 24 horas y refresco seguro. (f) Bloqueo de fila a nivel de base de datos para prevenir condiciones de carrera y doble gasto. (g) Verificación HMAC-SHA256 en webhooks de pago. (h) Conexiones cifradas TLS/SSL en toda la plataforma. (i) Auditoría de eventos de seguridad con registro inmutable.'
            },
            {
                title: '8. Uso de Cookies y Tecnologías de Rastreo',
                content: 'La plataforma utiliza cookies propias y de terceros para: (a) Mantener la sesión del usuario activa (cookies técnicas o esenciales). (b) Recordar preferencias del usuario (cookies funcionales). (c) Analizar el tráfico y comportamiento en el sitio con fines estadísticos (Google Analytics u otras herramientas similares). (d) Personalizar contenido y ofertas (cookies de marketing, previo consentimiento). El usuario puede configurar su navegador para rechazar todas las cookies, aunque algunas funcionalidades de la plataforma podrían verse afectadas. Al continuar navegando en la plataforma después de haber sido informado, el usuario acepta el uso de cookies según esta política.'
            },
            {
                title: '9. Conservación de Datos',
                content: 'Los datos personales se conservarán durante el tiempo necesario para cumplir con las finalidades descritas, y en todo caso, durante el término de duración de la relación contractual con el usuario y los plazos legales de prescripción aplicables (hasta 10 años para obligaciones fiscales y contables según el Estatuto Tributario). Una vez cumplidos estos plazos, los datos serán eliminados de forma segura o anonimizados.'
            },
            {
                title: '10. Menores de Edad',
                content: 'La plataforma está dirigida exclusivamente a mayores de 18 años. No recopilamos intencionalmente datos personales de menores de edad. Si se descubre que un menor de edad ha proporcionado datos personales sin consentimiento parental, procederemos a eliminarlos de inmediato. Las secciones de juegos, ruleta y gamificación están estrictamente prohibidas para menores de 18 años.'
            },
            {
                title: '11. Modificaciones a la Política de Privacidad',
                content: 'Tribu se reserva el derecho de modificar esta Política de Privacidad en cualquier momento. Los cambios serán notificados a los usuarios a través de la plataforma o por correo electrónico con al menos 15 días de antelación a su entrada en vigor. El uso continuado de la plataforma después de la fecha de vigencia constituye la aceptación de los cambios.'
            }
        ]
    },
    {
        id: 'terminos',
        icon: FileText,
        label: 'Términos y Condiciones',
        color: '#00C896',
        subsections: [
            {
                title: '1. Aceptación de los Términos',
                content: 'Al acceder, navegar, registrarse o realizar cualquier transacción en la plataforma Tribu (tribucol.shop), el usuario manifiesta haber leído, entendido y aceptado expresamente la totalidad de los presentes Términos y Condiciones, así como la Política de Privacidad. Si el usuario no está de acuerdo con estos términos, debe abstenerse de utilizar la plataforma.'
            },
            {
                title: '2. Capacidad Legal',
                content: 'Los servicios de la plataforma están disponibles exclusivamente para personas mayores de 18 años con capacidad legal para contratar. Al registrarse, el usuario declara y garantiza ser mayor de edad y tener plena capacidad legal para obligarse conforme a la legislación colombiana. Las secciones de juegos, ruleta y cualquier mecánica de gamificación están restringidas a mayores de 18 años.'
            },
            {
                title: '3. Registro y Cuenta de Usuario',
                content: 'Para utilizar los servicios de la plataforma, el usuario debe crear una cuenta proporcionando información veraz, completa y actualizada. El usuario es el único responsable de: (a) Mantener la confidencialidad de su contraseña, PIN y secretos de autenticación de dos factores. (b) Todas las actividades que ocurran bajo su cuenta. (c) Notificar inmediatamente a Tribu sobre cualquier uso no autorizado de su cuenta. Tribu se reserva el derecho de suspender o cancelar cuentas que proporcionen información falsa, fraudulenta o incompleta, o que violen estos términos. El registro de múltiples cuentas por un mismo usuario no está permitido y podrá resultar en la suspensión de todas las cuentas asociadas.'
            },
            {
                title: '4. Autenticación y Seguridad de la Cuenta',
                content: 'La plataforma ofrece autenticación de dos factores (2FA) como mecanismo opcional de seguridad adicional. Se recomienda encarecidamente su activación. El PIN de seguridad es requerido para realizar transferencias P2P y operaciones sensibles. Tribu no será responsable por pérdidas derivadas del acceso no autorizado a la cuenta del usuario debido a: (a) Contraseñas débiles, compartidas o reutilizadas. (b) Pérdida o robo del dispositivo móvil utilizado para 2FA. (c) Phishing o ingeniería social donde el usuario haya revelado voluntariamente sus credenciales. (d) Falta de activación de las medidas de seguridad disponibles (2FA, PIN). El usuario reconoce que es su responsabilidad mantener su dispositivo y credenciales seguros.'
            },
            {
                title: '5. Billetera Digital y Puntos Tribu',
                content: 'La Tribu Card es una billetera digital interna que permite al usuario almacenar Puntos Tribu dentro de la plataforma. Los Puntos Tribu: (a) No constituyen moneda de curso legal, no están expresados en pesos colombianos ni en ninguna otra divisa real. (b) No constituyen un depósito bancario ni están cubiertos por el seguro de depósitos del Fogafín. (c) No generan intereses ni rendimientos financieros de ningún tipo. (d) No tienen valor comercial externo ni equivalencia monetaria reembolsable en dinero real. (e) No pueden ser retirados en efectivo ni transferidos a cuentas bancarias externas bajo ninguna circunstancia. (f) Pueden ser transferidos exclusivamente entre usuarios registrados dentro de la plataforma y utilizados únicamente para realizar compras, pagar suscripciones, participar en compras grupales y acceder a beneficios dentro del ecosistema Tribu. (g) Están respaldados por un libro contable inmutable (ledger) que registra todos los movimientos. Los movimientos se registran con estado ON_HOLD (pendiente) o CLEARED (disponible). Los puntos pueden estar sujetos a períodos de retención según el tipo de transacción (ej. cashback: 7 días).'
            },
            {
                title: '6. Puntos Tribu (Programa de Fidelización)',
                content: 'Los Puntos Tribu (pts) son unidades de fidelidad de uso exclusivamente interno dentro de la plataforma. Se rigen por las siguientes reglas: (a) Sin valor comercial externo: No constituyen moneda de curso legal, no tienen equivalencia monetaria reembolsable en dinero real fuera de Tribu, no pueden ser transferidos a cuentas bancarias externas ni intercambiados por efectivo. (b) No son propiedad del usuario: Son unidades de fidelización que Tribu otorga de forma discrecional y pueden ser modificadas o descontinuadas. (c) Redención interna: Solo son válidos para adquirir productos, pagar cuentas compartidas en Compras Grupales o canjear beneficios dentro del ecosistema Tribu. (d) Caducidad: Los puntos pueden estar sujetos a fechas de expiración según las reglas del programa, que serán notificadas oportunamente. (e) Sin interés: No generan ningún tipo de rendimiento financiero. (f) Revocación: Tribu se reserva el derecho de revocar puntos obtenidos de manera fraudulenta o en violación de estos términos. Los Puntos Tribu operan como un programa de recompensas y acumulación de puntos, alineado con el marco legal aplicable a programas de lealtad y fidelización de clientes en Colombia (Ley 1480 de 2011).'
            },
            {
                title: '7. Transferencias entre Usuarios (P2P)',
                content: 'La plataforma permite transferencias de saldo entre usuarios registrados (Transferencias P2P), sujetas a las siguientes condiciones: (a) El remitente debe verificar la transferencia mediante su PIN de seguridad. (b) Están sujetas a límites diarios según el nivel VIP del usuario (BRONCE: 3 transferencias/día, PLATA: 10, ORO: ilimitado). (c) Están sujetas a límites de monto por transacción según el nivel VIP. (d) Una vez confirmada, la transferencia es irreversible salvo por intervención administrativa en casos de fraude comprobado. (e) El remitente es responsable de verificar la identidad del destinatario antes de enviar la transferencia. Tribu no será responsable por transferencias enviadas a destinatarios incorrectos por error del remitente. (f) Tribu se reserva el derecho de revertir transferencias en caso de actividad fraudulenta o violación de estos términos, previa investigación y decisión administrativa.'
            },
            {
                title: '8. Compras y Pedidos',
                content: 'Al realizar un pedido en la plataforma, el usuario acepta las siguientes condiciones: (a) El contrato de compraventa se perfecciona en el momento en que el pedido es confirmado y el pago es aprobado por la pasarela de pago. (b) Los precios mostrados incluyen el IVA y demás impuestos aplicables, salvo que se indique expresamente lo contrario. (c) Tribu se reserva el derecho de rechazar o cancelar pedidos por: error en el precio, falta de inventario, sospecha de fraude, incumplimiento de estos términos. (d) En caso de cancelación por falta de inventario, Tribu reembolsará la totalidad del monto pagado al saldo del usuario o al método de pago original dentro de los 5 días hábiles siguientes. (e) El título de propiedad del producto se transfiere al usuario en el momento de la entrega física del producto.'
            },
            {
                title: '9. Precios, Impuestos y Facturación',
                content: 'Todos los precios están expresados en pesos colombianos (COP) e incluyen el IVA cuando aplica. Los precios están sujetos a cambios sin previo aviso, aunque los cambios no afectarán pedidos ya confirmados y pagados. Tribu emitirá factura electrónica por cada compra realizada, de conformidad con la Resolución DIAN 000042 de 2020 y normas complementarias. El usuario es responsable de proporcionar información fiscal correcta (NIT/RUT, razón social) para la facturación. La factura será enviada al correo electrónico registrado del usuario y estará disponible en la sección de facturas de la plataforma.'
            },
            {
                title: '10. Envíos y Tiempos de Entrega',
                content: 'Los tiempos de entrega proporcionados son estimados y pueden variar según: (a) La ubicación geográfica del destino. (b) La disponibilidad del producto en inventario. (c) Las condiciones operativas de la transportadora. (d) Fuerza mayor o caso fortuito. Los tiempos estimados comienzan a contar desde la confirmación del pago. Tribu no se hace responsable por retrasos imputables exclusivamente a las transportadoras nacionales, pero brindará acompañamiento para rastrear y resolver el caso. El usuario debe inspeccionar el producto al momento de la entrega y reportar cualquier daño o discrepancia dentro de las 24 horas siguientes.'
            },
            {
                title: '11. Devoluciones y Reembolsos',
                content: 'El usuario tiene derecho a solicitar la devolución de un producto dentro de los 5 días hábiles siguientes a la recepción, de conformidad con el artículo 47 de la Ley 1480 de 2011 (Estatuto del Consumidor), siempre que el producto: (a) Presente defectos de fabricación. (b) No corresponda a lo solicitado. (c) Haya llegado en mal estado. Para procesar la devolución, el usuario debe: (i) Contactar a soporte a través del chat o WhatsApp. (ii) Proporcionar evidencia fotográfica del daño o defecto. (iii) Devolver el producto en su empaque original y en las mismas condiciones en que fue recibido. Tribu evaluará la solicitud y podrá aprobar o rechazar la devolución. En caso de aprobación, Tribu procesará el reembolso al saldo de la billetera del usuario o al método de pago original, según corresponda, dentro de los 10 días hábiles siguientes. Los costos de envío de la devolución serán asumidos por Tribu cuando se trate de productos defectuosos o incorrectos.'
            },
            {
                title: '12. Tribu Pass (Suscripción Mensual)',
                content: 'Tribu Pass es una suscripción mensual que otorga beneficios exclusivos. Se rige por: (a) Precio: La suscripción tiene un costo de $9.900 COP mensuales (precio sujeto a cambios con aviso previo). (b) Activación: Al activar la suscripción, el usuario autoriza el cobro mensual automático a su billetera Tribu o método de pago asociado. (c) Renovación automática: La suscripción se renovará automáticamente cada mes. El usuario puede cancelar la renovación en cualquier momento desde la configuración de su cuenta antes de la siguiente fecha de facturación. (d) Beneficios: Incluyen, entre otros, multiplicador de cashback 2x, envío gratuito, acceso anticipado a ofertas relámpago y giro extra diario en la ruleta. (e) Cancelación: El usuario puede cancelar la suscripción en cualquier momento, pero no habrá reembolso proporcional por los días no utilizados del período vigente. (f) Suspensión: Tribu se reserva el derecho de suspender o cancelar la suscripción si el usuario incumple estos términos o si el pago no es completado exitosamente.'
            },
            {
                title: '13. Compras Grupales',
                content: 'Las compras grupales permiten a múltiples usuarios unirse para adquirir productos a precios reducidos. Condiciones: (a) El creador del grupo establece el número de participantes y el producto objetivo. (b) Al unirse a un grupo, el usuario se compromete a pagar su parte del producto. (c) La compra grupal se completa únicamente cuando todos los participantes han pagado su parte. (d) Si el grupo no se completa en el plazo establecido, el grupo expira y los pagos serán reembolsados al saldo de cada participante. (e) Una vez completado el grupo, no se permiten cancelaciones individuales. (f) El producto se envía a la dirección del creador del grupo o según se acuerde entre los participantes. Tribu no se hace responsable por disputas entre participantes de un grupo una vez completada la compra.'
            },
            {
                title: '14. Programa de Referidos',
                content: 'El programa de referidos permite a los usuarios invitar a nuevos usuarios a la plataforma. Condiciones: (a) Cada usuario recibe un código de referido único. (b) Cuando un nuevo usuario se registra usando un código de referido y realiza su primera compra, el referidor recibe una comisión. (c) Las comisiones se estructuran en 3 niveles: Nivel 1 (5% de la compra del referido directo), Nivel 2 (2% de la compra del referido del referido), Nivel 3 (1%). (d) Las comisiones se acreditan como Puntos Tribu o saldo, según determine la plataforma, y están sujetas a un período de retención de 7 días antes de estar disponibles. (e) No se pagarán comisiones por autorreferidos (registrarse usando el propio código), cuentas duplicadas o actividades fraudulentas. (f) Tribu se reserva el derecho de modificar o cancelar el programa de referidos en cualquier momento.'
            },
            {
                title: '15. Cashback',
                content: 'El cashback es un porcentaje del valor de la compra que se acredita al usuario como saldo en su billetera. Condiciones: (a) El porcentaje de cashback varía según el nivel VIP del usuario: BRONCE (1%), PLATA (3%), ORO (5%). (b) El cashback se calcula sobre el valor neto de la compra (después de aplicar descuentos y antes de impuestos de envío). (c) El cashback se acredita con estado ON_HOLD y estará disponible (CLEARED) después de 7 días hábiles desde la confirmación del pago. (d) Tribu Pass activo multiplica el porcentaje de cashback por 2. (e) Campañas promocionales pueden ofrecer multiplicadores adicionales. (f) No se otorga cashback sobre compras realizadas con puntos o saldo de cashback previo. (g) Tribu se reserva el derecho de modificar los porcentajes de cashback con aviso previo.'
            },
            {
                title: '16. Ruleta, Juegos y Mecánicas de Gamificación',
                content: 'La plataforma incluye mecánicas de gamificación como ruleta diaria, logros, rachas y leaderboard, sujetas a las siguientes condiciones importantes: (a) Naturaleza gratuita: La ruleta diaria se otorga de forma gratuita a los usuarios activos. No se requiere pago para participar. Los giros adicionales pueden obtenerse como beneficio del Tribu Pass, pero no pueden comprarse directamente. (b) No constituyen juegos de azar: Estas mecánicas son herramientas de fidelización y entretenimiento. No están sujetas a la Ley 643 de 2001 (juegos de suerte y azar) precisamente porque no requieren erogación económica para participar. (c) Restricción de edad: Están dirigidas exclusivamente a mayores de 18 años. (d) Premios: Los premios se otorgan en puntos Tribu o saldo interno, sin valor comercial externo ni convertibilidad a efectivo. (e) Discrecionalidad: Tribu se reserva el derecho de modificar, suspender o descontinuar cualquier mecánica de gamificación en cualquier momento, así como las probabilidades, reglas y premios. (f) Prohibición de abuso: Queda estrictamente prohibido el uso de bots, automatizaciones, scripts o cualquier mecanismo no autorizado para manipular o explotar las mecánicas de juego. El abuso resultará en la cancelación inmediata de la cuenta y la pérdida de todos los puntos y saldos acumulados. (g) Logros y Rachas: Los logros y rachas se verifican automáticamente según reglas predefinidas. No se realizarán ajustes manuales salvo error comprobado del sistema.'
            },
            {
                title: '17. VIP Tiers y Beneficios',
                content: 'Los usuarios son clasificados automáticamente en niveles VIP (BRONCE, PLATA, ORO) según su actividad y volumen de compras en la plataforma. Condiciones: (a) La clasificación se recalcula periódicamente mediante reglas objetivas predefinidas. (b) Los beneficios de cada nivel incluyen, entre otros: mayor porcentaje de cashback, límites de transferencia más altos, acceso prioritario a soporte y promociones exclusivas. (c) Tribu se reserva el derecho de modificar los criterios de clasificación y los beneficios asociados a cada nivel con aviso previo. (d) Un usuario puede descender de nivel si no mantiene la actividad mínima requerida.'
            },
            {
                title: '18. Propiedad Intelectual',
                content: 'Todo el contenido de la plataforma, incluyendo pero no limitado a textos, gráficos, logotipos, iconos, imágenes, clips de audio, descargas digitales y software, es propiedad de Tribu o de sus proveedores de contenido y está protegido por las leyes colombianas e internacionales de propiedad intelectual. Queda estrictamente prohibido: (a) Reproducir, distribuir, modificar, exhibir públicamente o crear obras derivadas del contenido sin autorización expresa y por escrito de Tribu. (b) Utilizar marcas, nombres comerciales o signos distintivos de Tribu sin autorización. (c) Realizar ingeniería inversa, descompilar o desensamblar cualquier aspecto de la plataforma. El nombre "Tribu", el logotipo y todos los nombres de productos, servicios y funciones asociados son marcas registradas o no registradas de Tribu E-commerce.'
            },
            {
                title: '19. Limitación de Responsabilidad',
                content: 'En la máxima medida permitida por la ley colombiana, Tribu no será responsable por: (a) Daños indirectos, incidentales, especiales, consecuentes o punitivos derivados del uso o la imposibilidad de uso de la plataforma. (b) Pérdida de datos, ingresos, ganancias, oportunidades de negocio o ahorros anticipados. (c) Interrupciones del servicio por mantenimiento, fallos técnicos, ataques cibernéticos, caso fortuito o fuerza mayor. (d) Actos de terceros, incluyendo pero no limitado a transportadoras, procesadores de pago y proveedores de servicios tecnológicos. (e) Contenido generado por usuarios que viole derechos de terceros. La responsabilidad máxima agregada de Tribu frente al usuario por cualquier reclamo derivado de estos términos no excederá el valor total de las transacciones realizadas por el usuario en los 12 meses anteriores al reclamo.'
            },
            {
                title: '20. Conducta Prohibida',
                content: 'El usuario se compromete a no utilizar la plataforma para: (a) Realizar actividades fraudulentas, ilícitas o engañosas. (b) Intentar acceder a cuentas de otros usuarios. (c) Realizar transferencias con recursos de origen ilícito. (d) Manipular o explotar vulnerabilidades de la plataforma. (e) Realizar ataques de denegación de servicio, inyección de código o cualquier otra actividad que afecte la integridad del sistema. (f) Crear múltiples cuentas para obtener beneficios adicionales del programa de referidos, bonos de bienvenida u otras promociones. (g) Realizar lavado de activos o financiación del terrorismo a través de la plataforma. (h) Publicar contenido ofensivo, discriminatorio, difamatorio o ilegal en cualquier sección de la plataforma (soporte, comentarios, etc.). La violación de estas prohibiciones resultará en la cancelación inmediata de la cuenta, la pérdida de todos los saldos y puntos acumulados, y el reporte a las autoridades competentes.'
            },
            {
                title: '21. Cancelación y Suspensión de Cuenta',
                content: 'Tribu se reserva el derecho de suspender o cancelar la cuenta de un usuario, sin previo aviso, en los siguientes casos: (a) Violación de estos términos y condiciones. (b) Actividad fraudulenta o sospechosa. (c) Solicitud expresa del usuario. (d) Inactividad prolongada según los criterios definidos internamente. (e) Por disposición de autoridad competente. En caso de cancelación: (i) El saldo disponible en la billetera será reembolsado al método de pago original, menos cualquier cargo o deducción aplicable, dentro de los 30 días hábiles siguientes. (ii) Los Puntos Tribu acumulados se perderán irrevocablemente, por no tener valor comercial externo. (iii) Las suscripciones activas (Tribu Pass) serán canceladas sin reembolso proporcional. (iv) Las transferencias P2P pendientes serán canceladas. El usuario puede solicitar la cancelación de su cuenta enviando un correo a contacto@tribu.com. El proceso de cancelación puede tardar hasta 10 días hábiles.'
            },
            {
                title: '22. Ley Aplicable y Jurisdicción',
                content: 'Estos términos y condiciones se rigen por las leyes de la República de Colombia. Cualquier controversia que surja en relación con estos términos, la plataforma o las transacciones realizadas a través de ella, será sometida a la jurisdicción de los jueces y tribunales de la República de Colombia, renunciando el usuario a cualquier otro fuero que pudiera corresponderle. Antes de iniciar cualquier acción legal, las partes acuerdan intentar resolver la disputa de manera amigable a través de un Centro de Conciliación y Arbitraje legalmente constituido en el país.'
            },
            {
                title: '23. Notificaciones',
                content: 'Las notificaciones relacionadas con estos términos y condiciones serán enviadas al correo electrónico registrado por el usuario o publicadas en la plataforma. Se considera que el usuario ha recibido la notificación en el momento de su envío al correo registrado o de su publicación en la plataforma. Es responsabilidad del usuario mantener su información de contacto actualizada.'
            },
            {
                title: '24. Modificaciones a los Términos',
                content: 'Tribu se reserva el derecho de modificar estos términos y condiciones en cualquier momento. Las modificaciones serán notificadas a los usuarios con al menos 15 días de antelación a su entrada en vigor, a través de la plataforma o por correo electrónico. El uso continuado de la plataforma después de la fecha de vigencia de las modificaciones constituye la aceptación de los nuevos términos. Si el usuario no está de acuerdo con las modificaciones, puede cancelar su cuenta antes de la fecha de vigencia.'
            },
            {
                title: '25. Disposiciones Finales',
                content: '(a) Estos términos constituyen el acuerdo completo entre el usuario y Tribu con respecto al uso de la plataforma. (b) Si cualquier disposición de estos términos es considerada inválida o inejecutable por un tribunal competente, las demás disposiciones permanecerán en pleno vigor y efecto. (c) El hecho de que Tribu no ejerza o haga valer algún derecho o disposición de estos términos no constituirá una renuncia a dicho derecho o disposición. (d) Estos términos no crean una relación de sociedad, agencia, empleo o joint venture entre el usuario y Tribu. (e) El usuario no puede ceder ni transferir sus derechos u obligaciones bajo estos términos sin el consentimiento previo por escrito de Tribu.'
            },
            {
                title: '26. Contacto',
                content: 'Para cualquier consulta, queja o notificación relacionada con estos términos y condiciones o la política de privacidad, el usuario puede contactar a Tribu a través de: Correo electrónico: contacto@tribu.com. WhatsApp: +57 300 000 0000. Chat de soporte: disponible en la plataforma. Dirección: Bodega Central, Colombia. Para consultas sobre protección de datos, contactar al correo: contacto@tribu.com con el asunto "Protección de Datos".'
            }
        ]
    }
]

function Section({ section, isOpen, onToggle }) {
    const Icon = section.icon
    return (
        <div style={{
            background: 'var(--color-surface)',
            border: `1px solid ${isOpen ? section.color : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            marginBottom: '1.5rem'
        }}>
            <button
                onClick={onToggle}
                style={{
                    width: '100%',
                    padding: '1.5rem 2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text)',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    fontFamily: 'inherit'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 44, height: 44, borderRadius: '12px',
                        background: `${section.color}15`,
                        border: `1px solid ${section.color}30`
                    }}>
                        <Icon size={22} color={section.color} />
                    </div>
                    <span>{section.label}</span>
                </div>
                {isOpen ? <ChevronUp size={20} color="var(--color-text-muted)" /> : <ChevronDown size={20} color="var(--color-text-muted)" />}
            </button>

            {isOpen && (
                <div style={{ padding: '0 2rem 2rem' }}>
                    <div style={{
                        height: '2px',
                        background: `linear-gradient(90deg, ${section.color}, transparent)`,
                        marginBottom: '1.5rem',
                        borderRadius: '1px'
                    }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {section.subsections.map((sub, i) => (
                            <div key={i}>
                                <h3 style={{
                                    color: section.color,
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    marginBottom: '0.5rem'
                                }}>
                                    {sub.title}
                                </h3>
                                <p style={{
                                    color: 'var(--color-text-muted)',
                                    lineHeight: 1.8,
                                    fontSize: '0.9rem',
                                    margin: 0
                                }}>
                                    {sub.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function PoliticasPage() {
    const [openSection, setOpenSection] = useState('privacidad')

    const toggleSection = (id) => {
        setOpenSection(prev => prev === id ? null : id)
    }

    return (
        <div style={{ paddingTop: '6rem', paddingBottom: '4rem', minHeight: '100vh' }}>
            <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--color-surface)', padding: '1rem', borderRadius: '50%',
                        marginBottom: '1.5rem', boxShadow: '0 0 20px rgba(79, 172, 254, 0.2)'
                    }}>
                        <Scale size={48} color="#4facfe" />
                    </div>
                    <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, marginBottom: '0.75rem' }}>
                        Políticas Legales
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
                        Documentos legales de Tribu E-commerce en cumplimiento de la legislación colombiana.
                        Al usar nuestra plataforma, aceptas estas políticas.
                    </p>
                    <p style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        Última actualización: Mayo 2026
                    </p>
                </div>

                {/* Section Selector */}
                <div style={{
                    display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '2rem',
                    flexWrap: 'wrap'
                }}>
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => toggleSection(s.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '50px',
                                border: `1.5px solid ${openSection === s.id ? s.color : 'var(--color-border)'}`,
                                background: openSection === s.id ? `${s.color}15` : 'transparent',
                                color: openSection === s.id ? s.color : 'var(--color-text-muted)',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <s.icon size={18} />
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {sections.map(s => (
                    <Section
                        key={s.id}
                        section={s}
                        isOpen={openSection === s.id}
                        onToggle={() => toggleSection(s.id)}
                    />
                ))}

                {/* Footer disclaimer */}
                <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    marginTop: '1rem'
                }}>
                    <p style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem', lineHeight: 1.6, margin: 0 }}>
                        Estas políticas fueron elaboradas para cumplir con la legislación colombiana aplicable,
                        incluyendo la Ley 1581 de 2012 (Protección de Datos Personales), la Ley 1480 de 2011
                        (Estatuto del Consumidor) y el Código de Comercio de Colombia. Para asesoría legal
                        específica, recomendamos consultar con un abogado.
                    </p>
                </div>

            </div>
        </div>
    )
}
