/*
  Controle de 5 Servos via MQTT - ESP32
  Projeto: Mão Robótica
  
  Conexões:
  - Servo 1: GPIO 15
  - Servo 2: GPIO 18
  - Servo 3: GPIO 19
  - Servo 4: GPIO 22
  - Servo 5: GPIO 23
*/

#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>

// ==================== CONFIGURAÇÕES DE REDE ====================
const char* ssid = "Lidia_2G";           // Nome da sua rede WiFi
const char* password = "vfn4i83123";       // Senha da sua rede WiFi

// ==================== CONFIGURAÇÕES DO BROKER MQTT ====================
const char* mqtt_server = "broker.hivemq.com"; // Broker MQTT público
const int mqtt_port = 1883;
const char* mqtt_client_id = "esp32_mao_robotica";

// Tópicos MQTT
const char* topic_servo1 = "mao_robotica/servo1";
const char* topic_servo2 = "mao_robotica/servo2";
const char* topic_servo3 = "mao_robotica/servo3";
const char* topic_servo4 = "mao_robotica/servo4";
const char* topic_servo5 = "mao_robotica/servo5";
const char* topic_todos = "mao_robotica/todos";
const char* topic_status = "mao_robotica/status";

// ==================== CONFIGURAÇÃO DOS SERVOS ====================
// Pinos GPIO
#define SERVO1_PIN 15
#define SERVO2_PIN 18
#define SERVO3_PIN 19
#define SERVO4_PIN 22
#define SERVO5_PIN 23

// Objetos dos Servos
Servo servo1;
Servo servo2;
Servo servo3;
Servo servo4;
Servo servo5;

// Ângulos quando DESABILITADO (botão OFF)
const int angulo_off[] = {0, 180, 0, 180, 180};

// Ângulos quando HABILITADO (botão ON)
const int angulo_on[] = {180, 40, 180, 0, 0};

// Estado atual dos servos (0 = desabilitado, 1 = habilitado)
int estado_servo[] = {0, 0, 0, 0, 0};

// Objetos WiFi e MQTT
WiFiClient espClient;
PubSubClient client(espClient);

// ==================== FUNÇÕES ====================

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Conectando a ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi conectado!");
  Serial.print("Endereço IP: ");
  Serial.println(WiFi.localIP());
}

void moverServo(int servoNum, int estado) {
  int angulo;
  
  if (estado == 1) {
    angulo = angulo_on[servoNum - 1];
  } else {
    angulo = angulo_off[servoNum - 1];
  }
  
  estado_servo[servoNum - 1] = estado;
  
  switch (servoNum) {
    case 1:
      servo1.write(angulo);
      break;
    case 2:
      servo2.write(angulo);
      break;
    case 3:
      servo3.write(angulo);
      break;
    case 4:
      servo4.write(angulo);
      break;
    case 5:
      servo5.write(angulo);
      break;
  }
  
  Serial.print("Servo ");
  Serial.print(servoNum);
  Serial.print(" movido para ");
  Serial.print(angulo);
  Serial.println("°");
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.print("Mensagem recebida [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);
  
  int estado = message.toInt();
  
  if (String(topic) == topic_servo1) {
    moverServo(1, estado);
  } else if (String(topic) == topic_servo2) {
    moverServo(2, estado);
  } else if (String(topic) == topic_servo3) {
    moverServo(3, estado);
  } else if (String(topic) == topic_servo4) {
    moverServo(4, estado);
  } else if (String(topic) == topic_servo5) {
    moverServo(5, estado);
  } else if (String(topic) == topic_todos) {
    // Controla todos os servos de uma vez
    for (int i = 1; i <= 5; i++) {
      moverServo(i, estado);
    }
  }
  
  // Publica status atualizado
  publicarStatus();
}

void publicarStatus() {
  String status = "";
  for (int i = 0; i < 5; i++) {
    status += String(estado_servo[i]);
    if (i < 4) status += ",";
  }
  client.publish(topic_status, status.c_str());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Tentando conexão MQTT...");
    
    if (client.connect(mqtt_client_id)) {
      Serial.println("Conectado!");
      
      // Inscreve-se nos tópicos
      client.subscribe(topic_servo1);
      client.subscribe(topic_servo2);
      client.subscribe(topic_servo3);
      client.subscribe(topic_servo4);
      client.subscribe(topic_servo5);
      client.subscribe(topic_todos);
      
      Serial.println("Inscrito nos tópicos MQTT");
      
      // Publica status inicial
      publicarStatus();
      
    } else {
      Serial.print("Falha, rc=");
      Serial.print(client.state());
      Serial.println(" Tentando novamente em 5 segundos...");
      delay(5000);
    }
  }
}

void inicializarServos() {
  // Configura os servos com frequência adequada
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  
  servo1.setPeriodHertz(50);
  servo2.setPeriodHertz(50);
  servo3.setPeriodHertz(50);
  servo4.setPeriodHertz(50);
  servo5.setPeriodHertz(50);
  
  servo1.attach(SERVO1_PIN, 500, 2400);
  servo2.attach(SERVO2_PIN, 500, 2400);
  servo3.attach(SERVO3_PIN, 500, 2400);
  servo4.attach(SERVO4_PIN, 500, 2400);
  servo5.attach(SERVO5_PIN, 500, 2400);
  
  // Posição inicial (todos desabilitados)
  for (int i = 1; i <= 5; i++) {
    moverServo(i, 0);
    delay(200);
  }
  
  Serial.println("Servos inicializados nas posições padrão");
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== Mão Robótica - ESP32 ===");
  
  // Inicializa os servos
  inicializarServos();
  
  // Conecta ao WiFi
  setup_wifi();
  
  // Configura o servidor MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}
