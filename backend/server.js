const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const DATA_FILE = path.join(__dirname, "data", "clientes.csv");

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

    if (req.method === "GET" && req.url === "/api/clientes") {
        try {
            const clientes = leerClientes();

            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify(clientes));
        } catch (error) {
            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                error: "No se pudieron leer los clientes"
            }));
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
                    res.writeHead(400, {
                        "Content-Type": "application/json"
                    });

                    res.end(JSON.stringify({
                        error: "Nombre y correo son obligatorios"
                    }));

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

                res.writeHead(201, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify(nuevoCliente));

            } catch (error) {
                res.writeHead(400, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    error: "JSON inválido"
                }));
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
                    res.writeHead(404, {
                        "Content-Type": "application/json"
                    });

                    res.end(JSON.stringify({
                        error: "Cliente no encontrado"
                    }));

                    return;
                }

                clientes[indice].nombre = datos.nombre;
                clientes[indice].correo = datos.correo;

                guardarClientes(clientes);

                res.writeHead(200, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify(clientes[indice]));

            } catch (error) {
                res.writeHead(400, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    error: "JSON inválido"
                }));
            }
        });

        return;
    }

    if (req.method === "DELETE" && req.url.startsWith("/api/clientes/")) {
        const id = Number(req.url.split("/").pop());
        const clientes = leerClientes();
        const indice = clientes.findIndex(cliente => cliente.id === id);

        if (indice === -1) {
            res.writeHead(404, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                error: "Cliente no encontrado"
            }));

            return;
        }

        const eliminado = clientes[indice];

        clientes.splice(indice, 1);
        guardarClientes(clientes);

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify(eliminado));

        return;
    }

    res.writeHead(404, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify({
        error: "Ruta no encontrada"
    }));
});

server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
