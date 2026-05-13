/* script.js - Allan Zelaya - VERSIÓN ULTRA RÁPIDA */

// URL DE MATERIALES VERIFICADA
const URL_MATERIALES = "https://script.google.com/macros/s/AKfycbyWyp1BupM-yySWEi7uEbE5jbslKh9JCjR0BuQjCLD14PnP3E01O9alYDirJPB-7U5zgA/exec";

// --- BASE DE USUARIOS EXTRAÍDA DE TU EXCEL ---
const BASE_USUARIOS = [
    { user: "JOSUE.ORTIZ", pass: "12345", sector: "JUTICALPA" },
    { user: "ALLAN.ZELAYA", pass: "12345", sector: "JUTICALPA" },
    { user: "CARLOS.RIVERA", pass: "12345", sector: "LA CEIBA" },
    { user: "WILSON.ZAVALA", pass: "12345", sector: "LA CEIBA" },
    { user: "DAVID.APLICANO", pass: "12345", sector: "TOCOA" },
    { user: "TOMY.AMED", pass: "12345", sector: "LA CEIBA" },
    { user: "ADMIN", pass: "enee2026", sector: "TEGUCIGALPA" }
];

let BASE_DE_DATOS = {};
let DATOS_POR_TIPO = {};
let proyecto = [];
let sectorActivo = "";
let nombreUsuario = "";

function validarLogin() {
    const userIn = document.getElementById('user_input').value.trim().toUpperCase();
    const passIn = document.getElementById('pass_input').value.trim();
    const errorMsg = document.getElementById('login-error');

    // Validación contra la lista interna
    const encontrado = BASE_USUARIOS.find(u => u.user === userIn && u.pass === passIn);

    if (encontrado) {
        nombreUsuario = encontrado.user;
        sectorActivo = encontrado.sector;
        
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        document.getElementById('user-display').innerText = `${nombreUsuario} | SECTOR: ${sectorActivo}`;
        
        cargarDatosMateriales();
    } else {
        errorMsg.style.display = 'block';
    }
}

async function cargarDatosMateriales() {
    try {
        const res = await fetch(URL_MATERIALES);
        BASE_DE_DATOS = await res.json();
        DATOS_POR_TIPO = {};
        
        Object.keys(BASE_DE_DATOS).forEach(nombre => {
            const primerMat = BASE_DE_DATOS[nombre][0];
            const tipo = primerMat.tipo || nombre.charAt(0).toUpperCase();
            if (!DATOS_POR_TIPO[tipo]) DATOS_POR_TIPO[tipo] = [];
            DATOS_POR_TIPO[tipo].push(nombre);
        });

        const selectTipo = document.getElementById('select-tipo');
        selectTipo.innerHTML = '<option value="">Tipo...</option>';
        Object.keys(DATOS_POR_TIPO).sort().forEach(t => {
            let opt = document.createElement('option'); opt.value = t; opt.text = t;
            selectTipo.appendChild(opt);
        });
    } catch (e) { alert("Error cargando base de materiales."); }
}

function filtrarEstructuras() {
    const tipo = document.getElementById('select-tipo').value;
    const selectEst = document.getElementById('select-estructura');
    selectEst.innerHTML = '<option value="">Estructura...</option>';
    if (tipo && DATOS_POR_TIPO[tipo]) {
        DATOS_POR_TIPO[tipo].sort().forEach(nom => {
            let opt = document.createElement('option'); opt.value = nom; opt.text = nom;
            selectEst.appendChild(opt);
        });
    }
}

function agregarEstructura() {
    const nombre = document.getElementById('select-estructura').value;
    const cant = parseInt(document.getElementById('input-cantidad').value);
    if (!nombre || cant <= 0) return;
    let item = proyecto.find(p => p.nombre === nombre);
    if (item) item.cantidad += cant;
    else proyecto.push({ nombre, cantidad: cant });
    actualizarVista();
}

function actualizarVista() {
    const ul = document.getElementById('lista-estructuras');
    const tbody = document.getElementById('tabla-body');
    ul.innerHTML = ""; tbody.innerHTML = "";
    let totales = {};
    proyecto.forEach((p, idx) => {
        ul.innerHTML += `<li><span><b>${p.cantidad}x</b> ${p.nombre}</span><i class="fas fa-trash-alt" style="color:#e74c3c; cursor:pointer" onclick="eliminarItem(${idx})"></i></li>`;
        BASE_DE_DATOS[p.nombre].forEach(m => {
            if (!totales[m.codigo]) totales[m.codigo] = { ...m, total: 0 };
            totales[m.codigo].total += (m.cantidad * p.cantidad);
        });
    });
    Object.values(totales).forEach(m => {
        tbody.innerHTML += `<tr><td>${m.total}</td><td>${m.unidad}</td><td>${m.codigo}</td><td>${m.nombre}</td></tr>`;
    });
    if (proyecto.length === 0) tbody.innerHTML = '<tr><td colspan="4">No hay datos</td></tr>';
}

function eliminarItem(i) { proyecto.splice(i, 1); actualizarVista(); }
function cerrarSesion() { location.reload(); }

async function imprimirPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("CONSOLIDADO DE MATERIALES - ENEE", 10, 10);
    doc.text(`USUARIO: ${nombreUsuario} | SECTOR: ${sectorActivo}`, 10, 20);
    doc.save(`Materiales_${sectorActivo}.pdf`);
}
