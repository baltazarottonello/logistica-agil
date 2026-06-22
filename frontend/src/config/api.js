// Configuración central de la URL del backend.
// En desarrollo: usa http://localhost:5000 (por defecto).
// En Docker: la variable VITE_API_URL se inyecta en tiempo de build desde el .env.
const API_URL = "http://localhost:5000";

export default API_URL;
