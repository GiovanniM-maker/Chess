/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prototipo interamente client-side: nessuna funzione server, nessuna API.
  // Il motore Stockfish è servito come file statico da /public/engine ed
  // eseguito in un Web Worker classico, senza necessità di header COOP/COEP
  // (build single-thread). Questo lo rende deployabile su Vercel senza
  // configurazione aggiuntiva.
};

export default nextConfig;
