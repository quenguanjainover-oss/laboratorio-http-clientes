const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const DATA_FILE = path.join(__dirname, "data", "clientes.csv");

function encabezadosCORS() {
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "no-store"
    };
}

function responder(res, estado, datos) {
    res.writeHead(estado, encabezadosCORS());
    res.end(JSON.stringify(datos));
}

function leerClientes() {
    const contenido = fs.readFileSync(DATA_FILE, "utf8").trim();
    const lineas = contenido.split(/\r?\n/);

    return lineas.slice(1).map(linea => {
        const valores = linea.split(",");

        return {
            id: Number(valores[0]),
            nombre: valores[1],
            correo: valores[2]
        };
    });
}

function guardarClientes(clientes) {
    const contenido = [
        "id,nombre,correo",
        ...clientes.map(cliente =>
            `${cliente.id},${cliente.nombre},${cliente.correo}`
        )
    ].join("\n");

    fs.writeFileSync(DATA_FILE, contenido);
}

const server = http.createServer((req, res) => {

    if (req.method === "OPTIONS") {
        res.writeHead(204, encabezadosCORS());
        res.end();
        return;
    }

    if (req.method === "GET" && req.url === "/health") {
        responder(res, 200, {
            ok: true,
            servicio: "backend-http-lab"
        });
        return;
    }

    if (req.method === "GET" && req.url === "/api/clientes") {
        try {
            const clientes = leerClientes();
            responder(res, 200, clientes);
        } catch (error) {
            responder(res, 500, {
                error: "No se pudieron leer los clientes"
            });
        }

        return;
    }

    if (req.method === "POST" && req.url === "/api/clientes") {
        let cuerpo = "";

        req.on("data", parte => {
            cuerpo += parte;
        });

        req.on("end", () => {
            try {
                const datos = JSON.parse(cuerpo);

                if (!datos.nombre || !datos.correo) {
                    responder(res, 400, {
                        error: "Nombre y correo son obligatorios"
                    });
                    return;
                }

                const clientes = leerClientes();

                const nuevoId = clientes.length > 0
                    ? Math.max(...clientes.map(cliente => cliente.id)) + 1
                    : 1;

                const nuevoCliente = {
                    id: nuevoId,
                    nombre: datos.nombre,
                    correo: datos.correo
                };

                clientes.push(nuevoCliente);
                guardarClientes(clientes);

                responder(res, 201, nuevoCliente);

            } catch (error) {
                responder(res, 400, {
                    error: "JSON inválido"
                });
            }
        });

        return;
    }

    if (req.method === "PUT" && req.url.startsWith("/api/clientes/")) {
        const id = Number(req.url.split("/").pop());
        let cuerpo = "";

        req.on("data", parte => {
            cuerpo += parte;
        });

        req.on("end", () => {
            try {
                const datos = JSON.parse(cuerpo);
                const clientes = leerClientes();
                const indice = clientes.findIndex(cliente => cliente.id === id);

                if (indice === -1) {
                    responder(res, 404, {
                        error: "Cliente no encontrado"
                    });
                    return;
                }

                clientes[indice].nombre = datos.nombre;
                clientes[indice].correo = datos.correo;

                guardarClientes(clientes);

                responder(res, 200, clientes[indice]);

            } catch (error) {
                responder(res, 400, {
                    error: "JSON inválido"
                });
            }
        });

        return;
    }

    if (req.method === "DELETE" && req.url.startsWith("/api/clientes/")) {
        const id = Number(req.url.split("/").pop());
        const clientes = leerClientes();
        const indice = clientes.findIndex(cliente => cliente.id === id);

        if (indice === -1) {
            responder(res, 404, {
                error: "Cliente no encontrado"
            });
            return;
        }

        const eliminado = clientes[indice];

        clientes.splice(indice, 1);
        guardarClientes(clientes);

        responder(res, 200, eliminado);

        return;
    }

    responder(res, 404, {
        error: "Ruta no encontrada"
    });
});

server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
