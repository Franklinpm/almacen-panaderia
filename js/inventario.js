const btnProductos = document.getElementById("btnProductos");
const listaProductos = document.getElementById("listaProductos");

const formIngreso = document.getElementById("formIngreso");
const productoIngreso = document.getElementById("productoIngreso");
const resultadoIngreso = document.getElementById("resultadoIngreso");
const formSalida = document.getElementById("formSalida");
const productoSalida = document.getElementById("productoSalida");
const resultadoSalida = document.getElementById("resultadoSalida");


// ======================================================
// CARGAR INVENTARIO
// ======================================================

async function cargarInventario() {

    listaProductos.innerHTML = "⏳ Cargando inventario...";

    try {

        // Obtener productos
        const { data: productos, error: errorProductos } =
            await supabaseClient
                .from("productos")
                .select("id, codigo, nombre, unidad, stock_minimo_porcentaje")
                .order("codigo");

        if (errorProductos) {
            throw errorProductos;
        }


        // Obtener movimientos
        const { data: movimientos, error: errorMovimientos } =
            await supabaseClient
                .from("movimientos")
                .select("producto_id, tipo_movimiento, cantidad");

        if (errorMovimientos) {
            throw errorMovimientos;
        }


        // Calcular stock de cada producto
        const stockPorProducto = {};

        movimientos.forEach(movimiento => {

            const productoId = movimiento.producto_id;

            if (!stockPorProducto[productoId]) {
                stockPorProducto[productoId] = 0;
            }

            const cantidad = Number(movimiento.cantidad) || 0;

            const tipo =
                String(movimiento.tipo_movimiento)
                    .trim()
                    .toUpperCase();


            if (tipo === "INGRESO") {

                stockPorProducto[productoId] += cantidad;

            } else if (tipo === "SALIDA") {

                stockPorProducto[productoId] -= cantidad;

            }

        });


        // Crear tabla
        let html = `
            <h3>📦 Inventario actual</h3>

            <table class="tabla-productos">

                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Unidad</th>
                        <th>Stock</th>
                        <th>Mínimo</th>
                        <th>Estado</th>
                    </tr>
                </thead>

                <tbody>
        `;


        productos.forEach(producto => {

            const stock =
                stockPorProducto[producto.id] || 0;

            const minimo =
                Number(producto.stock_minimo_porcentaje) || 75;


            let estado = "🟢 Normal";


            if (stock <= 0) {

                estado = "🔴 Sin stock";

            }


            html += `
                <tr>

                    <td>${producto.codigo}</td>

                    <td>${producto.nombre}</td>

                    <td>${producto.unidad}</td>

                    <td><strong>${stock}</strong></td>

                    <td>${minimo}%</td>

                    <td>${estado}</td>

                </tr>
            `;

        });


        html += `
                </tbody>
            </table>
        `;


        listaProductos.innerHTML = html;


    } catch (error) {

        console.error("Error:", error);

        listaProductos.innerHTML = `
            <p style="color:red;">
                ❌ Error al cargar inventario:
                ${error.message}
            </p>
        `;

    }

}


// ======================================================
// CARGAR PRODUCTOS EN EL FORMULARIO DE INGRESO
// ======================================================

async function cargarProductosParaIngreso() {

    try {

        const { data, error } =
            await supabaseClient
                .from("productos")
                .select("id, codigo, nombre")
                .order("codigo");


        if (error) {
            throw error;
        }


        productoIngreso.innerHTML =
            '<option value="">Seleccione un producto</option>';


        data.forEach(producto => {

            const opcion =
                document.createElement("option");

            opcion.value = producto.id;

            opcion.textContent =
                `${producto.codigo} - ${producto.nombre}`;

            productoIngreso.appendChild(opcion);

        });


    } catch (error) {

        console.error(
            "Error cargando productos:",
            error
        );

    }

}


// ======================================================
// REGISTRAR INGRESO
// ======================================================

formIngreso.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        resultadoIngreso.textContent =
            "⏳ Registrando ingreso...";


        const productoId =
            productoIngreso.value;


        const cantidad =
            Number(
                document.getElementById(
                    "cantidadIngreso"
                ).value
            );


        const precio =
            Number(
                document.getElementById(
                    "precioIngreso"
                ).value
            );


        const fecha =
            document.getElementById(
                "fechaIngreso"
            ).value;


        const observacion =
            document.getElementById(
                "observacionIngreso"
            ).value;


        if (
            !productoId ||
            cantidad <= 0 ||
            precio < 0 ||
            !fecha
        ) {

            resultadoIngreso.textContent =
                "⚠️ Complete correctamente los campos.";

            return;

        }


        try {

            const { error } =
                await supabaseClient
                    .from("movimientos")
                    .insert({

                        producto_id:
                            Number(productoId),

                        lote_id:
                            null,

                        tipo_movimiento:
                            "INGRESO",

                        cantidad:
                            cantidad,

                        fecha_movimiento:
                            `${fecha}T00:00:00`,

                        precio_unitario:
                            precio,

                        observacion:
                            observacion || null

                    });


            if (error) {
                throw error;
            }


            resultadoIngreso.textContent =
                "✅ Ingreso registrado correctamente.";


            formIngreso.reset();


            // Actualizar inventario inmediatamente
            await cargarInventario();

        } catch (error) {

            console.error(error);

            resultadoIngreso.textContent =
                "❌ Error al registrar: " +
                error.message;

        }

    }
);

// ======================================================
// CARGAR PRODUCTOS EN EL FORMULARIO DE SALIDA
// ======================================================

async function cargarProductosParaSalida() {

    try {

        const { data, error } =
            await supabaseClient
                .from("productos")
                .select("id, codigo, nombre")
                .order("codigo");

        if (error) {
            throw error;
        }

        productoSalida.innerHTML =
            '<option value="">Seleccione un producto</option>';

        data.forEach(producto => {

            const opcion =
                document.createElement("option");

            opcion.value = producto.id;

            opcion.textContent =
                `${producto.codigo} - ${producto.nombre}`;

            productoSalida.appendChild(opcion);

        });

    } catch (error) {

        console.error(
            "Error cargando productos para salida:",
            error
        );

    }
}

// ======================================================
// REGISTRAR SALIDA
// ======================================================

formSalida.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        resultadoSalida.textContent =
            "⏳ Verificando stock...";

        const productoId =
            Number(productoSalida.value);

        const cantidad =
            Number(
                document.getElementById(
                    "cantidadSalida"
                ).value
            );

        const fecha =
            document.getElementById(
                "fechaSalida"
            ).value;

        const observacion =
            document.getElementById(
                "observacionSalida"
            ).value;


        if (
            !productoId ||
            cantidad <= 0 ||
            !fecha
        ) {

            resultadoSalida.textContent =
                "⚠️ Complete correctamente los campos.";

            return;
        }


        try {

            // Obtener movimientos del producto
            const { data: movimientos, error } =
                await supabaseClient
                    .from("movimientos")
                    .select(
                        "tipo_movimiento, cantidad"
                    )
                    .eq(
                        "producto_id",
                        productoId
                    );

            if (error) {
                throw error;
            }


            // Calcular stock actual
            let stockActual = 0;

            movimientos.forEach(movimiento => {

                const tipo =
                    String(
                        movimiento.tipo_movimiento
                    )
                    .trim()
                    .toUpperCase();

                const cantidadMovimiento =
                    Number(
                        movimiento.cantidad
                    ) || 0;


                if (tipo === "INGRESO") {

                    stockActual +=
                        cantidadMovimiento;

                }

                if (tipo === "SALIDA") {

                    stockActual -=
                        cantidadMovimiento;

                }

            });


            // Verificar stock
            if (cantidad > stockActual) {

                resultadoSalida.innerHTML = `
                    ❌ <strong>Stock insuficiente.</strong><br>
                    Stock disponible: ${stockActual}<br>
                    Cantidad solicitada: ${cantidad}
                `;

                return;
            }


            // Registrar salida
            const { error: errorSalida } =
                await supabaseClient
                    .from("movimientos")
                    .insert({

                        producto_id:
                            productoId,

                        lote_id:
                            null,

                        tipo_movimiento:
                            "SALIDA",

                        cantidad:
                            cantidad,

                        fecha_movimiento:
                            `${fecha}T00:00:00`,

                        precio_unitario:
                            0,

                        observacion:
                            observacion || null
                    });


            if (errorSalida) {
                throw errorSalida;
            }


            const nuevoStock =
                stockActual - cantidad;


            resultadoSalida.innerHTML = `
                ✅ <strong>Salida registrada correctamente.</strong><br>
                Stock anterior: ${stockActual}<br>
                Salida: ${cantidad}<br>
                Nuevo stock: ${nuevoStock}
            `;


            formSalida.reset();


            // Actualizar inventario
            await cargarInventario();

        } catch (error) {

            console.error(error);

            resultadoSalida.textContent =
                "❌ Error al registrar salida: " +
                error.message;
        }

    }
);

// ======================================================
// INICIO
// ======================================================

btnProductos.addEventListener(
    "click",
    cargarInventario
);

cargarProductosParaIngreso();
cargarProductosParaSalida();
