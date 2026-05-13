function doGet(e) {
  // Abre el Sheet usando el ID de tu enlace
  var ss = SpreadsheetApp.openById('1ADSNiUa4wY5xs4kModG6_8fDIWcsrbOM');
  
  // 1. Cargar unidades de medida desde TABLA MATERIALES
  var sheetMateriales = ss.getSheetByName('MATERIALES'); 
  var dataMateriales = sheetMateriales.getDataRange().getValues();
  
  var infoMateriales = {};
  for (var i = 1; i < dataMateriales.length; i++) { // Salta el encabezado
    var cod = dataMateriales[i][0]; // CODIGO MATERIAL (Col A)
    var und = dataMateriales[i][6]; // UNIDAD DE MEDIDA (Col G)
    infoMateriales[cod] = und;
  }

  // 2. Armar la base de datos desde TABLA MATERIALES_POR_ESTRUCTURA
  var sheetMatEstruct = ss.getSheetByName('MATERIALES_POR_ESTRUCTURA');
  var dataMatEstruct = sheetMatEstruct.getDataRange().getValues();
  
  var db = {};
  
  for (var i = 1; i < dataMatEstruct.length; i++) { // Salta el encabezado
    var nombreEstructura = dataMatEstruct[i][1]; // ESTRUCTURA (Col B)
    var codMaterial = dataMatEstruct[i][2];      // CODIGO MATERIAL (Col C)
    var nomMaterial = dataMatEstruct[i][3];      // NOMBRE MATERIAL (Col D)
    var cant = dataMatEstruct[i][4];             // CANTIDAD (Col E)
    
    if (!nombreEstructura) continue;
    
    if (!db[nombreEstructura]) {
      db[nombreEstructura] = [];
    }
    
    db[nombreEstructura].push({
      codigo: codMaterial,
      nombre: nomMaterial,
      unidad: infoMateriales[codMaterial] || 'UND', // Busca la unidad, si no hay pone UND
      cantidad: cant
    });
  }
  
  // Devuelve los datos a tu aplicación de GitHub en formato JSON
  return ContentService.createTextOutput(JSON.stringify(db))
    .setMimeType(ContentService.MimeType.JSON);
}
