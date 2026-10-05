import { useEffect, useState } from "react";
import "./App.css";

const API = "http://18.118.227.43:3000";

function App() {
  const [clientes, setClientes] = useState([]);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [editando, setEditando] = useState(null);
  const [estado, setEstado] = useState("");

  async function cargarClientes() {
    const respuesta = await fetch(`${API}/api/clientes`);
    const datos = await respuesta.json();
    setClientes(datos);
  }

  useEffect(() => {
    cargarClientes();
  }, []);

  async function guardar(e) {
    e.preventDefault();

    const metodo = editando ? "PUT" : "POST";
    const url = editando
      ? `${API}/api/clientes/${editando}`
      : `${API}/api/clientes`;

    const respuesta = await fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ nombre, correo })
    });

    const datos = await respuesta.json();
    setEstado(`HTTP ${respuesta.status}: ${JSON.stringify(datos)}`);

    setNombre("");
    setCorreo("");
    setEditando(null);
    cargarClientes();
  }

  async function eliminar(id) {
    const respuesta = await fetch(`${API}/api/clientes/${id}`, {
      method: "DELETE"
    });

    const datos = await respuesta.json();
    setEstado(`HTTP ${respuesta.status}: ${JSON.stringify(datos)}`);
    cargarClientes();
  }

  function editar(cliente) {
    setEditando(cliente.id);
    setNombre(cliente.nombre);
    setCorreo(cliente.correo);
  }

  return (
    <main className="contenedor">
      <h1>Laboratorio HTTP - Clientes</h1>

      <p className="subtitulo">
        React + Node.js + EC2
      </p>

      <section className="panel">
        <h2>{editando ? "Editar cliente" : "Nuevo cliente"}</h2>

        <form onSubmit={guardar}>
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Nombre"
            required
          />

          <input
            value={correo}
            onChange={e => setCorreo(e.target.value)}
            placeholder="Correo"
            type="email"
            required
          />

          <button type="submit">
            {editando ? "Actualizar" : "Crear"}
          </button>

          {editando && (
            <button
              type="button"
              onClick={() => {
                setEditando(null);
                setNombre("");
                setCorreo("");
              }}
            >
              Cancelar
            </button>
          )}
        </form>
      </section>

      <section className="panel">
        <div className="fila-titulo">
          <h2>Clientes</h2>
          <button onClick={cargarClientes}>Recargar</button>
        </div>

        {clientes.map(cliente => (
          <article className="cliente" key={cliente.id}>
            <div>
              <strong>{cliente.nombre}</strong>
              <span>{cliente.correo}</span>
            </div>

            <div>
              <button onClick={() => editar(cliente)}>Editar</button>
              <button onClick={() => eliminar(cliente.id)}>Eliminar</button>
            </div>
          </article>
        ))}
      </section>

      <pre className="estado">{estado}</pre>

      <p>
        Abre F12 → Network para observar GET, POST, PUT y DELETE.
      </p>
    </main>
  );
}

export default App;
