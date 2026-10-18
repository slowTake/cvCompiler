// Loads every theme token block in this folder. Adding a template only needs
// a registry entry plus a `<id>.css` file here; no import to maintain.
import.meta.glob('./*.css', { eager: true });
