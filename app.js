/* script.js - Allan Zelaya - VERSIÓN FINAL CON GOOGLE LOGIN */

// 1. TUS DIRECCIONES DE GOOGLE (Verificadas)
const URL_LOGIN = "https://script.google.com/macros/s/AKfycbwmnaOFx7NmTrNn2DCqLHp29Zcby_-05aSlaYMEoh-WDulZFskdz2ywDdXMkihCUK3Q2Q/exec";
const URL_MATERIALES = "https://script.google.com/macros/s/AKfycbyWyp1BupM-yySWEi7uEbE5jbslKh9JCjR0BuQjCLD14PnP3E01O9alYDirJPB-7U5zgA/exec";

let BASE_DE_DATOS = {};
let DATOS_POR_TIPO = {};
let proyecto = [];
let sectorActivo = "";
let nombreUsuario = "";

// --- FUNCIÓN DE LOGIN (Conectada a Google Sheets) ---
function validarLogin() {
    const userIn = document.getElementById('user_input').value.trim();
    const passIn = document.getElementById('pass_input').value.trim();
    const btnText = document.getElementById('login-text');
    const spinner = document.getElementById('login-spinner');
    const errorMsg = document.getElementById('login-error');

    if (!userIn || !passIn) {
        alert("⚠️ Por favor ingrese usuario y contraseña.");
        return;
    }

    // Efecto visual de carga
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
    errorMsg.style.display = 'none';

    // FUNCIÓN TEMPORAL PARA RECIBIR LA RESPUESTA (JSONP)
    window.handleLoginResponse = function(result) {
        // Limpiamos el script temporal de la página
        const oldScript = document.getElementById('google-login-script');
        if(oldScript) oldScript.remove();

        if (result.success) {
            nombreUsuario = userIn.toUpperCase();
            sectorActivo = result.sector.toUpperCase();
            
            // Cambiamos pantalla
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('app-container').style.display = 'block';
            document.getElementById('user-display').innerText = `BIENVENIDO: ${nombreUsuario} | SECTOR: ${sectorActivo}`;
            
            // Cargamos la base de materiales usando el URL nuevo
            cargarDatosMateriales();
        } else {
            errorMsg.style.display = 'block';
            errorMsg.innerText = "❌ Usuario o contraseña incorrectos";
            btnText.style.display = 'inline-block';
            spinner.style.display = 'none';
        }
    };

    // Crear la petición a Google
    const script = document.createElement('script');
    script.id = 'google-login-script';
    script.src = `${URL_LOGIN}?action=login&user=${encodeURIComponent(userIn)}&pass=${encodeURIComponent(passIn)}&callback=handleLoginResponse`;
    
    // Si en 10 segundos no responde, avisar al usuario
    const timeout = setTimeout(() => {
        if (document.getElementById('app-container').style.display === 'none') {
            alert("⚠️ El servidor de Google está tardando demasiado. Revisa tu conexión o la implementación del Apps Script.");
            btnText.style.display = 'inline-block';
            spinner.style.display = 'none';
        }
    }, 10000);

    document.body.appendChild(script);
}

// --- CARGA DE MATERIALES (Usando el nuevo URL verificado) ---
async function cargarDatosMateriales() {
    try {
        const res = await fetch(URL_MATERIALES);
        if (!res.ok) throw new Error("No se pudo conectar con la base de materiales.");
        
        BASE_DE_DATOS = await res.json();
        DATOS_POR_TIPO = {};

        // Agrupamos por TIPO (Instrucción 1)
        Object.keys(BASE_DE_DATOS).forEach(nombre => {
            const primerMat = BASE_DE_DATOS[nombre][0];
            const tipo = primerMat.tipo || nombre.charAt(0).toUpperCase();
            if (!DATOS_POR_TIPO[tipo]) DATOS_POR_TIPO[tipo] = [];
            DATOS_POR_TIPO[tipo].push(nombre);
        });

        // Llenar selector de tipos
        const selectTipo = document.getElementById('select-tipo');
        if(selectTipo) {
            selectTipo.innerHTML = '<option value="">Tipo...</option>';
            Object.keys(DATOS_POR_TIPO).sort().forEach(t => {
                let opt = document.createElement('option'); opt.value = t; opt.text = t;
                selectTipo.appendChild(opt);
            });
        }
    } catch (e) {
        console.error("Error materiales:", e);
        alert("❌ Error al cargar la base de materiales. Verifique el URL del Apps Script.");
    }
}

// --- FUNCIONES DE LA CALCULADORA ---

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
        ul.innerHTML += `<li><span><b>${p.cantidad}x</b> ${p.nombre}</span><i class="fas fa-trash-alt" style="color:#e74c3c; cursor:pointer; margin-left:10px;" onclick="eliminarItem(${idx})"></i></li>`;
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
    doc.save(`Materiales_${sectorActivo}.pdf`);
}
