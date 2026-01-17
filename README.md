# 🤖 Mão Robótica - Controle de Servos via MQTT

Este projeto permite controlar 5 servos motores de uma mão robótica usando ESP32 e uma interface web, comunicando-se via protocolo MQTT.

## 📁 Estrutura do Projeto

```
aplicacao/
├── esp32_servo_mqtt/
│   └── esp32_servo_mqtt.ino    # Código do ESP32
├── web/
│   ├── index.html              # Interface web
│   ├── style.css               # Estilos
│   └── app.js                  # Lógica JavaScript
└── README.md                   # Este arquivo
```

## 🔧 Configuração do Hardware

### Conexões dos Servos

| Servo | GPIO | Ângulo Desabilitado | Ângulo Habilitado |
|-------|------|---------------------|-------------------|
| 1     | 15   | 0°                  | 180°              |
| 2     | 18   | 180°                | 40°               |
| 3     | 19   | 0°                  | 180°              |
| 4     | 22   | 180°                | 0°                |
| 5     | 23   | 180°                | 0°                |

### Alimentação

- Os servos devem ser alimentados com fonte externa de 5V
- Conecte o GND da fonte ao GND do ESP32
- Não alimente os servos diretamente pelo ESP32

## 🚀 Como Usar

### 1. Configurar o ESP32

1. Abra o arquivo `esp32_servo_mqtt/esp32_servo_mqtt.ino` na Arduino IDE
2. Instale as bibliotecas necessárias:
   - `PubSubClient` (para MQTT)
   - `ESP32Servo` (para controle dos servos)
3. Configure suas credenciais WiFi no código:
   ```cpp
   const char* ssid = "SEU_WIFI_SSID";
   const char* password = "SUA_SENHA_WIFI";
   ```
4. Faça upload do código para o ESP32

### 2. Abrir a Interface Web

1. Navegue até a pasta `web/`
2. Abra o arquivo `index.html` em um navegador moderno
3. A interface conectará automaticamente ao broker MQTT

**Nota:** Para funcionar corretamente, você pode precisar servir os arquivos através de um servidor local:

```bash
# Usando Python 3
cd web
python -m http.server 8000

# Acesse: http://localhost:8000
```

Ou use a extensão "Live Server" do VS Code.

## 📡 Configuração MQTT

### Broker Utilizado

O projeto usa o broker público **HiveMQ**:
- **WebSocket (Web):** `wss://broker.hivemq.com:8884/mqtt`
- **TCP (ESP32):** `broker.hivemq.com:1883`

### Tópicos MQTT

| Tópico | Descrição |
|--------|-----------|
| `mao_robotica/servo1` | Controla servo 1 (0 ou 1) |
| `mao_robotica/servo2` | Controla servo 2 (0 ou 1) |
| `mao_robotica/servo3` | Controla servo 3 (0 ou 1) |
| `mao_robotica/servo4` | Controla servo 4 (0 ou 1) |
| `mao_robotica/servo5` | Controla servo 5 (0 ou 1) |
| `mao_robotica/todos` | Controla todos os servos |
| `mao_robotica/status` | Status atual dos servos |

### Usar Broker Próprio

Para usar um broker MQTT próprio (ex: Mosquitto), altere:

**No ESP32:**
```cpp
const char* mqtt_server = "SEU_IP_OU_DOMINIO";
const int mqtt_port = 1883;
```

**Na Web (app.js):**
```javascript
const MQTT_BROKER = 'ws://SEU_IP_OU_DOMINIO:9001/mqtt';
```

## 🎮 Funcionalidades

- ✅ Controle individual de cada servo
- ✅ Botões de abrir/fechar toda a mão
- ✅ Indicador de status de conexão
- ✅ Interface responsiva para mobile
- ✅ Sincronização de estado via MQTT
- ✅ Reconexão automática

## 📚 Bibliotecas Necessárias (Arduino IDE)

1. **ESP32Servo**
   - Gerenciador de Bibliotecas → Pesquisar "ESP32Servo"
   
2. **PubSubClient**
   - Gerenciador de Bibliotecas → Pesquisar "PubSubClient"

## 🔍 Troubleshooting

### ESP32 não conecta ao WiFi
- Verifique SSID e senha
- O ESP32 suporta apenas redes 2.4GHz

### Interface web mostra "Desconectado"
- Verifique a conexão com a internet
- O broker público pode estar temporariamente indisponível
- Tente recarregar a página

### Servos não respondem
- Verifique a alimentação dos servos
- Confira as conexões dos GPIOs
- Verifique o Monitor Serial do Arduino para mensagens

## 📝 Licença

Projeto desenvolvido pelo **GO LabMaker - IFG Câmpus Goiânia Oeste**

---

*Última atualização: Janeiro 2026*
