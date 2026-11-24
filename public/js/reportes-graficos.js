document.addEventListener("DOMContentLoaded", async () => {
    const NOMBRES_CATEGORIAS = {
        1: "Pollo",
        2: "Cerdo",
        3: "Embutidos",
        4: "Huevos",
        5: "Preparados",
        6: "Aceites"
    };

    const COLORES_RICO = [
        "#dc3545", // Rojo RICO
        "#ffc107", // Amarillo RICO
        "#0d6efd", // Azul
        "#198754", // Verde
        "#fd7e14", // Naranja
        "#6f42c1"  // Morado
    ];

    async function obtenerDatosReportes() {
        // 1. Intentar conectar al endpoint oficial /api/reportes
        try {
            const res = await fetch("/api/reportes");
            if (res.ok) {
                return await res.json();
            }
        } catch (error) {
            console.warn("Endpoint /api/reportes aún no disponible.");
        }

        // 2. Solo cargar datos reales disponibles actualmente (/api/productos)
        let preciosPorCategoria = { labels: [], valores: [] };

        try {
            const resProd = await fetch("/api/productos");
            if (resProd.ok) {
                const productos = await resProd.json();
                const acumulado = {};

                productos.forEach((p) => {
                    const cat = NOMBRES_CATEGORIAS[p.id_categoria] || "Otros";
                    if (!acumulado[cat]) acumulado[cat] = { suma: 0, cuenta: 0 };
                    acumulado[cat].suma += Number(p.precio) || 0;
                    acumulado[cat].cuenta += 1;
                });

                const labels = Object.keys(acumulado);
                preciosPorCategoria = {
                    labels,
                    valores: labels.map((c) => Number((acumulado[c].suma / acumulado[c].cuenta).toFixed(2)))
                };
            }
        } catch (e) {
            console.warn("No se pudo consultar /api/productos.");
        }

        return {
            ventasPorCategoria: { labels: [], valores: [] },
            productosMasVendidos: { labels: [], valores: [] },
            preciosPorCategoria,
            pedidosPorEstado: { labels: [], valores: [] },
            clientesFrecuentes: { labels: [], valores: [] },
            descuentosAplicados: { labels: [], valores: [] }
        };
    }

    function obtenerMaximo(labels, valores) {
        let idx = 0;
        valores.forEach((v, i) => {
            if (v > valores[idx]) idx = i;
        });
        return { label: labels[idx], valor: valores[idx] };
    }

    const datos = await obtenerDatosReportes();
    window.datosReportes = datos;

    // 1. Ventas por Categoría
    new Chart(document.getElementById("chartVentasCategoria"), {
        type: "bar",
        data: {
            labels: datos.ventasPorCategoria.labels,
            datasets: [{
                label: "Ventas (S/)",
                data: datos.ventasPorCategoria.valores,
                backgroundColor: COLORES_RICO,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
    if (datos.ventasPorCategoria.valores.length > 0) {
        const maxVenta = obtenerMaximo(datos.ventasPorCategoria.labels, datos.ventasPorCategoria.valores);
        const totalVentas = datos.ventasPorCategoria.valores.reduce((a, b) => a + b, 0);
        document.getElementById("descVentasCategoria").textContent =
            `La categoría líder es ${maxVenta.label} con S/ ${maxVenta.valor.toFixed(2)}, representando el ${((maxVenta.valor / totalVentas) * 100).toFixed(1)}% de las ventas totales (S/ ${totalVentas.toFixed(2)}).`;
    } else {
        document.getElementById("descVentasCategoria").textContent = "Sin datos registrados aún.";
    }

    // 2. Productos más Vendidos
    new Chart(document.getElementById("chartProductosMasVendidos"), {
        type: "bar",
        data: {
            labels: datos.productosMasVendidos.labels,
            datasets: [{
                label: "Unidades vendidas",
                data: datos.productosMasVendidos.valores,
                backgroundColor: "#ffc107",
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
    if (datos.productosMasVendidos.valores.length > 0) {
        const maxProd = obtenerMaximo(datos.productosMasVendidos.labels, datos.productosMasVendidos.valores);
        document.getElementById("descProductosMasVendidos").textContent =
            `${maxProd.label} encabeza la demanda con ${maxProd.valor} unidades vendidas, consolidándose como el producto de mayor rotación del catálogo.`;
    } else {
        document.getElementById("descProductosMasVendidos").textContent = "Sin datos registrados aún.";
    }

    // 3. Precio Promedio por Categoría (Real desde /api/productos)
    new Chart(document.getElementById("chartPreciosCategoria"), {
        type: "bar",
        data: {
            labels: datos.preciosPorCategoria.labels,
            datasets: [{
                label: "Precio promedio (S/)",
                data: datos.preciosPorCategoria.valores,
                backgroundColor: "#0d6efd",
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
    if (datos.preciosPorCategoria.valores.length > 0) {
        const maxPrecio = obtenerMaximo(datos.preciosPorCategoria.labels, datos.preciosPorCategoria.valores);
        document.getElementById("descPreciosCategoria").textContent =
            `La categoría con el precio promedio más alto es ${maxPrecio.label} (S/ ${maxPrecio.valor.toFixed(2)}), lo que permite enfocar campañas de descuento estratégico en esta línea.`;
    } else {
        document.getElementById("descPreciosCategoria").textContent = "Sin datos registrados aún.";
    }

    // 4. Pedidos por Estado
    new Chart(document.getElementById("chartPedidosEstado"), {
        type: "doughnut",
        data: {
            labels: datos.pedidosPorEstado.labels,
            datasets: [{
                data: datos.pedidosPorEstado.valores,
                backgroundColor: ["#198754", "#0d6efd", "#ffc107", "#dc3545"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    if (datos.pedidosPorEstado.valores.length > 0) {
        const totalPedidos = datos.pedidosPorEstado.valores.reduce((a, b) => a + b, 0);
        const maxEstado = obtenerMaximo(datos.pedidosPorEstado.labels, datos.pedidosPorEstado.valores);
        document.getElementById("descPedidosEstado").textContent =
            `De un total de ${totalPedidos} pedidos registrados, el estado predominante es "${maxEstado.label}" con ${maxEstado.valor} pedidos (${((maxEstado.valor / totalPedidos) * 100).toFixed(1)}%).`;
    } else {
        document.getElementById("descPedidosEstado").textContent = "Sin datos registrados aún.";
    }

    // 5. Clientes Frecuentes
    new Chart(document.getElementById("chartClientesFrecuentes"), {
        type: "bar",
        data: {
            labels: datos.clientesFrecuentes.labels,
            datasets: [{
                label: "Pedidos realizados",
                data: datos.clientesFrecuentes.valores,
                backgroundColor: "#0dcaf0",
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
    if (datos.clientesFrecuentes.valores.length > 0) {
        const maxCliente = obtenerMaximo(datos.clientesFrecuentes.labels, datos.clientesFrecuentes.valores);
        document.getElementById("descClientesFrecuentes").textContent =
            `${maxCliente.label} es el cliente más recurrente con ${maxCliente.valor} pedidos, siendo un candidato ideal para programas de fidelización mayorista.`;
    } else {
        document.getElementById("descClientesFrecuentes").textContent = "Sin datos registrados aún.";
    }

    // 6. Descuentos Aplicados
    new Chart(document.getElementById("chartDescuentosAplicados"), {
        type: "line",
        data: {
            labels: datos.descuentosAplicados.labels,
            datasets: [{
                label: "Descuentos otorgados (S/)",
                data: datos.descuentosAplicados.valores,
                borderColor: "#dc3545",
                backgroundColor: "rgba(220, 53, 69, 0.15)",
                fill: true,
                tension: 0.35
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    if (datos.descuentosAplicados.valores.length > 0) {
        const totalDesc = datos.descuentosAplicados.valores.reduce((a, b) => a + b, 0);
        const maxDesc = obtenerMaximo(datos.descuentosAplicados.labels, datos.descuentosAplicados.valores);
        document.getElementById("descDescuentosAplicados").textContent =
            `Se otorgaron S/ ${totalDesc.toFixed(2)} en descuentos acumulados; el pico promocional se registró en ${maxDesc.label} con S/ ${maxDesc.valor.toFixed(2)}.`;
    } else {
        document.getElementById("descDescuentosAplicados").textContent = "Sin datos registrados aún.";
    }
});