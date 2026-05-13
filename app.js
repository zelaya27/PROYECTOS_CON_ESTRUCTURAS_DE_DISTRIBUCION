const USUARIOS = {
    "ADMIN": { pass: "admin123", sector: "TEGUCIGALPA" },
    "ALLAN.MUÑOZ": { pass: "12345", sector: "TOCOA" },
    "ALLAN.ZELAYA": { pass: "12345", sector: "JUTICALPA" },
    "ALSIDES.PONCE": { pass: "12345", sector: "TOCOA" },
    "AXEL.IRIAS": { pass: "12345", sector: "TOCOA" },
    "CARLOS ROMERO": { pass: "12345", sector: "SANTA ROSA DE COPAN" },
    "CARLOS.RIVERA": { pass: "12345", sector: "LA CEIBA" },
    "JONATHAN ORTIZ": { pass: "12345", sector: "TEGUCIGALPA" },
    "JOSE PINTO": { pass: "12345", sector: "TEGUCIGALPA" },
    "JOSUE.ORTIZ": { pass: "12345", sector: "JUTICALPA" },
    "JUAN MIRANDA": { pass: "12345", sector: "SANTA ROSA DE COPAN" },
    "RENE ALEGRIA": { pass: "12345", sector: "TEGUCIGALPA" },
    "WILSON.ZAVALA": { pass: "12345", sector: "LA CEIBA" }
};

const URL_MATERIALES = "https://script.google.com/macros/s/AKfycbyWyp1BupM-yySWEi7uEbE5jbslKh9JCjR0BuQjCLD14PnP3E01O9alYDirJPB-7U5zgA/exec";

let BASE_DE_DATOS = {}; 
let DATOS_POR_TIPO = {}; 
let proyecto = []; 
let sectorActivo = "";
let nombreUsuario = "";

// Cargar lista al iniciar
window.onload = function() {
    const selectUser = document.getElementById('user');
    Object.keys(USUARIOS).forEach(nombre => {
        selectUser.innerHTML += `<option value="${nombre}">${nombre}</option>`;
    });
};

// Función de Login
function validarLogin() {
    const u = document.getElementById('user').value; 
    const p = document.getElementById('pass').value.trim();

    if (u === "") {
        alert("Por favor, seleccione un usuario de la lista.");
        return;
    }
    if (p === "") {
        alert("Por favor, ingrese su contraseña.");
        return;
    }

    if (USUARIOS[u] && USUARIOS[u].pass === p) {
        nombreUsuario = u;
        sectorActivo = USUARIOS[u].sector;
        
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        document.getElementById('user-display').innerText = `BIENVENIDO: ${nombreUsuario} | SECTOR: ${sectorActivo}`;
        
        cargarDatosMateriales();
    } else {
        alert("❌ Contraseña incorrecta para el usuario " + u);
    }
}

// Descargar Materiales
async function cargarDatosMateriales() {
    try {
        const res = await fetch(URL_MATERIALES);
        BASE_DE_DATOS = await res.json();
        DATOS_POR_TIPO = {}; 

        Object.keys(BASE_DE_DATOS).forEach(nombre => {
            const material = BASE_DE_DATOS[nombre][0];
            const tipo = material.tipo || nombre.charAt(0).toUpperCase();
            if (!DATOS_POR_TIPO[tipo]) DATOS_POR_TIPO[tipo] = [];
            DATOS_POR_TIPO[tipo].push(nombre);
        });

        const selectTipo = document.getElementById('select-tipo');
        selectTipo.innerHTML = '<option value="">Tipo...</option>';
        Object.keys(DATOS_POR_TIPO).sort().forEach(t => {
            selectTipo.innerHTML += `<option value="${t}">${t}</option>`;
        });
    } catch (error) {
        alert("Error al conectar con la base de Google Sheets.");
    }
}

// Filtrar Estructuras
function filtrarEstructuras() {
    const tipo = document.getElementById('select-tipo').value;
    const selectEst = document.getElementById('select-estructura');
    selectEst.innerHTML = '<option value="">Estructura...</option>';
    
    if (tipo && DATOS_POR_TIPO[tipo]) {
        DATOS_POR_TIPO[tipo].sort().forEach(nombre => {
            selectEst.innerHTML += `<option value="${nombre}">${nombre}</option>`;
        });
    }
}

// Agregar al Proyecto
function agregarEstructura() {
    const nombre = document.getElementById('select-estructura').value;
    const cant = parseInt(document.getElementById('input-cantidad').value);
    
    if (!nombre || cant <= 0) {
        alert("Seleccione una estructura válida y cantidad mayor a 0.");
        return;
    }

    let itemExistente = proyecto.find(p => p.nombre === nombre);
    if (itemExistente) itemExistente.cantidad += cant;
    else proyecto.push({ nombre: nombre, cantidad: cant });
    
    actualizarVista();
}

// Dibuja Tabla y Lista
function actualizarVista() {
    const ulLista = document.getElementById('lista-estructuras');
    const tbodyTabla = document.getElementById('tabla-body');
    ulLista.innerHTML = ""; tbodyTabla.innerHTML = "";
    let materialesTotales = {}; 

    proyecto.forEach((item, index) => {
        ulLista.innerHTML += `<li><span><b>${item.cantidad}x</b> ${item.nombre}</span><i class="fas fa-trash-alt" title="Eliminar" onclick="eliminarItem(${index})"></i></li>`;
        BASE_DE_DATOS[item.nombre].forEach(mat => {
            if (!materialesTotales[mat.codigo]) materialesTotales[mat.codigo] = { ...mat, total: 0 };
            materialesTotales[mat.codigo].total += (mat.cantidad * item.cantidad);
        });
    });

    Object.values(materialesTotales).forEach(m => {
        tbodyTabla.innerHTML += `<tr><td>${m.total}</td><td>${m.unidad}</td><td>${m.codigo}</td><td>${m.nombre}</td></tr>`;
    });

    if (proyecto.length === 0) tbodyTabla.innerHTML = '<tr><td colspan="4">No hay datos agregados</td></tr>';
}

function eliminarItem(index) {
    proyecto.splice(index, 1);
    actualizarVista(); 
}

function cerrarSesion() { location.reload(); }

function imprimirPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("CONSOLIDADO DE MATERIALES - ENEE", 10, 10);
    doc.text(`USUARIO: ${nombreUsuario} | SECTOR: ${sectorActivo}`, 10, 20);
    doc.save(`Materiales_${sectorActivo}.pdf`);
}
