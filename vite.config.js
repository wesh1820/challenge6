import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: process.env.PORT || 3000, // Gebruik de poort die Render toewijst of een standaardpoort
    host: true, // Zorg ervoor dat de server extern toegankelijk is
  }
});
