
document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // CONFIGURACIÓN GENERAL
    // ==========================================

    const REPORTES = [
        {
            clave: "ventasPorCategoria",
            titulo: "Ventas por Categoría",
            hoja: "Ventas por Categoria",
            canvas: "chartVentasCategoria",
            descripcion: "descVentasCategoria",
            columna: "Categoría",
            medida: "Ventas (S/)",
            moneda: true
        },
        {
            clave: "productosMasVendidos",
            titulo: "Productos más Vendidos",
            hoja: "Productos Vendidos",
            canvas: "chartProductosMasVendidos",
            descripcion: "descProductosMasVendidos",
            columna: "Producto",
            medida: "Unidades vendidas",
            moneda: false
        },
        {
            clave: "preciosPorCategoria",
            titulo: "Precio Promedio por Categoría",
            hoja: "Precios por Categoria",
            canvas: "chartPreciosCategoria",
            descripcion: "descPreciosCategoria",
            columna: "Categoría",
            medida: "Precio promedio (S/)",
            moneda: true
        },
        {
            clave: "pedidosPorEstado",
            titulo: "Pedidos por Estado",
            hoja: "Pedidos por Estado",
            canvas: "chartPedidosEstado",
            descripcion: "descPedidosEstado",
            columna: "Estado",
            medida: "Cantidad de pedidos",
            moneda: false
        },
        {
            clave: "clientesFrecuentes",
            titulo: "Clientes Frecuentes",
            hoja: "Clientes Frecuentes",
            canvas: "chartClientesFrecuentes",
            descripcion: "descClientesFrecuentes",
            columna: "Cliente",
            medida: "Pedidos realizados",
            moneda: false
        },
        {
            clave: "descuentosAplicados",
            titulo: "Descuentos Aplicados por Mes",
            hoja: "Descuentos Aplicados",
            canvas: "chartDescuentosAplicados",
            descripcion: "descDescuentosAplicados",
            columna: "Periodo",
            medida: "Descuentos (S/)",
            moneda: true
        }
    ];

    const btnExcel = document.getElementById("btnExportarExcel");
    const btnWord = document.getElementById("btnExportarWord");
    const btnPDF = document.getElementById("btnExportarPDF");

    const botones = [btnExcel, btnWord, btnPDF].filter(Boolean);

    // ==========================================
    // FUNCIONES AUXILIARES
    // ==========================================

    function obtenerFecha() {
        return new Date().toLocaleDateString("es-PE", {
            timeZone: "America/Lima",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    function obtenerNombreArchivo(extension) {
        const fecha = obtenerFecha()
            .split("/")
            .reverse()
            .join("-");

        return `RICO_Reportes_${fecha}.${extension}`;
    }

    function obtenerReportes() {

        if (!window.datosReportes || !window.reportesListos) {
            throw new Error("Los reportes todavía no están disponibles.");
        }

        return REPORTES.map(reporte => {

            const datos = window.datosReportes[reporte.clave] || {
                labels: [],
                valores: []
            };

            const labels = Array.isArray(datos.labels)
                ? datos.labels
                : [];

            const valores = Array.isArray(datos.valores)
                ? datos.valores
                : [];

            const descripcion = document
                .getElementById(reporte.descripcion)
                ?.textContent
                ?.trim() || "Sin datos registrados aún.";

            const filas = labels.map((label, index) => {

                const valor = valores[index];

                return [
                    String(label ?? ""),
                    valor !== null &&
                    valor !== undefined &&
                    valor !== "" &&
                    Number.isFinite(Number(valor))
                        ? Number(valor)
                        : null
                ];
            });

            return {
                ...reporte,
                filas,
                textoDescripcion: descripcion
            };
        });
    }

    function formatearValor(valor, moneda) {

        if (valor === null || valor === undefined) {
            return "Sin dato";
        }

        if (moneda) {
            return `S/ ${Number(valor).toFixed(2)}`;
        }

        return String(valor);
    }

    function obtenerImagenGrafico(idCanvas) {

        const canvas = document.getElementById(idCanvas);

        if (!canvas || !canvas.width || !canvas.height) {
            return null;
        }

        const grafico = window.Chart?.getChart(canvas);

        if (grafico) {
            grafico.stop();
            grafico.update("none");
        }

        const temporal = document.createElement("canvas");

        temporal.width = canvas.width;
        temporal.height = canvas.height;

        const contexto = temporal.getContext("2d");

        contexto.fillStyle = "#FFFFFF";

        contexto.fillRect(
            0,
            0,
            temporal.width,
            temporal.height
        );

        contexto.drawImage(canvas, 0, 0);

        return {
            data: temporal.toDataURL("image/png"),
            ancho: temporal.width,
            alto: temporal.height
        };
    }

    function convertirImagenBytes(dataURL) {

        const base64 = dataURL.split(",")[1];
        const binario = atob(base64);

        const bytes = new Uint8Array(binario.length);

        for (let i = 0; i < binario.length; i++) {
            bytes[i] = binario.charCodeAt(i);
        }

        return bytes;
    }

    function descargarBlob(blob, nombreArchivo) {

        const url = URL.createObjectURL(blob);
        const enlace = document.createElement("a");

        enlace.href = url;
        enlace.download = nombreArchivo;

        document.body.appendChild(enlace);

        enlace.click();
        enlace.remove();

        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    function habilitarBotones(habilitar) {

        botones.forEach(boton => {
            boton.disabled = !habilitar;
        });
    }

    // ==========================================
    // EXPORTAR EXCEL - DISEÑO EMPRESARIAL
    // ==========================================

    async function exportarExcel() {

        if (!window.ExcelJS) {
            throw new Error("No se pudo cargar la librería ExcelJS.");
        }

        const reportes = obtenerReportes();

        const libro = new ExcelJS.Workbook();

        libro.creator = "RICO Alimentos";
        libro.company = "RICO Alimentos";
        libro.title = "Reporte Estadístico Gerencial";
        libro.subject = "Análisis de ventas, productos y clientes";
        libro.created = new Date();
        libro.modified = new Date();

        // ==========================================
        // PALETA CORPORATIVA
        // ==========================================

        const C = {
            rojo: "B62C38",
            oscuro: "343B45",
            blanco: "FFFFFF",
            gris: "F5F6F8",
            grisClaro: "F8F9FA",
            grisMedio: "E9ECEF",
            grisTexto: "737B85",
            borde: "E1E5E9",
            enlace: "495564"
        };

        const FORMATO_MONEDA = '"S/ " #,##0.00';
        const FORMATO_NUMERO = '#,##0';
        const FORMATO_PORCENTAJE = '0.00%';

        // ==========================================
        // FUNCIONES DE ESTILO
        // ==========================================

        function pintarCelda(celda, color) {

            celda.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                    argb: "FF" + color
                }
            };
        }

        function aplicarFuente(
            celda,
            color = C.oscuro,
            tamano = 11,
            negrita = false
        ) {

            celda.font = {
                name: "Calibri",
                size: tamano,
                bold: negrita,
                color: {
                    argb: "FF" + color
                }
            };
        }

        function aplicarBorde(celda) {

            const linea = {
                style: "thin",
                color: {
                    argb: "FF" + C.borde
                }
            };

            celda.border = {
                top: linea,
                left: linea,
                bottom: linea,
                right: linea
            };
        }

        function combinarBloque(
            hoja,
            rango,
            valor,
            fondo,
            texto,
            tamano = 12,
            negrita = false,
            horizontal = "left"
        ) {

            hoja.mergeCells(rango);

            const celda = hoja.getCell(
                rango.split(":")[0]
            );

            celda.value = valor;

            pintarCelda(celda, fondo);

            aplicarFuente(
                celda,
                texto,
                tamano,
                negrita
            );

            celda.alignment = {
                vertical: "middle",
                horizontal: horizontal,
                wrapText: true,
                indent: horizontal === "left" ? 1 : 0
            };

            return celda;
        }

        // ==========================================
        // CONFIGURACIÓN DE HOJAS
        // ==========================================

        function configurarHoja(hoja) {

            hoja.properties.tabColor = {
                argb: "FF" + C.rojo
            };

            hoja.properties.defaultRowHeight = 22;

            hoja.views = [{
                state: "normal",
                showGridLines: false,
                zoomScale: 90
            }];

            hoja.columns = [
                { width: 8 },
                { width: 47 },
                { width: 23 },
                { width: 23 }
            ];

            hoja.pageSetup = {
                paperSize: 9,
                orientation: "landscape",
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
                margins: {
                    left: 0.25,
                    right: 0.25,
                    top: 0.4,
                    bottom: 0.4,
                    header: 0.2,
                    footer: 0.2
                }
            };

            hoja.headerFooter.oddFooter =
                "&L RICO Alimentos - Uso interno" +
                "&R Página &P de &N";
        }

        // ==========================================
        // ENCABEZADO CORPORATIVO
        // ==========================================

        function crearEncabezado(hoja, titulo) {

            combinarBloque(
                hoja,
                "A1:D2",
                "RICO ALIMENTOS",
                C.blanco,
                C.oscuro,
                23,
                true
            );

            hoja.getRow(1).height = 20;
            hoja.getRow(2).height = 20;

            combinarBloque(
                hoja,
                "A3:D3",
                "SISTEMA DE REPORTES GERENCIALES",
                C.blanco,
                C.grisTexto,
                10
            );

            hoja.getRow(3).height = 22;

            const tituloReporte = combinarBloque(
                hoja,
                "A4:D4",
                titulo,
                C.blanco,
                C.oscuro,
                16,
                true
            );

            tituloReporte.border = {
                top: {
                    style: "medium",
                    color: {
                        argb: "FF" + C.rojo
                    }
                }
            };

            hoja.getRow(4).height = 32;

            combinarBloque(
                hoja,
                "A5:B5",
                "Fecha de generación: " + obtenerFecha(),
                C.blanco,
                C.grisTexto,
                10
            );

            combinarBloque(
                hoja,
                "C5:D5",
                "Panel de Administración | Uso interno",
                C.blanco,
                C.grisTexto,
                10,
                false,
                "center"
            );

            hoja.getRow(5).height = 24;
            hoja.getRow(6).height = 10;
        }

        // ==========================================
        // INDICADORES GERENCIALES
        // ==========================================

        function crearIndicador(
            hoja,
            rangoTitulo,
            rangoValor,
            titulo,
            valor,
            formato = null
        ) {

            combinarBloque(
                hoja,
                rangoTitulo,
                titulo,
                C.gris,
                C.grisTexto,
                10,
                true,
                "center"
            );

            const celda = combinarBloque(
                hoja,
                rangoValor,
                valor,
                C.gris,
                C.oscuro,
                22,
                true,
                "center"
            );

            celda.border = {
                bottom: {
                    style: "thin",
                    color: {
                        argb: "FF" + C.borde
                    }
                }
            };

            if (formato) {
                celda.numFmt = formato;
            }
        }

        function obtenerValoresValidos(reporte) {

            return reporte.filas
                .map(fila => fila[1])
                .filter(valor =>
                    typeof valor === "number" &&
                    Number.isFinite(valor)
                );
        }

        function obtenerIndicador(reporte) {

            const valores = obtenerValoresValidos(reporte);

            if (valores.length === 0) {
                return null;
            }

            const suma = valores.reduce(
                (a, b) => a + b,
                0
            );

            if (reporte.clave === "preciosPorCategoria") {
                return suma / valores.length;
            }

            return suma;
        }

        function obtenerTituloIndicador(reporte) {

            const titulos = {
                ventasPorCategoria: "TOTAL DE VENTAS",
                productosMasVendidos: "UNIDADES DE PRODUCTOS LISTADOS",
                preciosPorCategoria: "PROMEDIO ENTRE CATEGORÍAS",
                pedidosPorEstado: "TOTAL DE PEDIDOS",
                clientesFrecuentes: "PEDIDOS DE CLIENTES LISTADOS",
                descuentosAplicados: "TOTAL DE DESCUENTOS"
            };

            return titulos[reporte.clave];
        }

        // ==========================================
        // ESTILO DE ENCABEZADOS DE TABLAS
        // ==========================================

        function aplicarEncabezadoTabla(hoja, numeroFila) {

            const fila = hoja.getRow(numeroFila);

            fila.height = 30;

            for (let col = 1; col <= 4; col++) {

                const celda = fila.getCell(col);

                pintarCelda(celda, C.oscuro);
                aplicarFuente(celda, C.blanco, 11, true);

                aplicarBorde(celda);

                celda.alignment = {
                    vertical: "middle",
                    horizontal: "center",
                    wrapText: true
                };
            }
        }

        // ==========================================
        // HOJA 1 - RESUMEN EJECUTIVO
        // ==========================================

        const resumen = libro.addWorksheet(
            "Resumen Ejecutivo"
        );

        configurarHoja(resumen);

        crearEncabezado(
            resumen,
            "RESUMEN EJECUTIVO DE RESULTADOS"
        );

        const ventas = reportes.find(
            r => r.clave === "ventasPorCategoria"
        );

        const productos = reportes.find(
            r => r.clave === "productosMasVendidos"
        );

        const pedidos = reportes.find(
            r => r.clave === "pedidosPorEstado"
        );

        const descuentos = reportes.find(
            r => r.clave === "descuentosAplicados"
        );

        crearIndicador(
            resumen,
            "A7:B7",
            "A8:B9",
            "VENTAS TOTALES",
            obtenerIndicador(ventas) ?? "Sin datos",
            FORMATO_MONEDA
        );

        crearIndicador(
            resumen,
            "C7:D7",
            "C8:D9",
            "UNIDADES DE PRODUCTOS LISTADOS",
            obtenerIndicador(productos) ?? "Sin datos",
            FORMATO_NUMERO
        );

        crearIndicador(
            resumen,
            "A11:B11",
            "A12:B13",
            "PEDIDOS REGISTRADOS",
            obtenerIndicador(pedidos) ?? "Sin datos",
            FORMATO_NUMERO
        );

        crearIndicador(
            resumen,
            "C11:D11",
            "C12:D13",
            "DESCUENTOS APLICADOS",
            obtenerIndicador(descuentos) ?? "Sin datos",
            FORMATO_MONEDA
        );

        resumen.getRow(7).height = 28;
        resumen.getRow(8).height = 24;
        resumen.getRow(9).height = 24;
        resumen.getRow(10).height = 10;
        resumen.getRow(11).height = 28;
        resumen.getRow(12).height = 24;
        resumen.getRow(13).height = 24;
        resumen.getRow(14).height = 12;

        combinarBloque(
            resumen,
            "A15:D15",
            "DETALLE DE REPORTES ESTADÍSTICOS",
            C.grisMedio,
            C.oscuro,
            12,
            true
        );

        resumen.getRow(15).height = 30;

        resumen.getRow(16).values = [
            "N°",
            "Reporte",
            "Indicador",
            "Registros"
        ];

        aplicarEncabezadoTabla(resumen, 16);

        reportes.forEach((reporte, index) => {

            const numeroFila = 17 + index;

            const fila = resumen.getRow(numeroFila);

            fila.values = [
                index + 1,
                reporte.titulo,
                obtenerIndicador(reporte) ?? "Sin datos",
                reporte.filas.length
            ];

            fila.height = 26;

            for (let col = 1; col <= 4; col++) {

                const celda = fila.getCell(col);

                pintarCelda(
                    celda,
                    index % 2 === 0 ? C.blanco : C.gris
                );

                aplicarFuente(celda);
                aplicarBorde(celda);

                celda.alignment = {
                    vertical: "middle",
                    horizontal: col === 2
                        ? "left"
                        : col === 1
                            ? "center"
                            : "right",
                    wrapText: true
                };
            }

            fila.getCell(2).value = {
                text: reporte.titulo,
                hyperlink: `#'${reporte.hoja}'!A1`
            };

            fila.getCell(2).font = {
                name: "Calibri",
                size: 11,
                bold: true,
                underline: true,
                color: {
                    argb: "FF" + C.enlace
                }
            };

            fila.getCell(3).numFmt = reporte.moneda
                ? FORMATO_MONEDA
                : FORMATO_NUMERO;

            fila.getCell(4).numFmt = FORMATO_NUMERO;
        });

        combinarBloque(
            resumen,
            "A24:D24",
            "NOTAS DEL INFORME",
            C.grisMedio,
            C.oscuro,
            12,
            true
        );

        resumen.getRow(24).height = 28;

        combinarBloque(
            resumen,
            "A25:D28",
            "Información obtenida del sistema de reportes de RICO " +
            "Alimentos. Los indicadores corresponden a los datos " +
            "disponibles al momento de la exportación. " +
            "Haga clic en el nombre de cada reporte para consultar " +
            "su detalle. El indicador de precios corresponde a un " +
            "promedio simple entre categorías. Los indicadores de " +
            "productos y clientes se limitan a los registros listados.",
            C.grisClaro,
            C.oscuro,
            11
        );

        for (let f = 25; f <= 28; f++) {
            resumen.getRow(f).height = 22;
        }

        combinarBloque(
            resumen,
            "A30:D30",
            "RICO Alimentos | Reporte de uso interno",
            C.blanco,
            C.grisTexto,
            10,
            false,
            "center"
        );

        resumen.pageSetup.printArea = "A1:D30";

        // ==========================================
        // HOJAS INDIVIDUALES
        // ==========================================

        reportes.forEach((reporte, index) => {

            const hoja = libro.addWorksheet(reporte.hoja);

            configurarHoja(hoja);

            crearEncabezado(
                hoja,
                `${String(index + 1).padStart(2, "0")}. ${reporte.titulo}`
            );

            const esPrecioPromedio =
                reporte.clave === "preciosPorCategoria";

            const valoresValidos =
                obtenerValoresValidos(reporte);

            const indicador =
                obtenerIndicador(reporte);

            const maximo = valoresValidos.length > 0
                ? valoresValidos.reduce(
                    (max, valor) => Math.max(max, valor),
                    -Infinity
                )
                : null;

            const tieneParticipacion =
                !esPrecioPromedio &&
                indicador !== null &&
                indicador > 0 &&
                valoresValidos.every(v => v >= 0);

            const formatoValor = reporte.moneda
                ? FORMATO_MONEDA
                : FORMATO_NUMERO;

            // ==========================================
            // INDICADORES SUPERIORES
            // ==========================================

            crearIndicador(
                hoja,
                "A7:B7",
                "A8:B9",
                obtenerTituloIndicador(reporte),
                indicador ?? "Sin datos",
                formatoValor
            );

            crearIndicador(
                hoja,
                "C7:D7",
                "C8:D9",
                "REGISTROS DEL REPORTE",
                reporte.filas.length,
                FORMATO_NUMERO
            );

            hoja.getRow(7).height = 28;
            hoja.getRow(8).height = 24;
            hoja.getRow(9).height = 24;
            hoja.getRow(10).height = 12;

            // ==========================================
            // ENCABEZADOS DE TABLA
            // ==========================================

            const filaEncabezado = 11;
            const filaInicio = 12;

            hoja.getRow(filaEncabezado).values = [
                "N°",
                reporte.columna,
                reporte.medida,
                tieneParticipacion
                    ? "Participación (%)"
                    : "Observación"
            ];

            aplicarEncabezadoTabla(
                hoja,
                filaEncabezado
            );

            // ==========================================
            // DATOS DE LA TABLA
            // ==========================================

            const filas = reporte.filas.length > 0
                ? reporte.filas
                : [["Sin datos registrados", null]];

            const filaFin =
                filaInicio + filas.length - 1;

            const filaTotal = filaFin + 1;

            filas.forEach((dato, i) => {

                const numeroFila = filaInicio + i;
                const fila = hoja.getRow(numeroFila);

                const valor = dato[1];

                const esMayor =
                    maximo !== null &&
                    valor === maximo;

                fila.values = [
                    reporte.filas.length > 0 ? i + 1 : null,
                    dato[0],
                    valor,
                    null
                ];

                const fondo = i % 2 === 0
                    ? C.blanco
                    : C.gris;

                fila.height = Math.max(
                    23,
                    Math.ceil(String(dato[0]).length / 40) * 15 + 8
                );

                for (let col = 1; col <= 4; col++) {

                    const celda = fila.getCell(col);

                    pintarCelda(celda, fondo);

                    aplicarFuente(
                        celda,
                        C.oscuro,
                        11,
                        esMayor
                    );

                    aplicarBorde(celda);

                    celda.alignment = {
                        vertical: "middle",
                        horizontal: col === 2
                            ? "left"
                            : col >= 3
                                ? "right"
                                : "center",
                        wrapText: true,
                        indent: col === 2 ? 1 : 0
                    };
                }

                fila.getCell(3).numFmt = formatoValor;

                // Porcentaje de participación
                if (
                    tieneParticipacion &&
                    typeof valor === "number"
                ) {

                    fila.getCell(4).value = {
                        formula:
                            `IFERROR(C${numeroFila}/$C$${filaTotal},0)`,
                        result: valor / indicador
                    };

                    fila.getCell(4).numFmt =
                        FORMATO_PORCENTAJE;

                } else if (!tieneParticipacion) {

                    fila.getCell(4).value =
                        esMayor ? "Mayor valor" : "";

                    fila.getCell(4).alignment = {
                        vertical: "middle",
                        horizontal: "center"
                    };
                }
            });

            // ==========================================
            // FILA DE TOTAL O PROMEDIO
            // ==========================================

            hoja.mergeCells(
                `A${filaTotal}:B${filaTotal}`
            );

            hoja.getCell(`A${filaTotal}`).value =
                esPrecioPromedio
                    ? "PROMEDIO ENTRE CATEGORÍAS"
                    : reporte.clave === "productosMasVendidos" ||
                      reporte.clave === "clientesFrecuentes"
                        ? "TOTAL DE REGISTROS LISTADOS"
                        : "TOTAL GENERAL";

            for (let col = 1; col <= 4; col++) {

                const celda = hoja
                    .getRow(filaTotal)
                    .getCell(col);

                pintarCelda(celda, C.grisMedio);

                aplicarFuente(
                    celda,
                    C.oscuro,
                    12,
                    true
                );

                celda.border = {
                    top: {
                        style: "medium",
                        color: {
                            argb: "FFB8BEC5"
                        }
                    }
                };

                celda.alignment = {
                    vertical: "middle",
                    horizontal: col >= 3
                        ? "right"
                        : "center",
                    wrapText: true
                };
            }

            hoja.getRow(filaTotal).height = 30;

            const celdaTotal =
                hoja.getCell(`C${filaTotal}`);

            if (valoresValidos.length > 0) {

                celdaTotal.value = {
                    formula: esPrecioPromedio
                        ? `AVERAGE(C${filaInicio}:C${filaFin})`
                        : `SUM(C${filaInicio}:C${filaFin})`,
                    result: indicador
                };

                celdaTotal.numFmt = formatoValor;

            } else {

                celdaTotal.value = "Sin datos";
            }

            if (tieneParticipacion) {

                hoja.getCell(`D${filaTotal}`).value = {
                    formula:
                        `SUM(D${filaInicio}:D${filaFin})`,
                    result: 1
                };

                hoja.getCell(`D${filaTotal}`).numFmt =
                    FORMATO_PORCENTAJE;
            }

            // ==========================================
            // FILTROS Y VISTA
            // ==========================================

            if (reporte.filas.length > 0) {

                hoja.autoFilter = {
                    from: {
                        row: filaEncabezado,
                        column: 1
                    },
                    to: {
                        row: filaFin,
                        column: 4
                    }
                };
            }

            hoja.views = [{
                state: "normal",
                showGridLines: false,
                zoomScale: 90
            }];

            // ==========================================
            // DESCRIPCIÓN DE RESULTADOS
            // ==========================================

            const filaTituloDescripcion =
                filaTotal + 2;

            combinarBloque(
                hoja,
                `A${filaTituloDescripcion}:D${filaTituloDescripcion}`,
                "DESCRIPCIÓN DE RESULTADOS",
                C.grisMedio,
                C.oscuro,
                12,
                true
            );

            hoja.getRow(filaTituloDescripcion).height = 28;

            const filaDescripcion =
                filaTituloDescripcion + 1;

            const cantidadLineas = Math.max(
                3,
                Math.ceil(
                    reporte.textoDescripcion.length / 90
                ) + 1
            );

            const filaFinDescripcion =
                filaDescripcion + cantidadLineas - 1;

            const bloqueDescripcion = combinarBloque(
                hoja,
                `A${filaDescripcion}:D${filaFinDescripcion}`,
                reporte.textoDescripcion,
                C.grisClaro,
                C.oscuro,
                11
            );

            bloqueDescripcion.border = {
                left: {
                    style: "medium",
                    color: {
                        argb: "FF" + C.rojo
                    }
                }
            };

            for (
                let f = filaDescripcion;
                f <= filaFinDescripcion;
                f++
            ) {
                hoja.getRow(f).height = 22;
            }

            // ==========================================
            // PIE DEL REPORTE
            // ==========================================

            const filaPie =
                filaFinDescripcion + 2;

            const pie = combinarBloque(
                hoja,
                `A${filaPie}:D${filaPie}`,
                "RICO Alimentos © " +
                new Date().getFullYear() +
                " | Reporte generado automáticamente",
                C.blanco,
                C.grisTexto,
                10,
                false,
                "center"
            );

            pie.border = {
                top: {
                    style: "thin",
                    color: {
                        argb: "FF" + C.borde
                    }
                }
            };

            hoja.getRow(filaPie).height = 26;

            // ==========================================
            // ENLACE AL RESUMEN
            // ==========================================

            const filaEnlace = filaPie + 1;

            const enlace = combinarBloque(
                hoja,
                `A${filaEnlace}:D${filaEnlace}`,
                "Volver al Resumen Ejecutivo",
                C.blanco,
                C.enlace,
                11,
                true,
                "center"
            );

            enlace.value = {
                text: "Volver al Resumen Ejecutivo",
                hyperlink: "#'Resumen Ejecutivo'!A1"
            };

            enlace.font = {
                name: "Calibri",
                size: 11,
                bold: true,
                underline: true,
                color: {
                    argb: "FF" + C.enlace
                }
            };

            hoja.getRow(filaEnlace).height = 25;

            hoja.pageSetup.printArea =
                `A1:D${filaPie}`;
        });

        // ==========================================
        // GENERAR ARCHIVO EXCEL
        // ==========================================

        libro.calcProperties.fullCalcOnLoad = true;

        libro.views = [{
            activeTab: 0,
            firstSheet: 0,
            visibility: "visible"
        }];

        const buffer = await libro.xlsx.writeBuffer();

        const blob = new Blob([buffer], {
            type:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });

        descargarBlob(
            blob,
            obtenerNombreArchivo("xlsx")
        );
    }

    // ==========================================
    // EXPORTAR WORD
    // ==========================================

    async function exportarWord() {

        if (!window.docx) {
            throw new Error("No se pudo cargar la librería de Word.");
        }

        const {
            Document,
            Packer,
            Paragraph,
            TextRun,
            Table,
            TableRow,
            TableCell,
            ImageRun,
            HeadingLevel,
            AlignmentType,
            WidthType,
            Header,
            Footer,
            PageNumber
        } = window.docx;

        const reportes = obtenerReportes();

        const contenido = [];

        function crearCelda(texto, encabezado = false) {

            return new TableCell({

                shading: encabezado
                    ? { fill: "DC3545" }
                    : undefined,

                margins: {
                    top: 100,
                    bottom: 100,
                    left: 120,
                    right: 120
                },

                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: String(texto),
                                bold: encabezado,
                                color: encabezado
                                    ? "FFFFFF"
                                    : "333333",
                                size: 21
                            })
                        ]
                    })
                ]
            });
        }

        reportes.forEach((reporte, index) => {

            contenido.push(

                new Paragraph({
                    text: `${index + 1}. ${reporte.titulo}`,
                    heading: HeadingLevel.HEADING_1,
                    pageBreakBefore: index > 0,
                    spacing: {
                        after: 250
                    }
                }),

                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Reporte estadístico gerencial",
                            color: "777777",
                            size: 20
                        })
                    ],
                    spacing: {
                        after: 200
                    }
                })
            );

            // Insertar gráfico

            const imagen = reporte.filas.length
                ? obtenerImagenGrafico(reporte.canvas)
                : null;

            if (imagen) {

                const escala = Math.min(
                    520 / imagen.ancho,
                    260 / imagen.alto
                );

                contenido.push(

                    new Paragraph({

                        alignment: AlignmentType.CENTER,

                        children: [
                            new ImageRun({
                                data: convertirImagenBytes(imagen.data),
                                transformation: {
                                    width: Math.round(
                                        imagen.ancho * escala
                                    ),
                                    height: Math.round(
                                        imagen.alto * escala
                                    )
                                }
                            })
                        ],

                        spacing: {
                            after: 300
                        }
                    })
                );
            }

            // Crear tabla

            const filasTabla = [

                new TableRow({
                    tableHeader: true,
                    children: [
                        crearCelda(reporte.columna, true),
                        crearCelda(reporte.medida, true)
                    ]
                })
            ];

            if (reporte.filas.length === 0) {

                filasTabla.push(

                    new TableRow({
                        children: [
                            crearCelda("Sin datos registrados"),
                            crearCelda("-")
                        ]
                    })
                );

            } else {

                reporte.filas.forEach(fila => {

                    filasTabla.push(

                        new TableRow({
                            children: [
                                crearCelda(fila[0]),

                                crearCelda(
                                    formatearValor(
                                        fila[1],
                                        reporte.moneda
                                    )
                                )
                            ]
                        })
                    );
                });
            }

            contenido.push(

                new Table({
                    width: {
                        size: 100,
                        type: WidthType.PERCENTAGE
                    },
                    rows: filasTabla
                }),

                new Paragraph({
                    spacing: {
                        before: 300,
                        after: 120
                    },
                    children: [
                        new TextRun({
                            text: "Descripción de resultados",
                            bold: true,
                            color: "DC3545",
                            size: 24
                        })
                    ]
                }),

                new Paragraph({
                    spacing: {
                        after: 300,
                        line: 360
                    },
                    children: [
                        new TextRun({
                            text: reporte.textoDescripcion,
                            size: 22
                        })
                    ]
                })
            );
        });

        const documento = new Document({

            creator: "RICO Alimentos",
            title: "Reporte Estadístico Gerencial",
            description: "Informe generado desde el panel administrativo",

            sections: [{

                properties: {
                    page: {
                        margin: {
                            top: 1100,
                            bottom: 1000,
                            left: 1000,
                            right: 1000
                        }
                    }
                },

                headers: {

                    default: new Header({

                        children: [

                            new Paragraph({
                                alignment: AlignmentType.LEFT,
                                children: [
                                    new TextRun({
                                        text: "RICO ALIMENTOS",
                                        bold: true,
                                        color: "DC3545",
                                        size: 30
                                    })
                                ]
                            }),

                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `Informe gerencial | ${obtenerFecha()}`,
                                        size: 18,
                                        color: "666666"
                                    })
                                ]
                            })
                        ]
                    })
                },

                footers: {

                    default: new Footer({

                        children: [

                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        children: [
                                            "RICO Alimentos | Uso interno | Página ",
                                            PageNumber.CURRENT
                                        ],
                                        size: 18,
                                        color: "777777"
                                    })
                                ]
                            })
                        ]
                    })
                },

                children: contenido
            }]
        });

        const blob = await Packer.toBlob(documento);

        descargarBlob(
            blob,
            obtenerNombreArchivo("docx")
        );
    }

    // ==========================================
    // EXPORTAR PDF
    // ==========================================

    function exportarPDF() {

        if (!window.jspdf) {
            throw new Error("No se pudo cargar la librería PDF.");
        }

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        if (typeof pdf.autoTable !== "function") {
            throw new Error("No se pudo cargar el complemento AutoTable.");
        }

        const reportes = obtenerReportes();

        const anchoPagina =
            pdf.internal.pageSize.getWidth();

        const altoPagina =
            pdf.internal.pageSize.getHeight();

        const margen = 15;

        const anchoUtil =
            anchoPagina - margen * 2;

        pdf.setProperties({
            title: "Reporte Estadístico Gerencial",
            author: "RICO Alimentos",
            subject: "Análisis de reportes y estadísticas"
        });

        function dibujarEncabezado() {

            pdf.setFillColor(220, 53, 69);

            pdf.rect(
                0,
                0,
                anchoPagina,
                28,
                "F"
            );

            pdf.setTextColor(255, 255, 255);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(20);

            pdf.text(
                "RICO ALIMENTOS",
                margen,
                12
            );

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);

            pdf.text(
                "Reporte Estadístico Gerencial",
                margen,
                20
            );

            pdf.text(
                obtenerFecha(),
                anchoPagina - margen,
                20,
                { align: "right" }
            );
        }

        reportes.forEach((reporte, index) => {

            if (index > 0) {
                pdf.addPage();
            }

            dibujarEncabezado();

            let y = 40;

            // Título del reporte

            pdf.setTextColor(33, 37, 41);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(15);

            const titulo = pdf.splitTextToSize(
                `${index + 1}. ${reporte.titulo}`,
                anchoUtil
            );

            pdf.text(titulo, margen, y);

            y += titulo.length * 7 + 5;

            // Insertar gráfico

            const imagen = reporte.filas.length
                ? obtenerImagenGrafico(reporte.canvas)
                : null;

            if (imagen) {

                const escala = Math.min(
                    anchoUtil / imagen.ancho,
                    80 / imagen.alto
                );

                const anchoImagen =
                    imagen.ancho * escala;

                const altoImagen =
                    imagen.alto * escala;

                pdf.addImage(
                    imagen.data,
                    "PNG",
                    (anchoPagina - anchoImagen) / 2,
                    y,
                    anchoImagen,
                    altoImagen
                );

                y += altoImagen + 8;
            }

            // Tabla de resultados

            const filas = reporte.filas.length > 0

                ? reporte.filas.map(fila => [
                    fila[0],
                    formatearValor(
                        fila[1],
                        reporte.moneda
                    )
                ])

                : [["Sin datos registrados", "-"]];

            pdf.autoTable({

                startY: y,

                head: [
                    [
                        reporte.columna,
                        reporte.medida
                    ]
                ],

                body: filas,

                theme: "striped",

                margin: {
                    top: 36,
                    left: margen,
                    right: margen,
                    bottom: 20
                },

                headStyles: {
                    fillColor: [220, 53, 69],
                    textColor: [255, 255, 255],
                    fontStyle: "bold"
                },

                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },

                styles: {
                    font: "helvetica",
                    fontSize: 10,
                    cellPadding: 3,
                    overflow: "linebreak"
                },

                columnStyles: {
                    1: {
                        halign: "right"
                    }
                },

                didDrawPage: () => {
                    dibujarEncabezado();
                }
            });

            y = pdf.lastAutoTable.finalY + 12;

            // Descripción de resultados

            pdf.setFontSize(11);

            const lineas = pdf.splitTextToSize(
                reporte.textoDescripcion,
                anchoUtil - 10
            );

            if (
                y + 20 + lineas.length * 5 >
                altoPagina - 20
            ) {

                pdf.addPage();
                dibujarEncabezado();
                y = 40;
            }

            pdf.setFillColor(246, 247, 248);

            pdf.roundedRect(
                margen,
                y,
                anchoUtil,
                15 + lineas.length * 5,
                2,
                2,
                "F"
            );

            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(220, 53, 69);

            pdf.text(
                "Descripción de resultados",
                margen + 5,
                y + 7
            );

            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(60, 60, 60);

            pdf.text(
                lineas,
                margen + 5,
                y + 14
            );
        });

        // ==========================================
        // NUMERACIÓN DE PÁGINAS
        // ==========================================

        const totalPaginas =
            pdf.getNumberOfPages();

        for (
            let pagina = 1;
            pagina <= totalPaginas;
            pagina++
        ) {

            pdf.setPage(pagina);

            pdf.setDrawColor(220, 220, 220);

            pdf.line(
                margen,
                altoPagina - 14,
                anchoPagina - margen,
                altoPagina - 14
            );

            pdf.setTextColor(110, 110, 110);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);

            pdf.text(
                "RICO Alimentos - Uso interno",
                margen,
                altoPagina - 8
            );

            pdf.text(
                `Página ${pagina} de ${totalPaginas}`,
                anchoPagina - margen,
                altoPagina - 8,
                { align: "right" }
            );
        }

        pdf.save(
            obtenerNombreArchivo("pdf")
        );
    }

    // ==========================================
    // CONTROL DE EXPORTACIONES Y ALERTAS
    // ==========================================

    async function ejecutarExportacion(formato, funcion) {

        if (!window.reportesListos) {

            await Swal.fire({
                icon: "warning",
                title: "Reportes no disponibles",
                text: "Espere a que finalice la carga de los gráficos."
            });

            return;
        }

        habilitarBotones(false);

        try {

            Swal.fire({
                title: `Generando ${formato}`,
                text: "Preparando el informe estadístico...",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            await new Promise(
                resolve => setTimeout(resolve, 100)
            );

            await funcion();

            await Swal.fire({
                icon: "success",
                title: "Exportación completada",
                text: `El informe ${formato} se ha generado correctamente.`,
                confirmButtonColor: "#198754"
            });

        } catch (error) {

            console.error(
                `Error al exportar ${formato}:`,
                error
            );

            await Swal.fire({
                icon: "error",
                title: "Error de exportación",
                text:
                    error.message ||
                    "No se pudo generar el archivo.",
                confirmButtonColor: "#dc3545"
            });

        } finally {

            habilitarBotones(
                Boolean(window.reportesListos)
            );
        }
    }

    // ==========================================
    // EVENTOS DE LOS BOTONES
    // ==========================================

    btnExcel?.addEventListener("click", () => {

        ejecutarExportacion(
            "Excel",
            exportarExcel
        );
    });

    btnWord?.addEventListener("click", () => {

        ejecutarExportacion(
            "Word",
            exportarWord
        );
    });

    btnPDF?.addEventListener("click", () => {

        ejecutarExportacion(
            "PDF",
            exportarPDF
        );
    });

    // Habilitar botones cuando los datos estén disponibles

    habilitarBotones(
        Boolean(window.reportesListos)
    );

    document.addEventListener("reportesListos", () => {
        habilitarBotones(true);
    });

});
