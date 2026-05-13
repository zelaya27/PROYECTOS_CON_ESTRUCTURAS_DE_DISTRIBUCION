/* script.js - Lógica Allan Zelaya corregida */
const URL_LOGIN = "https://script.google.com/macros/s/AKfycbxGywAq6Fw29ezNIB9o_cHM4d6pDbQxxL8EKMdsNn-Q4wDAvB-2W0H_g9jXqxNrzX-3rw/exec";
const URL_MATERIALES = "https://script.google.com/macros/s/AKfycbyPOrzRMPjppI77GDw92aVWzMP382eVNrv3XJ9yqRBAWYEwVxjwoUpzh_SnHWccMIxiIg/exec";

let BASE_DE_DATOS = {};
let DATOS_POR_TIPO = {};
let proyecto = [];
let sectorActivo = "";
let nombreUsuario = "";

// --- FUNCIÓN DE LOGIN CORREGIDA ---
async function validarLogin() {
    const user = document.getElementById('user_input').value.trim();
    const pass = document.getElementById('pass_input').value.trim();
    const btnText = document.getElementById('login-text');
    const spinner = document.getElementById('login-spinner');
    const errorMsg = document.getElementById('login-error');

    if (!user || !pass) {
        alert("⚠️ Por favor ingrese su usuario y contraseña.");
        return;
    }

    // Efecto de carga
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
    errorMsg.style.display = 'none';

    try {
        // Usamos una URL limpia para evitar errores de red
        const consulta = `${URL_LOGIN}?action=login&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}`;
        
        const response = await fetch(consulta);
        
        if (!response.ok) throw new Error("Error en el servidor");
        
        const result = await response.json();

        if (result.success) {
            nombreUsuario = user.toUpperCase();
            sectorActivo = result.sector.toUpperCase();
            
            // Ocultar Login y mostrar App
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('app-container').style.display = 'block';
            document.getElementById('user-display').innerText = `${nombreUsuario} | SECTOR: ${sectorActivo}`;
            
            // Cargar los materiales del otro Sheet
            cargarDatosMateriales();
        } else {
            // Si el servidor responde pero el usuario no existe
            errorMsg.style.display = 'block';
            errorMsg.innerText = "❌ Usuario o contraseña incorrectos";
        }
    } catch (e) {
        console.error("Error:", e);
        alert("❌ Error de conexión: No se pudo contactar con la base de datos de usuarios. Verifique su conexión a internet.");
    } finally {
        btnText.style.display = 'inline-block';
        spinner.style.display = 'none';
    }
}

// --- RESTO DE LAS FUNCIONES ---

function cerrarSesion() {
    if(confirm("¿Desea cerrar sesión?")) location.reload();
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
            let opt = document.createElement('option');
            opt.value = t; opt.text = t;
            selectTipo.appendChild(opt);
        });
    } catch (e) { console.error("Error cargando materiales:", e); }
}

function filtrarEstructuras() {
    const tipo = document.getElementById('select-tipo').value;
    const selectEst = document.getElementById('select-estructura');
    selectEst.innerHTML = '<option value="">Estructura...</option>';
    if (tipo && DATOS_POR_TIPO[tipo]) {
        DATOS_POR_TIPO[tipo].sort().forEach(nom => {
            let opt = document.createElement('option');
            opt.value = nom; opt.text = nom;
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
function reiniciarApp() { if(confirm("¿Limpiar todo?")) { proyecto = []; actualizarVista(); } }

async function imprimirPDF() {
    alert("Generando PDF...");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("CONSOLIDADO DE MATERIALES - ENEE", 10, 10);
    doc.text(`SECTOR: ${sectorActivo}`, 10, 20);
    doc.save(`Materiales_${sectorActivo}.pdf`);
}
