import { onMounted, onUnmounted } from 'vue';

// Ejecuta `fn` al montar el componente y después cada `ms` milisegundos.
// - No arranca una consulta si la anterior todavía no terminó.
// - No consulta si la pestaña está oculta (ahorra pedidos al backend).
// - Limpia el intervalo al salir de la vista (si no, sigue corriendo para siempre).
export function usePolling(fn: () => Promise<void> | void, ms: number) {
  let id: ReturnType<typeof setInterval> | null = null;
  let corriendo = false;

  const ejecutar = async () => {
    if (corriendo) return;
    corriendo = true;
    try {
      await fn();
    } finally {
      corriendo = false;
    }
  };

  onMounted(() => {
    ejecutar();
    id = setInterval(() => {
      if (document.visibilityState === 'visible') ejecutar();
    }, ms);
  });

  onUnmounted(() => {
    if (id) clearInterval(id);
  });
}