# 🍗 Proyecto Web - RICO

Bienvenido al repositorio oficial del proyecto web para **RICO**. Esta aplicación web está diseñada para ofrecer una interfaz moderna, intuitiva y rápida, optimizando la gestión y visualización de productos y servicios de la empresa.

---

## 👥 Integrantes del Equipo

* **Huarac Valle, Manuel Angel**
* **Apac Martinez, Gabriel Alejandro**
* **Yanac Tomaiconsa, Fernando Jose**
* **Arteaga Leon, Sebastian Victor**
* **Sánchez Chunga, Sergio Alberto**
* **Ramos Carranza, Mauricio Sebastian**

---

## 🛠️ Tecnologías Utilizadas

| Categoría | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Estructura** | HTML5 | Semántica y maquetación web estándar |
| **Estilos** | CSS3 & Bootstrap 5 | Diseño responsivo, componentes UI y personalización |
| **Lógica** | JavaScript (ES6+) | Interactividad en el cliente y conexión con servicios |
| **Backend & BD** | Supabase | Base de datos PostgreSQL en tiempo real y autenticación |

---

## 🌟 Características Principales

* **Diseño Responsivo:** Adaptado para dispositivos móviles, tablets y pantallas de escritorio gracias al sistema de grid y utilidades de Bootstrap.
* **Integración con Supabase:** Gestión dinámica de datos (lectura y persistencia de información en tiempo real).
* **Interfaz Limpia e Intuitiva:** Navegación optimizada centrada en la experiencia de usuario (UX/UI).
* **Arquitectura Ligera:** Código modular organizado para facilitar el mantenimiento y la escalabilidad.

---

## 📁 Estructura del Proyecto

```text
EMPRESA-RICO-DISTRIBUTOR/
│
├── public/                          <-- Carpeta principal del Front-end (Lo que se ve en la web)
│   ├── assets/                      <-- Recursos multimedia y gráficos
│   │   ├── img/                     
│   │   │   ├── Clientes/            <-- Logos de clientes (redondos.jpg, San Fernando, Segoviana)
│   │   │   ├── Imagenes Carrusel/   <-- Fotos para la portada (carrusel1.png, carrusel2.jpg, etc.)
│   │   │   ├── Logo Rico/           <-- Logotipos oficiales de la empresa
│   │   │   ├── Logo UTP/            <-- Logotipo de la universidad
│   │   │   ├── Marcas/              <-- Logos de marcas y aliados
│   │   │   └── Productos/           <-- Fotos del catálogo o servicios
│   │   └── video/                   <-- Archivos de video locales (ej. Rico Pollo 50 años)
│   │
│   ├── js/                          <-- Archivos de lógica JavaScript para la interfaz
│   └── style/                       <-- Archivos de hojas de estilo CSS (ej. style.css)
│
├── index.html                       <-- Página web principal (Inicio - Avance 1)
├── server.js                        <-- Servidor Backend básico configurado con Express
├── package.json                     <-- Configuración y dependencias del proyecto Node.js
├── package-lock.json                <-- Control de versiones de los paquetes de Node
└── README.md                        <-- Documentación oficial del repositorio
