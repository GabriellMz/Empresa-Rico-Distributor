
const rolesData = {

    1: {
        nombre: "Huarac Valle Manuel Angel",
        rol: "Gerente de Diseño Web",
        foto: "assets/img/Dev/img1.jpeg",

        capacidades: [
            "Desarrollo Frontend",
            "Diseño UI/UX y Prototipado",
            "Desarrollo de Landing Pages y Sitios Web"
        ],

        herramientas: ["VS Code", "Git", "Bootstrap"],

        lenguajes: ["HTML", "CSS", "JavaScript"],

        habilidades: [
            "Liderazgo",
            "Trabajo en equipo",
            "Resolución de problemas",
            "Comunicación efectiva",
            "Creatividad"
        ],

        cv: "assets/CV/CV_Manuel.pdf",

        certificados: [
            { nombre: "Certificado 1", url: "assets/Certificados/Certificado_Manuel.pdf" },
            { nombre: "Certificado 2", url: "assets/Certificados/Certificado_Manuel2.pdf" }
        ],

        capacitaciones: [
            "Certificados y capacitaciones registrados en el CV."
        ]
    },

    2: {
        nombre: "Apac Martinez Gabriel Alejandro",
        rol: "Gerente de Desarrollo",
        foto: "assets/img/Dev/img2.jpeg",

        capacidades: [
            "Gestión e Integración de Bases de Datos",
            "Programación Orientada a Objetos",
            "Desarrollo Full Stack Web"
        ],

        herramientas: ["VS Code", "Git", "Supabase"],

        lenguajes: ["JavaScript", "HTML", "SQL"],

        habilidades: [
            "Trabajo en equipo",
            "Gestión del tiempo",
            "Análisis de problemas",
            "Comunicación efectiva",
            "Adaptabilidad"
        ],

        cv: "assets/CV/CV_Gabriel.pdf",

        certificados: [
            { nombre: "Certificado 1", url: "assets/Certificados/Certificado_Gabriel.pdf" },
            { nombre: "Certificado 2", url: "assets/Certificados/Certificado_Gabriel2.pdf" }
        ],

        capacitaciones: [
            "Certificados y capacitaciones registrados en el CV."
        ]
    },

    3: {
        nombre: "Yanac Tomaiconsa Fernando Jose",
        rol: "Desarrollador Backend",
        foto: "assets/img/Dev/img3.png",

        capacidades: [
            "Desarrollo Backend con Java y Spring Boot",
            "Desarrollo Frontend con Bootstrap",
            "Gestión de Bases de Datos"
        ],

        herramientas: ["IntelliJ IDEA", "Git", "MySQL"],

        lenguajes: ["Java", "JavaScript", "SQL"],

        habilidades: [
            "Gestión del tiempo",
            "Trabajo en equipo",
            "Resolución de problemas",
            "Pensamiento lógico",
            "Responsabilidad"
        ],

        cv: "assets/CV/CV_Fernando.pdf",

        certificados: [
            { nombre: "Certificado 1", url: "assets/Certificados/Certificado_Fernando.pdf" },
            { nombre: "Certificado 2", url: "assets/Certificados/Certificado_Fernando2.pdf" }
        ],

        capacitaciones: [
            "Certificados y capacitaciones registrados en el CV."
        ]
    },

    4: {
        nombre: "Sebastian Arteaga Leon",
        rol: "Desarrollador Full Stack",
        foto: "assets/img/Dev/img4.png",

        capacidades: [
            "Desarrollo Full Stack",
            "Programación Orientada a Objetos",
            "Análisis de Datos en GCP (BigQuery)"
        ],

        herramientas: ["VS Code", "Git", "Google Cloud Platform"],

        lenguajes: ["Java", "JavaScript", "SQL"],

        habilidades: [
            "Pensamiento crítico",
            "Comunicación asertiva",
            "Gestión de proyectos",
            "Trabajo en equipo",
            "Adaptabilidad"
        ],

        cv: "assets/CV/CV_Sebastian.pdf",

        certificados: [
            { nombre: "Certificado 1", url: "assets/Certificados/Certificado_Sebastian.pdf" },
            { nombre: "Certificado 2", url: "assets/Certificados/Certificado_Sebastian2.pdf" }
        ],

        capacitaciones: [
            "Certificados y capacitaciones registrados en el CV."
        ]
    },

    5: {
        nombre: "Sánchez Chunga Sergio Alberto",
        rol: "Analista QA",
        foto: "assets/img/Dev/img5.jpeg",

        capacidades: [
            "Automatización de pruebas",
            "Conocimientos de SQL",
            "Programación y pruebas de software"
        ],

        herramientas: ["Selenium", "VS Code", "Git"],

        lenguajes: ["Java", "Python", "SQL"],

        habilidades: [
            "Atención al detalle",
            "Comunicación efectiva",
            "Pensamiento analítico",
            "Resolución de problemas",
            "Organización"
        ],

        cv: "assets/CV/CV_Sergio.pdf",

        certificados: [
            { nombre: "Certificado 1", url: "assets/Certificados/Certificado_Sergio.pdf" },
            { nombre: "Certificado 2", url: "assets/Certificados/Certificado_Sergio2.pdf" }
        ],

        capacitaciones: [
            "Certificados y capacitaciones registrados en el CV."
        ]
    },

    6: {
         nombre: "Ramos Carranza Mauricio Sebastian",
    rol: "Frontend Developer",
    foto: "assets/img/Dev/img6.png",

    capacidades: [
        "Desarrollo de interfaces web",
        "Diseño de páginas responsivas",
        "Implementación de componentes visuales",
        "Integración de interfaces con APIs",
        "Optimización de la experiencia de usuario"
    ],

    herramientas: [
        "Visual Studio Code",
        "Git",
        "GitHub",
        "Figma",
        "Chrome DevTools"
    ],

    lenguajes: [
        "HTML5",
        "CSS3",
        "JavaScript"
    ],

    habilidades: [
        "Diseño web responsivo",
        "Maquetación de interfaces",
        "Flexbox y CSS Grid",
        "Manipulación del DOM",
        "Consumo de APIs REST",
        "Trabajo en equipo",
        "Resolución de problemas"
    ],

    cv: "assets/CV/CV_Mauricio.pdf",

    certificados: [{ nombre: "Certificado 1", url: "assets/Certificados/Certificado_Mauricio.pdf" },
            { nombre: "Certificado 2", url: "assets/Certificados/Certificado_Mauricio2.pdf" }],

    capacitaciones: [" Certificados y capacitaciones registrados en el CV."]
    }

};


// FUNCIÓN PARA MOSTRAR EL PERFIL
function mostrarRol(numero) {

    const rol = rolesData[numero];

    if (!rol) return;

    // FOTO Y NOMBRE
    document.getElementById("fotoPerfil").src = rol.foto;
    document.getElementById("nombre").textContent = rol.nombre;
    document.getElementById("rolNombre").textContent = rol.rol;

    // CV
    const btnCV = document.getElementById("btn-cv");

    btnCV.href = rol.cv || "#";
    btnCV.style.display = rol.cv ? "block" : "none";

    // CERTIFICADOS
    for (let i = 1; i <= 2; i++) {

        const btn = document.getElementById(`btn-cert-${i}`);
        const cert = rol.certificados[i - 1];

        if (cert) {
            btn.href = cert.url;
            btn.textContent = cert.nombre;
            btn.style.display = "block";
        } else {
            btn.style.display = "none";
        }

    }

    // FUNCIÓN PARA CARGAR LISTAS
    function cargarLista(id, datos) {

        const elemento = document.getElementById(id);

        elemento.innerHTML = datos.length
            ? datos.map(item => `<li class="mb-2">• ${item}</li>`).join("")
            : "<li>Información pendiente de registrar</li>";

    }

    cargarLista("herramientas", rol.herramientas);
    cargarLista("lenguajes", rol.lenguajes);
    cargarLista("capacidades", rol.capacidades);
    cargarLista("habilidades", rol.habilidades);
    cargarLista("capacitaciones", rol.capacitaciones);

    // BOTONES ACTIVOS
    for (let i = 1; i <= 6; i++) {

        const boton = document.getElementById(`btn-rol-${i}`);

        if (!boton) continue;

        if (i === numero) {
            boton.classList.remove("btn-outline-danger");
            boton.classList.add("btn-danger");
        } else {
            boton.classList.remove("btn-danger");
            boton.classList.add("btn-outline-danger");
        }

    }

}


// CARGAR PRIMER INTEGRANTE
document.addEventListener("DOMContentLoaded", () => {
    mostrarRol(1);
});
