// =======================================================================
// 1. DICCIONARIO DE USUARIOS LOCAL (Idéntico a tu App de Poda)
// Esto asegura que el login funcione INMEDIATAMENTE sin depender de internet.
// =======================================================================
const USUARIOS = {
    "josue.ortiz": { pass: "12345", sector: "JUTICALPA" },
    "allan.zelaya": { pass: "12345", sector: "JUTICALPA" },
    "carlos romero": { pass: "12345", sector: "SANTA ROSA DE COPAN" },
    "jonathan ortiz": { pass: "12345", sector: "TEGUCIGALPA" },
    "rene alegria": { pass: "12345", sector: "TEGUCIGALPA" },
    "jose pinto": { pass: "12345", sector: "TEGUCIGALPA" },
    "juan miranda": { pass: "12345", sector: "SANTA ROSA DE COPAN" },
    "allan.muñoz": { pass: "12345", sector: "TOCOA" },
    "alsides.ponce": { pass: "12345", sector: "TOCOA" },
    "carlos.rivera": { pass: "12345", sector: "LA CEIBA" },
    "wilson.zavala": { pass: "12345", sector: "LA CEIBA" },
    "admin": { pass: "admin123", sector: "TEGUCIGALPA" }
    // Puedes agregar más usuarios copiando este formato
};

// URL de donde descargaremos las estructuras al entrar
const URL_MATERIALES = "https://script.google.com/macros/s/AKfycbyWyp1BupM-yySWEi7uEbE5jbslKh9JCjR0BuQjCLD14PnP3E01O9alYDirJPB-7U5zgA/exec";

// Variables globales que usará la aplicación
let BASE_DE_DATOS = {}; // Aquí guardamos todo lo que viene de Excel
let DATOS_POR_TIPO = {}; // Aquí separamos (Tipo A, Tipo B, etc.)
let proyecto = []; // Aquí guardamos lo que el usuario va agregando
let sectorActivo = "";
let nombreUsuario = "";

// =======================================================================
// 2. FUNCIÓN DE LOGIN
// Revisa si lo escrito en los cuadros coincide con el diccionario de arriba.
// =======================================================================
function validarLogin() {
    // Obtenemos los textos ingresados. ".toLowerCase()" lo hace minúscula para que no importe cómo lo escriban.
    const u = document.getElementById('user').value.toLowerCase().trim();
    const p = document.getElementById('pass').value.trim();
    const errorMsg = document.getElementById('login-error');

    // ¿Existe el usuario en el diccionario Y su contraseña coincide?
    if (USUARIOS[u] && USUARIOS[u].pass === p) {
        // Si es correcto, guardamos sus datos
        nombreUsuario = u.toUpperCase();
        sectorActivo = USUARIOS[u].sector;
        
        // Ocultamos la tarjeta de login y mostramos la app principal
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        document.getElementById('user-display').innerText = `BIENVENIDO: ${nombreUsuario} | SECTOR: ${sectorActivo}`;
        
        // Disparamos la descarga de materiales de Excel
        cargarDatosMateriales();
    } else {
        // Si hay error, mostramos el texto rojo
        errorMsg.style.display = 'block';
    }
}

// =======================================================================
// 3. FUNCIÓN PARA DESCARGAR MATERIALES
// Va a tu URL de Apps Script y trae el JSON de las estructuras.
// =======================================================================
async function cargarDatosMateriales() {
    try {
        // fetch() hace la petición a Google
        const res = await fetch(URL_MATERIALES);
        BASE_DE_DATOS = await res.json();
        DATOS_POR_TIPO = {}; // Limpiamos por si acaso

        // Recorremos la base de datos para separar por el primer caracter (A, B, C...)
        Object.keys(BASE_DE_DATOS).forEach(nombreEstructura => {
            const primerMaterial = BASE_DE_DATOS[nombreEstructura][0];
            // Si el Excel tiene columna "tipo", lo usa. Si no, usa la primera letra del nombre.
            const tipo = primerMaterial.tipo || nombreEstructura.charAt(0).toUpperCase();
            
            // Si la categoría no existe, la crea
            if (!DATOS_POR_TIPO[tipo]) {
                DATOS_POR_TIPO[tipo] = [];
            }
            DATOS_POR_TIPO[tipo].push(nombreEstructura);
        });

        // Llenamos el primer cuadro desplegable (Select)
        const selectTipo = document.getElementById('select-tipo');
        selectTipo.innerHTML = '<option value="">Tipo...</option>';
        Object.keys(DATOS_POR_TIPO).sort().forEach(t => {
            selectTipo.innerHTML += `<option value="${t}">${t}</option>`;
        });
    } catch (error) {
        alert("Ocurrió un error al cargar las estructuras desde Google Sheets.");
    }
}

// =======================================================================
// 4. FUNCIÓN PARA FILTRAR ESTRUCTURAS
// Cuando el usuario elige un "Tipo" (ej: A), esta función llena el 
// segundo desplegable solo con estructuras de ese tipo (ej: A-1, A-2).
// =======================================================================
function filtrarEstructuras() {
    const tipoElegido = document.getElementById('select-tipo').value;
    const selectEst = document.getElementById('select-estructura');
    
    // Limpiamos el segundo selector
    selectEst.innerHTML = '<option value="">Estructura...</option>';
    
    // Si eligió algo válido, lo llenamos con sus estructuras correspondientes
    if (tipoElegido && DATOS_POR_TIPO[tipoElegido]) {
        DATOS_POR_TIPO[tipoElegido].sort().forEach(nombre => {
            selectEst.innerHTML += `<option value="${nombre}">${nombre}</option>`;
        });
    }
}

// =======================================================================
// 5. FUNCIÓN PARA AGREGAR AL PROYECTO
// Toma la estructura seleccionada, la cantidad, y la guarda en la memoria.
// =======================================================================
function agregarEstructura() {
    const nombre = document.getElementById('select-estructura').value;
    const cant = parseInt(document.getElementById('input-cantidad').value);
    
    // Validamos que no esté vacío y la cantidad sea mayor a 0
    if (!nombre || cant <= 0) return;

    // Buscamos si esa estructura ya la habíamos agregado antes
    let itemExistente = proyecto.find(p => p.nombre === nombre);
    
    if (itemExistente) {
        // Si ya existe, solo sumamos la cantidad
        itemExistente.cantidad += cant;
    } else {
        // Si es nueva, la agregamos a la lista del proyecto
        proyecto.push({ nombre: nombre, cantidad: cant });
    }
    
    // Actualizamos la pantalla para que el usuario vea los cambios
    actualizarVista();
}

// =======================================================================
// 6. FUNCIÓN PARA ACTUALIZAR LA PANTALLA (HTML)
// Dibuja la lista superior y suma todos los materiales en la tabla inferior.
// =======================================================================
function actualizarVista() {
    const ulLista = document.getElementById('lista-estructuras');
    const tbodyTabla = document.getElementById('tabla-body');
    
    ulLista.innerHTML = "";
    tbodyTabla.innerHTML = "";
    
    let materialesTotales = {}; // Objeto temporal para ir sumando

    // Paso A: Dibujar la lista de estructuras arriba y calcular materiales
    proyecto.forEach((item, index) => {
        // Dibujamos el renglón con el botón de basurero
        ulLista.innerHTML += `<li>
            <span><b>${item.cantidad}x</b> ${item.nombre}</span>
            <i class="fas fa-trash-alt" title="Eliminar" onclick="eliminarItem(${index})"></i>
        </li>`;

        // Multiplicamos los materiales de esta estructura
        BASE_DE_DATOS[item.nombre].forEach(mat => {
            if (!materialesTotales[mat.codigo]) {
                // Copiamos el material si es la primera vez que aparece
                materialesTotales[mat.codigo] = { ...mat, totalCalculado: 0 };
            }
            // Sumamos: (Cantidad de material en la estructura) x (Cantidad de estructuras pedidas)
            materialesTotales[mat.codigo].totalCalculado += (mat.cantidad * item.cantidad);
        });
    });

    // Paso B: Dibujar la tabla de abajo con los resultados sumados
    Object.values(materialesTotales).forEach(m => {
        tbodyTabla.innerHTML += `
            <tr>
                <td>${m.totalCalculado}</td>
                <td>${m.unidad}</td>
                <td>${m.codigo}</td>
                <td>${m.nombre}</td>
            </tr>`;
    });

    // Mensaje si no hay nada
    if (proyecto.length === 0) {
        tbodyTabla.innerHTML = '<tr><td colspan="4">No hay datos agregados</td></tr>';
    }
}

// =======================================================================
// 7. FUNCIONES EXTRAS (Eliminar, Salir, PDF)
// =======================================================================

// Elimina una estructura de la lista según su posición (index)
function eliminarItem(index) {
    proyecto.splice(index, 1);
    actualizarVista(); // Recalcula la tabla
}

// Recarga la página para volver al login
function cerrarSesion() {
    location.reload();
}

// Lógica para exportar (Por ahora dibuja un PDF básico)
async function imprimirPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("CONSOLIDADO DE MATERIALES - ENEE", 10, 10);
    doc.text(`USUARIO: ${nombreUsuario} | SECTOR: ${sectorActivo}`, 10, 20);
    doc.save(`Materiales_${sectorActivo}.pdf`);
}
