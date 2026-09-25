const formularioLogin = document.getElementById("formularioLogin");
const mensajeLogin = document.getElementById("mensajeLogin");

formularioLogin.addEventListener("submit", async function (event) {
    event.preventDefault();

    const usuario = document.getElementById("usuario").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    mensajeLogin.textContent = "⏳ Iniciando sesión...";

    if (!usuario || !password) {
        mensajeLogin.textContent = "⚠️ Ingrese usuario y contraseña.";
        return;
    }

    try {

        // =====================================================
        // 1. ADMINISTRADOR ALICORP
        // =====================================================

        if (usuario === "alicorp") {

            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email: "42632661@continental.edu.pe",
                    password: password
                });

            if (error) {
                throw error;
            }

            localStorage.setItem("tipoUsuario", "ALICORP");
            localStorage.setItem("usuarioActual", "alicorp");

            mensajeLogin.textContent =
                "✅ Inicio de sesión correcto.";

            document.getElementById("pantallaLogin").style.display = "none";
            document.getElementById("pantallaApp").style.display = "block";

            document.getElementById("nombreEmpresa").textContent = "Alicorp Soluciones Cusco";

            document.getElementById("tipoUsuario").textContent =
                "👤 Administrador";

            mostrarMenuAdmin();

            return;
        }


        // =====================================================
        // 2. USUARIOS DE PANADERÍAS
        // =====================================================

        const { data, error } = await supabaseClient.rpc(
            "login_panaderia",
            {
                p_usuario: usuario,
                p_password: password
            }
        );

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            mensajeLogin.textContent =
                "❌ Usuario o contraseña incorrectos.";
            return;
        }

        const usuarioPanaderia = data[0];

        localStorage.setItem("tipoUsuario", "PANADERIA");
        localStorage.setItem("usuarioActual", usuarioPanaderia.usuario);
        localStorage.setItem(
            "panaderiaActual",
            usuarioPanaderia.panaderia
        );

        mensajeLogin.textContent =
            "✅ Inicio de sesión correcto.";

        document.getElementById("pantallaLogin").style.display = "none";
        document.getElementById("pantallaApp").style.display = "block";

        mostrarMenuPanaderia(usuarioPanaderia.panaderia);

    } catch (error) {

        console.error("Error de inicio de sesión:", error);

        mensajeLogin.textContent =
            "❌ Usuario o contraseña incorrectos.";
    }
});


// =====================================================
// MENÚ DEL ADMINISTRADOR
// =====================================================

function mostrarMenuAdmin() {

    document.getElementById("contenidoApp").innerHTML = `

        <div class="panel-admin">

            <h2>ALICORP SOLUCIONES CUSCO</h2>

            <p>CLIENTES</p>

            <div class="clientes-admin">

                <div class="cliente-card">
                    <h3>🥖 LOS MARQUESES</h3>
                    <button type="button"
                        onclick="verStock('Los Marqueses')">
                        VER STOCK
                    </button>
                </div>

                <div class="cliente-card">
                    <h3>🥖 ERMITAS</h3>
                    <button type="button"
                        onclick="verStock('Ermitas')">
                        VER STOCK
                    </button>
                </div>

                <div class="cliente-card">
                    <h3>🥖 SANN JUAN</h3>
                    <button type="button"
                        onclick="verStock('Sann Juan')">
                        VER STOCK
                    </button>
                </div>

            </div>

            <button type="button" onclick="cerrarSesion()">
                🚪 SALIR
            </button>

        </div>
    `;
}


// =====================================================
// MENÚ DE CADA PANADERÍA
// =====================================================

function mostrarMenuPanaderia(nombrePanaderia) {

    document.getElementById("nombreEmpresa").textContent =
        "🥖 " + nombrePanaderia;

    document.getElementById("tipoUsuario").textContent =
        "Sistema de gestión de inventario";

    document.getElementById("contenidoApp").innerHTML = `

        <div class="panel-panaderia">

            <h2>🥖 ${nombrePanaderia}</h2>

            <p>Sistema de gestión de inventario</p>

            <div class="menu-panaderia">

                <button type="button"
                    onclick="mostrarInventarioPanaderia('${nombrePanaderia}')">
                    📦 INVENTARIO
                </button>

                <button type="button"
                    onclick="mostrarIngresosPanaderia('${nombrePanaderia}')">
                    📥 INGRESOS
                </button>

                <button type="button"
                    onclick="mostrarSalidasPanaderia('${nombrePanaderia}')">
                    📤 SALIDAS
                </button>

                <button type="button"
                    onclick="mostrarAlertasPanaderia('${nombrePanaderia}')">
                    🔔 ALERTAS
                </button>

            </div>

            <button type="button" onclick="cerrarSesion()">
                🚪 SALIR
            </button>

        </div>
    `;
}


// =====================================================
// INVENTARIO DE LA PANADERÍA
// =====================================================

async function mostrarInventarioPanaderia(nombrePanaderia) {

    document.getElementById("contenidoApp").innerHTML = `

        <div class="panel-panaderia">

            <button type="button"
                onclick="mostrarMenuPanaderia('${nombrePanaderia}')">
                ← VOLVER
            </button>

            <h2>📦 INVENTARIO</h2>

            <p>${nombrePanaderia}</p>

            <button type="button" id="btnProductos">
                🔄 ACTUALIZAR INVENTARIO
            </button>

            <div id="listaProductos">
                ⏳ Preparando inventario...
            </div>

        </div>
    `;

    await cargarModuloInventario(nombrePanaderia);
}


// =====================================================
// CARGAR INVENTARIO.JS
// =====================================================

async function cargarModuloInventario(nombrePanaderia) {

    try {

        await establecerModuloInventario();

        await abrirInventarioPanaderia(nombrePanaderia);

    } catch (error) {

        console.error(
            "Error cargando módulo de inventario:",
            error
        );

        const lista = document.getElementById("listaProductos");

        if (lista) {
            lista.innerHTML = `
                <p style="color:red;">
                    ❌ No se pudo cargar el inventario.
                </p>
            `;
        }
    }
}


function establecerModuloInventario() {

    return new Promise((resolve, reject) => {

        if (window.moduloInventarioCargado) {
            resolve();
            return;
        }

        const script = document.createElement("script");

        script.src = "js/inventario.js";

        script.onload = function () {

            window.moduloInventarioCargado = true;

            console.log(
                "✅ inventario.js cargado correctamente"
            );

            resolve();
        };

        script.onerror = function () {

            reject(
                new Error(
                    "No se pudo cargar inventario.js"
                )
            );
        };

        document.body.appendChild(script);
    });
}


// =====================================================
// BOTONES DE INGRESOS, SALIDAS Y ALERTAS
// =====================================================

function mostrarIngresosPanaderia(nombrePanaderia) {

    document.getElementById("contenidoApp").innerHTML = `

        <div class="panel-panaderia">

            <button type="button"
                onclick="mostrarMenuPanaderia('${nombrePanaderia}')">
                ← VOLVER
            </button>

            <h2>📥 INGRESOS</h2>

            <p>
                Registrar ingreso de productos
            </p>

            <form id="formIngreso">

                <label for="productoIngreso">
                    Producto
                </label>

                <select id="productoIngreso" required>
                    <option value="">
                        Seleccione un producto
                    </option>
                </select>


                <label for="cantidadIngreso">
                    Cantidad
                </label>

                <input
                    type="number"
                    id="cantidadIngreso"
                    min="1"
                    step="1"
                    placeholder="Cantidad de sacos"
                    required
                >


                <label for="precioIngreso">
                    Precio unitario
                </label>

                <input
                    type="number"
                    id="precioIngreso"
                    min="0"
                    step="0.01"
                    placeholder="Ejemplo: 125.00"
                    required
                >


                <label for="fechaIngreso">
                    Fecha de ingreso
                </label>

                <input
                    type="date"
                    id="fechaIngreso"
                    required
                >


                <label for="fechaVencimientoIngreso">
                    Fecha de vencimiento
                </label>

                <input
                    type="date"
                    id="fechaVencimientoIngreso"
                    required
                >


                <label for="observacionIngreso">
                    Observación
                </label>

                <textarea
                    id="observacionIngreso"
                    placeholder="Observación opcional"
                    rows="3"
                ></textarea>


                <button
                    type="submit"
                >
                    📥 REGISTRAR INGRESO
                </button>

            </form>


            <p
                id="resultadoIngreso"
                class="mensaje-resultado"
            ></p>

        </div>
    `;


    // ==================================================
    // CARGAR PRODUCTOS
    // ==================================================

    cargarProductosIngreso(nombrePanaderia);


    // ==================================================
    // EVENTO DEL FORMULARIO
    // ==================================================

    const formulario =
        document.getElementById("formIngreso");

    formulario.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const resultado =
                document.getElementById(
                    "resultadoIngreso"
                );

            resultado.textContent =
                "⏳ Registrando ingreso...";


            const productoId =
                Number(
                    document.getElementById(
                        "productoIngreso"
                    ).value
                );


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


            const fechaIngreso =
                document.getElementById(
                    "fechaIngreso"
                ).value;


            const fechaVencimiento =
                document.getElementById(
                    "fechaVencimientoIngreso"
                ).value;


            const observacion =
                document.getElementById(
                    "observacionIngreso"
                ).value.trim();


            // ==========================================
            // VALIDACIONES
            // ==========================================

            if (!productoId) {

                resultado.textContent =
                    "⚠️ Seleccione un producto.";

                return;
            }


            if (cantidad <= 0) {

                resultado.textContent =
                    "⚠️ La cantidad debe ser mayor a 0.";

                return;
            }


            if (precio < 0) {

                resultado.textContent =
                    "⚠️ El precio no puede ser negativo.";

                return;
            }


            if (!fechaIngreso) {

                resultado.textContent =
                    "⚠️ Seleccione la fecha de ingreso.";

                return;
            }


            if (!fechaVencimiento) {

                resultado.textContent =
                    "⚠️ Seleccione la fecha de vencimiento.";

                return;
            }


            if (
                new Date(fechaVencimiento) <
                new Date(fechaIngreso)
            ) {

                resultado.textContent =
                    "⚠️ La fecha de vencimiento no puede ser anterior a la fecha de ingreso.";

                return;
            }


            try {

                // ======================================
                // BUSCAR ID DE LA PANADERÍA
                // ======================================

                const {
                    data: panaderia,
                    error: errorPanaderia
                } = await supabaseClient
                    .from("panaderias")
                    .select("id")
                    .eq(
                        "nombre",
                        nombrePanaderia
                    )
                    .limit(1);


                if (errorPanaderia) {
                    throw errorPanaderia;
                }


                if (
                    !panaderia ||
                    panaderia.length === 0
                ) {

                    throw new Error(
                        "No se encontró la panadería."
                    );
                }


                const panaderiaId =
                    panaderia[0].id;


                // ======================================
                // GUARDAR INGRESO
                // ======================================

                const {
                    error: errorIngreso
                } = await supabaseClient
                    .from("movimientos")
                    .insert({

                        producto_id:
                            productoId,

                        panaderia_id:
                            panaderiaId,

                        lote_id:
                            null,

                        tipo_movimiento:
                            "INGRESO",

                        cantidad:
                            cantidad,

                        fecha_movimiento:
                            `${fechaIngreso}T00:00:00`,

                        fecha_vencimiento:
                            fechaVencimiento,

                        precio_unitario:
                            precio,

                        observacion:
                            observacion || null

                    });


                if (errorIngreso) {
                    throw errorIngreso;
                }


                // ======================================
                // ÉXITO
                // ======================================

                resultado.innerHTML = `
                    ✅ <strong>
                        Ingreso registrado correctamente.
                    </strong>
                    <br>
                    Stock actualizado.
                `;


                formulario.reset();


                // ======================================
                // MOSTRAR INVENTARIO ACTUALIZADO
                // ======================================

                setTimeout(
                    async function() {

                        await mostrarInventarioPanaderia(
                            nombrePanaderia
                        );

                    },
                    1200
                );


            } catch (error) {

                console.error(
                    "Error registrando ingreso:",
                    error
                );

                resultado.innerHTML = `
                    ❌ <strong>
                        No se pudo registrar el ingreso.
                    </strong>
                    <br>
                    ${error.message}
                `;
            }

        }
    );
}


// ======================================================
// CARGAR PRODUCTOS PARA INGRESO
// ======================================================

async function cargarProductosIngreso(nombrePanaderia) {

    const selector =
        document.getElementById(
            "productoIngreso"
        );


    if (!selector) {
        return;
    }


    try {

        const {
            data: productos,
            error
        } = await supabaseClient
            .from("productos")
            .select(
                "id, codigo, nombre"
            )
            .order("codigo");


        if (error) {
            throw error;
        }


        selector.innerHTML = `
            <option value="">
                Seleccione un producto
            </option>
        `;


        productos.forEach(
            function(producto) {

                const opcion =
                    document.createElement(
                        "option"
                    );


                opcion.value =
                    producto.id;


                opcion.textContent =
                    `${producto.codigo} - ${producto.nombre}`;


                selector.appendChild(
                    opcion
                );

            }
        );


    } catch (error) {

        console.error(
            "Error cargando productos:",
            error
        );


        selector.innerHTML = `
            <option value="">
                ❌ Error cargando productos
            </option>
        `;
    }
}


function mostrarSalidasPanaderia(nombrePanaderia) {

    document.getElementById("contenidoApp").innerHTML = `

        <div class="panel-panaderia">

            <button type="button"
                onclick="mostrarMenuPanaderia('${nombrePanaderia}')">
                ← VOLVER
            </button>

            <h2>📤 SALIDAS</h2>

            <p>
                Registrar salida de productos
            </p>

            <form id="formSalida">

                <label for="productoSalida">
                    Producto
                </label>

                <select id="productoSalida" required>
                    <option value="">
                        Seleccione un producto
                    </option>
                </select>

                <label for="cantidadSalida">
                    Cantidad
                </label>

                <input
                    type="number"
                    id="cantidadSalida"
                    min="1"
                    step="1"
                    placeholder="Cantidad de sacos"
                    required
                >

                <label for="fechaSalida">
                    Fecha de salida
                </label>

                <input
                    type="date"
                    id="fechaSalida"
                    required
                >

                <label for="observacionSalida">
                    Observación
                </label>

                <textarea
                    id="observacionSalida"
                    placeholder="Observación opcional"
                    rows="3"
                ></textarea>

                <button type="submit">
                    📤 REGISTRAR SALIDA
                </button>

            </form>

            <p id="resultadoSalida" class="mensaje-resultado"></p>

        </div>
    `;

    cargarProductosSalida(nombrePanaderia);

    const formulario = document.getElementById("formSalida");

    formulario.addEventListener("submit", async function(event) {

        event.preventDefault();

        const resultado = document.getElementById("resultadoSalida");

        resultado.textContent = "⏳ Registrando salida...";

        const productoId =
            Number(document.getElementById("productoSalida").value);

        const cantidad =
            Number(document.getElementById("cantidadSalida").value);

        const fechaSalida =
            document.getElementById("fechaSalida").value;

        const observacion =
            document.getElementById("observacionSalida").value.trim();

        if (!productoId) {
            resultado.textContent = "⚠️ Seleccione un producto.";
            return;
        }

        if (cantidad <= 0) {
            resultado.textContent = "⚠️ La cantidad debe ser mayor que 0.";
            return;
        }

        if (!fechaSalida) {
            resultado.textContent = "⚠️ Seleccione la fecha de salida.";
            return;
        }

        try {

            // Buscar panadería
            const { data: panaderia, error: errorPanaderia } =
                await supabaseClient
                    .from("panaderias")
                    .select("id")
                    .eq("nombre", nombrePanaderia)
                    .limit(1);

            if (errorPanaderia) throw errorPanaderia;

            if (!panaderia || panaderia.length === 0) {
                throw new Error("No se encontró la panadería.");
            }

            const panaderiaId = panaderia[0].id;


            // Consultar movimientos del producto
            const { data: movimientos, error: errorMovimientos } =
                await supabaseClient
                    .from("movimientos")
                    .select("tipo_movimiento, cantidad")
                    .eq("producto_id", productoId)
                    .eq("panaderia_id", panaderiaId);

            if (errorMovimientos) throw errorMovimientos;


            // Calcular stock actual
            let stockActual = 0;

            (movimientos || []).forEach(function(movimiento) {

                if (movimiento.tipo_movimiento === "INGRESO") {
                    stockActual += Number(movimiento.cantidad);
                }

                if (movimiento.tipo_movimiento === "SALIDA") {
                    stockActual -= Number(movimiento.cantidad);
                }

            });


            // Validar stock suficiente
            if (cantidad > stockActual) {

                resultado.innerHTML =
                    `❌ <strong>Stock insuficiente.</strong><br>` +
                    `Stock disponible: ${stockActual} saco(s).`;

                return;
            }


            // Registrar salida
            const { error: errorSalida } =
                await supabaseClient
                    .from("movimientos")
                    .insert({

                        producto_id: productoId,

                        panaderia_id: panaderiaId,

                        lote_id: null,

                        tipo_movimiento: "SALIDA",

                        cantidad: cantidad,

                        fecha_movimiento:
                            `${fechaSalida}T00:00:00`,

                        fecha_vencimiento: null,

                        precio_unitario: 0,

                        observacion:
                            observacion || null
                    });

            if (errorSalida) throw errorSalida;


            resultado.innerHTML =
                `✅ <strong>Salida registrada correctamente.</strong><br>` +
                `Stock restante: ${stockActual - cantidad} saco(s).`;

            formulario.reset();


            // Volver al inventario
            setTimeout(async function() {

                await mostrarInventarioPanaderia(nombrePanaderia);

            }, 1200);


        } catch (error) {

            console.error(
                "Error registrando salida:",
                error
            );

            resultado.innerHTML =
                `❌ <strong>No se pudo registrar la salida.</strong><br>` +
                `${error.message}`;
        }
    });
}


async function cargarProductosSalida(nombrePanaderia) {

    const selector =
        document.getElementById("productoSalida");

    if (!selector) return;

    try {

        const { data: productos, error } =
            await supabaseClient
                .from("productos")
                .select("id, codigo, nombre")
                .order("codigo");

        if (error) throw error;

        selector.innerHTML =
            `<option value="">Seleccione un producto</option>`;

        productos.forEach(function(producto) {

            const opcion =
                document.createElement("option");

            opcion.value = producto.id;

            opcion.textContent =
                `${producto.codigo} - ${producto.nombre}`;

            selector.appendChild(opcion);
        });

    } catch (error) {

        console.error(
            "Error cargando productos:",
            error
        );

        selector.innerHTML =
            `<option value="">❌ Error cargando productos</option>`;
    }
}


function mostrarAlertasPanaderia(nombrePanaderia) {

    document.getElementById("contenidoApp").innerHTML = `

        <div class="panel-panaderia">

            <button type="button"
                onclick="mostrarMenuPanaderia('${nombrePanaderia}')">
                ← VOLVER
            </button>

            <h2>🔔 ALERTAS</h2>

            <p>
                Alertas de inventario de ${nombrePanaderia}
            </p>

            <button type="button" id="btnActualizarAlertas">
                🔄 ACTUALIZAR ALERTAS
            </button>

            <div id="listaAlertas">
                ⏳ Cargando alertas...
            </div>

        </div>
    `;

    cargarAlertasPanaderia(nombrePanaderia);

    const botonActualizar =
        document.getElementById("btnActualizarAlertas");

    if (botonActualizar) {

        botonActualizar.addEventListener("click", function() {
            cargarAlertasPanaderia(nombrePanaderia);
        });

    }
}


async function cargarAlertasPanaderia(nombrePanaderia) {

    const contenedor =
        document.getElementById("listaAlertas");

    if (!contenedor) return;

    contenedor.innerHTML =
        "⏳ Analizando inventario...";

    try {

        // Buscar la panadería
        const { data: panaderias, error: errorPanaderia } =
            await supabaseClient
                .from("panaderias")
                .select("id")
                .eq("nombre", nombrePanaderia)
                .limit(1);

        if (errorPanaderia) {
            throw errorPanaderia;
        }

        if (!panaderias || panaderias.length === 0) {
            throw new Error(
                "No se encontró la panadería."
            );
        }

        const panaderiaId =
            panaderias[0].id;


        // Obtener productos
        const { data: productos, error: errorProductos } =
            await supabaseClient
                .from("productos")
                .select(
                    "id, codigo, nombre, unidad, stock_minimo_porcentaje"
                )
                .order("codigo");

        if (errorProductos) {
            throw errorProductos;
        }


        // Obtener movimientos de esta panadería
        const { data: movimientos, error: errorMovimientos } =
            await supabaseClient
                .from("movimientos")
                .select(
                    "producto_id, tipo_movimiento, cantidad, fecha_movimiento, fecha_vencimiento, precio_unitario"
                )
                .eq("panaderia_id", panaderiaId)
                .order("fecha_movimiento", {
                    ascending: false
                });

        if (errorMovimientos) {
            throw errorMovimientos;
        }


        const alertas = [];

        productos.forEach(function(producto) {

            const movimientosProducto =
                (movimientos || []).filter(function(movimiento) {

                    return Number(movimiento.producto_id) ===
                        Number(producto.id);

                });


            // Calcular stock
            let stock = 0;

            movimientosProducto.forEach(function(movimiento) {

                if (movimiento.tipo_movimiento === "INGRESO") {
                    stock += Number(movimiento.cantidad);
                }

                if (movimiento.tipo_movimiento === "SALIDA") {
                    stock -= Number(movimiento.cantidad);
                }

            });


            // Buscar último ingreso
            const ultimoIngreso =
                movimientosProducto.find(function(movimiento) {

                    return movimiento.tipo_movimiento === "INGRESO";

                });


            // ALERTA SIN STOCK
            if (stock <= 0) {

                alertas.push({
                    tipo: "SIN_STOCK",
                    icono: "🔴",
                    titulo: "Sin stock",
                    producto: producto,
                    stock: stock,
                    mensaje:
                        "El producto no tiene stock disponible."
                });

                return;
            }


            // ALERTA DE VENCIMIENTO
            if (ultimoIngreso &&
                ultimoIngreso.fecha_vencimiento) {

                const hoy = new Date();

                hoy.setHours(0, 0, 0, 0);

                const fechaVencimiento =
                    new Date(
                        ultimoIngreso.fecha_vencimiento +
                        "T00:00:00"
                    );

                const diferencia =
                    fechaVencimiento - hoy;

                const diasRestantes =
                    Math.ceil(
                        diferencia /
                        (1000 * 60 * 60 * 24)
                    );


                if (diasRestantes < 0) {

                    alertas.push({
                        tipo: "VENCIDO",
                        icono: "❌",
                        titulo: "Producto vencido",
                        producto: producto,
                        stock: stock,
                        mensaje:
                            "El producto está vencido."
                    });

                    return;
                }


                if (diasRestantes <= 30) {

                    alertas.push({
                        tipo: "POR_VENCER",
                        icono: "⚠️",
                        titulo: "Próximo a vencer",
                        producto: producto,
                        stock: stock,
                        mensaje:
                            `Vence en ${diasRestantes} día(s).`
                    });

                    return;
                }
            }


            // ALERTA STOCK BAJO
            if (
                producto.stock_minimo_porcentaje !== null &&
                producto.stock_minimo_porcentaje !== undefined &&
                stock <= Number(
                    producto.stock_minimo_porcentaje
                )
            ) {

                alertas.push({
                    tipo: "STOCK_BAJO",
                    icono: "⚠️",
                    titulo: "Stock bajo",
                    producto: producto,
                    stock: stock,
                    mensaje:
                        "El stock se encuentra por debajo del nivel establecido."
                });

            }

        });


        // Mostrar resultado
        if (alertas.length === 0) {

            contenedor.innerHTML = `
                <div class="alerta-normal">
                    🟢 <strong>Todo está en orden.</strong>
                    <p>
                        No se encontraron alertas
                        en el inventario.
                    </p>
                </div>
            `;

            return;
        }


        let html = `
            <div class="resumen-alertas">
                🔔 <strong>
                    ${alertas.length}
                    alerta(s) encontrada(s)
                </strong>
            </div>
        `;


        alertas.forEach(function(alerta) {

            html += `

                <div class="tarjeta-alerta">

                    <h3>
                        ${alerta.icono}
                        ${alerta.titulo}
                    </h3>

                    <p>
                        <strong>
                            ${alerta.producto.codigo}
                        </strong>
                    </p>

                    <p>
                        ${alerta.producto.nombre}
                    </p>

                    <p>
                        📦 Stock actual:
                        <strong>
                            ${alerta.stock}
                            ${alerta.producto.unidad || "SACO"}
                        </strong>
                    </p>

                    <p>
                        ${alerta.mensaje}
                    </p>

                </div>

            `;

        });


        contenedor.innerHTML = html;

    } catch (error) {

        console.error(
            "Error cargando alertas:",
            error
        );

        contenedor.innerHTML = `
            <div class="alerta-error">
                ❌ <strong>
                    No se pudieron cargar las alertas.
                </strong>

                <p>
                    ${error.message}
                </p>
            </div>
        `;
    }
}


// =====================================================
// STOCK PARA ALICORP
// =====================================================

async function verStock(nombrePanaderia) {

    try {

        document.getElementById("contenidoApp").innerHTML = `

            <div class="panel-admin">

                <button type="button"
                    onclick="mostrarMenuAdmin()">
                    ← VOLVER
                </button>

                <h2>📦 STOCK</h2>

                <h3>🥖 ${nombrePanaderia}</h3>

                <button type="button"
                    id="btnActualizarStockAdmin">
                    🔄 ACTUALIZAR STOCK
                </button>

                <div id="listaStock">
                    ⏳ Cargando stock...
                </div>

            </div>
        `;


        const cargarStock = async function() {

            const listaStock =
                document.getElementById("listaStock");

            listaStock.innerHTML =
                "⏳ Cargando stock...";


            // Buscar panadería
            const { data: panaderia, error: errorPanaderia } =
                await supabaseClient
                    .from("panaderias")
                    .select("id")
                    .eq("nombre", nombrePanaderia)
                    .limit(1);

            if (errorPanaderia) {
                throw errorPanaderia;
            }

            if (!panaderia || panaderia.length === 0) {
                throw new Error(
                    "No se encontró la panadería."
                );
            }

            const panaderiaId =
                panaderia[0].id;


            // Obtener productos
            const { data: productos, error: errorProductos } =
                await supabaseClient
                    .from("productos")
                    .select(
                        "id, codigo, nombre, unidad"
                    )
                    .order("codigo");

            if (errorProductos) {
                throw errorProductos;
            }


            // Obtener movimientos
            const { data: movimientos, error: errorMovimientos } =
                await supabaseClient
                    .from("movimientos")
                    .select(
                        "producto_id, tipo_movimiento, cantidad, precio_unitario, fecha_movimiento, fecha_vencimiento"
                    )
                    .eq("panaderia_id", panaderiaId)
                    .order(
                        "fecha_movimiento",
                        {
                            ascending: false
                        }
                    );

            if (errorMovimientos) {
                throw errorMovimientos;
            }


            let html = "";


            productos.forEach(function(producto) {

                let stock = 0;

                const movimientosProducto =
                    (movimientos || []).filter(
                        function(movimiento) {

                            return Number(
                                movimiento.producto_id
                            ) === Number(producto.id);

                        }
                    );


                // Calcular stock
                movimientosProducto.forEach(
                    function(movimiento) {

                        if (
                            movimiento.tipo_movimiento ===
                            "INGRESO"
                        ) {

                            stock += Number(
                                movimiento.cantidad
                            );
                        }

                        if (
                            movimiento.tipo_movimiento ===
                            "SALIDA"
                        ) {

                            stock -= Number(
                                movimiento.cantidad
                            );
                        }

                    }
                );


                // Último ingreso
                const ultimoIngreso =
                    movimientosProducto.find(
                        function(movimiento) {

                            return movimiento.tipo_movimiento ===
                                "INGRESO";

                        }
                    );


                let precio = "-";
                let fechaIngreso = "-";
                let fechaVencimiento = "-";


                if (ultimoIngreso) {

                    if (
                        ultimoIngreso.precio_unitario !== null &&
                        ultimoIngreso.precio_unitario !== undefined
                    ) {

                        precio =
                            Number(
                                ultimoIngreso.precio_unitario
                            ).toFixed(2);
                    }


                    if (
                        ultimoIngreso.fecha_movimiento
                    ) {

                        fechaIngreso =
                            formatearFechaAdmin(
                                ultimoIngreso.fecha_movimiento
                            );
                    }


                    if (
                        ultimoIngreso.fecha_vencimiento
                    ) {

                        fechaVencimiento =
                            formatearFechaAdmin(
                                ultimoIngreso.fecha_vencimiento
                            );
                    }

                }


                // Estado
                let estado = "";

                if (stock <= 0) {

                    estado =
                        "🔴 Sin stock";

                } else if (
                    ultimoIngreso &&
                    ultimoIngreso.fecha_vencimiento
                ) {

                    const hoy = new Date();

                    hoy.setHours(0, 0, 0, 0);

                    const vencimiento =
                        new Date(
                            ultimoIngreso.fecha_vencimiento +
                            "T00:00:00"
                        );

                    const diferencia =
                        vencimiento - hoy;

                    const dias =
                        Math.ceil(
                            diferencia /
                            (1000 * 60 * 60 * 24)
                        );


                    if (dias < 0) {

                        estado =
                            "❌ Vencido";

                    } else if (dias <= 30) {

                        estado =
                            "⚠️ Por vencer";

                    } else {

                        estado =
                            "🟢 Normal";
                    }

                } else {

                    estado =
                        "🟢 Normal";
                }


                html += `

                    <div class="producto-stock">

                        <h3>
                            📦 ${producto.nombre}
                        </h3>

                        <p>
                            <strong>Código:</strong>
                            ${producto.codigo}
                        </p>

                        <p>
                            <strong>Stock actual:</strong>
                            ${stock}
                            ${producto.unidad || "SACO"}
                        </p>

                        <p>
                            <strong>Precio:</strong>
                            ${precio}
                        </p>

                        <p>
                            <strong>Fecha de ingreso:</strong>
                            ${fechaIngreso}
                        </p>

                        <p>
                            <strong>Fecha de vencimiento:</strong>
                            ${fechaVencimiento}
                        </p>

                        <p>
                            <strong>Estado:</strong>
                            ${estado}
                        </p>

                    </div>

                `;

            });


            listaStock.innerHTML =
                html ||
                "<p>No hay productos registrados.</p>";
        };


        await cargarStock();


        const botonActualizar =
            document.getElementById(
                "btnActualizarStockAdmin"
            );


        if (botonActualizar) {

            botonActualizar.addEventListener(
                "click",
                async function() {

                    try {

                        await cargarStock();

                    } catch (error) {

                        console.error(
                            "Error actualizando stock:",
                            error
                        );

                        document.getElementById(
                            "listaStock"
                        ).innerHTML = `
                            <p style="color:red;">
                                ❌ No se pudo actualizar el stock.
                            </p>
                        `;
                    }

                }
            );

        }


    } catch (error) {

        console.error(
            "Error mostrando stock:",
            error
        );

        const lista =
            document.getElementById("listaStock");

        if (lista) {

            lista.innerHTML = `
                <p style="color:red;">
                    ❌ No se pudo cargar el stock.
                </p>
            `;

        }

    }
}


/* Formatear fechas para la vista de Alicorp */

function formatearFechaAdmin(fecha) {

    if (!fecha) {
        return "-";
    }

    const fechaObj =
        new Date(fecha + "T00:00:00");

    if (isNaN(fechaObj.getTime())) {
        return "-";
    }

    return fechaObj.toLocaleDateString(
        "es-PE",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


// =====================================================
// CERRAR SESIÓN
// =====================================================

async function cerrarSesion() {

    try {

        await supabaseClient.auth.signOut();

    } catch (error) {

        console.error(
            "Error cerrando sesión:",
            error
        );
    }

    localStorage.removeItem("tipoUsuario");
    localStorage.removeItem("usuarioActual");
    localStorage.removeItem("panaderiaActual");

    location.reload();
}