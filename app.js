// BASE DE DATOS DE USUARIOS (Extraída de tu archivo)
const USUARIOS = {
    "JOSUE.ORTIZ": { pass: "12345", sector: "JUTICALPA" },
    "CARLOS ROMERO": { pass: "12345", sector: "SANTA ROSA DE COPAN" },
    "JONATHAN ORTIZ": { pass: "12345", sector: "TEGUCIGALPA" },
    "RENE ALEGRIA": { pass: "12345", sector: "TEGUCIGALPA" },
    "JOSE PINTO": { pass: "12345", sector: "TEGUCIGALPA" },
    "JUAN MIRANDA": { pass: "12345", sector: "SANTA ROSA DE COPAN" },
    "ALLAN.ZELAYA": { pass: "12345", sector: "JUTICALPA" },
    "ALLAN.MUÑOZ": { pass: "12345", sector: "TOCOA" },
    "ALSIDES.PONCE": { pass: "12345", sector: "TOCOA" },
    "AXEL.IRIAS": { pass: "12345", sector: "TOCOA" },
    "ADMIN": { pass: "admin123", sector: "SISTEMAS" }
};

const URL_MATERIALES = "https://script.google.com/macros/s/AKfycbyWyp1BupM-yySWEi7uEbE5jbslKh9JCjR0BuQjCLD14PnP3E01O9alYDirJPB-7U5zgA/exec";

// Variables en memoria
let BASE_DE_DATOS = {}; 
let DATOS_POR_TIPO = {}; 
let proyecto = []; 
let sectorActivo = "";
let nombreUsuario = "";

// 1. AUTO-LLENAR LISTA DE USUARIOS
document.addEventListener("DOMContentLoaded", () => {
    const selectUser = document.getElementById('user');
    const listaNombres = Object.keys(USUARIOS).sort(); // Ordenar A-Z
    listaNombres.forEach(nombre => {
        selectUser.innerHTML += `<option value="${nombre}">${nombre}</option>`;
    });
});

// 2. VALIDAR LOGIN
function validarLogin() {
    const u = document.getElementById('user').value; 
    const p = document.getElementById('pass').value.trim();
    const errorMsg = document.getElementById('login-error');

    if (u === "") { alert("⚠️ Seleccione su usuario"); return; }

    if (USUARIOS[u] && USUARIOS[u].pass === p) {
        nombreUsuario = u;
        sectorActivo = USUARIOS[u].sector;
        
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        document.getElementById('user-display').innerText = `BIENVENIDO: ${nombreUsuario} | SECTOR: ${sectorActivo}`;
        
        cargarDatosMateriales();
    } else {
        errorMsg.style.display = 'block';
    }
}

// 3. DESCARGAR Y AGRUPAR ESTRUCTURAS
async function cargarDatosMateriales() {
    try {
        const res = await fetch(URL_MATERIALES);
        BASE_DE_DATOS = await res.json();
        DATOS_POR_TIPO = {}; 

        Object.keys(BASE_DE_DATOS).forEach(nombreEstructura => {
            const primerMaterial = BASE_DE_DATOS[nombreEstructura][0];
            const tipo = primerMaterial.tipo || nombreEstructura.charAt(0).toUpperCase();
            
            if (!DATOS_POR_TIPO[tipo]) DATOS_POR_TIPO[tipo] = [];
            DATOS_POR_TIPO[tipo].push(nombreEstructura);
        });

        const selectTipo = document.getElementById('select-tipo');
        selectTipo.innerHTML = '<option value="">Tipo...</option>';
        Object.keys(DATOS_POR_TIPO).sort().forEach(t => {
            selectTipo.innerHTML += `<option value="${t}">${t}</option>`;
        });
    } catch (error) {
        alert("Ocurrió un error de conexión con Google Sheets.");
    }
}

// 4. FILTRAR SEGUNDO DESPLEGABLE
function filtrarEstructuras() {
    const tipoElegido = document.getElementById('select-tipo').value;
    const selectEst = document.getElementById('select-estructura');
    
    selectEst.innerHTML = '<option value="">Estructura...</option>';
    if (tipoElegido && DATOS_POR_TIPO[tipoElegido]) {
        DATOS_POR_TIPO[tipoElegido].sort().forEach(nombre => {
            selectEst.innerHTML += `<option value="${nombre}">${nombre}</option>`;
        });
    }
}

// 5. AGREGAR A LA MEMORIA
function agregarEstructura() {
    const nombre = document.getElementById('select-estructura').value;
    const cant = parseInt(document.getElementById('input-cantidad').value);
    
    if (!nombre || cant <= 0) return;

    let itemExistente = proyecto.find(p => p.nombre === nombre);
    if (itemExistente) itemExistente.cantidad += cant;
    else proyecto.push({ nombre: nombre, cantidad: cant });
    
    actualizarVista();
}

// 6. DIBUJAR PANTALLA Y SUMAR MATERIALES
function actualizarVista() {
    const ulLista = document.getElementById('lista-estructuras');
    const tbodyTabla = document.getElementById('tabla-body');
    ulLista.innerHTML = ""; tbodyTabla.innerHTML = "";
    
    let materialesTotales = {}; 

    proyecto.forEach((item, index) => {
        // Dibuja la lista de arriba
        ulLista.innerHTML += `<li>
            <span><b>${item.cantidad}x</b> ${item.nombre}</span>
            <i class="fas fa-trash-alt" title="Eliminar" onclick="eliminarItem(${index})"></i>
        </li>`;

        // Multiplica y suma
        BASE_DE_DATOS[item.nombre].forEach(mat => {
            if (!materialesTotales[mat.codigo]) {
                materialesTotales[mat.codigo] = { ...mat, totalCalculado: 0 };
            }
            materialesTotales[mat.codigo].totalCalculado += (mat.cantidad * item.cantidad);
        });
    });

    // Dibuja la tabla de abajo
    Object.values(materialesTotales).forEach(m => {
        tbodyTabla.innerHTML += `<tr>
            <td>${m.totalCalculado}</td>
            <td>${m.unidad}</td>
            <td>${m.codigo}</td>
            <td>${m.nombre}</td>
        </tr>`;
    });

    if (proyecto.length === 0) {
        tbodyTabla.innerHTML = '<tr><td colspan="4">No hay datos agregados</td></tr>';
    }
}

// 7. ELIMINAR ITEM DE LA MEMORIA
function eliminarItem(index) {
    proyecto.splice(index, 1);
    actualizarVista(); 
}

// 8. RECARGAR PÁGINA
function cerrarSesion() {
    location.reload();
}

// 9. DIBUJAR PDF (Básico por ahora)
async function imprimirPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("CONSOLIDADO DE MATERIALES - ENEE", 10, 10);
    doc.text(`USUARIO: ${nombreUsuario} | SECTOR: ${sectorActivo}`, 10, 20);
    doc.save(`Materiales_${sectorActivo}.pdf`);
}
