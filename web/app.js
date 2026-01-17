// ==================== CONFIGURAÇÕES MQTT ====================
const MQTT_BROKER = 'wss://broker.hivemq.com:8884/mqtt';
const MQTT_CLIENT_ID = 'web_mao_robotica_' + Math.random().toString(16).substr(2, 8);

// Tópicos MQTT
const TOPICS = {
    servo1: 'mao_robotica/servo1',
    servo2: 'mao_robotica/servo2',
    servo3: 'mao_robotica/servo3',
    servo4: 'mao_robotica/servo4',
    servo5: 'mao_robotica/servo5',
    todos: 'mao_robotica/todos',
    status: 'mao_robotica/status',
    heartbeat: 'mao_robotica/heartbeat'
};

// Ângulos dos servos
const ANGULOS = {
    off: [0, 180, 0, 180, 180],
    on: [180, 40, 180, 0, 0]
};

// Estado dos servos
let estadoServos = [0, 0, 0, 0, 0];

// Cliente MQTT
let client = null;

// Controle do ESP32
let espOnline = false;
let lastHeartbeat = null;
let heartbeatTimeout = null;

// ==================== CONEXÃO MQTT ====================
function conectarMQTT() {
    atualizarStatusConexao('connecting', 'Conectando ao broker...');
    
    const options = {
        clientId: MQTT_CLIENT_ID,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 2000,
    };

    client = mqtt.connect(MQTT_BROKER, options);

    client.on('connect', () => {
        console.log('✅ Conectado ao broker MQTT!');
        atualizarStatusConexao('connected', 'Conectado ao broker MQTT');
        
        // Inscreve-se nos tópicos
        client.subscribe(TOPICS.status);
        client.subscribe(TOPICS.heartbeat);
        
        // Solicita status atual do ESP32
        client.publish('mao_robotica/request_status', '1');
    });

    client.on('error', (err) => {
        console.error('❌ Erro de conexão:', err);
        atualizarStatusConexao('disconnected', 'Erro de conexão');
    });

    client.on('close', () => {
        console.log('🔌 Conexão fechada');
        atualizarStatusConexao('disconnected', 'Desconectado');
        atualizarStatusESP32(false);
    });

    client.on('reconnect', () => {
        console.log('🔄 Reconectando...');
        atualizarStatusConexao('connecting', 'Reconectando...');
    });

    client.on('message', (topic, message) => {
        const msg = message.toString();
        console.log(`📩 [${topic}]: ${msg}`);
        
        if (topic === TOPICS.status) {
            atualizarEstadosServos(msg);
            registrarHeartbeat();
        } else if (topic === TOPICS.heartbeat) {
            registrarHeartbeat();
        }
    });
}

// ==================== CONTROLE DO ESP32 ====================
function registrarHeartbeat() {
    lastHeartbeat = new Date();
    atualizarStatusESP32(true);
    
    // Limpa timeout anterior
    if (heartbeatTimeout) {
        clearTimeout(heartbeatTimeout);
    }
    
    // Define timeout de 10 segundos para considerar offline
    heartbeatTimeout = setTimeout(() => {
        atualizarStatusESP32(false);
    }, 10000);
}

function atualizarStatusESP32(online) {
    espOnline = online;
    const card = document.getElementById('esp-status-card');
    const connectionText = document.getElementById('esp-connection');
    const lastSeenText = document.getElementById('esp-last-seen');
    
    if (online) {
        card.className = 'esp-status-card online';
        connectionText.textContent = 'ONLINE';
        connectionText.className = 'value online';
        lastSeenText.textContent = 'Agora';
    } else {
        card.className = 'esp-status-card offline';
        connectionText.textContent = 'OFFLINE';
        connectionText.className = 'value offline';
        
        if (lastHeartbeat) {
            const diff = Math.round((new Date() - lastHeartbeat) / 1000);
            lastSeenText.textContent = `${diff}s atrás`;
        } else {
            lastSeenText.textContent = 'Nunca conectado';
        }
    }
}

// Atualiza o tempo desde o último sinal a cada segundo
setInterval(() => {
    if (!espOnline && lastHeartbeat) {
        const diff = Math.round((new Date() - lastHeartbeat) / 1000);
        document.getElementById('esp-last-seen').textContent = `${diff}s atrás`;
    }
}, 1000);

// ==================== FUNÇÕES DE CONTROLE ====================
function toggleServo(servoNum, estado) {
    if (!client || !client.connected) {
        alert('❌ Não conectado ao broker MQTT!');
        return;
    }
    
    if (!espOnline) {
        const confirmar = confirm('⚠️ ESP32 parece estar offline. Deseja enviar o comando mesmo assim?');
        if (!confirmar) return;
    }
    
    const topic = TOPICS[`servo${servoNum}`];
    client.publish(topic, estado.toString());
    console.log(`📤 Enviado: ${topic} = ${estado}`);
    
    // Atualiza interface localmente (será confirmado pelo ESP32)
    estadoServos[servoNum - 1] = estado;
    atualizarCardServo(servoNum, estado);
}

function controlarTodos(estado) {
    if (!client || !client.connected) {
        alert('❌ Não conectado ao broker MQTT!');
        return;
    }
    
    if (!espOnline) {
        const confirmar = confirm('⚠️ ESP32 parece estar offline. Deseja enviar o comando mesmo assim?');
        if (!confirmar) return;
    }
    
    client.publish(TOPICS.todos, estado.toString());
    console.log(`📤 Enviado: ${TOPICS.todos} = ${estado}`);
    
    // Atualiza todos os cards
    for (let i = 1; i <= 5; i++) {
        estadoServos[i - 1] = estado;
        atualizarCardServo(i, estado);
    }
}

// ==================== ATUALIZAÇÃO DA INTERFACE ====================
function atualizarStatusConexao(status, texto) {
    const dot = document.getElementById('status-dot');
    const textElement = document.getElementById('status-text');
    
    dot.className = 'status-dot ' + status;
    textElement.textContent = texto;
}

function atualizarCardServo(servoNum, estado) {
    const card = document.getElementById(`card-servo${servoNum}`);
    const statusLabel = document.getElementById(`status-servo${servoNum}`);
    const angleValue = document.getElementById(`angle-servo${servoNum}`);
    const needle = document.getElementById(`needle-servo${servoNum}`);
    
    const angulo = estado === 1 ? ANGULOS.on[servoNum - 1] : ANGULOS.off[servoNum - 1];
    
    // Atualiza o card
    if (estado === 1) {
        card.classList.add('active');
        statusLabel.textContent = 'LIGADO';
        statusLabel.classList.add('on');
    } else {
        card.classList.remove('active');
        statusLabel.textContent = 'DESLIGADO';
        statusLabel.classList.remove('on');
    }
    
    // Atualiza o ângulo
    angleValue.textContent = angulo;
    
    // Atualiza o ponteiro visual (converte ângulo do servo para rotação CSS)
    // Servo: 0° = ponteiro para cima, 180° = ponteiro para baixo
    const rotacao = angulo - 90; // Ajusta para CSS rotation
    needle.style.transform = `rotate(${rotacao}deg)`;
}

function atualizarEstadosServos(statusString) {
    // Status vem no formato "0,0,0,0,0" ou "1,1,1,1,1"
    const estados = statusString.split(',').map(Number);
    
    estados.forEach((estado, index) => {
        const servoNum = index + 1;
        estadoServos[index] = estado;
        atualizarCardServo(servoNum, estado);
    });
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando aplicação Mão Robótica...');
    
    // Inicializa os ângulos na interface
    for (let i = 1; i <= 5; i++) {
        atualizarCardServo(i, 0);
    }
    
    // Conecta ao MQTT
    conectarMQTT();
});
