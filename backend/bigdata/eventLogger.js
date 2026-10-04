const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ARCHIVO = path.join(__dirname, '..', 'data', 'raw', 'eventos.csv');

const CABECERA = 'fecha,id,metodo,ruta,status,duracion_ms\n';

const metricas = {
  inicio: new Date().toISOString(),
  total: 0
};

function csv(valor) {
  return '"' + String(valor).replaceAll('"', '""') + '"';
}

function eventLogger(req, res) {
  const inicio = process.hrtime.bigint();
  const id = crypto.randomUUID();

  const url = new URL(
    req.url,
    `http://${req.headers.host || 'localhost'}`
  );

  const ruta = url.pathname;

  res.setHeader('X-Event-Id', id);

  res.on('finish', () => {
    const fin = process.hrtime.bigint();
    const duracion_ms = Number(fin - inicio) / 1000000;

    fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });

    if (!fs.existsSync(ARCHIVO)) {
      fs.writeFileSync(ARCHIVO, CABECERA);
    }

    const fila = [
      new Date().toISOString(),
      id,
      req.method,
      ruta,
      res.statusCode,
      duracion_ms.toFixed(2)
    ].map(csv).join(',') + '\n';

    fs.appendFileSync(ARCHIVO, fila);

    metricas.total++;
  });

  return id;
}

module.exports = {
  eventLogger,
  metricas
};