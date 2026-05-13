/* script.js - Allan Zelaya (Lógica de Login de App Poda + Materiales) */

const URL_MATERIALES = "https://script.google.com/macros/s/AKfycbyWyp1BupM-yySWEi7uEbE5jbslKh9JCjR0BuQjCLD14PnP3E01O9alYDirJPB-7U5zgA/exec";

// 1. TU DICCIONARIO DE USUARIOS (Igual al de la App de Poda)
const USUARIOS = {
    "josue.ortiz": "12345",
    "allan.zelaya": "12345",
    "carlos.rivera": "12345",
    "wilson.zavala": "12345",
    "david.aplicano": "12345",
    "tomy.amed": "12345",
    "admin": "enee2026"
};

// Mapeo de sectores para cuando entren
const SECTORES = {
    "josue.ortiz": "JUTICALPA",
    "allan.zelaya": "JUTICALPA",
    "carlos.rivera": "LA CEIBA",
    "wilson.zavala": "LA CEIBA",
    "david.aplicano": "TOCOA",
    "tomy.amed": "LA CEIBA",
    "admin": "TEGUCIGALPA"
};

let BASE_DE_DATOS = {};
let DATOS_POR_TIPO = {};
let proyecto = [];
let sectorActivo = "";
let nombreUsuario = "";

// 2. TU FUNCIÓN DE LOGIN (Idéntica a la que sí te funciona)
function validarLogin() {
    // ATENCIÓN: Asegúrate de que en tu index.html los id sean "user" y "pass"
    const u = document.getElementById('user_input').value.toLowerCase(); // Ajustado a tu HTML actual
    const p = document.getElementById('pass_input').value;

    if (USUARIOS[u] && USUARIOS[u] === p) {
        nombreUsuario = u.toUpperCase();
        sectorActivo = SECTORES[u];
        
        // Ocultar login y mostrar app
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        document.getElementById('user-display').innerText = `${nombreUsuario} | SECTOR: ${sectorActivo}`;
        
        // Cargar los materiales de Google
        cargarDatosMateriales();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

// 3. DESCARGA DE ESTRUCTURAS
async function cargarDatosMateriales() {
    try {
        const res = await fetch(URL_MATERIALES);
        BASE_DE_DATOS = await res.json();
        DATOS_POR_TIPO = {};
        
        Object.keys(BASE_DE_DATOS).forEach(nom => {
            const tipo = BASE_DE_DATOS[nom][0].tipo || nom.charAt(0).toUpperCase();
            if (!DATOS_POR_TIPO[tipo]) DATOS_POR_TIPO[tipo] = [];
            DATOS_POR_TIPO[tipo].push(nom);
        });

        const selectTipo = document.getElementById('select-tipo');
        selectTipo.innerHTML = '<option value="">Tipo...</option>';
        Object.keys(DATOS_POR_TIPO).sort().forEach(t => {
            selectTipo.innerHTML += `<option value="${t}">${t}</option>`;
        });
    } catch (e) { alert("Error al cargar la base de materiales de Google."); }
}

// 4. LÓGICA DE LA CALCULADORA
function filtrarEstructuras() {
    const t = document.getElementById('select-tipo').value;
    const se = document.getElementById('select-estructura');
    se.innerHTML = '<option value="">Estructura...</option>';
    if (t) DATOS_POR_TIPO[t].sort().forEach(n => se.innerHTML += `<option value="${n}">${n}</option>`);
}

function agregarEstructura() {
    const n = document.getElementById('select-estructura').value;
    const c = parseInt(document.getElementById('input-cantidad').value);
    if (!n || c <= 0) return;
    let item = proyecto.find(x => x.n === n);
    if (item) item.c += c; else proyecto.push({ n, c });
    actualizarVista();
}

function actualizarVista() {
    const ul = document.getElementById('lista-estructuras');
    const tbody = document.getElementById('tabla-body');
    ul.innerHTML = ""; tbody.innerHTML = "";
    let totales = {};
    proyecto.forEach((p, idx) => {
        ul.innerHTML += `<li><span><b>${p.c}x</b> ${p.n}</span><i class="fas fa-trash-alt" style="color:#e74c3c; cursor:pointer" onclick="eliminarItem(${idx})"></i></li>`;
        BASE_DE_DATOS[p.n].forEach(m => {
            if (!totales[m.codigo]) totales[m.codigo] = { ...m, total: 0 };
            totales[m.codigo].total += (m.cantidad * p.c);
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
