var sectorActivo = "";

// CREDENCIALES
const USUARIOS = {
    "admin": "admin123",
    "juticalpa": "enee2026",
    "la ceiba": "enee2026",
    "san pedro sula": "enee2026",
    "tegucigalpa": "enee2026"
};

// Esta variable ahora se llenará sola desde el Drive
let BASE_DE_DATOS_ESTRUCTURAS = {};
let proyectoActual = [];

function validarLogin() {
    const u = document.getElementById('user').value.toLowerCase();
    const p = document.getElementById('pass').value;

    if (USUARIOS[u] && USUARIOS[u] === p) {
        sectorActivo = u.toUpperCase();
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block'; 
        document.getElementById('user-display').innerText = "Sector: " + sectorActivo;
        
        // Mientras carga, mostrar este mensaje
        document.getElementById('select-estructura').innerHTML = '<option>Sincronizando con Drive...</option>';
        cargarDatosDesdeDrive();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

// === CONEXIÓN CON GOOGLE SHEETS ===
async function cargarDatosDesdeDrive() {
    // AQUÍ ESTÁ TU URL INSERTADA
    const URL_API = "https://script.google.com/macros/s/AKfycbyPOrzRMPjppI77GDw92aVWzMP382eVNrv3XJ9yqRBAWYEwVxjwoUpzh_SnHWccMIxiIg/exec"; 
    
    try {
        const respuesta = await fetch(URL_API);
        BASE_DE_DATOS_ESTRUCTURAS = await respuesta.json();
        cargarOpcionesEstructuras();
    } catch (error) {
        console.error("Error al sincronizar:", error);
        document.getElementById('select-estructura').innerHTML = '<option>Error de conexión. Recargue.</option>';
    }
}

function cargarOpcionesEstructuras() {
    const select = document.getElementById('select-estructura');
    select.innerHTML = '<option value="">Seleccionar estructura...</option>'; // Limpiar
    
    for (const nombreEstructura in BASE_DE_DATOS_ESTRUCTURAS) {
        let option = document.createElement('option');
        option.value = nombreEstructura;
        option.text = nombreEstructura;
        select.appendChild(option);
    }
}

function agregarEstructura() {
    const select = document.getElementById('select-estructura');
    const estructura = select.value;
    const cantidad = parseInt(document.getElementById('input-cantidad').value);

    if (estructura === "" || isNaN(cantidad) || cantidad <= 0) {
        alert("Por favor seleccione una estructura y una cantidad válida.");
        return;
    }

    let itemExistente = proyectoActual.find(item => item.nombre === estructura);
    if (itemExistente) {
        itemExistente.cantidad += cantidad;
    } else {
        proyectoActual.push({ nombre: estructura, cantidad: cantidad });
    }

    document.getElementById('input-cantidad').value = 1;
    select.value = "";
    actualizarInterfaz();
}

function eliminarEstructura(index) {
    proyectoActual.splice(index, 1);
    actualizarInterfaz();
}

function actualizarInterfaz() {
    renderizarListaEstructuras();
    renderizarTablaMateriales();
}

function renderizarListaEstructuras() {
    const ul = document.getElementById('lista-estructuras');
    ul.innerHTML = ""; 

    proyectoActual.forEach((item, index) => {
        let li = document.createElement('li');
        li.innerHTML = `
            <span><b>${item.cantidad}x</b> ${item.nombre}</span>
            <button class="btn-eliminar" onclick="eliminarEstructura(${index})"><i class="fas fa-trash-alt"></i></button>
        `;
        ul.appendChild(li);
    });
}

// === CÁLCULO Y GENERACIÓN DE LA TABLA COMO EN LA IMAGEN ===
function renderizarTablaMateriales() {
    const tbody = document.getElementById('tabla-body-materiales');
    tbody.innerHTML = ""; 

    if (proyectoActual.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: #9aa7b1;">Aún no hay estructuras agregadas</td></tr>`;
        return;
    }

    let materialesTotales = {};

    // Sumar todos los materiales de las estructuras escogidas
    proyectoActual.forEach(item => {
        const nombreEstructura = item.nombre;
        const cantidadEstructura = item.cantidad;
        const materialesQueOcupa = BASE_DE_DATOS_ESTRUCTURAS[nombreEstructura];

        if(materialesQueOcupa) {
            materialesQueOcupa.forEach(mat => {
                const cod = mat.codigo;
                if (!materialesTotales[cod]) {
                    materialesTotales[cod] = {
                        codigo: mat.codigo,
                        nombre: mat.nombre,
                        unidad: mat.unidad,
                        cantidadTotal: 0
                    };
                }
                materialesTotales[cod].cantidadTotal += (mat.cantidad * cantidadEstructura);
            });
        }
    });

    // Dibujar las filas ordenadas: CANTIDAD | UNIDAD | CODIGO | DESCRIPCION
    for (const cod in materialesTotales) {
        const mat = materialesTotales[cod];
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align: center; font-weight: bold;">${mat.cantidadTotal}</td>
            <td style="text-align: center;">${mat.unidad}</td>
            <td style="text-align: center;">${mat.codigo}</td>
            <td>${mat.nombre}</td>
        `;
        tbody.appendChild(tr);
    }
}

function limpiarProyecto() {
    if(confirm("¿Deseas empezar un cálculo nuevo?")) {
        proyectoActual = [];
        actualizarInterfaz();
    }
}
