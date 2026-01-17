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
    status: 'mao_robotica/status'
};

// Ângulos dos servos
const ANGULOS = {
    // Ângulos quando desabilitado (OFF)
    off: [0, 180, 0, 180, 180],
    // Ângulos quando habilitado (ON)
    on: [180, 40, 180, 0, 0]
};

// Cliente MQTT
let client = null;

// ==================== CONEXÃO MQTT ====================
function conectarMQTT() {
    atualizarStatusConexao('connecting', 'Conectando...');
    
    const options = {
        clientId: MQTT_CLIENT_ID,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
    };

    client = mqtt.connect(MQTT_BROKER, options);

    client.on('connect', () => {
        console.log('Conectado ao broker MQTT!');
        atualizarStatusConexao('connected', 'Conectado');
        
        // Inscreve-se no tópico de status
        client.subscribe(TOPICS.status, (err) => {
            if (!err) {
                console.log('Inscrito no tópico de status');
            }
        });
    });

    client.on('error', (err) => {
        console.error('Erro de conexão:', err);
        atualizarStatusConexao('disconnected', 'Erro de conexão');
    });

    client.on('close', () => {
        console.log('Conexão fechada');
        atualizarStatusConexao('disconnected', 'Desconectado');
    });

    client.on('reconnect', () => {
        console.log('Reconectando...');
        atualizarStatusConexao('connecting', 'Reconectando...');
    });

    client.on('message', (topic, message) => {
        console.log(`Mensagem recebida [${topic}]: ${message.toString()}`);
        
        if (topic === TOPICS.status) {
            atualizarEstadosServos(message.toString());
        }
    });
}

// ==================== FUNÇÕES DE CONTROLE ====================
function toggleServo(servoNum) {
    const checkbox = document.getElementById(`servo${servoNum}`);
    const estado = checkbox.checked ? 1 : 0;
    
    if (client && client.connected) {
        const topic = TOPICS[`servo${servoNum}`];
        client.publish(topic, estado.toString());
        console.log(`Publicado: ${topic} = ${estado}`);
        
        // Atualiza a interface
        atualizarCardServo(servoNum, estado);
    } else {
        console.error('Cliente MQTT não conectado!');
        // Reverte o checkbox
        checkbox.checked = !checkbox.checked;
        alert('Erro: Não conectado ao broker MQTT!');
    }
}

function controlarTodos(estado) {
    if (client && client.connected) {
        client.publish(TOPICS.todos, estado.toString());
        console.log(`Publicado: ${TOPICS.todos} = ${estado}`);
        
        // Atualiza todos os cards
        for (let i = 1; i <= 5; i++) {
            document.getElementById(`servo${i}`).checked = estado === 1;
            atualizarCardServo(i, estado);
        }
    } else {
        console.error('Cliente MQTT não conectado!');
        alert('Erro: Não conectado ao broker MQTT!');
    }
}

// ==================== FUNÇÕES DE ATUALIZAÇÃO DA INTERFACE ====================
function atualizarStatusConexao(status, texto) {
    const indicator = document.getElementById('status-indicator');
    const textElement = document.getElementById('status-text');
    
    indicator.className = 'status-indicator ' + status;
    textElement.textContent = texto;
}

function atualizarCardServo(servoNum, estado) {
    const card = document.getElementById(`card-servo${servoNum}`);
    const statusText = document.getElementById(`status-servo${servoNum}`);
    const angleInfo = document.getElementById(`angle-servo${servoNum}`);
    
    if (estado === 1) {
        card.classList.add('active');
        statusText.textContent = 'Habilitado';
        statusText.classList.add('enabled');
        angleInfo.textContent = `Ângulo: ${ANGULOS.on[servoNum - 1]}°`;
    } else {
        card.classList.remove('active');
        statusText.textContent = 'Desabilitado';
        statusText.classList.remove('enabled');
        angleInfo.textContent = `Ângulo: ${ANGULOS.off[servoNum - 1]}°`;
    }
}

function atualizarEstadosServos(statusString) {
    // Status vem no formato "0,0,0,0,0" ou "1,1,1,1,1"
    const estados = statusString.split(',').map(Number);
    
    estados.forEach((estado, index) => {
        const servoNum = index + 1;
        document.getElementById(`servo${servoNum}`).checked = estado === 1;
        atualizarCardServo(servoNum, estado);
    });
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Iniciando aplicação...');
    
    // Inicializa os ângulos na interface
    for (let i = 1; i <= 5; i++) {
        const angleInfo = document.getElementById(`angle-servo${i}`);
        angleInfo.textContent = `Ângulo: ${ANGULOS.off[i - 1]}°`;
    }
    
    // Conecta ao MQTT
    conectarMQTT();
});

// Reconecta se a conexão cair
setInterval(() => {
    if (client && !client.connected) {
        console.log('Tentando reconectar...');
    }
}, 5000);
