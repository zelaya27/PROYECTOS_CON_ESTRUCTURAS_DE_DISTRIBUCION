var sectorActivo = "";

// CREDENCIALES
const USUARIOS = {
    "admin": "admin123",
    "juticalpa": "enee2026",
    "la ceiba": "enee2026",
    "san pedro sula": "enee2026",
    "tegucigalpa": "enee2026"
};

/* ====================================================================
   AQUÍ CARGAS TUS DATOS DEL EXCEL
   Formato: "Nombre Estructura": { "Material A": cant, "Material B": cant }
==================================================================== */
const BASE_DE_DATOS_ESTRUCTURAS = {
    "ESTRUCTURA 1F (Trifásica)": {
        "Poste Concreto 35 pies": 1,
        "Aislador Tipo Espiga": 3,
        "Cruceta de Madera 8 pies": 1,
        "Perno Maquinita 5/8": 2
    },
    "ESTRUCTURA DE RETENIDA": {
        "Varilla de Anclaje 5/8": 1,
        "Cable de Acero 3/8 (Metros)": 15,
        "Aislador Tipo Carrete": 1,
        "Abrazadera U": 2
    },
    "TRANSFORMADOR MONOFÁSICO": {
        "Transformador 25 kVA": 1,
        "Pararrayos 10kV": 1,
        "Cortacircuito": 1,
        "Cable Cobre #4 (Metros)": 10
    }
};

// Variable para guardar lo que el usuario va agregando
let proyectoActual = [];

function validarLogin() {
    const u = document.getElementById('user').value.toLowerCase();
    const p = document.getElementById('pass').value;

    if (USUARIOS[u] && USUARIOS[u] === p) {
        sectorActivo = u.toUpperCase();
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block'; 
        document.getElementById('user-display').innerText = "Sector: " + sectorActivo;
        
        cargarOpcionesEstructuras();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

// Llena el <select> con las llaves de la BASE_DE_DATOS_ESTRUCTURAS
function cargarOpcionesEstructuras() {
    const select = document.getElementById('select-estructura');
    for (const nombreEstructura in BASE_DE_DATOS_ESTRUCTURAS) {
        let option = document.createElement('option');
        option.value = nombreEstructura;
        option.text = nombreEstructura;
        select.appendChild(option);
    }
}

// Función que se ejecuta al darle "Añadir a la lista"
function agregarEstructura() {
    const select = document.getElementById('select-estructura');
    const estructura = select.value;
    const cantidad = parseInt(document.getElementById('input-cantidad').value);

    if (estructura === "" || isNaN(cantidad) || cantidad <= 0) {
        alert("Por favor seleccione una estructura y una cantidad válida.");
        return;
    }

    // Buscar si la estructura ya está en la lista para sumar la cantidad
    let itemExistente = proyectoActual.find(item => item.nombre === estructura);
    if (itemExistente) {
        itemExistente.cantidad += cantidad;
    } else {
        proyectoActual.push({ nombre: estructura, cantidad: cantidad });
    }

    // Resetear el input a 1
    document.getElementById('input-cantidad').value = 1;
    select.value = "";

    actualizarInterfaz();
}

// Quitar un item de la lista
function eliminarEstructura(index) {
    proyectoActual.splice(index, 1);
    actualizarInterfaz();
}

// Función maestra que actualiza la pantalla
function actualizarInterfaz() {
    renderizarListaEstructuras();
    renderizarTablaMateriales();
}

function renderizarListaEstructuras() {
    const ul = document.getElementById('lista-estructuras');
    ul.innerHTML = ""; // Limpiar lista

    proyectoActual.forEach((item, index) => {
        let li = document.createElement('li');
        li.innerHTML = `
            <span><b>${item.cantidad}x</b> ${item.nombre}</span>
            <button class="btn-eliminar" onclick="eliminarEstructura(${index})"><i class="fas fa-trash-alt"></i></button>
        `;
        ul.appendChild(li);
    });
}

function renderizarTablaMateriales() {
    const tbody = document.getElementById('tabla-body-materiales');
    tbody.innerHTML = ""; // Limpiar tabla

    if (proyectoActual.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; color: #9aa7b1;">Aún no hay estructuras agregadas</td></tr>`;
        return;
    }

    // 1. Calcular consolidados de materiales
    let materialesTotales = {};

    proyectoActual.forEach(item => {
        const nombreEstructura = item.nombre;
        const cantidadEstructura = item.cantidad;
        const materialesQueOcupa = BASE_DE_DATOS_ESTRUCTURAS[nombreEstructura];

        for (const [material, cantPorEstructura] of Object.entries(materialesQueOcupa)) {
            if (!materialesTotales[material]) {
                materialesTotales[material] = 0;
            }
            // Sumar: (cantidad de material por estructura) * (cantidad de estructuras)
            materialesTotales[material] += (cantPorEstructura * cantidadEstructura);
        }
    });

    // 2. Dibujar la tabla
    for (const [material, total] of Object.entries(materialesTotales)) {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${material}</td>
            <td style="text-align: center; font-weight: bold;">${total}</td>
        `;
        tbody.appendChild(tr);
    }
}

// Resetear todo para un nuevo proyecto
function limpiarProyecto() {
    if(confirm("¿Estás seguro de que deseas limpiar el proyecto actual?")) {
        proyectoActual = [];
        actualizarInterfaz();
    }
}
