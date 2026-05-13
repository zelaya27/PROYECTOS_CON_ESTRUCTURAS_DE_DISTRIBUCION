// EXPLICACIÓN: Esta es la "dirección postal" hacia tu Google Sheet. Es por donde enviamos al mensajero a traer los datos.
const URL_API = "https://script.google.com/macros/s/AKfycbyPOrzRMPjppI77GDw92aVWzMP382eVNrv3XJ9yqRBAWYEwVxjwoUpzh_SnHWccMIxiIg/exec";

// EXPLICACIÓN: Esta es la lista de los usuarios y contraseñas permitidos. 
const USUARIOS = {
    "admin": "admin123",
    "juticalpa": "enee2026",
    "la ceiba": "enee2026",
    "san pedro sula": "enee2026",
    "tegucigalpa": "enee2026",
    "danli": "enee2026",
    "choluteca": "enee2026"
};

// EXPLICACIÓN: Creamos unas "cajas vacías" en la memoria de la app.
// BASE_DE_DATOS guardará toda la información que baje de Google Drive.
// proyecto guardará las estructuras que el usuario vaya agregando como en un carrito de compras.
let BASE_DE_DATOS = {};
let proyecto = [];

// -------------------------------------------------------------------------
// FUNCIÓN 1: validarLogin (El Portero)
// ¿Qué hace?: Compara la contraseña escrita con la lista de contraseñas.
// Si es correcta, esconde la pantalla de inicio y muestra la calculadora.
// -------------------------------------------------------------------------
function validarLogin() {
    const u = document.getElementById('user').value.toLowerCase(); // Lee el usuario
    const p = document.getElementById('pass').value; // Lee la contraseña

    if (USUARIOS[u] && USUARIOS[u] === p) { // Si coinciden...
        document.getElementById('login-container').style.display = 'none'; // Esconde el Login
        document.getElementById('app-container').style.display = 'block';  // Muestra la App
        document.getElementById('user-display').innerText = "Sector: " + u.toUpperCase();
        
        cargarDatos(); // Manda al mensajero a Google Drive
    } else {
        document.getElementById('login-error').style.display = 'block'; // Muestra error rojo
    }
}

// -------------------------------------------------------------------------
// FUNCIÓN 2: cargarDatos (El Mensajero)
// ¿Qué hace?: Viaja por internet hasta tu Google Sheet, copia toda la tabla 
// de materiales, vuelve, y rellena la lista desplegable de estructuras.
// -------------------------------------------------------------------------
async function cargarDatos() {
    try {
        const respuesta = await fetch(URL_API); // Va a la URL de Google Drive
        BASE_DE_DATOS = await respuesta.json(); // Guarda la respuesta en la caja vacía
        
        const select = document.getElementById('select-estructura');
        select.innerHTML = '<option value="">Seleccionar estructura...</option>'; // Limpia el mensaje de "Cargando..."
        
        // Toma cada nombre de estructura que vino de Google y crea una "opción" en el menú desplegable
        Object.keys(BASE_DE_DATOS).forEach(nombre => {
            let opt = document.createElement('option');
            opt.value = nombre; opt.text = nombre;
            select.appendChild(opt);
        });
    } catch (error) { // Si se cae el internet o falla algo...
        console.error(error);
        alert("Error al sincronizar con Google Drive");
    }
}

// -------------------------------------------------------------------------
// FUNCIÓN 3: agregarEstructura (El Cajero del Supermercado)
// ¿Qué hace?: Cuando tocas "AÑADIR A LA LISTA", toma el nombre de la 
// estructura y la cantidad, y los anota en el "carrito de compras" (proyecto).
// -------------------------------------------------------------------------
function agregarEstructura() {
    const sel = document.getElementById('select-estructura');
    const estructura = sel.value; // Lee qué estructura se escogió
    const cantidad = parseInt(document.getElementById('input-cantidad').value); // Lee cuántas ocupa

    if (!estructura || cantidad <= 0) return; // Si no escogió nada, no hace nada

    // Revisa si ya habíamos agregado esa estructura antes
    let item = proyecto.find(p => p.nombre === estructura);
    
    if (item) {
        item.cantidad += cantidad; // Si ya estaba, solo le suma la nueva cantidad
    } else {
        proyecto.push({ nombre: estructura, cantidad: cantidad }); // Si es nueva, la anota completa
    }

    actualizarUI(); // Llama al contador para que recalcule los totales de la tabla
}

// -------------------------------------------------------------------------
// FUNCIÓN 4: actualizarUI (La Calculadora y Dibujante)
// ¿Qué hace?: Toma todo lo que hay en el "carrito", busca cuántos materiales
// tiene cada cosa según Google Drive, multiplica por la cantidad, y dibuja
// la tabla final en la pantalla. (UI significa Interfaz de Usuario).
// -------------------------------------------------------------------------
function actualizarUI() {
    const ul = document.getElementById('lista-estructuras');
    ul.innerHTML = ""; // Borra la lista visual anterior para dibujarla fresca
    let consolidados = {}; // Una caja nueva temporal para ir sumando tornillos con tornillos, etc.

    // Paso A: Por cada estructura que hayamos agregado al carrito...
    proyecto.forEach((p, idx) => {
        // ...dibuja un texto en la pantalla con el nombre y un botón de "X" roja para borrarla si nos equivocamos
        ul.innerHTML += `<li><span><b>${p.cantidad}x</b> ${p.nombre}</span><button onclick="proyecto.splice(${idx},1);actualizarUI();" style="color:red; background:none; border:none; cursor:pointer;">X</button></li>`;
        
        // ...busca en la base de datos de Google qué materiales ocupa ESA estructura en específico
        BASE_DE_DATOS[p.nombre].forEach(mat => {
            if (!consolidados[mat.codigo]) {
                // Si es la primera vez que ve este material, lo anota empezando en cero
                consolidados[mat.codigo] = { ...mat, cantTotal: 0 };
            }
            // Multiplica (Material por Estructura * Cantidad de Estructuras) y lo suma al total global
            consolidados[mat.codigo].cantTotal += (mat.cantidad * p.cantidad);
        });
    });

    // Paso B: Toma todos esos totales que sumamos, y los dibuja bonito en la tabla de abajo
    const tbody = document.getElementById('tabla-body-materiales');
    tbody.innerHTML = ""; // Borra la tabla vieja
    
    Object.values(consolidados).forEach(m => {
        // Dibuja fila por fila: Cantidad | Unidad | Código | Nombre
        tbody.innerHTML += `<tr><td>${m.cantTotal}</td><td>${m.unidad}</td><td>${m.codigo}</td><td>${m.nombre}</td></tr>`;
    });
}

// -------------------------------------------------------------------------
// FUNCIÓN 5: limpiarProyecto (El Borrador)
// ¿Qué hace?: Si te equivocaste mucho o cambiaste de obra, te pregunta si 
// estás seguro, y si dices "Sí", vacía el carrito de compras y limpia la pantalla.
// -------------------------------------------------------------------------
function limpiarProyecto() {
    if(confirm("¿Limpiar cálculo actual?")) {
        proyecto = []; // Vacía la lista de estructuras agregadas
        actualizarUI(); // Manda a borrar la tabla para que quede en blanco
    }
}
