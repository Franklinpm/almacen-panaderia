// ======================================================
// INVENTARIO - ALICORP SOLUCIONES CUSCO
// ======================================================

// Elementos de la pantalla
const btnProductos = document.getElementById("btnProductos");
const listaProductos = document.getElementById("listaProductos");

// Panadería actualmente seleccionada
let panaderiaActual = null;
let panaderiaIdActual = null;


// ======================================================
// ESTABLECER PANADERÍA
// ======================================================

async function establecerPanaderia(nombrePanaderia) {

    const { data, error } = await supabaseClient
        .from("panaderias")
        .select("id, nombre")
        .eq("nombre", nombrePanaderia)
        .limit(1);

    if (error) {
        throw error;
    }

    if (!data || data.length === 0) {
        throw new Error(
            "No se encontró la panadería: " + nombrePanaderia
        );
    }

    panaderiaActual = data[0].nombre;
    panaderiaIdActual = data[0].id;

    console.log(
        "Panadería seleccionada:",
        panaderiaActual,
        "ID:",
        panaderiaIdActual
    );
}


// ======================================================
// ABRIR INVENTARIO DE UNA PANADERÍA
// ======================================================

async function abrirInventarioPanaderia(nombrePanaderia) {

    try {

        await establecerPanaderia(nombrePanaderia);

        await cargarInventario();

    } catch (error) {

        console.error(
            "Error al abrir inventario:",
            error
        );

        if (listaProductos) {
            listaProductos.innerHTML = `
                <p style="color:red;">
                    ❌ No se pudo abrir el inventario.
                </p>
            `;
        }
    }
}


// ======================================================
// CARGAR INVENTARIO
// ======================================================

async function cargarInventario() {

    if (!listaProductos) {
        console.error("No existe listaProductos");
        return;
    }

    listaProductos.innerHTML = `
        <p>⏳ Cargando inventario...</p>
    `;

    if (!panaderiaIdActual) {

        listaProductos.innerHTML = `
            <p style="color:red;">
                ❌ No se ha seleccionado una panadería.
            </p>
        `;

        return;
    }


    try {

        // --------------------------------------------------
        // OBTENER PRODUCTOS
        // --------------------------------------------------

        const {
            data: productos,
            error: errorProductos
        } = await supabaseClient
            .from("productos")
            .select(
                "id, codigo, nombre, unidad, stock_minimo_porcentaje"
            )
            .order("codigo");

        if (errorProductos) {
            throw errorProductos;
        }


        // --------------------------------------------------
        // OBTENER MOVIMIENTOS DE ESTA PANADERÍA
        // --------------------------------------------------

        const {
            data: movimientos,
            error: errorMovimientos
        } = await supabaseClient
            .from("movimientos")
            .select(`
                producto_id,
                tipo_movimiento,
                cantidad,
                precio_unitario,
                fecha_movimiento,
                fecha_vencimiento
            `)
            .eq(
                "panaderia_id",
                panaderiaIdActual
            )
            .order(
                "fecha_movimiento",
                { ascending: false }
            );

        if (errorMovimientos) {
            throw errorMovimientos;
        }


        // --------------------------------------------------
        // CALCULAR INFORMACIÓN DE CADA PRODUCTO
        // --------------------------------------------------

        const informacionProductos = {};


        movimientos.forEach(movimiento => {

            const productoId = movimiento.producto_id;

            if (!informacionProductos[productoId]) {

                informacionProductos[productoId] = {

                    stock: 0,

                    precio: null,

                    fechaIngreso: null,

                    fechaVencimiento: null

                };
            }


            const cantidad =
                Number(movimiento.cantidad) || 0;


            const tipo =
                String(
                    movimiento.tipo_movimiento || ""
                )
                .trim()
                .toUpperCase();


            // Calcular stock
            if (tipo === "INGRESO") {

                informacionProductos[productoId].stock +=
                    cantidad;

            }

            if (tipo === "SALIDA") {

                informacionProductos[productoId].stock -=
                    cantidad;

            }


            // El primer movimiento INGRESO encontrado
            // es el más reciente porque ordenamos descendente
            if (
                tipo === "INGRESO" &&
                informacionProductos[productoId].precio === null
            ) {

                informacionProductos[productoId].precio =
                    movimiento.precio_unitario;

                informacionProductos[productoId].fechaIngreso =
                    movimiento.fecha_movimiento;

                informacionProductos[productoId].fechaVencimiento =
                    movimiento.fecha_vencimiento;
            }

        });


        // --------------------------------------------------
        // CREAR TABLA
        // --------------------------------------------------

        let html = `

            <div class="encabezado-inventario">

                <h3>📦 Inventario actual</h3>

                <p>
                    <strong>Panadería:</strong>
                    ${panaderiaActual}
                </p>

            </div>


            <div style="
                overflow-x:auto;
                width:100%;
            ">

                <table class="tabla-productos">

                    <thead>

                        <tr>

                            <th>Código</th>

                            <th>Producto</th>

                            <th>Unidad</th>

                            <th>Stock actual</th>

                            <th>Precio</th>

                            <th>Fecha de ingreso</th>

                            <th>Fecha de vencimiento</th>

                            <th>Estado</th>

                        </tr>

                    </thead>

                    <tbody>
        `;


        // --------------------------------------------------
        // GENERAR FILAS
        // --------------------------------------------------

        productos.forEach(producto => {

            const info =
                informacionProductos[producto.id] || {

                    stock: 0,
                    precio: null,
                    fechaIngreso: null,
                    fechaVencimiento: null

                };


            const stock =
                Number(info.stock) || 0;


            const minimo =
                Number(
                    producto.stock_minimo_porcentaje
                ) || 75;


            // ----------------------------------------------
            // PRECIO
            // ----------------------------------------------

            let precioTexto = "—";

            if (
                info.precio !== null &&
                info.precio !== undefined
            ) {

                precioTexto =
                    "S/ " +
                    Number(info.precio)
                        .toFixed(2);
            }


            // ----------------------------------------------
            // FECHA DE INGRESO
            // ----------------------------------------------

            let fechaIngresoTexto = "—";

            if (info.fechaIngreso) {

                fechaIngresoTexto =
                    formatearFecha(
                        info.fechaIngreso
                    );
            }


            // ----------------------------------------------
            // FECHA DE VENCIMIENTO
            // ----------------------------------------------

            let fechaVencimientoTexto = "—";

            if (info.fechaVencimiento) {

                fechaVencimientoTexto =
                    formatearFecha(
                        info.fechaVencimiento
                    );
            }


            // ----------------------------------------------
            // ESTADO
            // ----------------------------------------------

            const estado =
                calcularEstado(
                    stock,
                    minimo,
                    info.fechaVencimiento
                );


            html += `

                <tr>

                    <td>
                        ${producto.codigo}
                    </td>

                    <td>
                        ${producto.nombre}
                    </td>

                    <td>
                        ${producto.unidad || "—"}
                    </td>

                    <td>
                        <strong>
                            ${stock}
                        </strong>
                    </td>

                    <td>
                        ${precioTexto}
                    </td>

                    <td>
                        ${fechaIngresoTexto}
                    </td>

                    <td>
                        ${fechaVencimientoTexto}
                    </td>

                    <td>
                        ${estado}
                    </td>

                </tr>

            `;

        });


        html += `

                    </tbody>

                </table>

            </div>

        `;


        listaProductos.innerHTML = html;


    } catch (error) {

        console.error(
            "Error al cargar inventario:",
            error
        );

        listaProductos.innerHTML = `

            <p style="color:red;">

                ❌ Error al cargar inventario:

                ${error.message}

            </p>

        `;
    }
}


// ======================================================
// CALCULAR ESTADO
// ======================================================

function calcularEstado(
    stock,
    minimo,
    fechaVencimiento
) {

    // Sin stock
    if (stock <= 0) {

        return "🔴 Sin stock";
    }


    // Revisar vencimiento
    if (fechaVencimiento) {

        const hoy = new Date();

        hoy.setHours(
            0,
            0,
            0,
            0
        );


        const vencimiento =
            new Date(
                fechaVencimiento +
                "T00:00:00"
            );


        // Producto vencido
        if (vencimiento < hoy) {

            return "❌ Vencido";
        }


        // Diferencia en días
        const diferencia =
            Math.ceil(
                (
                    vencimiento - hoy
                ) /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )
            );


        // Por vencer en 30 días
        if (diferencia <= 30) {

            return "⚠️ Por vencer";
        }
    }


    // Stock bajo
    // El mínimo establecido actualmente
    // es 75%
    if (stock <= minimo) {

        return "🟡 Stock bajo";
    }


    return "🟢 Normal";
}


// ======================================================
// FORMATEAR FECHA
// ======================================================

function formatearFecha(fecha) {

    if (!fecha) {
        return "—";
    }


    const fechaObjeto =
        new Date(fecha);


    if (
        isNaN(
            fechaObjeto.getTime()
        )
    ) {

        return fecha;
    }


    return fechaObjeto.toLocaleDateString(
        "es-PE",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


// ======================================================
// BOTÓN ACTUALIZAR INVENTARIO
// ======================================================

if (btnProductos) {

    btnProductos.addEventListener(
        "click",
        cargarInventario
    );

}


console.log(
    "✅ inventario.js cargado correctamente"
);