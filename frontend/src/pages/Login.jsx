import { useState } from "react";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    // SIMULACIÓN DE LOGINS SÚPER SIMPLE:
    if (email === "admin@empresa.com" && password === "1234") {
      onLoginSuccess({
        nombre: "Carlos Gómez",
        rol: "Administrador",
        id_rol: 1,
      });
    } else if (email === "operador@empresa.com" && password === "1234") {
      onLoginSuccess({
        nombre: "Martín Silva",
        rol: "Operador de Carga",
        id_rol: 2,
      });
    } else {
      setError(
        "Usuario o contraseña incorrectos. Pistas: admin@empresa.com o operador@empresa.com (clave: 1234)"
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 antialiased font-sans">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-slate-200">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-slate-900">
            Logística <span className="text-blue-600">Ágil</span>
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Simulador de Inicio de Sesión
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs p-3.5 rounded-xl mb-5 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Email (admin@empresa.com / operador@empresa.com)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ejemplo@empresa.com"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Contraseña (1234)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-600"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm shadow transition-all mt-2 cursor-pointer"
          >
            Entrar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
}
